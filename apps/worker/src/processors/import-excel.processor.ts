import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { IMPORT_QUEUE } from './queue.constants';

export interface ImportJobData {
  batchId: string;
  businessId: string;
  datasheetId: string;
  filePath: string; // MinIO object key
  fileName: string;
  uploadedBy: string; // userId
}

/**
 * Excel/CSV import processor — SRS 4.8
 * Steps:
 * 1. Download file from MinIO
 * 2. Parse with ExcelJS (detect header row + series column)
 * 3. Validate: max 200 series, 120 periods, numbers only
 * 4. Save DataSeries rows to PostgreSQL
 * 5. Update ImportBatch.status = 'ready' or 'error'
 * 6. Publish GraphQL subscription event (import complete)
 * 7. Check alert thresholds for affected widgets
 */
@Processor(IMPORT_QUEUE)
export class ImportExcelProcessor {
  private readonly logger = new Logger(ImportExcelProcessor.name);

  @Process('import')
  async handleImport(job: Job<ImportJobData>) {
    this.logger.log(`Processing import job ${job.id} — batch: ${job.data.batchId}`);
    // TODO: Implement when DatasheetModule entities are ready
    // 1. Download from MinIO
    // 2. Parse with ExcelJS
    // 3. Validate
    // 4. Save to DB
    // 5. Update ImportBatch status
    // 6. Emit GraphQL subscription
    this.logger.log(`Import job ${job.id} completed`);
  }
}
