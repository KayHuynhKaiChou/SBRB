import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `notifications` table (bell notifications) matching Notification entity.
 * Dev auto-creates this via TypeORM synchronize; this migration is for prod parity.
 */
export class CreateNotifications1777500006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_id UUID NULL REFERENCES businesses(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    // Fast unread-count + list-unread per user.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
        ON notifications(user_id) WHERE is_read = FALSE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_user_unread;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_user_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications;`);
  }
}
