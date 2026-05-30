import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminBusinessService } from '../admin-business.service';
import { Business } from '../../business/entities/business.entity';
import { BusinessMember } from '../../business/entities/business-member.entity';
import { User } from '../../auth/entities/user.entity';

/** Minimal mock for TypeORM QueryBuilder chain used in fetchRow */
function buildQbChain(rawRow?: Record<string, unknown>) {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(
      rawRow ?? {
        b_id: 'biz-1', b_name: 'Test Biz', b_industry: 'Tech',
        b_status: 'inactive', b_created_at: new Date(),
        b_inactivated_at: new Date(), b_inactive_reason: 'reason',
        owner_email: 'owner@test.com', member_count: '3',
      },
    ),
    getRawMany: jest.fn().mockResolvedValue([]),
    clone: jest.fn().mockReturnThis(),
  };
}

const mockBusiness = (overrides: Partial<Business> = {}): Business =>
  ({
    id: 'biz-1',
    name: 'Test Biz',
    industry: 'Tech',
    ownerId: 'user-1',
    status: 'active',
    inactivatedAt: null,
    inactivatedBy: null,
    inactiveReason: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }) as Business;

function buildService() {
  const businessRepo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(),
  };
  const memberRepo = {} as unknown as typeof businessRepo;
  const userRepo = {} as unknown as typeof businessRepo;
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  const service = new AdminBusinessService(
    businessRepo as never,
    memberRepo as never,
    userRepo as never,
    auditService as never,
  );

  return { service, businessRepo, auditService };
}

describe('AdminBusinessService', () => {
  describe('inactivateBusiness', () => {
    it('throws NotFoundException when business not found', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.inactivateBusiness('missing-id', 'admin-id', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when business already inactive', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'inactive' }));
      await expect(
        service.inactivateBusiness('biz-1', 'admin-id', 'reason'),
      ).rejects.toThrow(ConflictException);
    });

    it('calls update with inactive status', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness());
      businessRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.inactivateBusiness('biz-1', 'admin-id', 'reason');

      expect(businessRepo.update).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ status: 'inactive', inactiveReason: 'reason', inactivatedBy: 'admin-id' }),
      );
    });

    it('calls audit log on success', async () => {
      const { service, businessRepo, auditService } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness());
      businessRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.inactivateBusiness('biz-1', 'admin-id', 'reason');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'business.inactivate', businessId: 'biz-1' }),
      );
    });

    it('does NOT throw when audit log fails', async () => {
      const { service, businessRepo, auditService } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness());
      businessRepo.createQueryBuilder.mockReturnValue(buildQbChain());
      auditService.log.mockRejectedValue(new Error('DB error'));

      await expect(
        service.inactivateBusiness('biz-1', 'admin-id', 'reason'),
      ).resolves.toBeDefined();
    });
  });

  describe('reactivateBusiness', () => {
    it('throws NotFoundException when business not found', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.reactivateBusiness('missing-id', 'admin-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when business already active', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'active' }));
      await expect(
        service.reactivateBusiness('biz-1', 'admin-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('calls update with active status and nulls out inactivation fields', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'inactive' }));
      businessRepo.createQueryBuilder.mockReturnValue(
        buildQbChain({ ...{}, b_status: 'active', b_inactivated_at: null, b_inactive_reason: null }),
      );

      await service.reactivateBusiness('biz-1', 'admin-id');

      expect(businessRepo.update).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ status: 'active', inactivatedAt: null, inactivatedBy: null, inactiveReason: null }),
      );
    });
  });
});
