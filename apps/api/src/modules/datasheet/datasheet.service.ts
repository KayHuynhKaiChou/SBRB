import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as ExcelJS from 'exceljs';
import { MinioService } from '../../common/services/minio.service';
import { IMPORT_QUEUE } from '../../common/constants/queue.constants';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Widget } from '../widget/entities/widget.entity';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { IImportJobData, IUploadResult } from './dto/datasheet.type';

const MINIO_BUCKET = process.env.MINIO_BUCKET || 'sbrb';
const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];
const MANAGER_ROLES = ['owner', 'manager'];

/** DataSheet CRUD + upload service — SRS 4.7 / 4.8 */
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
    @InjectQueue(IMPORT_QUEUE)
    private readonly importQueue: Queue,
    private readonly minioService: MinioService,
  ) {}

  async upload(
    file: Express.Multer.File,
    businessId: string,
    userId: string,
  ): Promise<IUploadResult> {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .csv');
    }
    await this.requireManagerMember(businessId, userId);

    const fileKey = `${businessId}/imports/${uuidv4()}-${file.originalname}`;
    await this.minioService.upload(MINIO_BUCKET, fileKey, file.buffer, file.mimetype);

    const sheet = this.sheetRepo.create({
      businessId,
      uploadedBy: userId,
      name: file.originalname,
      originalFilename: file.originalname,
      fileUrl: fileKey,
      status: 'processing',
    });
    const savedSheet = await this.sheetRepo.save(sheet);

    const batch = this.batchRepo.create({
      businessId,
      uploaderId: userId,
      dataSheetId: savedSheet.id,
      originalFilename: file.originalname,
      fileUrl: fileKey,
      status: 'processing',
    });
    const savedBatch = await this.batchRepo.save(batch);

    const jobData: IImportJobData = {
      batchId: savedBatch.id,
      businessId,
      datasheetId: savedSheet.id,
      filePath: fileKey,
      fileName: file.originalname,
      uploadedBy: userId,
    };
    await this.importQueue.add('import-excel', jobData);

    return { batchId: savedBatch.id, datasheetId: savedSheet.id, status: 'processing' };
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

  async reimport(
    datasheetId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<IUploadResult> {
    const sheet = await this.findSheetOrFail(datasheetId);
    await this.requireManagerMember(sheet.businessId, userId);

    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file .xlsx hoặc .csv');
    }

    const fileKey = `${sheet.businessId}/imports/${uuidv4()}-${file.originalname}`;
    await this.minioService.upload(MINIO_BUCKET, fileKey, file.buffer, file.mimetype);

    const batch = this.batchRepo.create({
      businessId: sheet.businessId,
      uploaderId: userId,
      dataSheetId: datasheetId,
      originalFilename: file.originalname,
      fileUrl: fileKey,
      status: 'processing',
    });
    const savedBatch = await this.batchRepo.save(batch);

    const jobData: IImportJobData = {
      batchId: savedBatch.id,
      businessId: sheet.businessId,
      datasheetId,
      filePath: fileKey,
      fileName: file.originalname,
      uploadedBy: userId,
    };
    await this.importQueue.add('import-excel', jobData);

    return { batchId: savedBatch.id, datasheetId, status: 'processing' };
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
