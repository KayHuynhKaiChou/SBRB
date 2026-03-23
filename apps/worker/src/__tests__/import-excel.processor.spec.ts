import { DataSource, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { ImportExcelProcessor, IImportJobData } from '../processors/import-excel.processor';
import { parseFileBuffer, validateParseResult } from '../processors/import-excel-parser';
import { DataSheet } from '@sbrb/api-entities/datasheet/data-sheet.entity';
import { DataSeries } from '@sbrb/api-entities/datasheet/data-series.entity';
import { ImportBatch } from '@sbrb/api-entities/datasheet/import-batch.entity';

/** Build in-memory xlsx buffer: row 1 = headers, rows 2+ = series data */
async function createXlsxBuffer(
  headers: string[],
  rows: Array<{ name: string; values: (number | string | null)[] }>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  sheet.addRow(['', ...headers]);
  for (const row of rows) {
    sheet.addRow([row.name, ...row.values]);
  }
  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}

/** Create processor bypassing NestJS DI to avoid Bull queue registration requirements */
function createProcessor(
  datasheetRepo: Partial<Repository<DataSheet>>,
  seriesRepo: Partial<Repository<DataSeries>>,
  batchRepo: Partial<Repository<ImportBatch>>,
  dataSource: Partial<DataSource>,
): ImportExcelProcessor {
  const processor = Object.create(ImportExcelProcessor.prototype) as ImportExcelProcessor;
  Object.assign(processor, {
    datasheetRepo,
    seriesRepo,
    batchRepo,
    dataSource,
    minioClient: { getObject: jest.fn() },
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
  });
  return processor;
}

describe('parseFileBuffer', () => {
  it('parses valid xlsx with 3 series × 12 periods', async () => {
    const headers = Array.from({ length: 12 }, (_, i) => `2024-${String(i + 1).padStart(2, '0')}`);
    const rows = [
      { name: 'Revenue', values: Array.from({ length: 12 }, (_, i) => (i + 1) * 1000) },
      { name: 'Cost', values: Array.from({ length: 12 }, (_, i) => (i + 1) * 500) },
      { name: 'Profit', values: Array.from({ length: 12 }, (_, i) => (i + 1) * 500) },
    ];

    const buffer = await createXlsxBuffer(headers, rows);
    const result = await parseFileBuffer(buffer, 'test.xlsx');

    expect(result.headers).toHaveLength(12);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].name).toBe('Revenue');
    expect(result.rows[0].values['2024-01']).toBe(1000);
    expect(result.warnings).toHaveLength(0);
  });

  it('records warning and sets null for non-numeric cells', async () => {
    const headers = ['Jan', 'Feb'];
    const rows = [{ name: 'Series1', values: ['not-a-number', 200] }];

    const buffer = await createXlsxBuffer(headers, rows);
    const result = await parseFileBuffer(buffer, 'test.xlsx');

    expect(result.rows[0].values['Jan']).toBeNull();
    expect(result.rows[0].values['Feb']).toBe(200);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validateParseResult', () => {
  it('throws when duplicate series names exist', () => {
    const headers = ['Jan', 'Feb'];
    const rows = [
      { name: 'Revenue', values: { Jan: 100, Feb: 200 } },
      { name: 'Revenue', values: { Jan: 150, Feb: 250 } },
    ];
    expect(() => validateParseResult(headers, rows)).toThrow('Duplicate series names');
  });

  it('throws when rows exceed 200', () => {
    const headers = ['Jan'];
    const rows = Array.from({ length: 201 }, (_, i) => ({
      name: `Series${i}`,
      values: { Jan: i },
    }));
    expect(() => validateParseResult(headers, rows)).toThrow('Too many series rows');
  });

  it('throws when headers empty', () => {
    expect(() => validateParseResult([], [])).toThrow('No period headers found');
  });

  it('throws when headers exceed 120', () => {
    const headers = Array.from({ length: 121 }, (_, i) => `P${i}`);
    const rows = [{ name: 'S1', values: {} }];
    expect(() => validateParseResult(headers, rows)).toThrow('Too many periods');
  });
});

describe('ImportExcelProcessor.handleImport', () => {
  let batchRepo: jest.Mocked<Partial<Repository<ImportBatch>>>;
  let datasheetRepo: jest.Mocked<Partial<Repository<DataSheet>>>;
  let seriesRepo: jest.Mocked<Partial<Repository<DataSeries>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;
  let processor: ImportExcelProcessor;

  beforeEach(() => {
    batchRepo = { update: jest.fn() };
    datasheetRepo = { update: jest.fn() };
    seriesRepo = {};
    dataSource = { transaction: jest.fn() };
    processor = createProcessor(datasheetRepo, seriesRepo, batchRepo, dataSource);
  });

  const makeJob = (data: Partial<IImportJobData> = {}) =>
    ({
      id: 'job-1',
      data: {
        batchId: 'batch-1',
        businessId: 'biz-1',
        datasheetId: 'sheet-1',
        filePath: 'uploads/test.xlsx',
        fileName: 'test.xlsx',
        uploadedBy: 'user-1',
        ...data,
      },
    } as unknown as import('bull').Job<IImportJobData>);

  it('processes valid xlsx and updates batch + datasheet to success', async () => {
    const headers = ['Jan', 'Feb', 'Mar'];
    const rows = [
      { name: 'Revenue', values: [100, 200, 300] },
      { name: 'Cost', values: [50, 100, 150] },
    ];
    const buffer = await createXlsxBuffer(headers, rows);

    (processor as unknown as { minioClient: { getObject: jest.Mock } }).minioClient.getObject =
      jest.fn().mockImplementation((_bucket: string, _key: string) => {
        const { Readable } = require('stream');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return Promise.resolve(stream);
      });

    (dataSource.transaction as jest.Mock).mockImplementation(async (fn: (m: unknown) => Promise<void>) => {
      const manager = {
        delete: jest.fn(),
        create: jest.fn().mockImplementation((_entity: unknown, data: unknown) => data),
        save: jest.fn(),
      };
      await fn(manager);
    });

    await processor.handleImport(makeJob());

    expect(batchRepo.update).toHaveBeenCalledWith('batch-1', { status: 'processing' });
    expect(batchRepo.update).toHaveBeenCalledWith('batch-1', expect.objectContaining({
      status: 'success',
      successRows: 2,
      errorRows: 0,
    }));
    expect(datasheetRepo.update).toHaveBeenCalledWith('sheet-1', expect.objectContaining({
      status: 'ready',
      seriesCount: 2,
      periodCount: 3,
    }));
  });

  it('sets batch + datasheet to error when MinIO download fails', async () => {
    (processor as unknown as { minioClient: { getObject: jest.Mock } }).minioClient.getObject =
      jest.fn().mockRejectedValue(new Error('MinIO connection refused'));

    await expect(processor.handleImport(makeJob())).rejects.toThrow('MinIO connection refused');

    expect(batchRepo.update).toHaveBeenCalledWith('batch-1', expect.objectContaining({
      status: 'error',
      errorMessage: 'MinIO connection refused',
    }));
    expect(datasheetRepo.update).toHaveBeenCalledWith('sheet-1', { status: 'error' });
  });
});
