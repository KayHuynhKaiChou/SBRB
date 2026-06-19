import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove the `viewer` business role. `viewer` was the lowest-privilege member role
 * but was never differentiated from `staff` in practice, so it is collapsed into
 * `staff` (the new default for added/invited members).
 *
 * Existing `viewer` rows → `staff`; column default `viewer` → `staff`.
 */
export class RemoveViewerRole1777500009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE business_members SET role = 'staff' WHERE role = 'viewer';`);
    await queryRunner.query(`ALTER TABLE business_members ALTER COLUMN role SET DEFAULT 'staff';`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot recover which members were originally 'viewer'; restore only the default.
    await queryRunner.query(`ALTER TABLE business_members ALTER COLUMN role SET DEFAULT 'viewer';`);
  }
}
