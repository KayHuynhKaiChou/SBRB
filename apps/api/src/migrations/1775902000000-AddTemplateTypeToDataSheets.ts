import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateTypeToDataSheets1775902000000 implements MigrationInterface {
  name = 'AddTemplateTypeToDataSheets1775902000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "data_sheets" ADD "template_type" varchar(20) NOT NULL DEFAULT 'simple'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_sheets" DROP COLUMN "template_type"`);
  }
}
