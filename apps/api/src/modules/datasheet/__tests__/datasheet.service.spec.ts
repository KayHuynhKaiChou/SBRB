import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatasheetService } from '../datasheet.service';

const makeRepos = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

function makeService() {
  const sheetRepo = makeRepos();
  const seriesRepo = makeRepos();
  const batchRepo = makeRepos();
  const memberRepo = makeRepos();
  const widgetRepo = makeRepos();
  const queue = { add: jest.fn().mockResolvedValue(undefined) };
  const minioService = {
    upload: jest.fn().mockResolvedValue('bucket/key'),
    delete: jest.fn(),
  };

  const service = new DatasheetService(
    sheetRepo as any,
    seriesRepo as any,
    batchRepo as any,
    memberRepo as any,
    widgetRepo as any,
    queue as any,
    minioService as any,
  );

  return { service, sheetRepo, seriesRepo, batchRepo, memberRepo, widgetRepo, queue, minioService };
}

const managerMember = { businessId: 'biz1', userId: 'user1', role: 'manager', status: 'active' };
const viewerMember = { businessId: 'biz1', userId: 'user2', role: 'viewer', status: 'active' };

const xlsxFile = {
  originalname: 'test.xlsx',
  mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  buffer: Buffer.from('xlsx-content'),
} as Express.Multer.File;

describe('DatasheetService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('upload()', () => {
    it('creates DataSheet + ImportBatch + enqueues job for valid xlsx', async () => {
      const { service, sheetRepo, batchRepo, memberRepo, queue, minioService } = makeService();
      memberRepo.findOne.mockResolvedValue(managerMember);
      const mockSheet = { id: 'sheet-uuid', businessId: 'biz1' };
      const mockBatch = { id: 'batch-uuid', businessId: 'biz1' };
      sheetRepo.create.mockReturnValue(mockSheet);
      sheetRepo.save.mockResolvedValue(mockSheet);
      batchRepo.create.mockReturnValue(mockBatch);
      batchRepo.save.mockResolvedValue(mockBatch);

      const result = await service.upload(xlsxFile, 'biz1', 'user1');

      expect(minioService.upload).toHaveBeenCalled();
      expect(sheetRepo.save).toHaveBeenCalled();
      expect(batchRepo.save).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith(
        'import-excel',
        expect.objectContaining({ batchId: 'batch-uuid', datasheetId: 'sheet-uuid' }),
      );
      expect(result).toEqual({ batchId: 'batch-uuid', datasheetId: 'sheet-uuid', status: 'processing' });
    });

    it('throws BadRequestException for invalid MIME type', async () => {
      const { service } = makeService();
      const invalidFile = { ...xlsxFile, mimetype: 'application/pdf' } as Express.Multer.File;
      await expect(service.upload(invalidFile, 'biz1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user is not manager', async () => {
      const { service, memberRepo } = makeService();
      memberRepo.findOne.mockResolvedValue(viewerMember);
      await expect(service.upload(xlsxFile, 'biz1', 'user2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findById()', () => {
    it('throws ForbiddenException when user is not a member', async () => {
      const { service, sheetRepo, memberRepo } = makeService();
      sheetRepo.findOne.mockResolvedValue({ id: 'sheet1', businessId: 'biz1' });
      memberRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('sheet1', 'non-member')).rejects.toThrow(ForbiddenException);
    });

    it('returns sheet when user is a member', async () => {
      const { service, sheetRepo, memberRepo } = makeService();
      const mockSheet = { id: 'sheet1', businessId: 'biz1' };
      sheetRepo.findOne.mockResolvedValue(mockSheet);
      memberRepo.findOne.mockResolvedValue(viewerMember);

      const result = await service.findById('sheet1', 'user2');
      expect(result).toEqual(mockSheet);
    });

    it('throws NotFoundException when sheet does not exist', async () => {
      const { service, sheetRepo } = makeService();
      sheetRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('no-sheet', 'user1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete()', () => {
    it('throws BadRequestException when widget is linked to sheet', async () => {
      const { service, sheetRepo, memberRepo, widgetRepo } = makeService();
      sheetRepo.findOne.mockResolvedValue({ id: 'sheet1', businessId: 'biz1' });
      memberRepo.findOne.mockResolvedValue(managerMember);
      widgetRepo.findOne.mockResolvedValue({ id: 'w1', dataSheetId: 'sheet1' });

      await expect(service.delete('sheet1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('deletes sheet when no widget is linked', async () => {
      const { service, sheetRepo, memberRepo, widgetRepo } = makeService();
      sheetRepo.findOne.mockResolvedValue({ id: 'sheet1', businessId: 'biz1' });
      memberRepo.findOne.mockResolvedValue(managerMember);
      widgetRepo.findOne.mockResolvedValue(null);
      sheetRepo.delete.mockResolvedValue({ affected: 1 });

      await service.delete('sheet1', 'user1');
      expect(sheetRepo.delete).toHaveBeenCalledWith('sheet1');
    });
  });

  describe('generateTemplate()', () => {
    it('returns non-empty Buffer for month type with 3 rows', async () => {
      const { service } = makeService();
      const buffer = await service.generateTemplate('month', 3);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect((buffer as Buffer).length).toBeGreaterThan(0);
    });

    it('returns non-empty Buffer for quarter type', async () => {
      const { service } = makeService();
      const buffer = await service.generateTemplate('quarter', 2);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect((buffer as Buffer).length).toBeGreaterThan(0);
    });
  });
});
