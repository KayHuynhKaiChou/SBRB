import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFields1775905000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS department_id UUID;
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_department
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_department;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS department_id, DROP COLUMN IF EXISTS bio;`);
  }
}
