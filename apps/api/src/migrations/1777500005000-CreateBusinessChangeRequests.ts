import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shadow table holding owner-proposed changes to an approved business.
 * Live `businesses` row only updated on admin approval.
 * Partial unique index enforces at most one PENDING request per business.
 * See docs/business-approval-rules.md §5.
 */
export class CreateBusinessChangeRequests1777500005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS business_change_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        changes JSONB NOT NULL DEFAULT '{}',
        review_reason TEXT NULL,
        reviewed_at TIMESTAMPTZ NULL,
        reviewed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_bcr_business_status
        ON business_change_requests(business_id, status);
    `);
    // At most one open (pending) change-request per business.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_bcr_open
        ON business_change_requests(business_id)
        WHERE status = 'pending';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_bcr_open;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_bcr_business_status;`);
    await queryRunner.query(`DROP TABLE IF EXISTS business_change_requests;`);
  }
}
