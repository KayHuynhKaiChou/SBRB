import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentIdToDataSheets1712332800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE data_sheets
      ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_data_sheets_department_id ON data_sheets(department_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_data_sheets_department_id`);
    await queryRunner.query(`ALTER TABLE data_sheets DROP COLUMN department_id`);
  }
}
