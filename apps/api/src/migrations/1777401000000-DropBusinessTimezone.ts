import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBusinessTimezone1777401000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE businesses DROP COLUMN IF EXISTS timezone;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE businesses
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh';
    `);
  }
}
