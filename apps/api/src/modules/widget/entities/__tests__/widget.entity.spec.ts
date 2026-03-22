import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { Widget } from '../widget.entity';

describe('Widget entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "widgets"', () => {
    const table = storage.tables.find((t) => t.target === Widget);
    expect(table?.name).toBe('widgets');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === Widget);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has composite index on tabId, x, y', () => {
    const idx = storage.indices.find(
      (i) => i.target === Widget &&
        Array.isArray(i.columns) &&
        (i.columns as string[]).includes('tabId') &&
        (i.columns as string[]).includes('x') &&
        (i.columns as string[]).includes('y'),
    );
    expect(idx).toBeDefined();
  });

  it('has position columns with defaults', () => {
    const defaults: Record<string, number> = { x: 20, y: 20, w: 1000, h: 500 };
    for (const [prop, expected] of Object.entries(defaults)) {
      const col = storage.columns.find(
        (c) => c.target === Widget && c.propertyName === prop,
      );
      expect((col?.options as { default?: unknown })?.default).toBe(expected);
    }
  });

  it('has nullable dataSheetId', () => {
    const col = storage.columns.find(
      (c) => c.target === Widget && c.propertyName === 'dataSheetId',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('has FK relation to Tab', () => {
    const rel = storage.relations.find(
      (r) => r.target === Widget && r.propertyName === 'tab',
    );
    expect(rel).toBeDefined();
  });

  it('instantiates', () => {
    expect(new Widget()).toBeInstanceOf(Widget);
  });
});
