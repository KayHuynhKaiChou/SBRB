import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { DataSheet } from '../data-sheet.entity';

describe('DataSheet entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "data_sheets"', () => {
    const table = storage.tables.find((t) => t.target === DataSheet);
    expect(table?.name).toBe('data_sheets');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === DataSheet);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has status default "processing"', () => {
    const col = storage.columns.find(
      (c) => c.target === DataSheet && c.propertyName === 'status',
    );
    expect((col?.options as { default?: unknown })?.default).toBe('processing');
  });

  it('has periodType default "month"', () => {
    const col = storage.columns.find(
      (c) => c.target === DataSheet && c.propertyName === 'periodType',
    );
    expect((col?.options as { default?: unknown })?.default).toBe('month');
  });

  it('has nullable importedAt and errorMessage', () => {
    for (const prop of ['importedAt', 'errorMessage']) {
      const col = storage.columns.find(
        (c) => c.target === DataSheet && c.propertyName === prop,
      );
      expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
    }
  });

  it('has FK relations to Business and User', () => {
    const rels = storage.relations
      .filter((r) => r.target === DataSheet)
      .map((r) => r.propertyName);
    expect(rels).toEqual(expect.arrayContaining(['business', 'uploader']));
  });

  it('instantiates', () => {
    expect(new DataSheet()).toBeInstanceOf(DataSheet);
  });
});
