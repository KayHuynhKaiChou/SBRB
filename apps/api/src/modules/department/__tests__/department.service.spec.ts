import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DepartmentService } from '../department.service';

const BIZ_ID = 'biz-1';
const USER_ID = 'user-1';

function makeService() {
  const deptRepo = {
    create: jest.fn((dto) => ({ id: 'dept-new', ...dto })),
    save: jest.fn((entity) => Promise.resolve(entity)),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };
  const memberRepo = {
    findOne: jest.fn(),
  };
  const service = new DepartmentService(deptRepo as any, memberRepo as any);
  return { service, deptRepo, memberRepo };
}

/** Helper: make memberRepo.findOne return a member (pass auth) */
function allowMember(memberRepo: ReturnType<typeof makeService>['memberRepo']) {
  memberRepo.findOne.mockResolvedValue({ id: 'm-1', businessId: BIZ_ID, userId: USER_ID });
}

describe('DepartmentService', () => {
  describe('create', () => {
    it('creates root department (no parent)', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);

      const result = await service.create(USER_ID, {
        businessId: BIZ_ID,
        name: 'Sales',
      } as any);

      expect(deptRepo.create).toHaveBeenCalledWith({
        businessId: BIZ_ID,
        name: 'Sales',
        parentId: null,
      });
      expect(deptRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Sales');
    });

    it('creates child department with valid parent', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
      // Parent exists, same business, depth 0 (root)
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
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(USER_ID, { businessId: BIZ_ID, name: 'Sales' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when parent does not exist', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
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
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
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
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
      // Simulate a chain: root -> L1 -> L2 (depth 2), adding child would be depth 3 = MAX
      deptRepo.findOne.mockImplementation(({ where }: any) => {
        const nodes: Record<string, any> = {
          'L2': { id: 'L2', businessId: BIZ_ID, parentId: 'L1' },
          'L1': { id: 'L1', businessId: BIZ_ID, parentId: 'root' },
          'root': { id: 'root', businessId: BIZ_ID, parentId: null },
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
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
      const mockDepts = [
        { id: 'd-1', businessId: BIZ_ID, name: 'Alpha', parentId: null },
        { id: 'd-2', businessId: BIZ_ID, name: 'Beta', parentId: null },
      ];
      deptRepo.find.mockResolvedValue(mockDepts);

      const result = await service.findByBusiness(BIZ_ID, USER_ID);
      expect(result).toEqual(mockDepts);
      expect(deptRepo.find).toHaveBeenCalledWith({
        where: { businessId: BIZ_ID },
        order: { name: 'ASC' },
      });
    });

    it('throws ForbiddenException when user is not a member', async () => {
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue(null);

      await expect(service.findByBusiness(BIZ_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('updates department name', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
      const dept = { id: 'd-1', businessId: BIZ_ID, name: 'Old', parentId: null };
      deptRepo.findOne.mockResolvedValue(dept);

      const result = await service.update('d-1', USER_ID, { name: 'New' } as any);
      expect(result.name).toBe('New');
      expect(deptRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when department does not exist', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      deptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', USER_ID, { name: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when setting self as parent', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'd-1',
        businessId: BIZ_ID,
        name: 'Dept',
        parentId: null,
      });

      await expect(
        service.update('d-1', USER_ID, { parentId: 'd-1' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('deletes department with no children', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'd-1',
        businessId: BIZ_ID,
        name: 'Leaf',
        parentId: null,
      });
      deptRepo.count.mockResolvedValue(0);
      deptRepo.delete.mockResolvedValue(undefined);

      await expect(service.delete('d-1', USER_ID)).resolves.toBeUndefined();
      expect(deptRepo.delete).toHaveBeenCalledWith('d-1');
    });

    it('throws BadRequestException when department has children', async () => {
      const { service, deptRepo, memberRepo } = makeService();
      allowMember(memberRepo);
      deptRepo.findOne.mockResolvedValue({
        id: 'd-1',
        businessId: BIZ_ID,
        name: 'Parent',
        parentId: null,
      });
      deptRepo.count.mockResolvedValue(2);

      await expect(service.delete('d-1', USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when department does not exist', async () => {
      const { service, deptRepo } = makeService();
      deptRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
