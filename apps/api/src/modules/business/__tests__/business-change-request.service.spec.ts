import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessChangeRequestService } from '../business-change-request.service';
import { Business } from '../entities/business.entity';

const mockBusiness = (o: Partial<Business> = {}): Business =>
  ({
    id: 'biz-1',
    name: 'Biz',
    ownerId: 'owner-1',
    status: 'approved',
    legalName: 'Old Legal',
    taxCode: '123',
    ...o,
  }) as Business;

function buildService() {
  const businessRepo = { findOne: jest.fn(), update: jest.fn().mockResolvedValue(undefined) };
  const memberRepo = { findOne: jest.fn() };
  const changeRepo = {
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve({ id: 'cr-1', ...x })),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const notificationService = {
    notifyUser: jest.fn().mockResolvedValue(undefined),
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
  };
  const dataSource = { transaction: jest.fn() };

  const service = new BusinessChangeRequestService(
    businessRepo as never,
    memberRepo as never,
    changeRepo as never,
    auditService as never,
    notificationService as never,
    dataSource as never,
  );
  return { service, businessRepo, memberRepo, changeRepo, auditService, notificationService, dataSource };
}

describe('BusinessChangeRequestService', () => {
  describe('requestChange', () => {
    it('throws Forbidden when caller is not the owner', async () => {
      const { service, memberRepo } = buildService();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.requestChange('biz-1', 'user-x', { name: 'New' } as never)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequest when business is not approved', async () => {
      const { service, memberRepo, businessRepo } = buildService();
      memberRepo.findOne.mockResolvedValue({ role: 'owner' });
      businessRepo.findOne.mockResolvedValue(mockBusiness({ status: 'pending' }));
      await expect(service.requestChange('biz-1', 'owner-1', { name: 'New' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequest when no fields changed', async () => {
      const { service, memberRepo, businessRepo, changeRepo } = buildService();
      memberRepo.findOne.mockResolvedValue({ role: 'owner' });
      businessRepo.findOne.mockResolvedValue(mockBusiness({ name: 'Biz' }));
      changeRepo.findOne.mockResolvedValue(null);
      await expect(service.requestChange('biz-1', 'owner-1', { name: 'Biz' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates a diff of only changed fields + notifies admins', async () => {
      const { service, memberRepo, businessRepo, changeRepo, notificationService } = buildService();
      memberRepo.findOne.mockResolvedValue({ role: 'owner' });
      businessRepo.findOne.mockResolvedValue(mockBusiness({ name: 'Biz', taxCode: '123' }));
      changeRepo.findOne.mockResolvedValue(null);

      await service.requestChange('biz-1', 'owner-1', { name: 'New Biz', taxCode: '123' } as never);

      expect(changeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          changes: { name: { old: 'Biz', new: 'New Biz' } },
        }),
      );
      expect(notificationService.notifyAdmins).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'business.change_submitted' }),
      );
    });
  });

  describe('approve', () => {
    it('throws NotFound when request missing', async () => {
      const { service, changeRepo } = buildService();
      changeRepo.findOne.mockResolvedValue(null);
      await expect(service.approve('cr-x', 'admin')).rejects.toThrow(NotFoundException);
    });

    it('applies diff to live business in a transaction + notifies owner', async () => {
      const { service, changeRepo, businessRepo, notificationService, dataSource } = buildService();
      changeRepo.findOne.mockResolvedValue({
        id: 'cr-1',
        businessId: 'biz-1',
        status: 'pending',
        changes: { name: { old: 'Biz', new: 'New Biz' } },
      });
      businessRepo.findOne.mockResolvedValue(mockBusiness());

      const bizUpdate = jest.fn().mockResolvedValue(undefined);
      const reqSave = jest.fn().mockResolvedValue(undefined);
      // Both Business + BusinessChangeRequest repos share one stub (update + save).
      dataSource.transaction.mockImplementation((cb: (m: unknown) => Promise<void>) =>
        cb({ getRepository: () => ({ update: bizUpdate, save: reqSave }) }),
      );

      await service.approve('cr-1', 'admin');

      expect(bizUpdate).toHaveBeenCalledWith('biz-1', { name: 'New Biz' });
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        'owner-1',
        expect.objectContaining({ type: 'business.change_approved' }),
      );
    });
  });

  describe('reject', () => {
    it('keeps live data, stores reason, notifies owner', async () => {
      const { service, changeRepo, businessRepo, notificationService } = buildService();
      changeRepo.findOne.mockResolvedValue({ id: 'cr-1', businessId: 'biz-1', status: 'pending', changes: {} });
      businessRepo.findOne.mockResolvedValue(mockBusiness());

      await service.reject('cr-1', 'admin', 'not valid');

      expect(changeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'rejected', reviewReason: 'not valid' }),
      );
      expect(businessRepo.update).not.toHaveBeenCalled();
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        'owner-1',
        expect.objectContaining({ type: 'business.change_rejected' }),
      );
    });
  });
});
