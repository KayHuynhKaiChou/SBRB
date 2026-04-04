import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartmentsTable1712246400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id"          uuid DEFAULT gen_random_uuid() NOT NULL,
        "business_id" uuid NOT NULL,
        "parent_id"   uuid,
        "name"        varchar(100) NOT NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_departments_business" FOREIGN KEY ("business_id")
          REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_departments_parent" FOREIGN KEY ("parent_id")
          REFERENCES "departments"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_departments_business_id" ON "departments" ("business_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "departments"`);
  }
}
