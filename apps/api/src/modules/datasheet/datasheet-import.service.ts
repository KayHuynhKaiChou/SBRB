import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { AuthorizationService } from '../../common/services/authorization.service';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { parseFileBuffer, validateParseResult } from '../../../../worker/src/processors/import-excel-parser';

const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/x-xlsx',
  'application/x-excel',
  'application/excel',
  'text/csv',
  'text/plain',
];

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
    private readonly authorizationService: AuthorizationService,
    @Inject('PUBSUB') private readonly pubSub: PubSub,
  ) {}

  /** Upload + parse Excel/CSV synchronously, save series to DB — no MinIO, no queue */
  async upload(
    file: Express.Multer.File,
    businessId: string,
    userId: string,
    departmentId?: string,
  ): Promise<{ batchId: string; datasheetId: string; status: string }> {
    this.validateFileType(file);
    await this.authorizationService.requireManager(businessId, userId);

    const { headers, rows, warnings } = await this.parseFile(file);

    const sheet = this.sheetRepo.create({
      businessId,
      uploadedBy: userId,
      name: file.originalname,
      originalFilename: file.originalname,
      status: 'processing',
      periodHeaders: headers,
      periodCount: headers.length,
      seriesCount: rows.length,
      ...(departmentId ? { departmentId } : {}),
    });
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
      const seriesEntities = rows.map((row, idx) =>
        this.seriesRepo.create({
          dataSheetId: savedSheet.id,
          seriesName: row.name,
          rowIndex: idx,
          values: Object.fromEntries(
            Object.entries(row.values).map(([k, v]) => [k, v ?? 0]),
          ),
        }),
      );
      await this.seriesRepo.save(seriesEntities);

      await this.sheetRepo.update(savedSheet.id, {
        status: 'ready',
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
      await this.sheetRepo.update(savedSheet.id, { status: 'error', errorMessage: msg });
      await this.batchRepo.update(savedBatch.id, { status: 'error', errorMessage: msg });
      this.publishProgress(savedSheet.id, 0, 'error', msg);
      throw new BadRequestException(`Import thất bại: ${msg}`);
    }

    return { batchId: savedBatch.id, datasheetId: savedSheet.id, status: 'ready' };
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

    const { headers, rows, warnings } = await this.parseFile(file);

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

      const seriesEntities = rows.map((row, idx) =>
        this.seriesRepo.create({
          dataSheetId: datasheetId,
          seriesName: row.name,
          rowIndex: idx,
          values: Object.fromEntries(
            Object.entries(row.values).map(([k, v]) => [k, v ?? 0]),
          ),
        }),
      );
      await this.seriesRepo.save(seriesEntities);

      await this.sheetRepo.update(datasheetId, {
        status: 'ready',
        importedAt: new Date(),
        periodHeaders: headers,
        periodCount: headers.length,
        seriesCount: rows.length,
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
      await this.sheetRepo.update(datasheetId, { status: 'error', errorMessage: msg });
      await this.batchRepo.update(savedBatch.id, { status: 'error', errorMessage: msg });
      this.publishProgress(datasheetId, 0, 'error', msg);
      throw new BadRequestException(`Reimport thất bại: ${msg}`);
    }

    return { batchId: savedBatch.id, datasheetId, status: 'ready' };
  }

  /** Parse file and return preview data WITHOUT saving anything to DB — SRS 4.7 */
  async preview(file: Express.Multer.File): Promise<{
    headers: string[];
    rows: { name: string; values: Record<string, number | null> }[];
    warnings: string[];
  }> {
    this.validateFileType(file);
    return this.parseFile(file);
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

  private async parseFile(file: Express.Multer.File) {
    const { headers, rows, warnings } = await parseFileBuffer(file.buffer, file.originalname);
    try {
      validateParseResult(headers, rows);
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e));
    }
    return { headers, rows, warnings };
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
