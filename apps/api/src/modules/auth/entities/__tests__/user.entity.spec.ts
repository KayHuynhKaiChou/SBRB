import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../user.entity';

describe('User entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "users"', () => {
    const table = storage.tables.find((t) => t.target === User);
    expect(table?.name).toBe('users');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === User);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has required columns', () => {
    const cols = storage.columns
      .filter((c) => c.target === User)
      .map((c) => c.propertyName);
    expect(cols).toEqual(
      expect.arrayContaining([
        'email', 'passwordHash', 'fullName', 'avatarUrl',
        'emailVerified', 'language', 'createdAt', 'lastLoginAt',
      ]),
    );
  });

  it('instantiates with default values', () => {
    const user = new User();
    expect(user.emailVerified).toBeUndefined(); // defaults set by DB, not constructor
    expect(user).toBeInstanceOf(User);
  });

  it('allows nullable passwordHash for OAuth-only accounts', () => {
    const col = storage.columns.find(
      (c) => c.target === User && c.propertyName === 'passwordHash',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });
});
