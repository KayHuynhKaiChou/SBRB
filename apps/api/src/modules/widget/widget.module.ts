import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { Business } from '../business/entities/business.entity';
import { DataSheet } from '../datasheet/entities/data-sheet.entity';
import { DataSeries } from '../datasheet/entities/data-series.entity';
import { Tab } from '../tab/entities/tab.entity';
import { AlertThreshold } from './entities/alert-threshold.entity';
import { Widget } from './entities/widget.entity';
import { WidgetAuthService } from './widget-auth.service';
import { WidgetController } from './widget.controller';
import { WidgetDataResolver } from './widget-data.resolver';
import { WidgetDataService } from './widget-data.service';
import { WidgetResolver } from './widget.resolver';
import { WidgetService } from './widget.service';

/**
 * Widget module — SRS 4.4 / 4.5 / 8.3
 * REST: PATCH /widgets/:id/position (high-frequency, debounced 300ms client-side)
 * REST: GET/PATCH/DELETE /widgets/:id/chart-data|config|data-link
 * GraphQL: Widget CRUD + chart data queries/mutations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Widget, AlertThreshold, Tab, Business, DataSheet, DataSeries]),
    CommonModule,
  ],
  providers: [WidgetAuthService, WidgetService, WidgetResolver, WidgetDataService, WidgetDataResolver],
  controllers: [WidgetController],
  exports: [WidgetService, WidgetDataService],
})
export class WidgetModule {}
