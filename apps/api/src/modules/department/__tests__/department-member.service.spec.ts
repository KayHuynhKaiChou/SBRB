import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DepartmentMemberService } from '../department-member.service';

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
  const departmentService = {
    assertBusinessMember: jest.fn().mockResolvedValue({ role: opts.actorRole ?? 'owner' }),
  };
  const dataSource = {
    transaction: jest.fn((cb: any) => cb({ getRepository: () => memberRepo })),
  };
  const service = new DepartmentMemberService(
    deptRepo as any,
    memberRepo as any,
    bizMemberRepo as any,
    departmentService as any,
    dataSource as any,
  );
  return { service, deptRepo, memberRepo, bizMemberRepo, departmentService, dataSource };
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
});
