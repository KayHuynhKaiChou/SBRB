import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Collapse DataSheet.status from (processing | ready | READY_WITH_WARNINGS | error | pending)
 * down to 2 lifecycle states: 'active' | 'inactive'.
 *
 * Mapping:
 *   - 'error' → 'inactive'   (keep row, mark archived; user can toggle back on if desired)
 *   - anything else → 'active'   (ready / READY_WITH_WARNINGS / processing / pending)
 *
 * Going forward, failed imports roll back (row deleted) so 'error' no longer arises.
 * Transient 'processing' is also gone since parsing is synchronous in the upload request.
 */
export class CollapseDataSheetStatus1775903000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE data_sheets
      SET status = CASE
        WHEN status = 'error' THEN 'inactive'
        ELSE 'active'
      END
      WHERE status NOT IN ('active', 'inactive');
    `);
    await queryRunner.query(`
      ALTER TABLE data_sheets ALTER COLUMN status SET DEFAULT 'active';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort reverse: map 'inactive' back to legacy 'error' label. Active rows
    // can't be disambiguated (ready vs READY_WITH_WARNINGS info is lost) — use 'ready'.
    await queryRunner.query(`
      UPDATE data_sheets
      SET status = CASE
        WHEN status = 'inactive' THEN 'error'
        ELSE 'ready'
      END;
    `);
    await queryRunner.query(`
      ALTER TABLE data_sheets ALTER COLUMN status SET DEFAULT 'processing';
    `);
  }
}
