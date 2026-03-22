import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { Business } from '../business.entity';

describe('Business entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "businesses"', () => {
    const table = storage.tables.find((t) => t.target === Business);
    expect(table?.name).toBe('businesses');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === Business);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has required columns', () => {
    const cols = storage.columns
      .filter((c) => c.target === Business)
      .map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining([
        'ownerId', 'name', 'industry', 'timezone', 'currency',
        'primaryColor', 'weekStart', 'canvasWidth', 'canvasHeight', 'snapGrid',
      ]),
    );
  });

  it('has FK relation to owner User', () => {
    const rel = storage.relations.find(
      (r) => r.target === Business && r.propertyName === 'owner',
    );
    expect(rel).toBeDefined();
  });

  it('has default values defined', () => {
    const industryCol = storage.columns.find(
      (c) => c.target === Business && c.propertyName === 'industry',
    );
    expect((industryCol?.options as { default?: unknown })?.default).toBe('Other');

    const colorCol = storage.columns.find(
      (c) => c.target === Business && c.propertyName === 'primaryColor',
    );
    expect((colorCol?.options as { default?: unknown })?.default).toBe('#D72A44');
  });

  it('instantiates', () => {
    expect(new Business()).toBeInstanceOf(Business);
  });
});
