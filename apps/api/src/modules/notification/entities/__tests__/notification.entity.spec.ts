import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { Notification } from '../notification.entity';

describe('Notification entity', () => {
  const storage = getMetadataArgsStorage();

  it('maps to table "notifications"', () => {
    const table = storage.tables.find((t) => t.target === Notification);
    expect(table?.name).toBe('notifications');
  });

  it('has uuid primary key', () => {
    const pk = storage.generations.find((g) => g.target === Notification);
    expect(pk?.strategy).toBe('uuid');
  });

  it('has isRead default false', () => {
    const col = storage.columns.find(
      (c) => c.target === Notification && c.propertyName === 'isRead',
    );
    expect((col?.options as { default?: unknown })?.default).toBe(false);
  });

  it('has nullable businessId', () => {
    const col = storage.columns.find(
      (c) => c.target === Notification && c.propertyName === 'businessId',
    );
    expect((col?.options as { nullable?: boolean })?.nullable).toBe(true);
  });

  it('has type, title, message columns', () => {
    const cols = storage.columns
      .filter((c) => c.target === Notification)
      .map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining(['type', 'title', 'message', 'metadata']));
  });

  it('has FK relation to User', () => {
    const rel = storage.relations.find(
      (r) => r.target === Notification && r.propertyName === 'user',
    );
    expect(rel).toBeDefined();
  });

  it('instantiates', () => {
    expect(new Notification()).toBeInstanceOf(Notification);
  });
});
