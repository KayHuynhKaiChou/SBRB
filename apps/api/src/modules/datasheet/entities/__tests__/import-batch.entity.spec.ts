import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { ImportBatch } from '../import-batch.entity';

describe('ImportBatch entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "import_batches"', () => {
    const table = storage.tables.find((t) => t.target === ImportBatch);
    expect(table?.name).toBe('import_batches');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === ImportBatch);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has status default "processing"', () => {
    const col = storage.columns.find(
      (c) => c.target === ImportBatch && c.propertyName === 'status',
    );
    expect((col?.options as { default?: unknown })?.default).toBe('processing');
  });

  it('has successRows and errorRows with default 0', () => {
    for (const prop of ['successRows', 'errorRows']) {
      const col = storage.columns.find(
        (c) => c.target === ImportBatch && c.propertyName === prop,
      );
      expect((col?.options as { default?: unknown })?.default).toBe(0);
    }
  });

  it('has nullable dataSheetId', () => {
    const col = storage.columns.find(
      (c) => c.target === ImportBatch && c.propertyName === 'dataSheetId',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('has FK relations to Business and User', () => {
    const rels = storage.relations
      .filter((r) => r.target === ImportBatch)
      .map((r) => r.propertyName);
    expect(rels).toEqual(expect.arrayContaining(['business', 'uploader']));
  });

  it('instantiates', () => {
    expect(new ImportBatch()).toBeInstanceOf(ImportBatch);
  });
});
