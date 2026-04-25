import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatasheetService } from '../datasheet.service';
import { DatasheetImportService } from '../datasheet-import.service';
import { DatasheetTemplateService } from '../datasheet-template.service';

// Mock the parser module used by DatasheetImportService
jest.mock('../import-parsers/import-excel-parser', () => ({
  parseFileBuffer: jest.fn().mockResolvedValue({
    headers: ['T1', 'T2', 'T3'],
    rows: [
      { name: 'Revenue', values: { T1: 100, T2: 200, T3: 300 } },
      { name: 'Cost', values: { T1: 50, T2: 80, T3: 120 } },
    ],
    warnings: [],
  }),
  validateParseResult: jest.fn(),
}));

const makeRepos = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

const managerMember = { businessId: 'biz1', userId: 'user1', role: 'manager', status: 'active' };
const viewerMember = { businessId: 'biz1', userId: 'user2', role: 'viewer', status: 'active' };

const xlsxFile = {
  originalname: 'test.xlsx',
  mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  buffer: Buffer.from('xlsx-content'),
} as Express.Multer.File;

/** Build a real DatasheetImportService with mock dependencies for upload/reimport tests */
function makeImportService() {
  const sheetRepo = makeRepos();
  const seriesRepo = makeRepos();
  const batchRepo = makeRepos();
  const memberRepo = makeRepos();

  const authService = {
    requireMember: jest.fn().mockImplementation(async (_biz: string, _user: string) => {
      const found = memberRepo.findOne({ where: {} });
      return found;
    }),
    requireManager: jest.fn().mockImplementation(async (_biz: string, _user: string) => {
      const member = await memberRepo.findOne({ where: {} });
      if (!member || !['owner', 'manager'].includes(member.role)) {
        const { ForbiddenException: FE } = require('@nestjs/common');
        throw new FE('Manager role required');
      }
      return member;
    }),
  };

  const pubSub = { publish: jest.fn() };

  const importService = new DatasheetImportService(
    sheetRepo as any,
    seriesRepo as any,
    batchRepo as any,
    authService as any,
    pubSub as any,
  );

  return { importService, sheetRepo, seriesRepo, batchRepo, memberRepo, authService };
}

/** Build the DatasheetService facade with mock sub-services and repos */
function makeService() {
  const sheetRepo = makeRepos();
  const seriesRepo = makeRepos();
  const widgetRepo = makeRepos();
  const memberRepo = makeRepos();

  const authService = {
    requireMember: jest.fn().mockImplementation(async (_biz: string, _user: string) => {
      const member = memberRepo.findOne({ where: {} });
      if (!member) {
        const { ForbiddenException: FE } = require('@nestjs/common');
        throw new FE('Access denied');
      }
      return member;
    }),
    requireManager: jest.fn().mockImplementation(async (_biz: string, _user: string) => {
      const member = await memberRepo.findOne({ where: {} });
      if (!member || !['owner', 'manager'].includes((member as any).role)) {
        const { ForbiddenException: FE } = require('@nestjs/common');
        throw new FE('Manager role required');
      }
      return member;
    }),
  };

  const importService = {
    upload: jest.fn(),
    reimport: jest.fn(),
    getImportHistory: jest.fn(),
    getImportBatch: jest.fn(),
  } as unknown as DatasheetImportService;

  const templateService = {
    generateTemplate: jest.fn(),
  } as unknown as DatasheetTemplateService;

  const service = new DatasheetService(
    sheetRepo as any,
    seriesRepo as any,
    widgetRepo as any,
    authService as any,
    importService,
    templateService,
  );

  return { service, sheetRepo, seriesRepo, widgetRepo, memberRepo, authService, importService, templateService };
}

describe('DatasheetService — facade delegation', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('upload()', () => {
    it('delegates to importService.upload', async () => {
      const { service, importService } = makeService();
      const uploadResult = { batchId: 'b1', datasheetId: 's1', status: 'ready' };
      (importService.upload as jest.Mock).mockResolvedValue(uploadResult);

      const result = await service.upload(xlsxFile, 'biz1', 'user1');
      expect(result).toEqual(uploadResult);
      expect(importService.upload).toHaveBeenCalledWith(xlsxFile, 'biz1', 'user1');
    });
  });

  describe('reimport()', () => {
    it('delegates to importService.reimport', async () => {
      const { service, importService } = makeService();
      const reimportResult = { batchId: 'b2', datasheetId: 's1', status: 'ready' };
      (importService.reimport as jest.Mock).mockResolvedValue(reimportResult);

      const result = await service.reimport('s1', xlsxFile, 'user1');
      expect(result).toEqual(reimportResult);
      expect(importService.reimport).toHaveBeenCalledWith('s1', xlsxFile, 'user1');
    });
  });

  describe('generateTemplate()', () => {
    it('delegates to templateService.generateTemplate', async () => {
      const { service, templateService } = makeService();
      const fakeBuffer = Buffer.alloc(100);
      (templateService.generateTemplate as jest.Mock).mockResolvedValue(fakeBuffer);

      const result = await service.generateTemplate('month', 3);
      expect(result).toBe(fakeBuffer);
      expect(templateService.generateTemplate).toHaveBeenCalledWith('month', 3);
    });
  });

  describe('findById()', () => {
    it('throws ForbiddenException when user is not a member', async () => {
      const { service, sheetRepo, authService } = makeService();
      sheetRepo.findOne.mockResolvedValue({ id: 'sheet1', businessId: 'biz1' });
      authService.requireMember.mockRejectedValue(new ForbiddenException('Access denied'));
      await expect(service.findById('sheet1', 'non-member')).rejects.toThrow(ForbiddenException);
    });

    it('returns sheet when user is a member', async () => {
      const { service, sheetRepo, authService } = makeService();
      const mockSheet = { id: 'sheet1', businessId: 'biz1' };
      sheetRepo.findOne.mockResolvedValue(mockSheet);
      authService.requireMember.mockResolvedValue(viewerMember);
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
      const { service, sheetRepo, widgetRepo, authService } = makeService();
      sheetRepo.findOne.mockResolvedValue({ id: 'sheet1', businessId: 'biz1' });
      authService.requireManager.mockResolvedValue(managerMember);
      widgetRepo.findOne.mockResolvedValue({ id: 'w1', dataSheetId: 'sheet1' });
      await expect(service.delete('sheet1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('deletes sheet when no widget is linked', async () => {
      const { service, sheetRepo, widgetRepo, authService } = makeService();
      sheetRepo.findOne.mockResolvedValue({ id: 'sheet1', businessId: 'biz1' });
      authService.requireManager.mockResolvedValue(managerMember);
      widgetRepo.findOne.mockResolvedValue(null);
      sheetRepo.delete.mockResolvedValue({ affected: 1 });
      await service.delete('sheet1', 'user1');
      expect(sheetRepo.delete).toHaveBeenCalledWith('sheet1');
    });
  });
});

describe('DatasheetImportService — file import logic', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('upload()', () => {
    it('parses file, saves DataSheet + DataSeries + ImportBatch, returns ready', async () => {
      const { importService, sheetRepo, seriesRepo, batchRepo, memberRepo, authService } = makeImportService();
      memberRepo.findOne.mockResolvedValue(managerMember);
      authService.requireManager.mockResolvedValue(managerMember);

      const mockSheet = { id: 'sheet-uuid', businessId: 'biz1' };
      const mockBatch = { id: 'batch-uuid', businessId: 'biz1' };
      sheetRepo.create.mockReturnValue(mockSheet);
      sheetRepo.save.mockResolvedValue(mockSheet);
      batchRepo.create.mockReturnValue(mockBatch);
      batchRepo.save.mockResolvedValue(mockBatch);
      seriesRepo.create.mockImplementation((data: any) => data);
      seriesRepo.save.mockResolvedValue([]);

      const result = await importService.upload(xlsxFile, 'biz1', 'user1');

      expect(sheetRepo.save).toHaveBeenCalled();
      expect(batchRepo.save).toHaveBeenCalled();
      expect(seriesRepo.save).toHaveBeenCalled();
      expect(sheetRepo.update).toHaveBeenCalledWith('sheet-uuid', expect.objectContaining({ status: 'ready' }));
      expect(batchRepo.update).toHaveBeenCalledWith('batch-uuid', expect.objectContaining({ status: 'success', successRows: 2 }));
      expect(result).toEqual({ batchId: 'batch-uuid', datasheetId: 'sheet-uuid', status: 'ready' });
    });

    it('throws BadRequestException for invalid MIME type', async () => {
      const { importService } = makeImportService();
      const invalidFile = { ...xlsxFile, mimetype: 'application/pdf', originalname: 'test.pdf' } as Express.Multer.File;
      await expect(importService.upload(invalidFile, 'biz1', 'user1')).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user is not manager', async () => {
      const { importService, authService } = makeImportService();
      authService.requireManager.mockRejectedValue(new ForbiddenException('Manager role required'));
      await expect(importService.upload(xlsxFile, 'biz1', 'user2')).rejects.toThrow(ForbiddenException);
    });

    it('marks sheet/batch as error when series save fails', async () => {
      const { importService, sheetRepo, seriesRepo, batchRepo, authService } = makeImportService();
      authService.requireManager.mockResolvedValue(managerMember);
      const mockSheet = { id: 'sheet-uuid', businessId: 'biz1' };
      const mockBatch = { id: 'batch-uuid', businessId: 'biz1' };
      sheetRepo.create.mockReturnValue(mockSheet);
      sheetRepo.save.mockResolvedValue(mockSheet);
      batchRepo.create.mockReturnValue(mockBatch);
      batchRepo.save.mockResolvedValue(mockBatch);
      seriesRepo.create.mockImplementation((data: any) => data);
      seriesRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(importService.upload(xlsxFile, 'biz1', 'user1')).rejects.toThrow(BadRequestException);
      expect(sheetRepo.update).toHaveBeenCalledWith('sheet-uuid', expect.objectContaining({ status: 'error' }));
      expect(batchRepo.update).toHaveBeenCalledWith('batch-uuid', expect.objectContaining({ status: 'error' }));
    });
  });

  describe('reimport()', () => {
    it('deletes old series, saves new ones, returns ready', async () => {
      const { importService, sheetRepo, seriesRepo, batchRepo, authService } = makeImportService();
      const existingSheet = { id: 'sheet1', businessId: 'biz1' };
      sheetRepo.findOne.mockResolvedValue(existingSheet);
      authService.requireManager.mockResolvedValue(managerMember);
      const mockBatch = { id: 'batch-uuid', businessId: 'biz1' };
      batchRepo.create.mockReturnValue(mockBatch);
      batchRepo.save.mockResolvedValue(mockBatch);
      seriesRepo.delete.mockResolvedValue({ affected: 2 });
      seriesRepo.create.mockImplementation((data: any) => data);
      seriesRepo.save.mockResolvedValue([]);

      const result = await importService.reimport('sheet1', xlsxFile, 'user1');

      expect(seriesRepo.delete).toHaveBeenCalledWith({ dataSheetId: 'sheet1' });
      expect(seriesRepo.save).toHaveBeenCalled();
      expect(sheetRepo.update).toHaveBeenCalledWith('sheet1', expect.objectContaining({ status: 'ready' }));
      expect(result.status).toBe('ready');
    });
  });
});

describe('DatasheetTemplateService — template generation', () => {
  let templateService: DatasheetTemplateService;

  beforeEach(() => {
    templateService = new DatasheetTemplateService();
  });

  it('returns non-empty Buffer for month type with 3 rows', async () => {
    const buffer = await templateService.generateTemplate('month', 3);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect((buffer as Buffer).length).toBeGreaterThan(0);
  });

  it('returns non-empty Buffer for quarter type', async () => {
    const buffer = await templateService.generateTemplate('quarter', 2);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect((buffer as Buffer).length).toBeGreaterThan(0);
  });
});
