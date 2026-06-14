import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds business verification/approval columns + KYB profile fields.
 *
 * IMPORTANT: approval_status default = 'approved' so all EXISTING businesses are
 * back-filled as approved (no lockout). The service layer sets 'pending' explicitly
 * on NEW business creation. See docs/business-approval-rules.md §3.
 */
export class AddBusinessApprovalAndKyb1777500004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'approved',
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS approved_by UUID NULL,
        ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS rejected_by UUID NULL,
        ADD COLUMN IF NOT EXISTS legal_name VARCHAR(150) NULL,
        ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20) NULL,
        ADD COLUMN IF NOT EXISTS business_type VARCHAR(30) NULL,
        ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30) NULL,
        ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS website VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS description TEXT NULL,
        ADD COLUMN IF NOT EXISTS banner_url TEXT NULL,
        ADD COLUMN IF NOT EXISTS license_file_url TEXT NULL,
        ADD COLUMN IF NOT EXISTS founded_year SMALLINT NULL,
        ADD COLUMN IF NOT EXISTS company_size VARCHAR(20) NULL;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_businesses_approved_by'
        ) THEN
          ALTER TABLE businesses
            ADD CONSTRAINT fk_businesses_approved_by
            FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_businesses_rejected_by'
        ) THEN
          ALTER TABLE businesses
            ADD CONSTRAINT fk_businesses_rejected_by
            FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END;
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_businesses_approval_status
        ON businesses(approval_status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_businesses_approval_status;`);
    await queryRunner.query(`
      ALTER TABLE businesses
        DROP CONSTRAINT IF EXISTS fk_businesses_approved_by,
        DROP CONSTRAINT IF EXISTS fk_businesses_rejected_by;
    `);
    await queryRunner.query(`
      ALTER TABLE businesses
        DROP COLUMN IF EXISTS company_size,
        DROP COLUMN IF EXISTS founded_year,
        DROP COLUMN IF EXISTS license_file_url,
        DROP COLUMN IF EXISTS banner_url,
        DROP COLUMN IF EXISTS description,
        DROP COLUMN IF EXISTS website,
        DROP COLUMN IF EXISTS contact_email,
        DROP COLUMN IF EXISTS contact_phone,
        DROP COLUMN IF EXISTS address,
        DROP COLUMN IF EXISTS business_type,
        DROP COLUMN IF EXISTS tax_code,
        DROP COLUMN IF EXISTS legal_name,
        DROP COLUMN IF EXISTS rejected_by,
        DROP COLUMN IF EXISTS rejected_at,
        DROP COLUMN IF EXISTS approved_by,
        DROP COLUMN IF EXISTS approved_at,
        DROP COLUMN IF EXISTS rejection_reason,
        DROP COLUMN IF EXISTS approval_status;
    `);
  }
}
