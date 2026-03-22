import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Widget } from './entities/widget.entity';
import { AlertThreshold } from './entities/alert-threshold.entity';

/**
 * Widget module — SRS 4.4 / 4.5 / 4.6 / 8.1 / 8.3
 * Handles: CRUD widget, canvas position (x,y,w,h), server-side collision check,
 * PATCH /widgets/:id/position (debounce 300ms client-side),
 * chart config (type, colors, legend), data linking,
 * alert threshold (SRS 4.10)
 *
 * REST: PATCH /widgets/:id/position
 * GraphQL: Widget queries/mutations, AlertThreshold CRUD
 */
@Module({
  imports: [TypeOrmModule.forFeature([Widget, AlertThreshold])],
  // providers: [WidgetService, WidgetResolver, AlertThresholdService],
  // controllers: [WidgetController],
  // exports: [WidgetService],
})
export class WidgetModule {}
