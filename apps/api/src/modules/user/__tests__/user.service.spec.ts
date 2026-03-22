import { NotFoundException } from '@nestjs/common';
import { Session } from '../../auth/entities/session.entity';
import { User } from '../../auth/entities/user.entity';
import { UserService } from '../user.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn((obj: unknown) => obj),
  save: jest.fn((obj: unknown) => Promise.resolve(obj)),
});

// Prevent TypeORM metadata errors — User, Session, RefreshToken are only used as type tokens here
jest.mock('../../auth/entities/user.entity', () => ({ User: class User {} }));
jest.mock('../../auth/entities/session.entity', () => ({ Session: class Session {} }));
jest.mock('../../auth/entities/refresh-token.entity', () => ({ RefreshToken: class RefreshToken {} }));

describe('UserService', () => {
  let service: UserService;
  let userRepo: ReturnType<typeof mockRepo>;
  let sessionRepo: ReturnType<typeof mockRepo>;
  let tokenRepo: ReturnType<typeof mockRepo>;

  beforeEach(() => {
    userRepo = mockRepo();
    sessionRepo = mockRepo();
    tokenRepo = mockRepo();
    service = new UserService(userRepo as never, sessionRepo as never, tokenRepo as never);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'uid', email: 'a@a.com' });
      const result = await service.findById('uid');
      expect(result.id).toBe('uid');
    });

    it('should throw NotFoundException when not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return updated user', async () => {
      const updated = { id: 'uid', email: 'a@a.com', fullName: 'Updated' } as User;
      userRepo.update.mockResolvedValue({});
      userRepo.findOne.mockResolvedValue(updated);
      const result = await service.updateProfile('uid', { fullName: 'Updated' });
      expect(result.fullName).toBe('Updated');
    });
  });

  describe('getSessions', () => {
    it('should return sessions for user', async () => {
      sessionRepo.find.mockResolvedValue([{ id: 'sid', userId: 'uid' }] as Session[]);
      const sessions = await service.getSessions('uid');
      expect(sessions).toHaveLength(1);
    });
  });

  describe('deleteSession', () => {
    it('should delete session and revoke tokens', async () => {
      sessionRepo.findOne.mockResolvedValue({ id: 'sid', userId: 'uid', ipAddress: '127.0.0.1' } as Session);
      tokenRepo.update.mockResolvedValue({});
      sessionRepo.delete.mockResolvedValue({});
      await expect(service.deleteSession('uid', 'sid')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException for unknown session', async () => {
      sessionRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteSession('uid', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      userRepo.delete.mockResolvedValue({});
      await expect(service.deleteAccount('uid')).resolves.toBeUndefined();
    });
  });
});
