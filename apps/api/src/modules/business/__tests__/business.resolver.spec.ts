import { BusinessResolver } from '../business.resolver';

const mockUser = { sub: 'user-1', email: 'user@test.com' };
const mockBusiness = { id: 'biz-1', name: 'My Shop', ownerId: 'user-1' };

function makeResolver() {
  const businessService = {
    findById: jest.fn(),
    findMyBusinesses: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transferOwnership: jest.fn(),
  };
  const resolver = new BusinessResolver(businessService as any);
  return { resolver, businessService };
}

describe('BusinessResolver', () => {
  describe('getBusiness', () => {
    it('calls service.findById with id and userId', async () => {
      const { resolver, businessService } = makeResolver();
      businessService.findById.mockResolvedValue(mockBusiness);
      const result = await resolver.getBusiness('biz-1', mockUser as any);
      expect(businessService.findById).toHaveBeenCalledWith('biz-1', 'user-1');
      expect(result).toEqual(mockBusiness);
    });
  });

  describe('getMyBusinesses', () => {
    it('calls service.findMyBusinesses with userId', async () => {
      const { resolver, businessService } = makeResolver();
      businessService.findMyBusinesses.mockResolvedValue([mockBusiness]);
      const result = await resolver.getMyBusinesses(mockUser as any);
      expect(businessService.findMyBusinesses).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('createBusiness', () => {
    it('calls service.create with userId and input', async () => {
      const { resolver, businessService } = makeResolver();
      businessService.create.mockResolvedValue(mockBusiness);
      const input = { name: 'My Shop' } as any;
      const result = await resolver.createBusiness(input, mockUser as any);
      expect(businessService.create).toHaveBeenCalledWith('user-1', input);
      expect(result).toEqual(mockBusiness);
    });
  });

  describe('updateBusiness', () => {
    it('calls service.update with id, userId, and input', async () => {
      const { resolver, businessService } = makeResolver();
      businessService.update.mockResolvedValue({ ...mockBusiness, name: 'New' });
      const input = { name: 'New' } as any;
      const result = await resolver.updateBusiness('biz-1', input, mockUser as any);
      expect(businessService.update).toHaveBeenCalledWith('biz-1', 'user-1', input);
      expect(result).toMatchObject({ name: 'New' });
    });
  });

  describe('deleteBusiness', () => {
    it('calls service.delete and returns true', async () => {
      const { resolver, businessService } = makeResolver();
      businessService.delete.mockResolvedValue(undefined);
      const result = await resolver.deleteBusiness('biz-1', 'My Shop', mockUser as any);
      expect(businessService.delete).toHaveBeenCalledWith('biz-1', 'user-1', 'My Shop');
      expect(result).toBe(true);
    });
  });

  describe('transferOwnership', () => {
    it('calls service.transferOwnership and returns true', async () => {
      const { resolver, businessService } = makeResolver();
      businessService.transferOwnership.mockResolvedValue(undefined);
      const result = await resolver.transferOwnership('biz-1', 'user-2', mockUser as any);
      expect(businessService.transferOwnership).toHaveBeenCalledWith('biz-1', 'user-1', 'user-2');
      expect(result).toBe(true);
    });
  });
});
