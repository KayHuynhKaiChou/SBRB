import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Global uniqueness for business contact phone & email (no two businesses share them).
 * Partial indexes skip NULLs; email is indexed case-insensitively via LOWER().
 * Service-layer checks (business-contact-uniqueness.ts) give friendly errors; these
 * indexes are the race-safe source of truth.
 *
 * NOTE: if existing rows already contain duplicates, creating the index fails — resolve
 * the duplicate contact data first, then re-run the migration.
 */
export class AddBusinessContactUniqueness1777500010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_business_contact_phone
        ON businesses(contact_phone)
        WHERE contact_phone IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_business_contact_email
        ON businesses(LOWER(contact_email))
        WHERE contact_email IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_business_contact_email;`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_business_contact_phone;`);
  }
}
