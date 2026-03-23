import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { PubSub } from 'graphql-subscriptions';
import { IMPORT_QUEUE } from '../../common/constants/queue.constants';
import { MinioService } from '../../common/services/minio.service';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Widget } from '../widget/entities/widget.entity';
import { DataSheet } from './entities/data-sheet.entity';
import { DataSeries } from './entities/data-series.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { DatasheetService } from './datasheet.service';
import { DatasheetController } from './datasheet.controller';
import { DatasheetResolver } from './datasheet.resolver';

/**
 * Datasheet module — SRS 4.7 / 4.8 / 4.12
 * Handles: Excel/CSV import (BullMQ), DataSheet CRUD,
 * DataSeries, template export, import history
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DataSheet, DataSeries, ImportBatch, Widget, BusinessMember]),
    BullModule.registerQueue({ name: IMPORT_QUEUE }),
    ScheduleModule.forFeature(),
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
  ],
  providers: [
    DatasheetService,
    DatasheetResolver,
    MinioService,
    { provide: 'PUBSUB', useValue: new PubSub() },
  ],
  controllers: [DatasheetController],
  exports: [DatasheetService, 'PUBSUB'],
})
export class DatasheetModule {}
