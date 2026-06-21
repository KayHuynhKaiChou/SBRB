import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replace users.is_disabled / disabled_at with a 3-state lifecycle column `status`
 * (pending | active | inactive). Backfill: previously-disabled users → inactive,
 * everyone else → active. Adds status_changed_at audit timestamp + status index.
 */
export class AddUserAccountStatus1777500012000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ NULL;
    `);

    // Backfill from the old flag (column still present at this point).
    await queryRunner.query(`
      UPDATE users SET status = 'inactive' WHERE is_disabled = true;
    `);

    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS is_disabled,
        DROP COLUMN IF EXISTS disabled_at;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_status;`);

    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ NULL;
    `);

    // Reverse backfill: inactive accounts become disabled again.
    await queryRunner.query(`
      UPDATE users SET is_disabled = true, disabled_at = now() WHERE status = 'inactive';
    `);

    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS status_changed_at,
        DROP COLUMN IF EXISTS status;
    `);
  }
}
