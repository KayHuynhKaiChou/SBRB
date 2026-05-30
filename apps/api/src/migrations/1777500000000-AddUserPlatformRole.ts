import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPlatformRole1777500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS platform_role VARCHAR(20) NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_platform_role
        ON users(platform_role)
        WHERE platform_role IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_platform_role;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS platform_role;`);
  }
}
