import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { RefreshToken } from '../refresh-token.entity';

describe('RefreshToken entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "refresh_tokens"', () => {
    const table = storage.tables.find((t) => t.target === RefreshToken);
    expect(table?.name).toBe('refresh_tokens');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === RefreshToken);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has unique tokenHash column', () => {
    const col = storage.columns.find(
      (c) => c.target === RefreshToken && c.propertyName === 'tokenHash',
    );
    expect((col?.options as { unique?: boolean })?.unique).toBe(true);
  });

  it('has FK relation to User', () => {
    const rel = storage.relations.find(
      (r) => r.target === RefreshToken && r.propertyName === 'user',
    );
    expect(rel).toBeDefined();
  });

  it('allows nullable revokedAt', () => {
    const col = storage.columns.find(
      (c) => c.target === RefreshToken && c.propertyName === 'revokedAt',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('instantiates', () => {
    expect(new RefreshToken()).toBeInstanceOf(RefreshToken);
  });
});
