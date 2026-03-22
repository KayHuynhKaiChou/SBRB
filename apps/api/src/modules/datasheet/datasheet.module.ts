import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { IMPORT_QUEUE } from '../../common/constants/queue.constants';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';

/**
 * Datasheet module — SRS 4.7 / 4.8 / 4.12
 * Handles: Excel/CSV import (BullMQ job), DataSheet CRUD,
 * DataSeries management, re-import with diff,
 * template export (ExcelJS), import history
 *
 * REST: POST /datasheets/import (Multer upload),
 *       GET /datasheets/template,
 *       GET/DELETE/PATCH /datasheets/:id
 * GraphQL: DataSheet query (for DataSelector)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DataSheet, DataSeries, ImportBatch]),
    BullModule.registerQueue({ name: IMPORT_QUEUE }),
  ],
  // providers: [DatasheetService, DatasheetResolver, ImportHistoryService],
  // controllers: [DatasheetController],
  // exports: [DatasheetService],
})
export class DatasheetModule {}
