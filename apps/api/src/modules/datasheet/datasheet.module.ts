import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PubSub } from 'graphql-subscriptions';
import { CommonModule } from '../../common/common.module';
import { Widget } from '../widget/entities/widget.entity';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { DatasheetEditService } from './datasheet-edit.service';
import { DatasheetExportService } from './datasheet-export.service';
import { DatasheetImportService } from './datasheet-import.service';
import { DatasheetTemplateService } from './datasheet-template.service';
import { DatasheetService } from './datasheet.service';
import { DatasheetController } from './datasheet.controller';
import { DatasheetResolver } from './datasheet.resolver';

/**
 * Datasheet module — SRS 4.7 / 4.8 / 4.12
 * Handles: Excel/CSV import (direct parse), DataSheet CRUD,
 * DataSeries, template export, import history
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DataSheet, DataSeries, ImportBatch, Widget]),
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
    CommonModule,
  ],
  providers: [
    DatasheetEditService,
    DatasheetExportService,
    DatasheetImportService,
    DatasheetTemplateService,
    DatasheetService,
    DatasheetResolver,
    { provide: 'PUBSUB', useValue: new PubSub() },
  ],
  controllers: [DatasheetController],
  exports: [DatasheetService, 'PUBSUB'],
})
export class DatasheetModule {}
