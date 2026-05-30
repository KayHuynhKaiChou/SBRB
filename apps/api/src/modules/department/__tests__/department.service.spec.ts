import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DepartmentService } from '../department.service';
import { Department } from '../entities/department.entity';

const BIZ_ID = 'biz-1';
const USER_ID = 'user-1';

function makeService() {
  const deptRepo = {
    create: jest.fn((dto) => ({ id: 'dept-new', ...dto })),
    save: jest.fn((entity) => Promise.resolve({ id: 'dept-new', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
  const memberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve({ id: 'dm-new', ...entity })),
  };
  const bizMemberRepo = {
    findOne: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn((cb: any) =>
      cb({
        getRepository: (entity: any) => (entity === Department ? deptRepo : memberRepo),
      }),
    ),
  };
  const service = new DepartmentService(
    deptRepo as any,
    memberRepo as any,
    bizMemberRepo as any,
    dataSource as any,
  );
  return { service, deptRepo, memberRepo, bizMemberRepo, dataSource };
}

function allowMember(bizMemberRepo: ReturnType<typeof makeService>['bizMemberRepo']) {
  bizMemberRepo.findOne.mockResolvedValue({
    id: 'm-1',
    businessId: BIZ_ID,
    userId: USER_ID,
    role: 'owner',
  });
}

describe('DepartmentService', () => {
  describe('create', () => {
    it('creates root department and auto-assigns creator as manager', async () => {
      const { service, deptRepo, memberRepo, bizMemberRepo, dataSource } = makeService();
      allowMember(bizMemberRepo);

      const result = await service.create(USER_ID, {
        businessId: BIZ_ID,
        name: 'Sales',
      } as any);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(deptRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: BIZ_ID, name: 'Sales', isRoot: false }),
      );
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, isManager: true }),
      );
      expect(result.name).toBe('Sales');
    });

    it('creates child department with valid parent', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.id === 'parent-1')
          return Promise.resolve({ id: 'parent-1', businessId: BIZ_ID, parentId: null });
        return Promise.resolve(null);
      });

      const result = await service.create(USER_ID, {
        businessId: BIZ_ID,
        name: 'Sub-Sales',
        parentId: 'parent-1',
      } as any);
      expect(result.name).toBe('Sub-Sales');
    });

    it('throws ForbiddenException when user is not a member', async () => {
      const { service, bizMemberRepo } = makeService();
      bizMemberRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(USER_ID, { businessId: BIZ_ID, name: 'Sales' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when parent does not exist', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(USER_ID, {
          businessId: BIZ_ID,
          name: 'Child',
          parentId: 'nonexistent',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when parent belongs to different business', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'parent-1',
        businessId: 'other-biz',
        parentId: null,
      });
      await expect(
        service.create(USER_ID, {
          businessId: BIZ_ID,
          name: 'Child',
          parentId: 'parent-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when depth exceeds MAX_DEPTH', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockImplementation(({ where }: any) => {
        const nodes: Record<string, any> = {
          L2: { id: 'L2', businessId: BIZ_ID, parentId: 'L1' },
          L1: { id: 'L1', businessId: BIZ_ID, parentId: 'root' },
          root: { id: 'root', businessId: BIZ_ID, parentId: null },
        };
        return Promise.resolve(nodes[where.id] ?? null);
      });
      await expect(
        service.create(USER_ID, {
          businessId: BIZ_ID,
          name: 'TooDeep',
          parentId: 'L2',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByBusiness', () => {
    it('returns departments sorted by name', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      const mockDepts = [
        { id: 'd-1', businessId: BIZ_ID, name: 'Alpha', parentId: null },
        { id: 'd-2', businessId: BIZ_ID, name: 'Beta', parentId: null },
      ];
      deptRepo.find.mockResolvedValue(mockDepts);
      const result = await service.findByBusiness(BIZ_ID, USER_ID);
      expect(result).toEqual(mockDepts);
    });

    it('throws ForbiddenException when user is not a member', async () => {
      const { service, bizMemberRepo } = makeService();
      bizMemberRepo.findOne.mockResolvedValue(null);
      await expect(service.findByBusiness(BIZ_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findTree', () => {
    it('builds nested tree with manager + memberCount', async () => {
      const { service, deptRepo, memberRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);

      const root = { id: 'r', businessId: BIZ_ID, parentId: null, name: 'BOD', isRoot: true };
      const child = { id: 'c', businessId: BIZ_ID, parentId: 'r', name: 'Sales', isRoot: false };
      deptRepo.find.mockResolvedValue([root, child]);

      memberRepo.find.mockResolvedValue([
        { id: 'mr1', departmentId: 'r', userId: 'u1', isManager: true, user: { id: 'u1' } },
        { id: 'mc1', departmentId: 'c', userId: 'u2', isManager: true, user: { id: 'u2' } },
        { id: 'mc2', departmentId: 'c', userId: 'u3', isManager: false, user: { id: 'u3' } },
      ]);

      const tree = await service.findTree(BIZ_ID, USER_ID);
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('r');
      expect(tree[0].memberCount).toBe(1);
      expect(tree[0].manager?.userId).toBe('u1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].memberCount).toBe(2);
      expect(tree[0].children![0].manager?.userId).toBe('u2');
      // directReportCount = own non-manager members + managers of direct children.
      // root: 0 own non-mgr + 1 child(c) with a manager = 1; child c: 1 own non-mgr (u3) + 0 children = 1.
      expect(tree[0].directReportCount).toBe(1);
      expect(tree[0].children![0].directReportCount).toBe(1);
    });

    it('computes directReportCount = own non-manager members + direct child managers', async () => {
      const { service, deptRepo, memberRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);

      // root: manager + 1 staff; two children each with a manager.
      const root = { id: 'r', businessId: BIZ_ID, parentId: null, name: 'BOD', isRoot: true };
      const a = { id: 'a', businessId: BIZ_ID, parentId: 'r', name: 'A', isRoot: false };
      const b = { id: 'b', businessId: BIZ_ID, parentId: 'r', name: 'B', isRoot: false };
      deptRepo.find.mockResolvedValue([root, a, b]);

      memberRepo.find.mockResolvedValue([
        { id: 'mr', departmentId: 'r', userId: 'u1', isManager: true, user: { id: 'u1' } },
        { id: 'mr2', departmentId: 'r', userId: 'u2', isManager: false, user: { id: 'u2' } },
        { id: 'ma', departmentId: 'a', userId: 'u3', isManager: true, user: { id: 'u3' } },
        { id: 'mb', departmentId: 'b', userId: 'u4', isManager: true, user: { id: 'u4' } },
      ]);

      const tree = await service.findTree(BIZ_ID, USER_ID);
      const rootNode = tree[0];
      // root: 1 own non-mgr (u2) + 2 child managers (a, b) = 3.
      expect(rootNode.directReportCount).toBe(3);
      // leaf children: own manager only, no children, no non-mgr members → 0.
      expect(rootNode.children!.every((c) => c.directReportCount === 0)).toBe(true);
    });

    it('returns empty array when no departments', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.find.mockResolvedValue([]);
      const tree = await service.findTree(BIZ_ID, USER_ID);
      expect(tree).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates department name', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      const dept = { id: 'd-1', businessId: BIZ_ID, name: 'Old', parentId: null, isRoot: false };
      deptRepo.findOne.mockResolvedValue(dept);
      const result = await service.update('d-1', USER_ID, { name: 'New' } as any);
      expect(result.name).toBe('New');
    });

    it('allows renaming root department', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      const root = { id: 'r', businessId: BIZ_ID, name: 'BOD', parentId: null, isRoot: true };
      deptRepo.findOne.mockResolvedValue(root);
      const result = await service.update('r', USER_ID, { name: 'CEO Office' } as any);
      expect(result.name).toBe('CEO Office');
    });

    it('rejects giving root a parent', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'r',
        businessId: BIZ_ID,
        name: 'BOD',
        parentId: null,
        isRoot: true,
      });
      await expect(
        service.update('r', USER_ID, { parentId: 'other' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when setting self as parent', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'd-1',
        businessId: BIZ_ID,
        name: 'Dept',
        parentId: null,
        isRoot: false,
      });
      await expect(
        service.update('d-1', USER_ID, { parentId: 'd-1' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('deletes leaf department', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'd-1',
        businessId: BIZ_ID,
        name: 'Leaf',
        parentId: null,
        isRoot: false,
      });
      deptRepo.count.mockResolvedValue(0);
      await service.delete('d-1', USER_ID);
      expect(deptRepo.delete).toHaveBeenCalledWith('d-1');
    });

    it('blocks deleting root department', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'r',
        businessId: BIZ_ID,
        name: 'BOD',
        parentId: null,
        isRoot: true,
      });
      await expect(service.delete('r', USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('blocks delete when department has children', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'd-1',
        businessId: BIZ_ID,
        name: 'Parent',
        parentId: null,
        isRoot: false,
      });
      deptRepo.count.mockResolvedValue(2);
      await expect(service.delete('d-1', USER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePositions', () => {
    const positions = [
      { id: 'd-1', positionX: 100, positionY: 200 },
      { id: 'd-2', positionX: -50, positionY: 75 },
    ];

    it('persists positions when called by owner', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.find.mockResolvedValue([
        { id: 'd-1', businessId: BIZ_ID },
        { id: 'd-2', businessId: BIZ_ID },
      ]);
      deptRepo.findOne.mockImplementation(({ where: { id } }: any) =>
        Promise.resolve({ id, businessId: BIZ_ID, positionX: 1, positionY: 2 }),
      );

      const result = await service.updatePositions(BIZ_ID, USER_ID, positions);
      expect(deptRepo.update).toHaveBeenCalledTimes(2);
      expect(deptRepo.update).toHaveBeenNthCalledWith(1, 'd-1', {
        positionX: 100,
        positionY: 200,
      });
      expect(result).toHaveLength(2);
    });

    it('rejects non-owner with ForbiddenException', async () => {
      const { service, bizMemberRepo } = makeService();
      bizMemberRepo.findOne.mockResolvedValue({
        id: 'm-1',
        businessId: BIZ_ID,
        userId: USER_ID,
        role: 'manager',
      });
      await expect(
        service.updatePositions(BIZ_ID, USER_ID, positions),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-member with ForbiddenException', async () => {
      const { service, bizMemberRepo } = makeService();
      bizMemberRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updatePositions(BIZ_ID, USER_ID, positions),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects departments belonging to a different business', async () => {
      const { service, deptRepo, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      deptRepo.find.mockResolvedValue([
        { id: 'd-1', businessId: BIZ_ID },
        { id: 'd-2', businessId: 'other-biz' },
      ]);
      await expect(
        service.updatePositions(BIZ_ID, USER_ID, positions),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects out-of-range coordinates', async () => {
      const { service, bizMemberRepo } = makeService();
      allowMember(bizMemberRepo);
      await expect(
        service.updatePositions(BIZ_ID, USER_ID, [
          { id: 'd-1', positionX: 1e9, positionY: 0 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns empty array when no positions provided', async () => {
      const { service, bizMemberRepo, deptRepo } = makeService();
      allowMember(bizMemberRepo);
      const result = await service.updatePositions(BIZ_ID, USER_ID, []);
      expect(result).toEqual([]);
      expect(deptRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('findMyRole', () => {
    it('returns role string when user is a member', async () => {
      const { service, bizMemberRepo } = makeService();
      bizMemberRepo.findOne.mockResolvedValue({ role: 'owner' });
      expect(await service.findMyRole(BIZ_ID, USER_ID)).toBe('owner');
    });

    it('returns null when user is not a member', async () => {
      const { service, bizMemberRepo } = makeService();
      bizMemberRepo.findOne.mockResolvedValue(null);
      expect(await service.findMyRole(BIZ_ID, USER_ID)).toBeNull();
    });
  });
});
