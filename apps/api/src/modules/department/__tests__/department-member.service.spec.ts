import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DepartmentMemberService } from '../department-member.service';
import { UpdateMemberInfoDto } from '../dto/update-member-info.dto';

const BIZ_ID = 'biz-1';
const DEPT_ID = 'dept-1';
const ACTOR_ID = 'actor-1';

function makeService(opts: { actorRole?: string; targetRole?: string } = {}) {
  const deptRepo = {
    findOne: jest.fn().mockResolvedValue({ id: DEPT_ID, businessId: BIZ_ID, isRoot: false }),
  };
  const memberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'dm-1', ...entity })),
    delete: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    })),
  };
  const bizMemberRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockImplementation(({ where }: any) => {
      if (where.userId === ACTOR_ID) {
        return Promise.resolve({
          id: 'bm-actor',
          businessId: BIZ_ID,
          userId: ACTOR_ID,
          role: opts.actorRole ?? 'owner',
        });
      }
      return Promise.resolve({
        id: 'bm-target',
        businessId: BIZ_ID,
        userId: where.userId,
        role: opts.targetRole ?? 'manager',
      });
    }),
  };
  const userRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'user-9',
      fullName: 'Old Name',
      phone: null,
      email: 'user9@test.com',
    }),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity })),
  };
  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };
  const departmentService = {
    assertBusinessMember: jest.fn().mockResolvedValue({ role: opts.actorRole ?? 'owner' }),
    findMyRole: jest.fn().mockResolvedValue(opts.actorRole ?? 'owner'),
  };
  const dataSource = {
    transaction: jest.fn((cb: any) => cb({ getRepository: () => memberRepo })),
  };
  const service = new DepartmentMemberService(
    deptRepo as any,
    memberRepo as any,
    bizMemberRepo as any,
    userRepo as any,
    departmentService as any,
    auditService as any,
    dataSource as any,
  );
  return { service, deptRepo, memberRepo, bizMemberRepo, userRepo, auditService, departmentService, dataSource };
}

describe('DepartmentMemberService', () => {
  describe('addMember', () => {
    it('inserts non-manager row when user is business member', async () => {
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue(null); // no existing dept membership
      const result = await service.addMember(DEPT_ID, 'user-9', ACTOR_ID);
      expect(memberRepo.save).toHaveBeenCalledWith({
        departmentId: DEPT_ID,
        userId: 'user-9',
        isManager: false,
      });
      expect(result.id).toBe('dm-1');
    });

    it('throws when user already in department', async () => {
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue({ id: 'dm-existing' });
      await expect(service.addMember(DEPT_ID, 'user-9', ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws Forbidden when target is not business member', async () => {
      const { service, bizMemberRepo, memberRepo } = makeService();
      bizMemberRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.userId === ACTOR_ID) {
          return Promise.resolve({ businessId: BIZ_ID, userId: ACTOR_ID, role: 'owner' });
        }
        return Promise.resolve(null);
      });
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.addMember(DEPT_ID, 'user-x', ACTOR_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addMembers (batch + transfer)', () => {
    it('adds/transfers multiple users, dropping existing non-manager memberships first', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      deptRepo.findOne.mockResolvedValue({ id: DEPT_ID, businessId: BIZ_ID });
      (deptRepo as any).find = jest
        .fn()
        .mockResolvedValue([{ id: DEPT_ID }, { id: 'other-dept' }]);

      const result = await service.addMembers(DEPT_ID, ['u1', 'u2'], ACTOR_ID);

      expect(result).toHaveLength(2);
      // Transfer: each user's existing non-manager memberships in the business are removed first.
      expect(memberRepo.delete).toHaveBeenCalledTimes(2);
      const delArg = memberRepo.delete.mock.calls[0][0];
      expect(delArg).toMatchObject({ userId: 'u1', isManager: false });
      expect([...delArg.departmentId.value].sort()).toEqual([DEPT_ID, 'other-dept'].sort());
      // Then inserted into the target department as a non-manager.
      expect(memberRepo.save).toHaveBeenCalledWith({
        departmentId: DEPT_ID,
        userId: 'u1',
        isManager: false,
      });
    });

    it('dedups ids and returns empty for empty input', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      deptRepo.findOne.mockResolvedValue({ id: DEPT_ID, businessId: BIZ_ID });
      (deptRepo as any).find = jest.fn().mockResolvedValue([{ id: DEPT_ID }]);
      const result = await service.addMembers(DEPT_ID, [], ACTOR_ID);
      expect(result).toEqual([]);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('blocks removing the manager (B13)', async () => {
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue({ id: 'dm-1', isManager: true });
      await expect(service.removeMember(DEPT_ID, 'user-1', ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('removes a non-manager member', async () => {
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue({ id: 'dm-1', isManager: false });
      await service.removeMember(DEPT_ID, 'user-1', ACTOR_ID);
      expect(memberRepo.delete).toHaveBeenCalledWith('dm-1');
    });

    it('throws NotFound when target not in department', async () => {
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.removeMember(DEPT_ID, 'user-1', ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setManager', () => {
    it('rejects user with viewer role (B3/B7)', async () => {
      const { service } = makeService({ targetRole: 'viewer' });
      await expect(service.setManager(DEPT_ID, 'user-9', ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('atomic swap: demotes old manager + promotes new', async () => {
      const { service, memberRepo, dataSource } = makeService({ targetRole: 'manager' });
      memberRepo.findOne.mockResolvedValue(null); // not a member yet
      const result = await service.setManager(DEPT_ID, 'user-9', ACTOR_ID);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-9', isManager: true }),
      );
      expect(result).toBeDefined();
    });

    it('promotes existing member to manager', async () => {
      const { service, memberRepo } = makeService({ targetRole: 'manager' });
      const existing = { id: 'dm-existing', userId: 'user-9', isManager: false };
      memberRepo.findOne.mockResolvedValue(existing);
      await service.setManager(DEPT_ID, 'user-9', ACTOR_ID);
      expect(existing.isManager).toBe(true);
      expect(memberRepo.save).toHaveBeenCalledWith(existing);
    });

    it('rejects a non-owner actor (only the owner can change managers)', async () => {
      const { service } = makeService({ actorRole: 'manager', targetRole: 'manager' });
      await expect(service.setManager(DEPT_ID, 'user-9', ACTOR_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects changing the root department manager (must go via admin)', async () => {
      const { service, deptRepo } = makeService({ targetRole: 'manager' });
      deptRepo.findOne.mockResolvedValue({ id: DEPT_ID, businessId: BIZ_ID, isRoot: true });
      await expect(service.setManager(DEPT_ID, 'user-9', ACTOR_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findMembers', () => {
    it('returns members ordered by isManager desc, joinedAt asc with businessRole', async () => {
      const { service, memberRepo, bizMemberRepo } = makeService();
      const list = [
        { id: 'dm-1', userId: 'u1', isManager: true, user: { id: 'u1' } },
        { id: 'dm-2', userId: 'u2', isManager: false, user: { id: 'u2' } },
      ];
      memberRepo.find.mockResolvedValue(list);
      bizMemberRepo.find.mockResolvedValue([
        { userId: 'u1', role: 'owner' },
        { userId: 'u2', role: 'manager' },
      ]);
      const result = await service.findMembers(DEPT_ID, ACTOR_ID);
      expect(memberRepo.find).toHaveBeenCalledWith({
        where: { departmentId: DEPT_ID },
        relations: ['user'],
        order: { isManager: 'DESC', joinedAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'dm-1', businessRole: 'owner' });
      expect(result[1]).toMatchObject({ id: 'dm-2', businessRole: 'manager' });
    });
  });

  describe('findSubtreeMembers', () => {
    it('returns direct members + managers of direct child departments', async () => {
      const { service, deptRepo, memberRepo, bizMemberRepo } = makeService();
      // Queried dept (Chi nhánh HCM) has two direct child departments (KD, VH).
      deptRepo.findOne.mockResolvedValue({ id: DEPT_ID, businessId: BIZ_ID, name: 'Chi nhánh HCM' });
      (deptRepo as any).find = jest.fn().mockResolvedValue([
        { id: 'kd', name: 'Phòng KD HCM' },
        { id: 'vh', name: 'Phòng VH HCM' },
      ]);
      // The OR query returns: this dept's direct members + only the child managers.
      memberRepo.find.mockResolvedValue([
        { id: 'b1', departmentId: DEPT_ID, userId: 'u1', isManager: true, user: { id: 'u1' } },
        { id: 'k1', departmentId: 'kd', userId: 'u2', isManager: true, user: { id: 'u2' } },
        { id: 'v1', departmentId: 'vh', userId: 'u4', isManager: true, user: { id: 'u4' } },
      ]);
      bizMemberRepo.find.mockResolvedValue([{ userId: 'u1', role: 'owner' }]);

      const result = await service.findSubtreeMembers(DEPT_ID, ACTOR_ID);

      expect(result).toHaveLength(3);
      // Direct member sorts first, tagged with own department + isDirect=true.
      expect(result[0]).toMatchObject({
        userId: 'u1',
        isDirect: true,
        departmentName: 'Chi nhánh HCM',
        businessRole: 'owner',
      });
      // Child managers carry their real sub-department name + isDirect=false.
      const inherited = result.filter((r) => !r.isDirect);
      expect(inherited).toHaveLength(2);
      expect(inherited.map((r) => r.departmentName).sort()).toEqual([
        'Phòng KD HCM',
        'Phòng VH HCM',
      ]);
      // Children looked up one level down via parentId.
      expect((deptRepo as any).find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentId: DEPT_ID } }),
      );
      // Member query is an OR: this dept's members + child-managers only.
      const where = memberRepo.find.mock.calls[0][0].where;
      expect(Array.isArray(where)).toBe(true);
      expect(where[0]).toEqual({ departmentId: DEPT_ID });
      expect([...where[1].departmentId.value].sort()).toEqual(['kd', 'vh'].sort());
      expect(where[1].isManager).toBe(true);
    });

    it('returns only direct members for a leaf department (no children)', async () => {
      const { service, deptRepo, memberRepo, bizMemberRepo } = makeService();
      deptRepo.findOne.mockResolvedValue({ id: DEPT_ID, businessId: BIZ_ID, name: 'Phòng Kỹ thuật' });
      (deptRepo as any).find = jest.fn().mockResolvedValue([]); // no children
      memberRepo.find.mockResolvedValue([
        { id: 'm1', departmentId: DEPT_ID, userId: 'u1', isManager: true, user: { id: 'u1' } },
        { id: 'm2', departmentId: DEPT_ID, userId: 'u2', isManager: false, user: { id: 'u2' } },
      ]);
      bizMemberRepo.find.mockResolvedValue([]);
      const result = await service.findSubtreeMembers(DEPT_ID, ACTOR_ID);
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.isDirect)).toBe(true);
      // No child-manager clause when there are no children.
      const where = memberRepo.find.mock.calls[0][0].where;
      expect(where).toEqual([{ departmentId: DEPT_ID }]);
    });

    it('returns empty array when the department has no members', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      deptRepo.findOne.mockResolvedValue({ id: DEPT_ID, businessId: BIZ_ID, name: 'Chi nhánh HCM' });
      (deptRepo as any).find = jest.fn().mockResolvedValue([]);
      memberRepo.find.mockResolvedValue([]);
      const result = await service.findSubtreeMembers(DEPT_ID, ACTOR_ID);
      expect(result).toEqual([]);
    });
  });

  describe('updateMemberInfo', () => {
    const TARGET_USER_ID = 'user-9';

    it('owner updates fullName and phone successfully', async () => {
      const { service, userRepo, auditService } = makeService({ actorRole: 'owner' });
      const input: UpdateMemberInfoDto = { fullName: 'New Name', phone: '+84901234567' };

      const result = await service.updateMemberInfo(BIZ_ID, TARGET_USER_ID, input, ACTOR_ID);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'New Name', phone: '+84901234567' }),
      );
      expect(result.fullName).toBe('New Name');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'member.update_info',
          businessId: BIZ_ID,
          actorId: ACTOR_ID,
          targetId: TARGET_USER_ID,
          targetType: 'user',
        }),
      );
    });

    it('throws ForbiddenException when actor is not owner', async () => {
      const { service } = makeService({ actorRole: 'manager' });
      const input: UpdateMemberInfoDto = { fullName: 'New Name' };

      await expect(
        service.updateMemberInfo(BIZ_ID, TARGET_USER_ID, input, ACTOR_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when target is not a business member', async () => {
      const { service, bizMemberRepo } = makeService({ actorRole: 'owner' });
      // Target user not found in business
      bizMemberRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.userId === ACTOR_ID) {
          return Promise.resolve({ businessId: BIZ_ID, userId: ACTOR_ID, role: 'owner' });
        }
        return Promise.resolve(null);
      });
      const input: UpdateMemberInfoDto = { fullName: 'New Name' };

      await expect(
        service.updateMemberInfo(BIZ_ID, TARGET_USER_ID, input, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('audit failure does not propagate — mutation still succeeds', async () => {
      const { service, auditService } = makeService({ actorRole: 'owner' });
      auditService.log.mockRejectedValue(new Error('DB error'));
      const input: UpdateMemberInfoDto = { fullName: 'Audit Fail Name' };

      // Should not throw even though audit fails
      await expect(
        service.updateMemberInfo(BIZ_ID, TARGET_USER_ID, input, ACTOR_ID),
      ).resolves.toBeDefined();
    });
  });
});
