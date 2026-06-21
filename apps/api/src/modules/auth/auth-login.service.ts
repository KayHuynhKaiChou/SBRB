import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  EUserAccountStatus,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_LOCKOUT_MINUTES,
  REFRESH_COOKIE_NAME,
} from '@sbrb/shared-constants';
import type { IAuthTokens, IJwtPayload } from '@sbrb/shared-types';
import { hashRefreshToken, parseDurationMs } from '@sbrb/shared-utils/auth-token-hash.util';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { IGoogleProfile } from './google.strategy';
import { RedisRateLimitService } from './redis-rate-limit.service';
import { RefreshTokenService } from './refresh-token.service';

const ATTEMPT_KEY = (email: string) => `auth:attempts:${email}`;
const ATTEMPT_TTL_SECONDS = LOGIN_LOCKOUT_MINUTES * 60;

@Injectable()
export class AuthLoginService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly redis: RedisRateLimitService,
    private readonly config: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(
    dto: LoginDto,
    ip: string,
    userAgent: string,
    res: Response,
  ): Promise<IAuthTokens> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    this.assertLoginAllowed(user);
    if (!user.emailVerified) throw new ForbiddenException('Email not verified');

    const attempts = await this.redis.get(ATTEMPT_KEY(dto.email));
    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      throw new HttpException('Too many failed attempts. Try again in 15 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash ?? '');
    if (!valid) {
      await this.redis.increment(ATTEMPT_KEY(dto.email), ATTEMPT_TTL_SECONDS);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redis.delete(ATTEMPT_KEY(dto.email));
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return this.issueTokens(user, ip, userAgent, res);
  }

  async loginWithGoogle(
    profile: IGoogleProfile,
    ip: string,
    userAgent: string,
    res: Response,
  ): Promise<IAuthTokens> {
    let user = await this.userRepo.findOne({ where: { email: profile.email } });
    if (!user) {
      user = this.userRepo.create({
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        emailVerified: true,
        passwordHash: null,
      });
      await this.userRepo.save(user);
    }
    this.assertLoginAllowed(user);
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.issueTokens(user, ip, userAgent, res);
  }

  /**
   * Gate login/refresh on account status. Only `active` accounts may authenticate.
   * `pending` = invited but hasn't set a password yet; `inactive` = deactivated.
   */
  private assertLoginAllowed(user: User): void {
    if (user.status === EUserAccountStatus.INACTIVE) {
      throw new UnauthorizedException('Account inactive');
    }
    if (user.status === EUserAccountStatus.PENDING) {
      throw new UnauthorizedException('Account not activated');
    }
  }

  async refresh(rawToken: string, ip: string, userAgent: string, res: Response): Promise<IAuthTokens> {
    if (!rawToken) {
      res.clearCookie(REFRESH_COOKIE_NAME);
      throw new UnauthorizedException('No refresh token');
    }
    const tokenHash = hashRefreshToken(rawToken);

    // Lookup by hash REGARDLESS of revoked status — needed to detect reuse of revoked tokens.
    const matched = await this.tokenRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!matched) {
      res.clearCookie(REFRESH_COOKIE_NAME);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // REUSE DETECTION (H-1): a previously-revoked token presented again indicates
    // either an attacker replaying a stolen token or a buggy client. Treat as
    // compromise — revoke entire token family for this user, force full re-login.
    if (matched.revokedAt) {
      await this.revokeFamily(matched.userId);
      res.clearCookie(REFRESH_COOKIE_NAME);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (matched.expiresAt < new Date()) {
      await this.tokenRepo.delete(matched.id);
      res.clearCookie(REFRESH_COOKIE_NAME);
      throw new UnauthorizedException('Refresh token expired');
    }

    // ATOMIC CAS (C-1): UPDATE ... WHERE id=? AND revoked_at IS NULL.
    // If 0 rows affected → another concurrent refresh already consumed this token →
    // race lost → treat as reuse, revoke family.
    const result = await this.tokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('id = :id AND revoked_at IS NULL', { id: matched.id })
      .execute();

    if (result.affected === 0) {
      await this.revokeFamily(matched.userId);
      res.clearCookie(REFRESH_COOKIE_NAME);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    // SRS §11: disabled users must not be able to refresh tokens indefinitely.
    // Phase 4 will additionally revoke all refresh tokens on disable, but this per-refresh
    // check provides immediate enforcement even if revoke hasn't run yet.
    if (matched.user.status !== EUserAccountStatus.ACTIVE) {
      await this.revokeFamily(matched.userId);
      res.clearCookie(REFRESH_COOKIE_NAME);
      throw new UnauthorizedException('Account inactive');
    }

    return this.issueTokens(matched.user, ip, userAgent, res);
  }

  /**
   * Defense response to reuse detection: hard-delete ALL tokens for the user
   * (active + already-revoked). Forces full re-login on every device.
   * Delegates to RefreshTokenService so AdminUserService can share the same logic.
   */
  private async revokeFamily(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }

  /**
   * Logout via refresh cookie alone — no access token required (C-2).
   * Allows logout when access has expired without leaving zombie refresh rows.
   */
  async logoutByCookie(rawToken: string | undefined, res: Response): Promise<void> {
    if (rawToken) {
      const tokenHash = hashRefreshToken(rawToken);
      await this.tokenRepo.delete({ tokenHash });
    }
    res.clearCookie(REFRESH_COOKIE_NAME);
  }

  private getRefreshTtlMs(): number {
    const raw = this.config.get<string>('JWT_REFRESH_EXPIRY', '30d');
    return parseDurationMs(raw);
  }

  async issueTokens(user: User, ip: string, userAgent: string, res: Response): Promise<IAuthTokens> {
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole ?? null,
    };
    const accessToken = this.jwtService.sign(payload);

    const rawRefresh = uuidv4();
    const tokenHash = hashRefreshToken(rawRefresh);
    const refreshTtlMs = this.getRefreshTtlMs();
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    // GC: drop user's stale rows (expired or revoked) before inserting fresh one.
    // Cheap (1 indexed query), prevents unbounded accumulation without a cron.
    await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .where(
        'user_id = :uid AND (expires_at < now() OR revoked_at IS NOT NULL)',
        { uid: user.id },
      )
      .execute();

    await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        tokenHash,
        ipAddress: ip,
        userAgent,
        expiresAt,
      }),
    );

    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE_NAME, rawRefresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: refreshTtlMs,
    });

    return { accessToken };
  }
}
