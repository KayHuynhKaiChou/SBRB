import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { AuditLog } from '../audit-log.entity';

describe('AuditLog entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "audit_logs"', () => {
    const table = storage.tables.find((t) => t.target === AuditLog);
    expect(table?.name).toBe('audit_logs');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === AuditLog);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has composite index on businessId + createdAt', () => {
    const idx = storage.indices.find(
      (i) => i.target === AuditLog &&
        Array.isArray(i.columns) &&
        (i.columns as string[]).includes('businessId') &&
        (i.columns as string[]).includes('createdAt'),
    );
    expect(idx).toBeDefined();
  });

  it('has action, targetType, targetId, targetName columns', () => {
    const cols = storage.columns
      .filter((c) => c.target === AuditLog)
      .map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining(['action', 'targetType', 'targetId', 'targetName', 'metadata']),
    );
  });

  it('has nullable targetId and ipAddress', () => {
    for (const prop of ['targetId', 'ipAddress', 'userAgent']) {
      const col = storage.columns.find(
        (c) => c.target === AuditLog && c.propertyName === prop,
      );
      expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
    }
  });

  it('has FK relations to Business and User actor', () => {
    const rels = storage.relations
      .filter((r) => r.target === AuditLog)
      .map((r) => r.propertyName);
    expect(rels).toEqual(expect.arrayContaining(['business', 'actor']));
  });

  it('instantiates', () => {
    expect(new AuditLog()).toBeInstanceOf(AuditLog);
  });
});
