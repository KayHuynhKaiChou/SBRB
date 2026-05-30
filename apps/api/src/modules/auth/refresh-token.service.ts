import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

/**
 * Extracted from AuthLoginService for cross-module use.
 * Hard-deletes all refresh tokens for a user — forces full re-login on all devices.
 * Called by AdminUserService on disable to invalidate sessions immediately.
 * SRS §11.
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
  ) {}

  /**
   * Hard-delete ALL refresh tokens for a user (active + already-revoked).
   * Hard-delete pattern (vs soft-revoke) keeps GC simple — no stale family in DB.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.tokenRepo.delete({ userId });
  }
}
