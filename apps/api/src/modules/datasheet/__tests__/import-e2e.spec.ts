/**
 * E2E integration test: upload → process → DataSeries saved
 * Tests the full pipeline via ImportExcelProcessor without real DB/MinIO.
 * Uses ExcelJS to create real xlsx buffers in-memory.
 */
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { ImportExcelProcessor } from '../../../../../worker/src/processors/import-excel.processor';
import { DataSheet } from '../entities/data-sheet.entity';
import { DataSeries } from '../entities/data-series.entity';
import { ImportBatch } from '../entities/import-batch.entity';

// Build real xlsx buffer from headers + rows
async function buildXlsx(
  headers: string[],
  rows: Array<{ name: string; values: number[] }>,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  ws.addRow(['', ...headers]);
  for (const row of rows) {
    ws.addRow([row.name, ...row.values]);
  }
  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

/** Create processor bypassing NestJS DI */
function buildProcessor(
  datasheetRepo: Partial<Repository<DataSheet>>,
  seriesRepo: Partial<Repository<DataSeries>>,
  batchRepo: Partial<Repository<ImportBatch>>,
  dataSource: { transaction: jest.Mock },
  minioGetObject: jest.Mock,
): ImportExcelProcessor {
  const p = Object.create(ImportExcelProcessor.prototype) as ImportExcelProcessor;
  Object.assign(p, {
    datasheetRepo,
    seriesRepo,
    batchRepo,
    dataSource,
    minioClient: { getObject: minioGetObject },
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
  });
  return p;
}

describe('Import pipeline e2e (upload → process → DataSeries saved)', () => {
  const DATASHEET_ID = 'ds-e2e-1';
  const BATCH_ID = 'batch-e2e-1';
  const BUSINESS_ID = 'biz-e2e-1';
  const USER_ID = 'user-e2e-1';

  let batchRepo: { update: jest.Mock };
  let datasheetRepo: { update: jest.Mock };
  let savedSeries: DataSeries[];
  let dataSource: { transaction: jest.Mock };
  let minioGetObject: jest.Mock;
  let processor: ImportExcelProcessor;

  const makeJob = () =>
    ({
      id: 'job-e2e-1',
      data: {
        batchId: BATCH_ID,
        businessId: BUSINESS_ID,
        datasheetId: DATASHEET_ID,
        filePath: `${BUSINESS_ID}/imports/test.xlsx`,
        fileName: 'report.xlsx',
        uploadedBy: USER_ID,
      },
    } as unknown as import('bull').Job<import('../../../../../worker/src/processors/import-excel.processor').IImportJobData>);

  beforeEach(() => {
    batchRepo = { update: jest.fn() };
    datasheetRepo = { update: jest.fn() };
    savedSeries = [];

    dataSource = {
      transaction: jest.fn().mockImplementation(async (fn: (m: unknown) => Promise<void>) => {
        const manager = {
          delete: jest.fn(),
          create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
          save: jest.fn().mockImplementation((_entity: unknown, entity: DataSeries) => {
            savedSeries.push(entity as DataSeries);
            return Promise.resolve(entity);
          }),
        };
        await fn(manager);
      }),
    };

    minioGetObject = jest.fn();
    processor = buildProcessor(datasheetRepo, {}, batchRepo, dataSource, minioGetObject);
  });

  it('full flow: valid xlsx → all DataSeries saved, ImportBatch=success, DataSheet=ready', async () => {
    const headers = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const rows = [
      { name: 'Revenue', values: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200] },
      { name: 'Cost',    values: [50,  100, 150, 200, 250, 300, 350, 400, 450, 500,  550,  600] },
      { name: 'Profit',  values: [50,  100, 150, 200, 250, 300, 350, 400, 450, 500,  550,  600] },
    ];
    const buffer = await buildXlsx(headers, rows);

    minioGetObject.mockImplementation((_bucket: string, _key: string) => {
      const { Readable } = require('stream');
      const s = new Readable();
      s.push(buffer);
      s.push(null);
      return Promise.resolve(s);
    });

    await processor.handleImport(makeJob());

    // Batch progressed through processing → success
    expect(batchRepo.update).toHaveBeenNthCalledWith(1, BATCH_ID, { status: 'processing' });
    expect(batchRepo.update).toHaveBeenNthCalledWith(2, BATCH_ID, expect.objectContaining({
      status: 'success',
      successRows: 3,
      errorRows: 0,
    }));

    // DataSheet marked ready with correct metadata
    expect(datasheetRepo.update).toHaveBeenCalledWith(DATASHEET_ID, expect.objectContaining({
      status: 'ready',
      seriesCount: 3,
      periodCount: 12,
      periodHeaders: headers,
    }));

    // DataSeries were persisted in transaction
    expect(savedSeries).toHaveLength(3);
    expect(savedSeries[0]).toMatchObject({
      dataSheetId: DATASHEET_ID,
      seriesName: 'Revenue',
      rowIndex: 0,
      values: expect.objectContaining({ T1: 100, T12: 1200 }),
    });
  });

  it('validation failure: duplicate series names → ImportBatch=error, DataSheet=error', async () => {
    const headers = ['Jan', 'Feb'];
    const rows = [
      { name: 'Revenue', values: [100, 200] },
      { name: 'Revenue', values: [150, 250] }, // duplicate
    ];
    const buffer = await buildXlsx(headers, rows);

    minioGetObject.mockImplementation((_bucket: string, _key: string) => {
      const { Readable } = require('stream');
      const s = new Readable();
      s.push(buffer);
      s.push(null);
      return Promise.resolve(s);
    });

    await expect(processor.handleImport(makeJob())).rejects.toThrow('Duplicate series names');

    expect(batchRepo.update).toHaveBeenCalledWith(BATCH_ID, expect.objectContaining({
      status: 'error',
      errorMessage: expect.stringContaining('Duplicate'),
    }));
    expect(datasheetRepo.update).toHaveBeenCalledWith(DATASHEET_ID, { status: 'error' });
    // No series were saved
    expect(savedSeries).toHaveLength(0);
  });

  it('MinIO failure → ImportBatch=error, DataSheet=error, no series saved', async () => {
    minioGetObject.mockRejectedValue(new Error('S3 network error'));

    await expect(processor.handleImport(makeJob())).rejects.toThrow('S3 network error');

    expect(batchRepo.update).toHaveBeenCalledWith(BATCH_ID, expect.objectContaining({
      status: 'error',
      errorMessage: 'S3 network error',
    }));
    expect(datasheetRepo.update).toHaveBeenCalledWith(DATASHEET_ID, { status: 'error' });
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(savedSeries).toHaveLength(0);
  });

  it('reimport scenario: replaces existing series (delete called before insert)', async () => {
    const headers = ['Q1', 'Q2'];
    const rows = [{ name: 'Sales', values: [1000, 2000] }];
    const buffer = await buildXlsx(headers, rows);

    minioGetObject.mockImplementation((_bucket: string, _key: string) => {
      const { Readable } = require('stream');
      const s = new Readable();
      s.push(buffer);
      s.push(null);
      return Promise.resolve(s);
    });

    const deleteCalls: unknown[] = [];
    dataSource.transaction = jest.fn().mockImplementation(async (fn: (m: unknown) => Promise<void>) => {
      const manager = {
        delete: jest.fn().mockImplementation((_entity: unknown, criteria: unknown) => {
          deleteCalls.push(criteria);
        }),
        create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
        save: jest.fn().mockImplementation((_entity: unknown, entity: DataSeries) => {
          savedSeries.push(entity as DataSeries);
          return Promise.resolve(entity);
        }),
      };
      await fn(manager);
    });

    await processor.handleImport(makeJob());

    // Verify delete was called with datasheetId before insert (reimport)
    expect(deleteCalls).toHaveLength(1);
    expect(deleteCalls[0]).toEqual({ dataSheetId: DATASHEET_ID });
    expect(savedSeries).toHaveLength(1);
    expect(savedSeries[0].seriesName).toBe('Sales');
  });
});
