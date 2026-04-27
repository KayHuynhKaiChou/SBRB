import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Purge refresh_tokens table — switching from bcrypt to SHA-256 hashing.
 * Bcrypt-hashed rows cannot be transformed to sha256 (one-way hash, raw token only
 * lives in users' HttpOnly cookies). All users will be forced to re-login once.
 * Schema is unchanged.
 */
export class PurgeRefreshTokensForSha2561745740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "refresh_tokens"`);
  }

  public async down(): Promise<void> {
    // No-op — rollback cannot recreate deleted sessions.
  }
}
