import { Response } from 'express';
import { DatasheetController } from '../datasheet.controller';
import { DatasheetService } from '../datasheet.service';
import { IJwtPayload } from '../../auth/jwt.strategy';

const mockUser: IJwtPayload = { sub: 'user1', email: 'test@test.com' };
const mockReq = { user: mockUser } as unknown as import('express').Request;

function makeController() {
  const service = {
    upload: jest.fn(),
    findByBusiness: jest.fn(),
    findById: jest.fn(),
    findSeries: jest.fn(),
    rename: jest.fn(),
    delete: jest.fn(),
    reimport: jest.fn(),
    getImportHistory: jest.fn(),
    getImportBatch: jest.fn(),
    generateTemplate: jest.fn(),
  } as unknown as DatasheetService;

  const controller = new DatasheetController(service);
  return { controller, service };
}

describe('DatasheetController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('upload()', () => {
    it('returns upload result from service with correct args', async () => {
      const { controller, service } = makeController();
      const uploadResult = { batchId: 'b1', datasheetId: 's1', status: 'processing' };
      (service.upload as jest.Mock).mockResolvedValue(uploadResult);

      const file = {
        originalname: 'test.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('fake'),
      } as Express.Multer.File;

      const result = await controller.upload('biz1', file, mockReq);
      expect(result).toEqual(uploadResult);
      expect(service.upload).toHaveBeenCalledWith(file, 'biz1', 'user1');
    });
  });

  describe('exportTemplate()', () => {
    it('calls generateTemplate and sets Content-Disposition attachment header', async () => {
      const { controller, service } = makeController();
      const fakeBuffer = Buffer.alloc(100, 0);
      (service.generateTemplate as jest.Mock).mockResolvedValue(fakeBuffer);

      const capturedHeaders: Record<string, unknown> = {};
      const mockRes = {
        set: (h: Record<string, unknown>) => { Object.assign(capturedHeaders, h); },
        end: jest.fn(),
      } as unknown as Response;

      await controller.exportTemplate({ periodType: 'month', count: 3 }, mockRes);

      expect(service.generateTemplate).toHaveBeenCalledWith('month', 3);
      const disposition = capturedHeaders['Content-Disposition'] as string;
      expect(disposition).toMatch(/^attachment; filename=sbrb_template_month_/);
    });
  });

  describe('findById()', () => {
    it('delegates to service with id and userId', async () => {
      const { controller, service } = makeController();
      const mockSheet = { id: 'sheet1', name: 'My Sheet' };
      (service.findById as jest.Mock).mockResolvedValue(mockSheet);

      const result = await controller.findById('sheet1', mockReq);
      expect(result).toEqual(mockSheet);
      expect(service.findById).toHaveBeenCalledWith('sheet1', 'user1');
    });
  });

  describe('delete()', () => {
    it('delegates delete to service with correct id and userId', async () => {
      const { controller, service } = makeController();
      (service.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete('sheet1', mockReq);
      expect(service.delete).toHaveBeenCalledWith('sheet1', 'user1');
    });
  });
});
