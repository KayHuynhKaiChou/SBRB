import { ConflictException, ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthLoginService } from '../auth-login.service';
import { AuthPasswordService } from '../auth-password.service';
import { AuthRegisterService } from '../auth-register.service';
import { AuthService } from '../auth.service';
import { hashRefreshToken } from '@sbrb/shared-utils/auth-token-hash.util';
import { RedisRateLimitService } from '../redis-rate-limit.service';

const mockRepo = () => {
  const cas = { affected: 1 as number };
  const builder = {
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(() => Promise.resolve(cas)),
  };
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((obj: unknown) => obj),
    save: jest.fn((obj: unknown) => Promise.resolve(obj)),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => builder),
    /** Test helper: configure CAS update result.affected for the next refresh call. */
    _setCasAffected: (n: number) => { cas.affected = n; },
  };
};

const mockRedis = () => ({
  incr: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn(),
});

const mockMail = () => ({
  sendVerifyEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
});

const mockConfig = (overrides: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string, def?: unknown) => {
    const map: Record<string, unknown> = {
      FRONTEND_URL: 'http://localhost:3000',
      JWT_SECRET: 'test-secret',
      NODE_ENV: 'test',
      JWT_REFRESH_EXPIRY: '30d',
      ...overrides,
    };
    return map[key] ?? def;
  }),
});

const mockRes = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
}) as unknown as import('express').Response;

function buildService(configOverrides: Record<string, unknown> = {}) {
  const userRepo = mockRepo();
  const verifyRepo = mockRepo();
  const resetRepo = mockRepo();
  const tokenRepo = mockRepo();
  const redis = mockRedis();
  const mail = mockMail();
  const config = mockConfig(configOverrides);
  const jwtService = { sign: jest.fn().mockReturnValue('access-tok') } as unknown as JwtService;

  const redisRateLimit = new RedisRateLimitService(redis as unknown as import('ioredis').default);

  const registerService = new AuthRegisterService(
    userRepo as never,
    verifyRepo as never,
    mail as never,
    redisRateLimit,
    config as never,
  );

  const refreshTokenService = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) };

  const loginService = new AuthLoginService(
    userRepo as never,
    tokenRepo as never,
    jwtService,
    redisRateLimit,
    config as never,
    refreshTokenService as never,
  );

  const passwordService = new AuthPasswordService(
    userRepo as never,
    resetRepo as never,
    mail as never,
    redisRateLimit,
    config as never,
  );

  const authService = new AuthService(registerService, loginService, passwordService);

  return { authService, userRepo, verifyRepo, resetRepo, tokenRepo, redis, mail, refreshTokenService };
}

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user and return message', async () => {
      const { authService, userRepo, verifyRepo, redis } = buildService();
      userRepo.findOne.mockResolvedValue(null);
      verifyRepo.save.mockResolvedValue({});
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      redis.get.mockResolvedValue('0');
      userRepo.save.mockResolvedValue({ id: 'uid', email: 'a@a.com', fullName: 'A' });

      const result = await authService.register({ email: 'a@a.com', password: 'Password1', fullName: 'A' });
      expect(result.message).toBe('Verification email sent');
    });

    it('should throw ConflictException for duplicate email', async () => {
      const { authService, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue({ id: 'uid', email: 'a@a.com' });
      await expect(
        authService.register({ email: 'a@a.com', password: 'Password1', fullName: 'A' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const passwordHash = bcrypt.hashSync('Password1', 12);
    const mockUser = { id: 'uid', email: 'a@a.com', passwordHash, emailVerified: true };

    it('should login successfully and return accessToken', async () => {
      const { authService, userRepo, tokenRepo, redis } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser);
      redis.get.mockResolvedValue('0');
      redis.del.mockResolvedValue(1);
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      tokenRepo.save.mockResolvedValue({});
      userRepo.update.mockResolvedValue({});

      const res = mockRes();
      const result = await authService.login({ email: 'a@a.com', password: 'Password1' }, '127.0.0.1', 'jest', res);
      expect(result.accessToken).toBe('access-tok');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const { authService, userRepo, redis } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser);
      redis.get.mockResolvedValue('0');
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      const res = mockRes();
      await expect(
        authService.login({ email: 'a@a.com', password: 'WrongPass1' }, '127.0.0.1', 'jest', res),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for unverified email', async () => {
      const { authService, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue({ ...mockUser, emailVerified: false });

      const res = mockRes();
      await expect(
        authService.login({ email: 'a@a.com', password: 'Password1' }, '127.0.0.1', 'jest', res),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw 429 HttpException when rate limit exceeded', async () => {
      const { authService, userRepo, redis } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser);
      redis.get.mockResolvedValue('5');

      const res = mockRes();
      await expect(
        authService.login({ email: 'a@a.com', password: 'Password1' }, '127.0.0.1', 'jest', res),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('forgotPassword', () => {
    it('should silently succeed for unknown email', async () => {
      const { authService, userRepo, redis } = buildService();
      userRepo.findOne.mockResolvedValue(null);
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      await expect(authService.forgotPassword('unknown@a.com')).resolves.toBeUndefined();
    });

    it('should throw 429 HttpException after 3 requests', async () => {
      const { authService, redis } = buildService();
      redis.incr.mockResolvedValue(4);
      redis.expire.mockResolvedValue(1);
      await expect(authService.forgotPassword('a@a.com')).rejects.toThrow(HttpException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const { authService, resetRepo, userRepo } = buildService();
      resetRepo.findOne.mockResolvedValue({
        id: 'rid', userId: 'uid', token: 'tok', usedAt: null, expiresAt: new Date(Date.now() + 60000),
      });
      resetRepo.save.mockResolvedValue({});
      userRepo.update.mockResolvedValue({});
      await expect(authService.resetPassword('tok', 'NewPass1W')).resolves.toBeUndefined();
    });
  });

  describe('refresh', () => {
    const rawToken = 'fixture-uuid-1234';
    const expectedHash = hashRefreshToken(rawToken);

    function activeRow() {
      return {
        id: 'rid',
        userId: 'uid',
        user: { id: 'uid', email: 'a@a.com' },
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      };
    }

    it('happy path: lookup by hash, atomic CAS revoke, issue new tokens', async () => {
      const { authService, tokenRepo } = buildService();
      tokenRepo.findOne.mockResolvedValue(activeRow());
      tokenRepo.save.mockResolvedValue({});

      const res = mockRes();
      const result = await authService.refresh(rawToken, '127.0.0.1', 'jest', res);

      expect(tokenRepo.findOne).toHaveBeenCalledTimes(1);
      expect(tokenRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tokenHash: expectedHash },
        }),
      );
      // 2 createQueryBuilder calls: (1) atomic CAS revoke, (2) GC stale rows in issueTokens
      expect(tokenRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(tokenRepo.find).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('access-tok');
    });

    it('clears cookie + throws when no cookie sent', async () => {
      const { authService } = buildService();
      const res = mockRes();
      await expect(authService.refresh('', '127.0.0.1', 'jest', res)).rejects.toThrow(
        UnauthorizedException,
      );
      expect((res as unknown as { clearCookie: jest.Mock }).clearCookie).toHaveBeenCalledWith('refresh_token');
    });

    it('clears cookie + throws when token unknown', async () => {
      const { authService, tokenRepo } = buildService();
      tokenRepo.findOne.mockResolvedValue(null);
      const res = mockRes();
      await expect(authService.refresh(rawToken, '127.0.0.1', 'jest', res)).rejects.toThrow(
        /Invalid/i,
      );
      expect((res as unknown as { clearCookie: jest.Mock }).clearCookie).toHaveBeenCalled();
    });

    it('deletes row + clears cookie when token expired', async () => {
      const { authService, tokenRepo } = buildService();
      tokenRepo.findOne.mockResolvedValue({
        ...activeRow(),
        expiresAt: new Date(Date.now() - 1000),
      });
      const res = mockRes();
      await expect(authService.refresh(rawToken, '127.0.0.1', 'jest', res)).rejects.toThrow(
        /expired/i,
      );
      expect(tokenRepo.delete).toHaveBeenCalledWith('rid');
      expect((res as unknown as { clearCookie: jest.Mock }).clearCookie).toHaveBeenCalled();
    });

    it('REUSE detection: revoked token presented → DELETE entire family + 401', async () => {
      const { authService, tokenRepo, refreshTokenService } = buildService();
      tokenRepo.findOne.mockResolvedValue({
        ...activeRow(),
        revokedAt: new Date(Date.now() - 5000),
      });
      const res = mockRes();
      await expect(authService.refresh(rawToken, '127.0.0.1', 'jest', res)).rejects.toThrow(
        /reuse/i,
      );
      // Family hard-delete delegated to RefreshTokenService
      expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith('uid');
      expect((res as unknown as { clearCookie: jest.Mock }).clearCookie).toHaveBeenCalled();
    });

    it('CONCURRENT race: CAS affected=0 → DELETE family + 401 (race lost)', async () => {
      const { authService, tokenRepo, refreshTokenService } = buildService();
      tokenRepo.findOne.mockResolvedValue(activeRow());
      tokenRepo._setCasAffected(0); // simulate concurrent rotation already happened
      const res = mockRes();
      await expect(authService.refresh(rawToken, '127.0.0.1', 'jest', res)).rejects.toThrow(
        /reuse/i,
      );
      expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith('uid');
      expect((res as unknown as { clearCookie: jest.Mock }).clearCookie).toHaveBeenCalled();
    });
  });

  describe('logoutByCookie (REST /logout, no userId required)', () => {
    it('deletes row by tokenHash + clears cookie', async () => {
      const { authService, tokenRepo } = buildService();
      const res = mockRes();
      const rawToken = 'fixture-uuid';

      await authService.logout(rawToken, res);

      expect(tokenRepo.delete).toHaveBeenCalledWith({
        tokenHash: hashRefreshToken(rawToken),
      });
      expect((res as unknown as { clearCookie: jest.Mock }).clearCookie).toHaveBeenCalledWith(
        'refresh_token',
      );
    });

    it('only clears cookie when no rawToken', async () => {
      const { authService, tokenRepo } = buildService();
      const res = mockRes();
      await authService.logout(undefined, res);
      expect(tokenRepo.delete).not.toHaveBeenCalled();
      expect((res as unknown as { clearCookie: jest.Mock }).clearCookie).toHaveBeenCalled();
    });
  });

  describe('issueTokens (via login) — JWT_REFRESH_EXPIRY config', () => {
    const passwordHash = bcrypt.hashSync('Password1', 12);
    const mockUser = { id: 'uid', email: 'a@a.com', passwordHash, emailVerified: true };

    async function loginAndCapture(envValue?: string) {
      const overrides: Record<string, unknown> = {};
      if (envValue !== undefined) overrides.JWT_REFRESH_EXPIRY = envValue;
      const { authService, userRepo, tokenRepo, redis } = buildService(overrides);
      userRepo.findOne.mockResolvedValue(mockUser);
      redis.get.mockResolvedValue('0');
      redis.del.mockResolvedValue(1);
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);
      tokenRepo.save.mockResolvedValue({});
      userRepo.update.mockResolvedValue({});

      const res = mockRes();
      const beforeMs = Date.now();
      await authService.login(
        { email: 'a@a.com', password: 'Password1' },
        '127.0.0.1',
        'jest',
        res,
      );
      const afterMs = Date.now();

      const savedEntity = tokenRepo.save.mock.calls[0][0] as { expiresAt: Date };
      const cookieCall = (res as unknown as { cookie: jest.Mock }).cookie.mock.calls[0];
      return { savedEntity, cookieOpts: cookieCall[2], beforeMs, afterMs };
    }

    it('uses JWT_REFRESH_EXPIRY=1m for both DB expiresAt and cookie maxAge', async () => {
      const { savedEntity, cookieOpts, beforeMs, afterMs } = await loginAndCapture('1m');
      expect(cookieOpts.maxAge).toBe(60_000);
      const expiresMs = savedEntity.expiresAt.getTime();
      expect(expiresMs).toBeGreaterThanOrEqual(beforeMs + 60_000);
      expect(expiresMs).toBeLessThanOrEqual(afterMs + 60_000);
    });

    it('falls back to 30d when env unset', async () => {
      const { cookieOpts } = await loginAndCapture(undefined);
      expect(cookieOpts.maxAge).toBe(30 * 86_400_000);
    });

    it('throws on invalid JWT_REFRESH_EXPIRY', async () => {
      const { authService, userRepo, redis } = buildService({ JWT_REFRESH_EXPIRY: 'foobar' });
      userRepo.findOne.mockResolvedValue(mockUser);
      redis.get.mockResolvedValue('0');
      redis.del.mockResolvedValue(1);
      const res = mockRes();
      await expect(
        authService.login({ email: 'a@a.com', password: 'Password1' }, '127.0.0.1', 'jest', res),
      ).rejects.toThrow(/Invalid duration/);
    });
  });
});
