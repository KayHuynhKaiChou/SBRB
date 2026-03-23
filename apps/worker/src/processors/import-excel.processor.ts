import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Job } from 'bull';
import * as Minio from 'minio';
import { IMPORT_QUEUE } from './queue.constants';
import { parseFileBuffer, validateParseResult } from './import-excel-parser';
import { DataSheet } from '@sbrb/api-entities/datasheet/data-sheet.entity';
import { DataSeries } from '@sbrb/api-entities/datasheet/data-series.entity';
import { ImportBatch } from '@sbrb/api-entities/datasheet/import-batch.entity';

export interface IImportJobData {
  batchId: string;
  businessId: string;
  datasheetId: string;
  filePath: string; // MinIO object key
  fileName: string;
  uploadedBy: string;
}

interface ISaveResult {
  successRows: number;
  errorRows: number;
}

@Processor(IMPORT_QUEUE)
export class ImportExcelProcessor {
  private readonly logger = new Logger(ImportExcelProcessor.name);
  private readonly minioClient: Minio.Client;

  constructor(
    @InjectRepository(DataSheet) private readonly datasheetRepo: Repository<DataSheet>,
    @InjectRepository(DataSeries) private readonly seriesRepo: Repository<DataSeries>,
    @InjectRepository(ImportBatch) private readonly batchRepo: Repository<ImportBatch>,
    private readonly dataSource: DataSource,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: process.env['MINIO_ENDPOINT'] || 'localhost',
      port: parseInt(process.env['MINIO_PORT'] || '9000', 10),
      useSSL: false,
      accessKey: process.env['MINIO_ACCESS_KEY'] || 'minioadmin',
      secretKey: process.env['MINIO_SECRET_KEY'] || 'minioadmin',
    });
  }

  @Process('import')
  async handleImport(job: Job<IImportJobData>): Promise<void> {
    const { batchId, datasheetId, filePath, fileName } = job.data;
    this.logger.log(`Processing import job ${job.id} — batch: ${batchId}`);

    try {
      await this.batchRepo.update(batchId, { status: 'processing' });

      const bucket = process.env['MINIO_BUCKET'] || 'sbrb';
      const buffer = await this.downloadFromMinio(bucket, filePath);

      const { headers, rows, warnings } = await parseFileBuffer(buffer, fileName);
      if (warnings.length > 0) {
        this.logger.warn(`Import job ${job.id} warnings: ${warnings.join('; ')}`);
      }

      validateParseResult(headers, rows); // throws on critical error

      const { successRows, errorRows } = await this.saveData(datasheetId, headers, rows);

      await this.batchRepo.update(batchId, { status: 'success', successRows, errorRows });
      await this.datasheetRepo.update(datasheetId, {
        status: 'ready',
        importedAt: new Date(),
        periodHeaders: headers,
        seriesCount: successRows,
        periodCount: headers.length,
      });

      this.publishProgress(datasheetId, 100, 'ready');
      this.logger.log(`Import job ${job.id} completed: ${successRows} series, ${errorRows} skipped`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Import job ${job.id} failed: ${msg}`);
      await this.batchRepo.update(batchId, { status: 'error', errorMessage: msg });
      await this.datasheetRepo.update(datasheetId, { status: 'error' });
      this.publishProgress(datasheetId, 0, 'error', msg);
      throw error;
    }
  }

  private async downloadFromMinio(bucket: string, objectKey: string): Promise<Buffer> {
    const stream = await this.minioClient.getObject(bucket, objectKey);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  private async saveData(
    datasheetId: string,
    headers: string[],
    rows: Array<{ name: string; values: Record<string, number | null> }>,
  ): Promise<ISaveResult> {
    let successRows = 0;
    let errorRows = 0;

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(DataSeries, { dataSheetId: datasheetId });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.name.trim()) {
          errorRows++;
          continue;
        }
        const series = manager.create(DataSeries, {
          dataSheetId: datasheetId,
          seriesName: row.name,
          rowIndex: i,
          values: row.values as Record<string, number>,
        });
        await manager.save(DataSeries, series);
        successRows++;
      }
    });

    return { successRows, errorRows };
  }

  private publishProgress(
    datasheetId: string,
    progress: number,
    status: string,
    errorMessage?: string,
  ): void {
    this.logger.log(
      `import_progress_${datasheetId}: progress=${progress} status=${status}${errorMessage ? ` error=${errorMessage}` : ''}`,
    );
  }
}
