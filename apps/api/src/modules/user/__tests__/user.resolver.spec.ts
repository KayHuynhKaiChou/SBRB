import { UserResolver } from '../user.resolver';
import { UserService } from '../user.service';
import { AvatarStorageService } from '../services/avatar-storage.service';
import type { IJwtPayload } from '../../auth/jwt.strategy';

const mockUserService = () => ({
  findById: jest.fn(),
  updateProfile: jest.fn(),
  getSessions: jest.fn(),
  deleteSession: jest.fn(),
  deleteAccount: jest.fn(),
});

const mockAvatarStorageService = () => ({
  createUploadUrl: jest.fn(),
});

function makeResolver() {
  const us = mockUserService() as any;
  const as = mockAvatarStorageService() as any;
  return { resolver: new UserResolver(us, as), us, as };
}

const USER: IJwtPayload = {
  sub: 'user-1',
  email: 'user@test.com',
  sessionId: 'session-1',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

describe('UserResolver', () => {
  describe('me()', () => {
    it('delegates to userService.findById with current user sub', async () => {
      const { resolver, us } = makeResolver();
      us.findById.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        fullName: 'User One',
      });

      const result = await resolver.me(USER);

      expect(us.findById).toHaveBeenCalledWith('user-1');
      expect(result.email).toBe('user@test.com');
    });
  });

  describe('updateMe()', () => {
    it('delegates to userService.updateProfile with user sub and input', async () => {
      const { resolver, us } = makeResolver();
      const input = { fullName: 'Updated Name' };
      us.updateProfile.mockResolvedValue({
        id: 'user-1',
        fullName: 'Updated Name',
      });

      const result = await resolver.updateMe(USER, input as any);

      expect(us.updateProfile).toHaveBeenCalledWith('user-1', input);
      expect(result.fullName).toBe('Updated Name');
    });
  });

  describe('mySessions()', () => {
    it('returns sessions with isCurrent flag set correctly', async () => {
      const { resolver, us } = makeResolver();
      us.getSessions.mockResolvedValue([
        { id: 'session-1', deviceName: 'Chrome', lastActiveAt: '2025-01-01' },
        { id: 'session-2', deviceName: 'Firefox', lastActiveAt: '2025-01-02' },
      ]);

      const result = await resolver.mySessions(USER);

      expect(us.getSessions).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(2);
      expect(result[0].isCurrent).toBe(true);
      expect(result[1].isCurrent).toBe(false);
    });

    it('marks session as not current when sessionId differs', async () => {
      const { resolver, us } = makeResolver();
      const userWithDifferentSession = { ...USER, sessionId: 'session-999' };
      us.getSessions.mockResolvedValue([
        { id: 'session-1', deviceName: 'Chrome', lastActiveAt: '2025-01-01' },
      ]);

      const result = await resolver.mySessions(userWithDifferentSession);

      expect(result[0].isCurrent).toBe(false);
    });

    it('handles missing sessionId in JWT', async () => {
      const { resolver, us } = makeResolver();
      const userWithoutSession = { ...USER, sessionId: undefined };
      us.getSessions.mockResolvedValue([
        { id: 'session-1', deviceName: 'Chrome', lastActiveAt: '2025-01-01' },
      ]);

      const result = await resolver.mySessions(userWithoutSession);

      expect(result[0].isCurrent).toBe(false);
    });
  });

  describe('deleteSession()', () => {
    it('delegates to userService.deleteSession with user sub and session id', async () => {
      const { resolver, us } = makeResolver();
      us.deleteSession.mockResolvedValue(undefined);

      const result = await resolver.deleteSession(USER, 'session-1');

      expect(us.deleteSession).toHaveBeenCalledWith('user-1', 'session-1');
      expect(result).toBe(true);
    });
  });

  describe('deleteAccount()', () => {
    it('delegates to userService.deleteAccount with user sub', async () => {
      const { resolver, us } = makeResolver();
      us.deleteAccount.mockResolvedValue(undefined);

      const result = await resolver.deleteAccount(USER);

      expect(us.deleteAccount).toHaveBeenCalledWith('user-1');
      expect(result).toBe(true);
    });
  });

  describe('getAvatarUploadUrl()', () => {
    it('delegates to avatarStorage.createUploadUrl with user sub and filename', async () => {
      const { resolver, as } = makeResolver();
      const input = { filename: 'photo.png' };
      as.createUploadUrl.mockResolvedValue({
        uploadUrl: 'https://signed',
        token: 'tok',
        path: 'users/user-1/avatar-123.png',
        publicUrl: 'https://public.url/users/user-1/avatar-123.png',
      });

      const result = await resolver.getAvatarUploadUrl(USER, input as any);

      expect(as.createUploadUrl).toHaveBeenCalledWith('user-1', 'photo.png');
      expect(result.uploadUrl).toBe('https://signed');
      expect(result.token).toBe('tok');
      expect(result.publicUrl).toContain('users/user-1');
    });

    it('returns complete AvatarUploadUrlType', async () => {
      const { resolver, as } = makeResolver();
      const input = { filename: 'avatar.jpg' };
      as.createUploadUrl.mockResolvedValue({
        uploadUrl: 'https://signed.url',
        token: 'upload-token',
        path: 'users/user-1/avatar-456.jpg',
        publicUrl: 'https://public.url/users/user-1/avatar-456.jpg',
      });

      const result = await resolver.getAvatarUploadUrl(USER, input as any);

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('publicUrl');
    });
  });
});
