import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthorizationService } from '../../common/services/authorization.service';
import { Department } from '../department/entities/department.entity';
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
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
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
    });

    return series!;
  }

  /** Delete a DataSeries row. */
  async deleteSeries(seriesId: string, userId: string): Promise<boolean> {
    const series = await this.seriesRepo.findOne({
      where: { id: seriesId },
      relations: ['dataSheet'],
    });
    if (!series) throw new NotFoundException('DataSeries not found');

    const sheet = series.dataSheet;
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    await this.seriesRepo.delete({ id: seriesId });
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
   * Insert a new period column at an arbitrary position. `index` is the target
   * slot in `periodHeaders` (0 = before first, N = append, equivalent to addPeriod).
   * Because values are stored as JSONB keyed by period name, column order is purely
   * controlled by the `periodHeaders` array — no JSONB reshaping needed.
   */
  async insertPeriodAt(
    datasheetId: string,
    periodName: string,
    index: number,
    userId: string,
  ): Promise<DataSheet> {
    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    if (sheet.periodHeaders.includes(periodName)) {
      throw new BadRequestException(`Period '${periodName}' already exists`);
    }
    const clampedIndex = Math.max(0, Math.min(index, sheet.periodHeaders.length));

    await this.dataSource.transaction(async (em) => {
      const next = [...sheet.periodHeaders];
      next.splice(clampedIndex, 0, periodName);
      sheet.periodHeaders = next;
      await em.save(DataSheet, sheet);

      // Bulk-patch all series: append new key with value 0 (key order in JSONB is
      // insignificant — render order comes from periodHeaders).
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

  /**
   * Insert a new series (row) at an arbitrary position.
   * - Simple template: creates 1 DataSeries row at target rowIndex.
   * - Department template: creates N DataSeries rows (one per distinct department)
   *   all sharing the same target rowIndex and new seriesName.
   * Existing series with rowIndex >= target are shifted down atomically.
   */
  async insertSeriesAt(
    datasheetId: string,
    name: string,
    index: number,
    userId: string,
  ): Promise<DataSheet> {
    if (!name || name.length > 200) throw new BadRequestException('Invalid series name');

    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    const existing = await this.seriesRepo
      .createQueryBuilder('s')
      .select(['s.seriesName', 's.rowIndex', 's.departmentId'])
      .where('s.dataSheetId = :id', { id: datasheetId })
      .orderBy('s.rowIndex', 'ASC')
      .getMany();

    const isDepartment = sheet.templateType === 'department';

    // Single pass: build unique names (first-appearance order), their anchor rowIndex,
    // detect duplicates, and collect distinct departmentIds (dept template only).
    const uniqueNames: string[] = [];
    const firstRowIdxByName = new Map<string, number>();
    const deptIdSet = new Set<string | null>();
    let maxRowIndex = -1;
    for (const s of existing) {
      if (!firstRowIdxByName.has(s.seriesName)) {
        firstRowIdxByName.set(s.seriesName, s.rowIndex);
        uniqueNames.push(s.seriesName);
      }
      if (isDepartment) deptIdSet.add(s.departmentId ?? null);
      if (s.rowIndex > maxRowIndex) maxRowIndex = s.rowIndex;
    }
    if (firstRowIdxByName.has(name)) {
      throw new BadRequestException(`Series '${name}' already exists`);
    }

    const clampedIndex = Math.max(0, Math.min(index, uniqueNames.length));
    const targetRowIndex =
      clampedIndex < uniqueNames.length
        ? firstRowIdxByName.get(uniqueNames[clampedIndex])!
        : maxRowIndex + 1;

    const deptIds: (string | null)[] =
      isDepartment && deptIdSet.size > 0 ? [...deptIdSet] : [null];
    const values = Object.fromEntries(sheet.periodHeaders.map((h) => [h, 0]));

    await this.dataSource.transaction(async (em) => {
      // Shift existing rows at target position down by 1 (skipped when appending).
      if (clampedIndex < uniqueNames.length) {
        await em
          .createQueryBuilder()
          .update(DataSeries)
          .set({ rowIndex: () => 'row_index + 1' })
          .where('data_sheet_id = :id AND row_index >= :target', {
            id: datasheetId,
            target: targetRowIndex,
          })
          .execute();
      }

      // Bulk INSERT — one round-trip regardless of deptIds.length.
      await em.insert(
        DataSeries,
        deptIds.map((departmentId) => ({
          dataSheetId: datasheetId,
          seriesName: name,
          rowIndex: targetRowIndex,
          departmentId,
          values,
        })),
      );
    });

    return sheet;
  }

  /**
   * Delete all DataSeries rows matching a given seriesName (across all departments).
   * Used by department template where one rendered row = N DataSeries records.
   */
  async deleteSeriesByName(
    datasheetId: string,
    name: string,
    userId: string,
  ): Promise<boolean> {
    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    await this.authorizationService.requireManager(sheet.businessId, userId);

    await this.seriesRepo.delete({
      dataSheetId: datasheetId,
      seriesName: name,
    });

    return true;
  }

  /**
   * Add a new department (column group) to a department-template datasheet.
   * Creates the Department record (business-scoped) and auto-populates one DataSeries
   * per existing unique seriesName. rowIndex values are `max+1..max+N` so the new
   * department appears LAST while preserving the original row ordering.
   * If `name` collides with an existing department in this sheet, auto-suffixes `(2)`, `(3)`…
   */
  async addDepartmentToDatasheet(
    datasheetId: string,
    name: string,
    userId: string,
  ): Promise<DataSheet> {
    const trimmed = (name ?? '').trim();
    if (!trimmed || trimmed.length > 100) {
      throw new BadRequestException('Invalid department name');
    }

    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    if (sheet.templateType !== 'department') {
      throw new BadRequestException('Only department-template datasheets support this operation');
    }
    await this.authorizationService.requireManager(sheet.businessId, userId);

    // Single pass: extract unique seriesNames (ordered), existing dept names, maxRowIndex.
    const existing = await this.seriesRepo
      .createQueryBuilder('s')
      .leftJoin('s.department', 'd')
      .select(['s.seriesName', 's.rowIndex', 'd.id', 'd.name'])
      .where('s.dataSheetId = :id', { id: datasheetId })
      .orderBy('s.rowIndex', 'ASC')
      .getMany();

    if (existing.length === 0) {
      throw new BadRequestException('Cannot add a department to an empty datasheet');
    }

    const seriesNames: string[] = [];
    const seenSeries = new Set<string>();
    const existingDeptNames = new Set<string>();
    let maxRowIndex = -1;
    for (const s of existing) {
      if (!seenSeries.has(s.seriesName)) {
        seenSeries.add(s.seriesName);
        seriesNames.push(s.seriesName);
      }
      if (s.department?.name) existingDeptNames.add(s.department.name);
      if (s.rowIndex > maxRowIndex) maxRowIndex = s.rowIndex;
    }

    // Auto-suffix on name collision (within this sheet only).
    let finalName = trimmed;
    let suffix = 2;
    while (existingDeptNames.has(finalName)) {
      finalName = `${trimmed} (${suffix++})`;
    }

    const zeroValues = Object.fromEntries(sheet.periodHeaders.map((h) => [h, 0]));

    let newDept!: Department;
    await this.dataSource.transaction(async (em) => {
      newDept = await em.save(
        Department,
        em.create(Department, { businessId: sheet.businessId, name: finalName }),
      );

      await em.insert(
        DataSeries,
        seriesNames.map((seriesName, i) => ({
          dataSheetId: datasheetId,
          departmentId: newDept.id,
          seriesName,
          rowIndex: maxRowIndex + 1 + i,
          values: zeroValues,
        })),
      );
    });

    return sheet;
  }

  /**
   * Remove a department from a department-template datasheet — deletes all DataSeries
   * records linking the given departmentId within this sheet. The Department record
   * itself is kept (business-scoped; may be referenced by other sheets).
   * Rejects if ≤2 distinct departments remain — the department template requires a
   * minimum of 2 columns per business rule.
   */
  async deleteDepartmentFromDatasheet(
    datasheetId: string,
    departmentId: string,
    userId: string,
  ): Promise<boolean> {
    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    if (sheet.templateType !== 'department') {
      throw new BadRequestException('Only department-template datasheets support this operation');
    }
    await this.authorizationService.requireManager(sheet.businessId, userId);

    const { distinctCount } = (await this.seriesRepo
      .createQueryBuilder('s')
      .select('COUNT(DISTINCT s.departmentId)', 'distinctCount')
      .where('s.dataSheetId = :id AND s.departmentId IS NOT NULL', { id: datasheetId })
      .getRawOne()) as { distinctCount: string };
    if (Number(distinctCount) <= 2) {
      throw new BadRequestException('Minimum 2 departments required');
    }

    await this.seriesRepo.delete({ dataSheetId: datasheetId, departmentId });
    return true;
  }

  /**
   * Upsert a single cell in a department-template datasheet — for editing "sparse"
   * cells (no DataSeries record yet for a given dept × seriesName).
   * - Existing row → atomic JSONB update (same as updateSeriesValue, avoids RMW).
   * - Missing row → create DataSeries inheriting rowIndex from any row with the same
   *   seriesName (keeps alignment across departments).
   * - `value = null` on missing row → no-op (nothing to clear).
   */
  async upsertCellValue(
    datasheetId: string,
    departmentId: string,
    seriesName: string,
    period: string,
    value: number | null,
    userId: string,
  ): Promise<DataSeries> {
    const sheet = await this.sheetRepo.findOne({ where: { id: datasheetId } });
    if (!sheet) throw new NotFoundException('DataSheet not found');
    if (sheet.templateType !== 'department') {
      throw new BadRequestException('Only department-template datasheets support this operation');
    }
    await this.authorizationService.requireManager(sheet.businessId, userId);

    // Period must be in sheet's header list (allow-list — never interpolate user input into SQL)
    if (!sheet.periodHeaders.includes(period)) {
      throw new BadRequestException('Period does not exist in this datasheet');
    }

    const existing = await this.seriesRepo.findOne({
      where: { dataSheetId: datasheetId, departmentId, seriesName },
    });

    if (existing) {
      if (value === null) {
        await this.seriesRepo
          .createQueryBuilder()
          .update(DataSeries)
          .set({ values: () => `values - :period` })
          .setParameter('period', period)
          .where('id = :id', { id: existing.id })
          .execute();
      } else {
        await this.seriesRepo
          .createQueryBuilder()
          .update(DataSeries)
          .set({ values: () => `jsonb_set(values, ARRAY[:period], :val::jsonb)` })
          .setParameter('period', period)
          .setParameter('val', JSON.stringify(value))
          .where('id = :id', { id: existing.id })
          .execute();
      }
      return this.seriesRepo.findOneOrFail({ where: { id: existing.id } });
    }

    // No existing row to clear.
    if (value === null) {
      throw new BadRequestException('Cannot clear a cell that has no data');
    }

    // Inherit rowIndex from any sibling row with the same seriesName (to stay aligned
    // across departments). If no sibling, append at end.
    const sibling = await this.seriesRepo
      .createQueryBuilder('s')
      .select('s.rowIndex', 'rowIndex')
      .where('s.dataSheetId = :id AND s.seriesName = :name', {
        id: datasheetId,
        name: seriesName,
      })
      .orderBy('s.rowIndex', 'ASC')
      .limit(1)
      .getRawOne<{ rowIndex: number }>();
    let rowIndex: number;
    if (sibling) {
      rowIndex = Number(sibling.rowIndex);
    } else {
      const max = await this.seriesRepo
        .createQueryBuilder('s')
        .select('COALESCE(MAX(s.rowIndex), -1)', 'max')
        .where('s.dataSheetId = :id', { id: datasheetId })
        .getRawOne<{ max: string }>();
      rowIndex = Number(max?.max ?? -1) + 1;
    }

    const values = Object.fromEntries(sheet.periodHeaders.map((h) => [h, 0]));
    values[period] = value;

    const created = await this.seriesRepo.save(
      this.seriesRepo.create({
        dataSheetId: datasheetId,
        departmentId,
        seriesName,
        rowIndex,
        values,
      }),
    );
    return created;
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
