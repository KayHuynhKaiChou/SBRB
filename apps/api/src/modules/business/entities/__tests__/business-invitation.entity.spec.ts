import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { BusinessInvitation } from '../business-invitation.entity';

describe('BusinessInvitation entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "business_invitations"', () => {
    const table = storage.tables.find((t) => t.target === BusinessInvitation);
    expect(table?.name).toBe('business_invitations');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === BusinessInvitation);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has unique token column', () => {
    const col = storage.columns.find(
      (c) => c.target === BusinessInvitation && c.propertyName === 'token',
    );
    expect((col?.options as { unique?: boolean })?.unique).toBe(true);
  });

  it('allows nullable usedAt', () => {
    const col = storage.columns.find(
      (c) => c.target === BusinessInvitation && c.propertyName === 'usedAt',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('has FK relations to Business and User', () => {
    const rels = storage.relations
      .filter((r) => r.target === BusinessInvitation)
      .map((r) => r.propertyName);
    expect(rels).toEqual(expect.arrayContaining(['business', 'inviter']));
  });

  it('instantiates', () => {
    expect(new BusinessInvitation()).toBeInstanceOf(BusinessInvitation);
  });
});
