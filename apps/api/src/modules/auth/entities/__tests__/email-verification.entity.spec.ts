import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { EmailVerification } from '../email-verification.entity';

describe('EmailVerification entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "email_verifications"', () => {
    const table = storage.tables.find((t) => t.target === EmailVerification);
    expect(table?.name).toBe('email_verifications');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === EmailVerification);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has unique token column', () => {
    const col = storage.columns.find(
      (c) => c.target === EmailVerification && c.propertyName === 'token',
    );
    expect((col?.options as { unique?: boolean })?.unique).toBe(true);
  });

  it('allows nullable usedAt', () => {
    const col = storage.columns.find(
      (c) => c.target === EmailVerification && c.propertyName === 'usedAt',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('has FK relation to User', () => {
    const rel = storage.relations.find(
      (r) => r.target === EmailVerification && r.propertyName === 'user',
    );
    expect(rel).toBeDefined();
  });

  it('instantiates', () => {
    expect(new EmailVerification()).toBeInstanceOf(EmailVerification);
  });
});
