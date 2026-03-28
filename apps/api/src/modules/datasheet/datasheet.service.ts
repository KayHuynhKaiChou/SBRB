import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorizationService } from '../../common/services/authorization.service';
import { Widget } from '../widget/entities/widget.entity';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { DatasheetImportService } from './datasheet-import.service';
import { DatasheetTemplateService } from './datasheet-template.service';

/**
 * DataSheet facade service — delegates import and template work to sub-services.
 * Handles CRUD operations directly: find, rename, delete, series lookup.
 * SRS 4.7 / 4.8
 */
@Injectable()
export class DatasheetService {
  constructor(
    @InjectRepository(DataSheet)
    private readonly sheetRepo: Repository<DataSheet>,
    @InjectRepository(DataSeries)
    private readonly seriesRepo: Repository<DataSeries>,
    @InjectRepository(Widget)
    private readonly widgetRepo: Repository<Widget>,
    private readonly authorizationService: AuthorizationService,
    private readonly importService: DatasheetImportService,
    private readonly templateService: DatasheetTemplateService,
  ) {}

  // ---------------------------------------------------------------------------
  // Delegated: import operations
  // ---------------------------------------------------------------------------

  upload(file: Express.Multer.File, businessId: string, userId: string) {
    return this.importService.upload(file, businessId, userId);
  }

  reimport(datasheetId: string, file: Express.Multer.File, userId: string) {
    return this.importService.reimport(datasheetId, file, userId);
  }

  getImportHistory(businessId: string, userId: string): Promise<ImportBatch[]> {
    return this.importService.getImportHistory(businessId, userId);
  }

  getImportBatch(batchId: string, userId: string): Promise<ImportBatch> {
    return this.importService.getImportBatch(batchId, userId);
  }

  // ---------------------------------------------------------------------------
  // Delegated: template generation
  // ---------------------------------------------------------------------------

  generateTemplate(
    periodType: 'month' | 'quarter' | 'year' | 'custom',
    count: number,
  ): Promise<Buffer<ArrayBufferLike>> {
    return this.templateService.generateTemplate(periodType, count);
  }

  // ---------------------------------------------------------------------------
  // CRUD operations
  // ---------------------------------------------------------------------------

  async findByBusiness(businessId: string, userId: string): Promise<DataSheet[]> {
    await this.authorizationService.requireMember(businessId, userId);
    return this.sheetRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<DataSheet> {
    const sheet = await this.findSheetOrFail(id);
    await this.authorizationService.requireMember(sheet.businessId, userId);
    return sheet;
  }

  async findSeries(datasheetId: string, userId: string, search?: string): Promise<DataSeries[]> {
    const sheet = await this.findSheetOrFail(datasheetId);
    await this.authorizationService.requireMember(sheet.businessId, userId);

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
    await this.authorizationService.requireManager(sheet.businessId, userId);
    sheet.name = name;
    return this.sheetRepo.save(sheet);
  }

  async delete(id: string, userId: string): Promise<void> {
    const sheet = await this.findSheetOrFail(id);
    await this.authorizationService.requireManager(sheet.businessId, userId);

    const linkedWidget = await this.widgetRepo.findOne({ where: { dataSheetId: id } });
    if (linkedWidget) {
      throw new BadRequestException('DataSheet đang được sử dụng bởi widget, không thể xóa');
    }
    await this.sheetRepo.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async findSheetOrFail(id: string): Promise<DataSheet> {
    const sheet = await this.sheetRepo.findOne({ where: { id } });
    if (!sheet) throw new NotFoundException(`DataSheet ${id} not found`);
    return sheet;
  }
}
