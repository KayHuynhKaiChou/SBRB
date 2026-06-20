import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * company_size moves from bucket string (e.g. '10-49') to a raw headcount integer.
 * Existing legacy buckets are mapped to a representative value so the admin
 * company-size chart (which now buckets numerically) keeps showing them; any other
 * non-numeric value becomes NULL.
 */
export class AlterBusinessCompanySizeToInteger1777500011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE businesses
        ALTER COLUMN company_size TYPE integer
        USING (
          CASE
            WHEN company_size ~ '^[0-9]+$' THEN company_size::integer
            WHEN company_size = '1-9' THEN 5
            WHEN company_size = '10-49' THEN 30
            WHEN company_size = '50-199' THEN 100
            WHEN company_size = '200+' THEN 200
            ELSE NULL
          END
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE businesses
        ALTER COLUMN company_size TYPE varchar(20)
        USING (company_size::text);
    `);
  }
}
