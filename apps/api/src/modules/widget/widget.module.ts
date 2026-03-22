import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Business } from '../business/entities/business.entity';
import { Tab } from '../tab/entities/tab.entity';
import { AlertThreshold } from './entities/alert-threshold.entity';
import { Widget } from './entities/widget.entity';
import { WidgetController } from './widget.controller';
import { WidgetResolver } from './widget.resolver';
import { WidgetService } from './widget.service';

/**
 * Widget module — SRS 4.4 / 4.5 / 8.3
 * REST: PATCH /widgets/:id/position (high-frequency, debounced 300ms client-side)
 * GraphQL: Widget CRUD queries/mutations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Widget, AlertThreshold, Tab, Business, BusinessMember]),
  ],
  providers: [WidgetService, WidgetResolver],
  controllers: [WidgetController],
  exports: [WidgetService],
})
export class WidgetModule {}
