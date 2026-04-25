import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentPositions1775904000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE departments
      ADD COLUMN IF NOT EXISTS position_x double precision,
      ADD COLUMN IF NOT EXISTS position_y double precision;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE departments
      DROP COLUMN IF EXISTS position_x,
      DROP COLUMN IF EXISTS position_y;
    `);
  }
}
