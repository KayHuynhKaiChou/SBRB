import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { AlertThreshold } from '../alert-threshold.entity';

describe('AlertThreshold entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "alert_thresholds"', () => {
    const table = storage.tables.find((t) => t.target === AlertThreshold);
    expect(table?.name).toBe('alert_thresholds');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === AlertThreshold);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has condition and threshold columns', () => {
    const cols = storage.columns
      .filter((c) => c.target === AlertThreshold)
      .map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining(['condition', 'threshold']));
  });

  it('has isActive default true', () => {
    const col = storage.columns.find(
      (c) => c.target === AlertThreshold && c.propertyName === 'isActive',
    );
    expect((col?.options as { default?: unknown })?.default).toBe(true);
  });

  it('allows nullable lastTriggeredAt', () => {
    const col = storage.columns.find(
      (c) => c.target === AlertThreshold && c.propertyName === 'lastTriggeredAt',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('has FK relation to Widget', () => {
    const rel = storage.relations.find(
      (r) => r.target === AlertThreshold && r.propertyName === 'widget',
    );
    expect(rel).toBeDefined();
  });

  it('instantiates', () => {
    expect(new AlertThreshold()).toBeInstanceOf(AlertThreshold);
  });
});
