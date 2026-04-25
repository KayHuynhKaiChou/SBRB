import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { AuthorizationService } from '../../common/services/authorization.service';
import { Department } from '../department/entities/department.entity';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { parseFileBuffer, validateParseResult } from './import-parsers/import-excel-parser';

const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/x-xlsx',
  'application/x-excel',
  'application/excel',
  'text/csv',
  'text/plain',
];

/** Strip .xlsx / .csv / .xls extension from a filename. Returns the original when no
 *  supported extension matches so non-standard filenames aren't silently truncated. */
function stripFileExtension(filename: string): string {
  return filename.replace(/\.(xlsx|xls|csv)$/i, '');
}

/** Handles file import and reimport logic for DataSheet — SRS 4.7 / 4.8 */
@Injectable()
export class DatasheetImportService {
  constructor(
    @InjectRepository(DataSheet)
    private readonly sheetRepo: Repository<DataSheet>,
    @InjectRepository(DataSeries)
    private readonly seriesRepo: Repository<DataSeries>,
    @InjectRepository(ImportBatch)
    private readonly batchRepo: Repository<ImportBatch>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    private readonly authorizationService: AuthorizationService,
    @Inject('PUBSUB') private readonly pubSub: PubSub,
  ) {}

  /** Upload + parse Excel/CSV synchronously, save series to DB — no MinIO, no queue */
  async upload(
    file: Express.Multer.File,
    businessId: string,
    userId: string,
    departmentId?: string,
    templateType: 'simple' | 'department' | 'pnl' = 'simple',
  ): Promise<{ batchId: string; datasheetId: string; status: string }> {
    this.validateFileType(file);
    await this.authorizationService.requireManager(businessId, userId);

    const { headers, rows, warnings } = await this.parseFile(file, templateType);

    const sheet = this.sheetRepo.create({
      businessId,
      uploadedBy: userId,
      name: stripFileExtension(file.originalname),
      originalFilename: file.originalname,
      status: 'active',
      templateType: templateType,
      periodHeaders: headers,
    });
    if (warnings.length > 0) {
      sheet.validationErrors = warnings; // Info only — status stays 'active'.
    }
    const savedSheet = await this.sheetRepo.save(sheet);

    const batch = this.batchRepo.create({
      businessId,
      uploaderId: userId,
      dataSheetId: savedSheet.id,
      originalFilename: file.originalname,
      status: 'processing',
    });
    const savedBatch = await this.batchRepo.save(batch);

    try {
      // 1. Setup Department Lookup Map
      const deptMap = new Map<string, string>();
      const existingDepts = await this.departmentRepo.find({ where: { businessId } });
      existingDepts.forEach((d) => deptMap.set(d.name.toLowerCase(), d.id));

      // 2. Identify all unique department names from the parsed rows
      const uniqueDeptNames = new Set<string>();
      rows.forEach((r: any) => {
        if (r.departmentName) uniqueDeptNames.add(r.departmentName);
      });

      // 3. Auto-create missing departments
      for (const dName of uniqueDeptNames) {
        if (!deptMap.has(dName.toLowerCase())) {
          const newDept = this.departmentRepo.create({ businessId, name: dName });
          const savedDept = await this.departmentRepo.save(newDept);
          deptMap.set(dName.toLowerCase(), savedDept.id);
        }
      }

      // 4. Map series
      const seriesEntities = rows.map((row: any, idx) => {
        let mappedDeptId = departmentId || null;
        if (row.departmentName) {
          mappedDeptId = deptMap.get(row.departmentName.toLowerCase()) || null;
        }

        return this.seriesRepo.create({
          dataSheetId: savedSheet.id,
          departmentId: mappedDeptId,
          seriesName: row.name,
          rowIndex: idx,
          values: Object.fromEntries(
            Object.entries(row.values).map(([k, v]) => [k, v ?? 0]),
          ) as Record<string, number>,
        });
      });
      await this.seriesRepo.save(seriesEntities);

      await this.sheetRepo.update(savedSheet.id, {
        importedAt: new Date(),
        errorMessage: warnings.length ? warnings.join('; ') : null,
      });
      await this.batchRepo.update(savedBatch.id, {
        status: 'success',
        successRows: rows.length,
        errorRows: 0,
      });

      this.publishProgress(savedSheet.id, 100, 'done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Rollback: delete any series that were partially inserted, then delete the
      // sheet itself, so failed imports leave no orphan rows in the DB.
      try {
        await this.seriesRepo.delete({ dataSheetId: savedSheet.id });
        await this.sheetRepo.delete(savedSheet.id);
      } catch {
        /* swallow — rollback is best-effort; the original error below is what matters */
      }
      await this.batchRepo.update(savedBatch.id, { status: 'error', errorMessage: msg });
      this.publishProgress(savedSheet.id, 0, 'error', msg);
      throw new BadRequestException(`Import thất bại: ${msg}`);
    }

    return { batchId: savedBatch.id, datasheetId: savedSheet.id, status: 'active' };
  }

  /** Reimport: parse new file, replace all existing series */
  async reimport(
    datasheetId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ batchId: string; datasheetId: string; status: string }> {
    const sheet = await this.findSheetOrFail(datasheetId);
    await this.authorizationService.requireManager(sheet.businessId, userId);

    this.validateFileType(file);

    const { headers, rows, warnings } = await this.parseFile(file, sheet.templateType as 'simple' | 'department' | 'pnl');

    const batch = this.batchRepo.create({
      businessId: sheet.businessId,
      uploaderId: userId,
      dataSheetId: datasheetId,
      originalFilename: file.originalname,
      status: 'processing',
    });
    const savedBatch = await this.batchRepo.save(batch);

    try {
      await this.seriesRepo.delete({ dataSheetId: datasheetId });

      // 1. Setup Department Lookup Map
      const deptMap = new Map<string, string>();
      const existingDepts = await this.departmentRepo.find({ where: { businessId: sheet.businessId } });
      existingDepts.forEach((d) => deptMap.set(d.name.toLowerCase(), d.id));

      // 2. Identify all unique department names from the parsed rows
      const uniqueDeptNames = new Set<string>();
      rows.forEach((r: any) => {
        if (r.departmentName) uniqueDeptNames.add(r.departmentName);
      });

      // 3. Auto-create missing departments
      for (const dName of uniqueDeptNames) {
        if (!deptMap.has(dName.toLowerCase())) {
          const newDept = this.departmentRepo.create({ businessId: sheet.businessId, name: dName });
          const savedDept = await this.departmentRepo.save(newDept);
          deptMap.set(dName.toLowerCase(), savedDept.id);
        }
      }

      // 4. Map series
      const seriesEntities = rows.map((row: any, idx) => {
        let mappedDeptId = null;
        if (row.departmentName) {
          mappedDeptId = deptMap.get(row.departmentName.toLowerCase()) || null;
        }

        return this.seriesRepo.create({
          dataSheetId: datasheetId,
          departmentId: mappedDeptId,
          seriesName: row.name,
          rowIndex: idx,
          values: Object.fromEntries(
            Object.entries(row.values).map(([k, v]) => [k, v ?? 0]),
          ) as Record<string, number>,
        });
      });
      await this.seriesRepo.save(seriesEntities);

      await this.sheetRepo.update(datasheetId, {
        // status stays as-is (active/inactive — user-controlled). Reimport doesn't
        // change lifecycle state.
        validationErrors: (warnings.length > 0 ? warnings : null) as any,
        importedAt: new Date(),
        periodHeaders: headers,
        originalFilename: file.originalname,
        errorMessage: warnings.length ? warnings.join('; ') : null,
      });
      await this.batchRepo.update(savedBatch.id, {
        status: 'success',
        successRows: rows.length,
        errorRows: 0,
      });

      this.publishProgress(datasheetId, 100, 'done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Reimport failed — existing sheet's status stays as-is. Record the error
      // message + import batch failure for audit, but don't touch lifecycle.
      await this.sheetRepo.update(datasheetId, { errorMessage: msg });
      await this.batchRepo.update(savedBatch.id, { status: 'error', errorMessage: msg });
      this.publishProgress(datasheetId, 0, 'error', msg);
      throw new BadRequestException(`Reimport thất bại: ${msg}`);
    }

    return { batchId: savedBatch.id, datasheetId, status: 'active' };
  }

  /** Parse file and return preview data WITHOUT saving anything to DB — SRS 4.7 */
  async preview(
    file: Express.Multer.File,
    templateType: 'simple' | 'department' | 'pnl' = 'simple',
  ): Promise<{
    headers: string[];
    rows: { name: string; values: Record<string, number | null> }[];
    warnings: string[];
    groups?: { departmentName: string; seriesCount: number }[];
    categories?: { name: string; level: number; hasValues: boolean }[];
  }> {
    this.validateFileType(file);
    return this.parseFile(file, templateType);
  }

  async getImportHistory(businessId: string, userId: string): Promise<ImportBatch[]> {
    await this.authorizationService.requireManager(businessId, userId);
    return this.batchRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async getImportBatch(batchId: string, userId: string): Promise<ImportBatch> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException(`ImportBatch ${batchId} not found`);
    await this.authorizationService.requireMember(batch.businessId, userId);
    return batch;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private validateFileType(file: Express.Multer.File): void {
    const ext = file.originalname.toLowerCase().split('.').pop();
    const isValidExt = ['xlsx', 'xls', 'csv'].includes(ext || '');
    const isValidMime = ALLOWED_MIMES.includes(file.mimetype);
    if (!isValidExt && !isValidMime) {
      throw new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .csv');
    }
  }

  private async parseFile(file: Express.Multer.File, templateType: 'simple' | 'department' | 'pnl' = 'simple') {
    let result;
    if (templateType === 'department') {
      const { parseDepartmentBuffer } = await import('./import-parsers/import-department-parser');
      result = await parseDepartmentBuffer(file.buffer, file.originalname);
    } else if (templateType === 'pnl') {
      const { parsePnlBuffer } = await import('./import-parsers/import-pnl-parser');
      result = await parsePnlBuffer(file.buffer, file.originalname);
    } else {
      result = await parseFileBuffer(file.buffer, file.originalname);
    }
    try {
      validateParseResult(result.headers, result.rows);
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e));
    }
    return result;
  }

  private async findSheetOrFail(id: string): Promise<DataSheet> {
    const sheet = await this.sheetRepo.findOne({ where: { id } });
    if (!sheet) throw new NotFoundException(`DataSheet ${id} not found`);
    return sheet;
  }

  private publishProgress(datasheetId: string, percent: number, status: string, errorMessage?: string) {
    this.pubSub.publish('importProgress', {
      importProgress: { datasheetId, percent, status, errorMessage: errorMessage ?? null },
    });
  }
}
