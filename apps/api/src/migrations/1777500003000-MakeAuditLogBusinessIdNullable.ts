import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Makes audit_logs.business_id nullable so platform-scope events
 * (user.disable, user.enable) can be recorded without a business context.
 *
 * Down: best-effort — requires the caller to remove any NULL rows first.
 * If NULL rows exist the SET NOT NULL will fail with a Postgres error.
 * "down() is best-effort; rows with NULL business_id must be deleted
 *  manually before rollback."
 */
export class MakeAuditLogBusinessIdNullable1777500003000 implements MigrationInterface {
  name = 'MakeAuditLogBusinessIdNullable1777500003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "business_id" DROP NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionally does NOT delete NULL rows — caller must clean up first.
    // Fails with a Postgres error if NULL rows exist, which prevents silent data loss.
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "business_id" SET NOT NULL`,
    );
  }
}
