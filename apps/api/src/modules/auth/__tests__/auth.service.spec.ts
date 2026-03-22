import { ConflictException, ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthLoginService } from '../auth-login.service';
import { AuthPasswordService } from '../auth-password.service';
import { AuthRegisterService } from '../auth-register.service';
import { AuthService } from '../auth.service';
import { RedisRateLimitService } from '../redis-rate-limit.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((obj: unknown) => obj),
  save: jest.fn((obj: unknown) => Promise.resolve(obj)),
  update: jest.fn(),
  delete: jest.fn(),
});

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

const mockConfig = () => ({
  get: jest.fn((key: string, def?: unknown) => {
    const map: Record<string, unknown> = {
      FRONTEND_URL: 'http://localhost:3000',
      JWT_SECRET: 'test-secret',
      NODE_ENV: 'test',
    };
    return map[key] ?? def;
  }),
});

const mockRes = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
}) as unknown as import('express').Response;

function buildService() {
  const userRepo = mockRepo();
  const verifyRepo = mockRepo();
  const resetRepo = mockRepo();
  const tokenRepo = mockRepo();
  const redis = mockRedis();
  const mail = mockMail();
  const config = mockConfig();
  const jwtService = { sign: jest.fn().mockReturnValue('access-tok') } as unknown as JwtService;

  const redisRateLimit = new RedisRateLimitService(redis as unknown as import('ioredis').default);

  const registerService = new AuthRegisterService(
    userRepo as never,
    verifyRepo as never,
    mail as never,
    redisRateLimit,
    config as never,
  );

  const loginService = new AuthLoginService(
    userRepo as never,
    tokenRepo as never,
    jwtService,
    redisRateLimit,
    config as never,
  );

  const passwordService = new AuthPasswordService(
    userRepo as never,
    resetRepo as never,
    mail as never,
    redisRateLimit,
    config as never,
  );

  const authService = new AuthService(registerService, loginService, passwordService);

  return { authService, userRepo, verifyRepo, resetRepo, tokenRepo, redis, mail };
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
});
