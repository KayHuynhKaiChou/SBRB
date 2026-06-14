import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Switch email verification from unique link tokens to per-user 6-digit OTP codes.
 * Drops the UNIQUE constraint on email_verifications.token (6-digit codes collide
 * across users) and adds a plain index for lookup.
 */
export class EmailVerificationOtp1777500007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Constraint name is auto-generated; drop whichever unique index covers `token`.
    await queryRunner.query(`
      DO $$
      DECLARE c RECORD;
      BEGIN
        FOR c IN
          SELECT conname FROM pg_constraint
          WHERE conrelid = 'email_verifications'::regclass AND contype = 'u'
        LOOP
          EXECUTE 'ALTER TABLE email_verifications DROP CONSTRAINT ' || quote_ident(c.conname);
        END LOOP;
      END$$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_token
        ON email_verifications(token);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_email_verifications_token;`);
    // Note: not restoring the UNIQUE constraint — incompatible with OTP codes.
  }
}
