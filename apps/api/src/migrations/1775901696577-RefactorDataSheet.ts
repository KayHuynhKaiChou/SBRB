import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorDataSheet1775901696577 implements MigrationInterface {
    name = 'RefactorDataSheet1775901696577'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_sheets" DROP CONSTRAINT "FK_295420f759fbdfc0723c8736af1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_295420f759fbdfc0723c8736af"`);
        await queryRunner.query(`ALTER TABLE "data_sheets" RENAME COLUMN "department_id" TO "validation_errors"`);
        await queryRunner.query(`ALTER TABLE "data_series" ADD "department_id" uuid`);
        await queryRunner.query(`ALTER TABLE "data_sheets" DROP COLUMN "validation_errors"`);
        await queryRunner.query(`ALTER TABLE "data_sheets" ADD "validation_errors" jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_853f72b34578b62abfde3d7ae7" ON "data_series" ("department_id") `);
        await queryRunner.query(`ALTER TABLE "data_series" ADD CONSTRAINT "FK_853f72b34578b62abfde3d7ae7a" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_series" DROP CONSTRAINT "FK_853f72b34578b62abfde3d7ae7a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_853f72b34578b62abfde3d7ae7"`);
        await queryRunner.query(`ALTER TABLE "data_sheets" DROP COLUMN "validation_errors"`);
        await queryRunner.query(`ALTER TABLE "data_sheets" ADD "validation_errors" uuid`);
        await queryRunner.query(`ALTER TABLE "data_series" DROP COLUMN "department_id"`);
        await queryRunner.query(`ALTER TABLE "data_sheets" RENAME COLUMN "validation_errors" TO "department_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_295420f759fbdfc0723c8736af" ON "data_sheets" ("department_id") `);
        await queryRunner.query(`ALTER TABLE "data_sheets" ADD CONSTRAINT "FK_295420f759fbdfc0723c8736af1" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
