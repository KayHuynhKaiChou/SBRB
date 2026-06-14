import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Merge businesses.approval_status (pending/approved/rejected) + businesses.status
 * (active/inactive) into a single `status` column with 4 values:
 * pending | approved | rejected | inactive.
 *
 * Mapping (run BEFORE dropping approval_status):
 *   approval=pending                      → pending
 *   approval=rejected                     → rejected
 *   approval=approved & status=inactive   → inactive
 *   approval=approved & (anything else)   → approved
 */
export class MergeBusinessStatus1777500008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE businesses SET status = CASE
        WHEN approval_status = 'pending' THEN 'pending'
        WHEN approval_status = 'rejected' THEN 'rejected'
        WHEN approval_status = 'approved' AND status = 'inactive' THEN 'inactive'
        ELSE 'approved'
      END;
    `);
    await queryRunner.query(`ALTER TABLE businesses DROP COLUMN IF EXISTS approval_status;`);
    await queryRunner.query(`ALTER TABLE businesses ALTER COLUMN status SET DEFAULT 'pending';`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create approval_status and best-effort reconstruct from the merged status.
    await queryRunner.query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS approval_status varchar(20) NOT NULL DEFAULT 'approved';
    `);
    await queryRunner.query(`
      UPDATE businesses SET
        approval_status = CASE
          WHEN status = 'pending' THEN 'pending'
          WHEN status = 'rejected' THEN 'rejected'
          ELSE 'approved'
        END,
        status = CASE
          WHEN status = 'inactive' THEN 'inactive'
          ELSE 'active'
        END;
    `);
    await queryRunner.query(`ALTER TABLE businesses ALTER COLUMN status SET DEFAULT 'active';`);
  }
}
