import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUserService } from '../admin-user.service';
import { User } from '../../auth/entities/user.entity';

/** Minimal QueryBuilder mock that covers the SELECT...getRawMany/getRawOne chain */
function buildQbChain(rawRow?: Record<string, unknown>, rawRows?: Record<string, unknown>[]) {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(1),
    getRawOne: jest.fn().mockResolvedValue(
      rawRow ?? {
        u_id: 'user-1',
        u_email: 'test@example.com',
        u_full_name: 'Test User',
        u_platform_role: null,
        u_is_disabled: false,
        u_last_login_at: null,
        u_created_at: new Date('2024-01-01'),
        business_count: '2',
      },
    ),
    getRawMany: jest.fn().mockResolvedValue(rawRows ?? []),
  };
}

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    platformRole: null,
    isDisabled: false,
    disabledAt: null,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    phone: null,
    avatarUrl: null,
    language: 'vi',
    bio: null,
    emailVerified: true,
    ...overrides,
  }) as User;

function buildService() {
  const userRepo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(),
  };
  const memberRepo = {
    createQueryBuilder: jest.fn(),
  };
  const businessRepo = {} as unknown as typeof userRepo;
  const refreshTokenService = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  const service = new AdminUserService(
    userRepo as never,
    memberRepo as never,
    businessRepo as never,
    refreshTokenService as never,
    auditService as never,
  );

  return { service, userRepo, memberRepo, refreshTokenService, auditService };
}

describe('AdminUserService', () => {
  describe('disableUser', () => {
    it('throws BadRequestException when admin disables themselves', async () => {
      const { service } = buildService();
      await expect(
        service.disableUser('admin-1', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user not found', async () => {
      const { service, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.disableUser('user-1', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates isDisabled and disabledAt', async () => {
      const { service, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser());
      userRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.disableUser('user-1', 'admin-1');

      expect(userRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ isDisabled: true, disabledAt: expect.any(Date) }),
      );
    });

    it('revokes all refresh tokens after disabling', async () => {
      const { service, userRepo, refreshTokenService } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser());
      userRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.disableUser('user-1', 'admin-1');

      expect(refreshTokenService.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('enableUser', () => {
    it('throws NotFoundException when user not found', async () => {
      const { service, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.enableUser('missing-id', 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('clears isDisabled and disabledAt', async () => {
      const { service, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser({ isDisabled: true, disabledAt: new Date() }));
      userRepo.createQueryBuilder.mockReturnValue(buildQbChain({ ...{}, u_is_disabled: false }));

      await service.enableUser('user-1', 'admin-1');

      expect(userRepo.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ isDisabled: false, disabledAt: null }),
      );
    });

    it('does NOT revoke tokens on enable', async () => {
      const { service, userRepo, refreshTokenService } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser({ isDisabled: true }));
      userRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.enableUser('user-1', 'admin-1');

      expect(refreshTokenService.revokeAllForUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserDetail', () => {
    it('throws NotFoundException when user not found', async () => {
      const { service, userRepo } = buildService();
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getUserDetail('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns user detail with memberships', async () => {
      const { service, userRepo, memberRepo } = buildService();
      userRepo.findOne.mockResolvedValue(mockUser());
      memberRepo.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { business_id: 'biz-1', business_name: 'Biz One', role: 'owner', joined_at: new Date() },
        ]),
      });

      const result = await service.getUserDetail('user-1');

      expect(result.id).toBe('user-1');
      expect(result.memberships).toHaveLength(1);
      expect(result.memberships[0].role).toBe('owner');
    });
  });
});
