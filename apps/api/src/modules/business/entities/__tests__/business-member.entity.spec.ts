import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { BusinessMember } from '../business-member.entity';

describe('BusinessMember entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "business_members"', () => {
    const table = storage.tables.find((t) => t.target === BusinessMember);
    expect(table?.name).toBe('business_members');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === BusinessMember);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has composite unique constraint on businessId + userId', () => {
    const unique = storage.uniques.find((u) => u.target === BusinessMember);
    expect(unique?.columns).toEqual(expect.arrayContaining(['businessId', 'userId']));
  });

  it('has role column with default staff', () => {
    const col = storage.columns.find(
      (c) => c.target === BusinessMember && c.propertyName === 'role',
    );
    expect((col?.options as { default?: unknown })?.default).toBe('staff');
  });

  it('has status column with default active', () => {
    const col = storage.columns.find(
      (c) => c.target === BusinessMember && c.propertyName === 'status',
    );
    expect((col?.options as { default?: unknown })?.default).toBe('active');
  });

  it('has FK relations to Business and User', () => {
    const rels = storage.relations
      .filter((r) => r.target === BusinessMember)
      .map((r) => r.propertyName);
    expect(rels).toEqual(expect.arrayContaining(['business', 'user']));
  });

  it('instantiates', () => {
    expect(new BusinessMember()).toBeInstanceOf(BusinessMember);
  });
});
