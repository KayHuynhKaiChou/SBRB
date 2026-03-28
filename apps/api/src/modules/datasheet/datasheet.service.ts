import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { PubSub } from 'graphql-subscriptions';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Widget } from '../widget/entities/widget.entity';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { UpdateDatasheetDto } from './dto/update-datasheet.dto';
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
const MANAGER_ROLES = ['owner', 'manager'];

/** DataSheet CRUD + direct-parse import service — SRS 4.7 / 4.8 */
@Injectable()
export class DatasheetService {
  constructor(
    @InjectRepository(DataSheet)
    private readonly sheetRepo: Repository<DataSheet>,
    @InjectRepository(DataSeries)
    private readonly seriesRepo: Repository<DataSeries>,
    @InjectRepository(ImportBatch)
    private readonly batchRepo: Repository<ImportBatch>,
    @InjectRepository(BusinessMember)
    private readonly memberRepo: Repository<BusinessMember>,
    @InjectRepository(Widget)
    private readonly widgetRepo: Repository<Widget>,
    @Inject('PUBSUB') private readonly pubSub: PubSub,
  ) {}

  /** Upload + parse Excel/CSV synchronously, save series to DB — no MinIO, no queue */
  async upload(
    file: Express.Multer.File,
    businessId: string,
    userId: string,
  ): Promise<{ batchId: string; datasheetId: string; status: string }> {
    // Validate file type by extension or MIME type
    const ext = file.originalname.toLowerCase().split('.').pop();
    const isValidExt = ['xlsx', 'xls', 'csv'].includes(ext || '');
    const isValidMime = ALLOWED_MIMES.includes(file.mimetype);

    if (!isValidExt && !isValidMime) {
      throw new BadRequestException(`Chỉ chấp nhận file .xlsx hoặc .csv`);
    }
    await this.requireManagerMember(businessId, userId);

    // Parse and validate
    const { headers, rows, warnings } = await parseFileBuffer(file.buffer, file.originalname);
    try {
      validateParseResult(headers, rows);
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e));
    }

    // Create DataSheet record
    const sheet = this.sheetRepo.create({
      businessId,
      uploadedBy: userId,
      name: file.originalname,
      originalFilename: file.originalname,
      fileUrl: null,
      status: 'processing',
      periodHeaders: headers,
      periodCount: headers.length,
      seriesCount: rows.length,
    });
    const savedSheet = await this.sheetRepo.save(sheet);

    // Create ImportBatch record
    const batch = this.batchRepo.create({
      businessId,
      uploaderId: userId,
      dataSheetId: savedSheet.id,
      originalFilename: file.originalname,
      fileUrl: null,
      status: 'processing',
    });
    const savedBatch = await this.batchRepo.save(batch);

    try {
      // Save DataSeries records
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

      // Mark sheet + batch as ready
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

  async findByBusiness(businessId: string, userId: string): Promise<DataSheet[]> {
    await this.requireMember(businessId, userId);
    return this.sheetRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<DataSheet> {
    const sheet = await this.findSheetOrFail(id);
    await this.requireMember(sheet.businessId, userId);
    return sheet;
  }

  async findSeries(datasheetId: string, userId: string, search?: string): Promise<DataSeries[]> {
    const sheet = await this.findSheetOrFail(datasheetId);
    await this.requireMember(sheet.businessId, userId);

    const qb = this.seriesRepo
      .createQueryBuilder('s')
      .where('s.dataSheetId = :datasheetId', { datasheetId })
      .orderBy('s.rowIndex', 'ASC');

    if (search) {
      qb.andWhere('s.seriesName ILIKE :search', { search: `%${search}%` });
    }
    return qb.getMany();
  }

  async rename(id: string, userId: string, name: string): Promise<DataSheet> {
    const sheet = await this.findSheetOrFail(id);
    await this.requireManagerMember(sheet.businessId, userId);
    sheet.name = name;
    return this.sheetRepo.save(sheet);
  }

  async delete(id: string, userId: string): Promise<void> {
    const sheet = await this.findSheetOrFail(id);
    await this.requireManagerMember(sheet.businessId, userId);

    const linkedWidget = await this.widgetRepo.findOne({ where: { dataSheetId: id } });
    if (linkedWidget) {
      throw new BadRequestException('DataSheet đang được sử dụng bởi widget, không thể xóa');
    }
    await this.sheetRepo.delete(id);
  }

  async getImportHistory(businessId: string, userId: string): Promise<ImportBatch[]> {
    await this.requireManagerMember(businessId, userId);
    return this.batchRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async getImportBatch(batchId: string, userId: string): Promise<ImportBatch> {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException(`ImportBatch ${batchId} not found`);
    await this.requireMember(batch.businessId, userId);
    return batch;
  }

  async generateTemplate(
    periodType: 'month' | 'quarter' | 'year' | 'custom',
    count: number,
  ): Promise<Buffer<ArrayBufferLike>> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    const headers = this.buildPeriodHeaders(periodType);

    sheet.addRow(['', ...headers]);
    for (let i = 1; i <= count; i++) {
      sheet.addRow([`Nhập tên chỉ số ${i}`, ...headers.map(() => 0)]);
    }

    const instructions = workbook.addWorksheet('Hướng dẫn');
    instructions.addRow(['Hướng dẫn nhập liệu SBRB']);
    instructions.addRow(['- Cột A: Tên chỉ số (không để trống)']);
    instructions.addRow(['- Hàng 1: Tiêu đề kỳ (không thay đổi)']);
    instructions.addRow(['- Giá trị: Số thực, để 0 nếu không có dữ liệu']);

    const buf = await workbook.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  /** Reimport: parse new file, replace all existing series */
  async reimport(
    datasheetId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ batchId: string; datasheetId: string; status: string }> {
    const sheet = await this.findSheetOrFail(datasheetId);
    await this.requireManagerMember(sheet.businessId, userId);

    // Validate file type by extension or MIME type
    const ext = file.originalname.toLowerCase().split('.').pop();
    const isValidExt = ['xlsx', 'xls', 'csv'].includes(ext || '');
    const isValidMime = ALLOWED_MIMES.includes(file.mimetype);

    if (!isValidExt && !isValidMime) {
      throw new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .csv');
    }

    const { headers, rows, warnings } = await parseFileBuffer(file.buffer, file.originalname);
    try {
      validateParseResult(headers, rows);
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e));
    }

    const batch = this.batchRepo.create({
      businessId: sheet.businessId,
      uploaderId: userId,
      dataSheetId: datasheetId,
      originalFilename: file.originalname,
      fileUrl: null,
      status: 'processing',
    });
    const savedBatch = await this.batchRepo.save(batch);

    try {
      // Delete existing series then re-insert
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async requireMember(businessId: string, userId: string): Promise<BusinessMember> {
    const member = await this.memberRepo.findOne({
      where: { businessId, userId, status: 'active' },
    });
    if (!member) throw new ForbiddenException('Bạn không có quyền truy cập business này');
    return member;
  }

  private async requireManagerMember(businessId: string, userId: string): Promise<BusinessMember> {
    const member = await this.requireMember(businessId, userId);
    if (!MANAGER_ROLES.includes(member.role)) {
      throw new ForbiddenException('Yêu cầu quyền Manager hoặc cao hơn');
    }
    return member;
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

  private buildPeriodHeaders(periodType: string): string[] {
    if (periodType === 'month') return Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    if (periodType === 'quarter') return ['Q1', 'Q2', 'Q3', 'Q4'];
    if (periodType === 'year') {
      const year = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => String(year + i));
    }
    return Array.from({ length: 12 }, (_, i) => `P${i + 1}`);
  }
}
