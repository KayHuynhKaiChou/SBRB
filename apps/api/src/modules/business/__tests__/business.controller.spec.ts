import { BusinessController } from '../business.controller';

const mockUser = { sub: 'user-1', email: 'user@test.com' };
const mockBusiness = { id: 'biz-1', name: 'My Shop', ownerId: 'user-1' };

function makeController() {
  const businessService = {
    findById: jest.fn(),
    findMyBusinesses: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transferOwnership: jest.fn(),
  };
  const minioService = { uploadFile: jest.fn() };
  const controller = new BusinessController(businessService as any, minioService as any);
  return { controller, businessService, minioService };
}

function mockReq(): any {
  return { user: mockUser };
}

describe('BusinessController', () => {
  describe('POST /businesses', () => {
    it('calls service.create with userId and dto', async () => {
      const { controller, businessService } = makeController();
      businessService.create.mockResolvedValue(mockBusiness);
      const dto = { name: 'My Shop' } as any;
      const result = await controller.create(mockReq(), dto);
      expect(businessService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockBusiness);
    });
  });

  describe('GET /users/me/businesses', () => {
    it('calls service.findMyBusinesses with userId', async () => {
      const { controller, businessService } = makeController();
      businessService.findMyBusinesses.mockResolvedValue([mockBusiness]);
      const result = await controller.findMyBusinesses(mockReq());
      expect(businessService.findMyBusinesses).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /businesses/:id', () => {
    it('calls service.findById with id and userId', async () => {
      const { controller, businessService } = makeController();
      businessService.findById.mockResolvedValue(mockBusiness);
      const result = await controller.findById('biz-1', mockReq());
      expect(businessService.findById).toHaveBeenCalledWith('biz-1', 'user-1');
      expect(result).toEqual(mockBusiness);
    });
  });

  describe('PATCH /businesses/:id', () => {
    it('calls service.update with id, userId, dto', async () => {
      const { controller, businessService } = makeController();
      businessService.update.mockResolvedValue({ ...mockBusiness, name: 'Updated' });
      const dto = { name: 'Updated' } as any;
      const result = await controller.update('biz-1', mockReq(), dto);
      expect(businessService.update).toHaveBeenCalledWith('biz-1', 'user-1', dto);
      expect(result).toMatchObject({ name: 'Updated' });
    });
  });

  describe('DELETE /businesses/:id', () => {
    it('calls service.delete with id, userId, confirmName', async () => {
      const { controller, businessService } = makeController();
      businessService.delete.mockResolvedValue(undefined);
      await controller.delete('biz-1', mockReq(), 'My Shop');
      expect(businessService.delete).toHaveBeenCalledWith('biz-1', 'user-1', 'My Shop');
    });
  });

  describe('POST /businesses/:id/transfer-ownership', () => {
    it('calls service.transferOwnership', async () => {
      const { controller, businessService } = makeController();
      businessService.transferOwnership.mockResolvedValue(undefined);
      await controller.transferOwnership('biz-1', mockReq(), 'user-2');
      expect(businessService.transferOwnership).toHaveBeenCalledWith('biz-1', 'user-1', 'user-2');
    });
  });

  describe('POST /businesses/:id/logo', () => {
    it('calls minioService.uploadFile and returns logoUrl', async () => {
      const { controller, businessService, minioService } = makeController();
      businessService.findById.mockResolvedValue(mockBusiness);
      minioService.uploadFile.mockResolvedValue('https://minio.local/logo.png');
      const file = { buffer: Buffer.from('img'), mimetype: 'image/png' } as any;
      const result = await controller.uploadLogo('biz-1', mockReq(), file);
      expect(minioService.uploadFile).toHaveBeenCalledWith(
        'businesses/biz-1/logo',
        file.buffer,
        'image/png',
      );
      expect(result).toEqual({ logoUrl: 'https://minio.local/logo.png' });
    });
  });
});
