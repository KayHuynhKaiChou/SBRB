import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { Session } from '../session.entity';

describe('Session entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "sessions"', () => {
    const table = storage.tables.find((t) => t.target === Session);
    expect(table?.name).toBe('sessions');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === Session);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has required columns', () => {
    const cols = storage.columns
      .filter((c) => c.target === Session)
      .map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining(['userId', 'deviceName', 'ipAddress', 'lastActiveAt', 'createdAt']),
    );
  });

  it('has FK relation to User', () => {
    const rel = storage.relations.find(
      (r) => r.target === Session && r.propertyName === 'user',
    );
    expect(rel).toBeDefined();
  });

  it('instantiates', () => {
    expect(new Session()).toBeInstanceOf(Session);
  });
});
