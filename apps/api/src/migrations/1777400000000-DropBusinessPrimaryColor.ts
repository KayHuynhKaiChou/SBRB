import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBusinessPrimaryColor1777400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE businesses DROP COLUMN IF EXISTS primary_color;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) NOT NULL DEFAULT '#D72A44';
    `);
  }
}
