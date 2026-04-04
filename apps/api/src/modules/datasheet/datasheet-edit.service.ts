import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthorizationService } from '../../common/services/authorization.service';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';

/**
 * DatasheetEditService — handles in-place edits: cell values, row/column CRUD.
 * All mutations require manager role (owner/manager). SRS 4.8
 */
@Injectable()
export class DatasheetEditService {
  constructor(
    @InjectRepository(DataSeries)
    private readonly seriesRepo: Repository<DataSeries>,
    @InjectRepository(DataSheet)
    private readonly sheetRepo: Repository<DataSheet>,
    private readonly authorizationService: AuthorizationService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Atomically update a single period value in a DataSeries JSONB column.
   * Uses PostgreSQL jsonb_set / key removal to avoid read-modify-write race conditions.
   * `period` is validated against sheet.periodHeaders (allow-list) before use in SQL.
   */
  async updateSeriesValue(
    seriesId: string,
    period: string,
    value: number | null,
    userId: string,
  ): Promise<DataSeries> {
    const series = await this.seriesRepo.findOne({
      where: { id: seriesId },
      relations: ['dataSheet'],
    });
    if (!series) throw new NotFoundException('DataSeries not found');

    const sheet = series.dataSheet;
    if (!sheet) throw new NotFoundException('DataSheet not found');

    await this.authorizationService.requireManager(sheet.businessId, userId);

    // Allow-list validation — period MUST exist in sheet headers before use in SQL
    if (!sheet.periodHeaders.includes(period)) {
      throw new BadRequestException('Period does not exist in this datasheet');
    }

    // Atomic JSONB update — safe because `period` is validated against periodHeaders above
    if (value === null) {
      await this.seriesRepo
        .createQueryBuilder()
        .update(DataSeries)
        .set({ values: () => `values - :period` })
        .setParameter('period', period)
        .where('id = :id', { id: seriesId })
        .execute();
    } else {
      await this.seriesRepo
        .createQueryBuilder()
        .update(DataSeries)
        .set({ values: () => `jsonb_set(values, ARRAY[:period], :val::jsonb)` })
        .setParameter('period', period)
        .setParameter('val', JSON.stringify(value))
        .where('id = :id', { id: seriesId })
        .execute();
    }

    return this.seriesRepo.findOneOrFail({ where: { id: seriesId } });
  }

  /** Add a new DataSeries row. rowIndex is appended after current last row. */
  async addSeries(datasheetId: string, name: string, userId: string): Promise<DataSeries> {
    if (!name || name.length > 200) throw new BadRequestException('Invalid series name');

    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    // Use max rowIndex + 1 to avoid collisions after deletes
    const maxRow = await this.seriesRepo
      .createQueryBuilder('s')
      .select('COALESCE(MAX(s.rowIndex), -1)', 'maxIdx')
      .where('s.dataSheetId = :id', { id: datasheetId })
      .getRawOne();
    const nextRowIndex = (maxRow?.maxIdx ?? -1) + 1;

    let series: DataSeries;
    await this.dataSource.transaction(async (em) => {
      const values = Object.fromEntries(sheet.periodHeaders.map((h) => [h, 0]));
      series = em.create(DataSeries, { dataSheetId: datasheetId, seriesName: name, rowIndex: nextRowIndex, values });
      await em.save(DataSeries, series);
      await em.increment(DataSheet, { id: datasheetId }, 'seriesCount', 1);
    });

    return series!;
  }

  /** Delete a DataSeries row and decrement sheet.seriesCount atomically. */
  async deleteSeries(seriesId: string, userId: string): Promise<boolean> {
    const series = await this.seriesRepo.findOne({
      where: { id: seriesId },
      relations: ['dataSheet'],
    });
    if (!series) throw new NotFoundException('DataSeries not found');

    const sheet = series.dataSheet;
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    await this.dataSource.transaction(async (em) => {
      await em.delete(DataSeries, { id: seriesId });
      await em
        .createQueryBuilder()
        .update(DataSheet)
        .set({ seriesCount: () => 'GREATEST(series_count - 1, 0)' })
        .where('id = :id', { id: sheet.id })
        .execute();
    });

    return true;
  }

  /**
   * Add a new period column. Appends header to periodHeaders and bulk-patches
   * all series JSONB values in a single transaction to avoid partial state.
   */
  async addPeriod(datasheetId: string, periodName: string, userId: string): Promise<DataSheet> {
    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    if (sheet.periodHeaders.includes(periodName)) {
      throw new BadRequestException(`Period '${periodName}' already exists`);
    }

    await this.dataSource.transaction(async (em) => {
      sheet.periodHeaders = [...sheet.periodHeaders, periodName];
      sheet.periodCount += 1;
      await em.save(DataSheet, sheet);

      // Bulk-patch all series: append new key with value 0
      const patch = JSON.stringify({ [periodName]: 0 });
      await em
        .createQueryBuilder()
        .update(DataSeries)
        .set({ values: () => `values || :patch::jsonb` })
        .setParameter('patch', patch)
        .where('data_sheet_id = :id', { id: datasheetId })
        .execute();
    });

    return this.sheetRepo.findOneOrFail({ where: { id: datasheetId } });
  }

  /**
   * Delete a period column. Removes header from periodHeaders and bulk-removes
   * the key from all series JSONB values in a single transaction.
   */
  async deletePeriod(datasheetId: string, periodName: string, userId: string): Promise<DataSheet> {
    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    if (!sheet.periodHeaders.includes(periodName)) {
      throw new BadRequestException(`Period '${periodName}' does not exist`);
    }

    await this.dataSource.transaction(async (em) => {
      sheet.periodHeaders = sheet.periodHeaders.filter((h) => h !== periodName);
      sheet.periodCount = Math.max(0, sheet.periodCount - 1);
      await em.save(DataSheet, sheet);

      // Bulk-remove key from all series JSONB values
      await em
        .createQueryBuilder()
        .update(DataSeries)
        .set({ values: () => `values - :period` })
        .setParameter('period', periodName)
        .where('data_sheet_id = :id', { id: datasheetId })
        .execute();
    });

    return this.sheetRepo.findOneOrFail({ where: { id: datasheetId } });
  }

  /** Rename a DataSeries row. Manager+ only. */
  async renameSeries(seriesId: string, name: string, userId: string): Promise<DataSeries> {
    if (!name || name.length > 200) throw new BadRequestException('Invalid series name');
    const series = await this.seriesRepo.findOne({
      where: { id: seriesId },
      relations: ['dataSheet'],
    });
    if (!series) throw new NotFoundException('DataSeries not found');

    const sheet = series.dataSheet;
    if (!sheet) throw new NotFoundException('DataSheet not found');

    await this.authorizationService.requireManager(sheet.businessId, userId);

    series.seriesName = name;
    return this.seriesRepo.save(series);
  }
}
