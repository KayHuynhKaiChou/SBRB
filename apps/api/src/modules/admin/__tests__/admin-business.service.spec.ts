import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminBusinessService } from '../admin-business.service';
import { Business } from '../../business/entities/business.entity';
import { BusinessMember } from '../../business/entities/business-member.entity';
import { Department } from '../../department/entities/department.entity';
import { DepartmentMember } from '../../department/entities/department-member.entity';

/** Minimal mock for TypeORM QueryBuilder chain used in fetchRow */
function buildQbChain(rawRow?: Record<string, unknown>) {
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
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
    getOne: jest.fn().mockResolvedValue(null),
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
    status: 'approved',
    inactivatedAt: null,
    inactivatedBy: null,
    inactiveReason: null,
    rejectionReason: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }) as Business;

const mockMember = (overrides: Partial<BusinessMember> = {}): BusinessMember =>
  ({
    id: 'mem-1',
    businessId: 'biz-1',
    userId: 'user-2',
    role: 'staff',
    invitedBy: null,
    assignedWidgetIds: [],
    joinedAt: new Date('2024-01-01'),
    status: 'active',
    ...overrides,
  }) as BusinessMember;

/**
 * Build a mock EntityManager for use inside dataSource.transaction callbacks.
 * Each getRepository call returns a repo mock that mirrors the shared shape used in buildService.
 */
function buildMockEntityManager(overrides: {
  bmUpdate?: jest.Mock;
  bizUpdate?: jest.Mock;
  rootDept?: Department | null;
  existingDeptMember?: DepartmentMember | null;
  deptMemberUpdate?: jest.Mock;
  deptMemberSave?: jest.Mock;
} = {}) {
  const bmQb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const deptQb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(overrides.rootDept ?? null),
  };

  const deptMemberQb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const bmRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(bmQb),
    update: overrides.bmUpdate ?? jest.fn().mockResolvedValue(undefined),
  };

  const bizRepo = {
    update: overrides.bizUpdate ?? jest.fn().mockResolvedValue(undefined),
  };

  const deptRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(deptQb),
  };

  const deptMemberRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(deptMemberQb),
    findOne: jest.fn().mockResolvedValue(overrides.existingDeptMember ?? null),
    update: overrides.deptMemberUpdate ?? jest.fn().mockResolvedValue(undefined),
    save: overrides.deptMemberSave ?? jest.fn().mockResolvedValue(undefined),
  };

  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === BusinessMember) return bmRepo;
      if (entity === Business) return bizRepo;
      if (entity === Department) return deptRepo;
      if (entity === DepartmentMember) return deptMemberRepo;
      return {};
    }),
    // Expose inner mocks for assertions
    _bmRepo: bmRepo,
    _bizRepo: bizRepo,
    _deptRepo: deptRepo,
    _deptMemberRepo: deptMemberRepo,
    _bmQb: bmQb,
    _deptQb: deptQb,
    _deptMemberQb: deptMemberQb,
  };

  return manager;
}

function buildService() {
  const businessRepo = {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(),
  };
  const memberRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const userRepo = { findOne: jest.fn() } as unknown as typeof businessRepo;
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const notificationService = {
    notifyUser: jest.fn().mockResolvedValue(undefined),
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
  };
  const storageService = {
    createSignedReadUrl: jest.fn().mockResolvedValue(null),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  const service = new AdminBusinessService(
    businessRepo as never,
    memberRepo as never,
    userRepo as never,
    auditService as never,
    notificationService as never,
    storageService as never,
    dataSource as never,
  );

  return { service, businessRepo, memberRepo, userRepo, auditService, notificationService, dataSource };
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

  describe('approveBusiness', () => {
    it('throws NotFoundException when business not found', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.approveBusiness('missing', 'admin')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when already approved', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'approved' }));
      await expect(service.approveBusiness('biz-1', 'admin')).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when rejected (owner must amend first)', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'rejected' }));
      await expect(service.approveBusiness('biz-1', 'admin')).rejects.toThrow(ConflictException);
    });

    it('approves a resubmitted business', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'resubmitted', ownerId: 'owner-1' }));
      businessRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.approveBusiness('biz-1', 'admin');

      expect(businessRepo.update).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ status: 'approved' }),
      );
    });

    it('sets approved status + notifies owner', async () => {
      const { service, businessRepo, notificationService } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'pending', ownerId: 'owner-1' }));
      businessRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.approveBusiness('biz-1', 'admin');

      expect(businessRepo.update).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ status: 'approved', approvedBy: 'admin' }),
      );
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        'owner-1',
        expect.objectContaining({ type: 'business.approved' }),
      );
    });
  });

  describe('rejectBusiness', () => {
    it('throws ConflictException when already approved', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'approved' }));
      await expect(service.rejectBusiness('biz-1', 'admin', 'bad')).rejects.toThrow(ConflictException);
    });

    it('sets rejected status + reason + notifies owner', async () => {
      const { service, businessRepo, notificationService } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'pending', ownerId: 'owner-1' }));
      businessRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.rejectBusiness('biz-1', 'admin', 'missing license');

      expect(businessRepo.update).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ status: 'rejected', rejectionReason: 'missing license' }),
      );
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        'owner-1',
        expect.objectContaining({ type: 'business.rejected' }),
      );
    });

    it('rejects a resubmitted business', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'resubmitted', ownerId: 'owner-1' }));
      businessRepo.createQueryBuilder.mockReturnValue(buildQbChain());

      await service.rejectBusiness('biz-1', 'admin', 'still missing license');

      expect(businessRepo.update).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ status: 'rejected' }),
      );
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

    it('throws ConflictException when business is not inactive', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'approved' }));
      await expect(
        service.reactivateBusiness('biz-1', 'admin-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('calls update with approved status and nulls out inactivation fields', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'inactive' }));
      businessRepo.createQueryBuilder.mockReturnValue(
        buildQbChain({ ...{}, b_status: 'approved', b_inactivated_at: null, b_inactive_reason: null }),
      );

      await service.reactivateBusiness('biz-1', 'admin-id');

      expect(businessRepo.update).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ status: 'approved', inactivatedAt: null, inactivatedBy: null, inactiveReason: null }),
      );
    });
  });

  describe('changeOwner', () => {
    const BUSINESS_ID = 'biz-1';
    const NEW_OWNER_ID = 'user-2';
    const ADMIN_ID = 'admin-id';

    const mockRootDept = {
      id: 'dept-root',
      businessId: BUSINESS_ID,
      isRoot: true,
      parentId: null,
      name: 'Root',
    } as Department;

    function setupHappyPath(overrides: {
      rootDept?: Department | null;
      existingDeptMember?: DepartmentMember | null;
    } = {}) {
      const { service, businessRepo, memberRepo, auditService, dataSource } = buildService();

      businessRepo.findOne.mockResolvedValue(mockBusiness({ ownerId: 'user-1' }));
      memberRepo.findOne.mockResolvedValue(mockMember({ userId: NEW_OWNER_ID }));

      // Use explicit undefined check — null means "no root dept", undefined means "use default"
      const rootDept = Object.prototype.hasOwnProperty.call(overrides, 'rootDept')
        ? overrides.rootDept
        : mockRootDept;

      const manager = buildMockEntityManager({
        rootDept,
        existingDeptMember: overrides.existingDeptMember ?? null,
      });

      // transaction runs callback immediately with the mock manager
      dataSource.transaction.mockImplementation((cb: (m: typeof manager) => Promise<void>) => cb(manager));

      // fetchRow after transaction
      businessRepo.createQueryBuilder.mockReturnValue(
        buildQbChain({
          b_id: BUSINESS_ID, b_name: 'Test Biz', b_industry: 'Tech',
          b_status: 'approved', b_created_at: new Date(),
          b_inactivated_at: null, b_inactive_reason: null,
          owner_email: 'newowner@test.com', member_count: '3',
        }),
      );

      return { service, businessRepo, memberRepo, auditService, dataSource, manager };
    }

    it('throws NotFoundException when business does not exist', async () => {
      const { service, businessRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(null);

      await expect(
        service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when newOwner is not a business member', async () => {
      const { service, businessRepo, memberRepo } = buildService();
      businessRepo.findOne.mockResolvedValue(mockBusiness());
      memberRepo.findOne.mockResolvedValue(null); // not a member

      await expect(
        service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('demotes current owners to manager inside transaction', async () => {
      const { service, manager } = setupHappyPath();

      await service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID);

      const bmQb = manager._bmQb;
      // First update call = demote owners → manager; second = promote newOwner → owner
      expect(bmQb.update).toHaveBeenCalledTimes(2);
      expect(bmQb.set).toHaveBeenNthCalledWith(1, { role: 'manager' });
      expect(bmQb.set).toHaveBeenNthCalledWith(2, { role: 'owner' });
    });

    it('sets business.ownerId to newOwnerUserId', async () => {
      const { service, manager } = setupHappyPath();

      await service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID);

      expect(manager._bizRepo.update).toHaveBeenCalledWith(
        BUSINESS_ID,
        { ownerId: NEW_OWNER_ID },
      );
    });

    it('reassigns root department manager — inserts new row when newOwner is not yet a dept member', async () => {
      const { service, manager } = setupHappyPath({ existingDeptMember: null });

      await service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID);

      // Should save a new DepartmentMember row
      expect(manager._deptMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ departmentId: 'dept-root', userId: NEW_OWNER_ID, isManager: true }),
      );
    });

    it('reassigns root department manager — updates existing row when newOwner is already a dept member', async () => {
      const existingDeptMember = {
        id: 'dm-1',
        departmentId: 'dept-root',
        userId: NEW_OWNER_ID,
        isManager: false,
      } as DepartmentMember;

      const { service, manager } = setupHappyPath({ existingDeptMember });

      await service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID);

      expect(manager._deptMemberRepo.update).toHaveBeenCalledWith(
        { departmentId: 'dept-root', userId: NEW_OWNER_ID },
        { isManager: true },
      );
    });

    it('writes audit log with correct action and meta after transaction', async () => {
      const { service, auditService } = setupHappyPath();

      await service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'business.change_owner',
          businessId: BUSINESS_ID,
          actorId: ADMIN_ID,
          metadata: { fromUserId: 'user-1', toUserId: NEW_OWNER_ID },
        }),
      );
    });

    it('does NOT throw when audit log fails after successful transfer', async () => {
      const { service, auditService } = setupHappyPath();
      auditService.log.mockRejectedValue(new Error('Audit DB down'));

      await expect(
        service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID),
      ).resolves.toBeDefined();
    });

    it('skips root dept reassignment when no root department exists', async () => {
      const { service, manager } = setupHappyPath({ rootDept: null });

      await service.changeOwner(BUSINESS_ID, NEW_OWNER_ID, ADMIN_ID);

      // save/update on deptMemberRepo should NOT be called if rootDept is null
      expect(manager._deptMemberRepo.save).not.toHaveBeenCalled();
      expect(manager._deptMemberRepo.update).not.toHaveBeenCalled();
    });
  });
});
