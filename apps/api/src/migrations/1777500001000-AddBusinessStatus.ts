import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessStatus1777500001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS inactivated_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS inactivated_by UUID NULL,
        ADD COLUMN IF NOT EXISTS inactive_reason TEXT NULL;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'fk_businesses_inactivated_by'
        ) THEN
          ALTER TABLE businesses
            ADD CONSTRAINT fk_businesses_inactivated_by
            FOREIGN KEY (inactivated_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END;
      $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_businesses_status;`);
    await queryRunner.query(`
      ALTER TABLE businesses
        DROP CONSTRAINT IF EXISTS fk_businesses_inactivated_by;
    `);
    await queryRunner.query(`
      ALTER TABLE businesses
        DROP COLUMN IF EXISTS inactive_reason,
        DROP COLUMN IF EXISTS inactivated_by,
        DROP COLUMN IF EXISTS inactivated_at,
        DROP COLUMN IF EXISTS status;
    `);
  }
}
