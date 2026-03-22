import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { Tab } from '../tab.entity';

describe('Tab entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "tabs"', () => {
    const table = storage.tables.find((t) => t.target === Tab);
    expect(table?.name).toBe('tabs');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === Tab);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has default color and icon', () => {
    const colorCol = storage.columns.find(
      (c) => c.target === Tab && c.propertyName === 'color',
    );
    expect((colorCol?.options as { default?: unknown })?.default).toBe('#D72A44');

    const iconCol = storage.columns.find(
      (c) => c.target === Tab && c.propertyName === 'icon',
    );
    expect((iconCol?.options as { default?: unknown })?.default).toBe('chart-bar');
  });

  it('has boolean flags isProtected and isPinned', () => {
    const cols = storage.columns
      .filter((c) => c.target === Tab)
      .map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining(['isProtected', 'isPinned']));
  });

  it('has FK relations to Business and User', () => {
    const rels = storage.relations
      .filter((r) => r.target === Tab)
      .map((r) => r.propertyName);
    expect(rels).toEqual(expect.arrayContaining(['business', 'creator']));
  });

  it('instantiates', () => {
    expect(new Tab()).toBeInstanceOf(Tab);
  });
});
