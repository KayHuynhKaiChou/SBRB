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
import {
  DataSheetSortField,
  ListDataSheetsInput,
  SortOrder,
} from './dto/list-datasheets.dto';

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

  upload(
    file: Express.Multer.File,
    businessId: string,
    userId: string,
    departmentId?: string,
    templateType: 'simple' | 'department' | 'pnl' = 'simple',
  ) {
    return this.importService.upload(file, businessId, userId, departmentId, templateType);
  }

  reimport(datasheetId: string, file: Express.Multer.File, userId: string) {
    return this.importService.reimport(datasheetId, file, userId);
  }

  preview(file: Express.Multer.File, templateType: 'simple' | 'department' | 'pnl' = 'simple') {
    return this.importService.preview(file, templateType);
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

  generateSampleFile(
    templateType: 'simple' | 'department' | 'pnl',
  ): Promise<Buffer<ArrayBufferLike>> {
    return this.templateService.generateSampleFile(templateType);
  }

  // ---------------------------------------------------------------------------
  // CRUD operations
  // ---------------------------------------------------------------------------

  async findByBusiness(
    businessId: string,
    userId: string,
    filter?: ListDataSheetsInput,
  ): Promise<DataSheet[]> {
    await this.authorizationService.requireMember(businessId, userId);
    const qb = this.sheetRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.uploader', 'uploader')
      .loadRelationCountAndMap('s.widgetCount', 's.widgets')
      .where('s.businessId = :businessId', { businessId });

    if (filter?.status?.length) {
      qb.andWhere('s.status IN (:...statuses)', { statuses: filter.status });
    }
    if (filter?.templateType?.length) {
      qb.andWhere('s.templateType IN (:...templateTypes)', {
        templateTypes: filter.templateType,
      });
    }

    const order = filter?.sortOrder ?? SortOrder.DESC;
    switch (filter?.sortBy) {
      case DataSheetSortField.widgetCount:
        // `widgetCount` is computed via loadRelationCountAndMap; ORDER BY needs a
        // correlated subquery so the sort happens in SQL, not in memory.
        qb.addSelect(
          '(SELECT COUNT(*) FROM widgets w WHERE w.data_sheet_id = s.id)',
          'widget_count_sort',
        ).orderBy('widget_count_sort', order);
        break;
      case DataSheetSortField.importedAt:
        qb.orderBy('s.importedAt', order, 'NULLS LAST');
        break;
      case DataSheetSortField.createdAt:
      default:
        qb.orderBy('s.createdAt', order);
    }

    return qb.getMany();
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
      .leftJoinAndSelect('s.department', 'department')
      .where('s.dataSheetId = :datasheetId', { datasheetId })
      .orderBy('s.rowIndex', 'ASC');

    if (search) {
      qb.andWhere('s.seriesName ILIKE :search', { search: `%${search}%` });
    }
    return qb.getMany();
  }

  async update(id: string, userId: string, name: string, departmentId?: string | null): Promise<DataSheet> {
    const sheet = await this.findSheetOrFail(id);
    await this.authorizationService.requireManager(sheet.businessId, userId);
    sheet.name = name;
    if (departmentId !== undefined) {
      // Ignored: DataSheet no longer has departmentId. Series have departmentId.
    }
    return this.sheetRepo.save(sheet);
  }

  /** Flip a datasheet's lifecycle flag between 'active' and 'inactive'. Inactive
   *  sheets are filtered out of widget-creation pickers; existing widget links stay
   *  intact so already-wired widgets keep rendering data. */
  async toggleStatus(id: string, userId: string): Promise<DataSheet> {
    const sheet = await this.findSheetOrFail(id);
    await this.authorizationService.requireManager(sheet.businessId, userId);
    sheet.status = sheet.status === 'active' ? 'inactive' : 'active';
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
