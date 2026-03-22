import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { DataSeries } from '../data-series.entity';

describe('DataSeries entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "data_series"', () => {
    const table = storage.tables.find((t) => t.target === DataSeries);
    expect(table?.name).toBe('data_series');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === DataSeries);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has composite index on dataSheetId + rowIndex', () => {
    const idx = storage.indices.find(
      (i) => i.target === DataSeries &&
        Array.isArray(i.columns) &&
        (i.columns as string[]).includes('dataSheetId') &&
        (i.columns as string[]).includes('rowIndex'),
    );
    expect(idx).toBeDefined();
  });

  it('has seriesName and rowIndex columns', () => {
    const cols = storage.columns
      .filter((c) => c.target === DataSeries)
      .map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining(['seriesName', 'rowIndex', 'values']));
  });

  it('has FK relation to DataSheet', () => {
    const rel = storage.relations.find(
      (r) => r.target === DataSeries && r.propertyName === 'dataSheet',
    );
    expect(rel).toBeDefined();
  });

  it('instantiates', () => {
    expect(new DataSeries()).toBeInstanceOf(DataSeries);
  });
});
