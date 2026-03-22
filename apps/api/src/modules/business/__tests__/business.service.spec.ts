import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusinessCrudService } from '../business-crud.service';
import { BusinessOwnershipService } from '../business-ownership.service';
import { BusinessService } from '../business.service';

const mockBusiness = { id: 'biz-1', name: 'My Shop', ownerId: 'user-1' };
const mockMember = { id: 'm-1', businessId: 'biz-1', userId: 'user-1', role: 'owner', status: 'active' };

function makeCrudService() {
  const businessRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const memberRepo = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new BusinessCrudService(
    businessRepo as any,
    memberRepo as any,
    auditService as any,
  );
  return { service, businessRepo, memberRepo, auditService };
}

function makeOwnershipService() {
  const memberRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const service = new BusinessOwnershipService(memberRepo as any, auditService as any);
  return { service, memberRepo, auditService };
}

describe('BusinessCrudService', () => {
  describe('create', () => {
    it('creates business and member when under limit', async () => {
      const { service, businessRepo, memberRepo } = makeCrudService();
      memberRepo.count.mockResolvedValue(0);
      businessRepo.create.mockReturnValue(mockBusiness);
      businessRepo.save.mockResolvedValue(mockBusiness);
      memberRepo.create.mockReturnValue(mockMember);
      memberRepo.save.mockResolvedValue(mockMember);

      const result = await service.create('user-1', { name: 'My Shop' } as any);
      expect(result).toEqual(mockBusiness);
      expect(memberRepo.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when user owns 3 businesses', async () => {
      const { service, memberRepo } = makeCrudService();
      memberRepo.count.mockResolvedValue(3);
      await expect(service.create('user-1', { name: 'Shop 4' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('returns business when member exists', async () => {
      const { service, memberRepo, businessRepo } = makeCrudService();
      memberRepo.findOne.mockResolvedValue(mockMember);
      businessRepo.findOne.mockResolvedValue(mockBusiness);
      const result = await service.findById('biz-1', 'user-1');
      expect(result).toEqual(mockBusiness);
    });

    it('throws NotFoundException when no member', async () => {
      const { service, memberRepo } = makeCrudService();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('biz-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates business when user is owner', async () => {
      const { service, memberRepo, businessRepo } = makeCrudService();
      memberRepo.findOne.mockResolvedValue(mockMember);
      const business = { ...mockBusiness, name: 'My Shop' };
      businessRepo.findOne.mockResolvedValue(business);
      businessRepo.save.mockResolvedValue({ ...business, name: 'New Name' });

      const result = await service.update('biz-1', 'user-1', { name: 'New Name' } as any);
      expect(result.name).toBe('New Name');
    });

    it('throws NotFoundException when not owner', async () => {
      const { service, memberRepo } = makeCrudService();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.update('biz-1', 'user-2', { name: 'X' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deletes when name matches', async () => {
      const { service, memberRepo, businessRepo } = makeCrudService();
      memberRepo.findOne.mockResolvedValue(mockMember);
      businessRepo.findOne.mockResolvedValue(mockBusiness);
      businessRepo.delete.mockResolvedValue(undefined);
      await expect(service.delete('biz-1', 'user-1', 'My Shop')).resolves.toBeUndefined();
      expect(businessRepo.delete).toHaveBeenCalledWith('biz-1');
    });

    it('throws BadRequestException when name mismatch', async () => {
      const { service, memberRepo, businessRepo } = makeCrudService();
      memberRepo.findOne.mockResolvedValue(mockMember);
      businessRepo.findOne.mockResolvedValue(mockBusiness);
      await expect(service.delete('biz-1', 'user-1', 'Wrong Name')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

describe('BusinessOwnershipService', () => {
  describe('transferOwnership', () => {
    it('swaps roles when conditions met', async () => {
      const { service, memberRepo } = makeOwnershipService();
      const ownerMember = { ...mockMember, role: 'owner' };
      const managerMember = { id: 'm-2', businessId: 'biz-1', userId: 'user-2', role: 'manager' };
      memberRepo.findOne
        .mockResolvedValueOnce(ownerMember)
        .mockResolvedValueOnce(managerMember);
      memberRepo.save.mockResolvedValue(undefined);

      await service.transferOwnership('biz-1', 'user-1', 'user-2');
      expect(ownerMember.role).toBe('manager');
      expect(managerMember.role).toBe('owner');
    });

    it('throws NotFoundException when caller is not owner', async () => {
      const { service, memberRepo } = makeOwnershipService();
      memberRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.transferOwnership('biz-1', 'user-1', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when target is not manager', async () => {
      const { service, memberRepo } = makeOwnershipService();
      memberRepo.findOne
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(null);
      await expect(
        service.transferOwnership('biz-1', 'user-1', 'user-3'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

describe('BusinessService (facade)', () => {
  function makeService() {
    const crud = {
      create: jest.fn(),
      findById: jest.fn(),
      findMyBusinesses: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const ownership = { transferOwnership: jest.fn() };
    const service = new BusinessService(crud as any, ownership as any);
    return { service, crud, ownership };
  }

  it('delegates create to crudService', async () => {
    const { service, crud } = makeService();
    crud.create.mockResolvedValue(mockBusiness);
    const result = await service.create('user-1', { name: 'Shop' } as any);
    expect(crud.create).toHaveBeenCalledWith('user-1', { name: 'Shop' });
    expect(result).toEqual(mockBusiness);
  });

  it('delegates transferOwnership to ownershipService', async () => {
    const { service, ownership } = makeService();
    ownership.transferOwnership.mockResolvedValue(undefined);
    await service.transferOwnership('biz-1', 'user-1', 'user-2');
    expect(ownership.transferOwnership).toHaveBeenCalledWith('biz-1', 'user-1', 'user-2');
  });
});
