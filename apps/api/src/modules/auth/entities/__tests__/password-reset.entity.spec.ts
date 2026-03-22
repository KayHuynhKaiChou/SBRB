import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { PasswordReset } from '../password-reset.entity';

describe('PasswordReset entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "password_resets"', () => {
    const table = storage.tables.find((t) => t.target === PasswordReset);
    expect(table?.name).toBe('password_resets');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === PasswordReset);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has unique token column', () => {
    const col = storage.columns.find(
      (c) => c.target === PasswordReset && c.propertyName === 'token',
    );
    expect((col?.options as { unique?: boolean })?.unique).toBe(true);
  });

  it('allows nullable usedAt', () => {
    const col = storage.columns.find(
      (c) => c.target === PasswordReset && c.propertyName === 'usedAt',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('has FK relation to User', () => {
    const rel = storage.relations.find(
      (r) => r.target === PasswordReset && r.propertyName === 'user',
    );
    expect(rel).toBeDefined();
  });

  it('instantiates', () => {
    expect(new PasswordReset()).toBeInstanceOf(PasswordReset);
  });
});
