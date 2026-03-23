import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IMPORT_QUEUE } from '../processors/queue.constants';
import { ImportExcelProcessor } from '../processors/import-excel.processor';
import { DataSheet } from '@sbrb/api-entities/datasheet/data-sheet.entity';
import { DataSeries } from '@sbrb/api-entities/datasheet/data-series.entity';
import { ImportBatch } from '@sbrb/api-entities/datasheet/import-batch.entity';

/**
 * Worker module — processes BullMQ jobs
 * - IMPORT_QUEUE: Parse Excel/CSV, save DataSeries to PostgreSQL
 * - ALERT_CHECK_QUEUE: Check alert thresholds after data import
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
        entities: [DataSheet, DataSeries, ImportBatch],
        synchronize: false, // Worker never auto-migrates
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
          tls: config.get('REDIS_TLS', 'false') === 'true' ? {} : undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: IMPORT_QUEUE }),
    TypeOrmModule.forFeature([DataSheet, DataSeries, ImportBatch]),
  ],
  providers: [ImportExcelProcessor],
})
export class WorkerModule {}
