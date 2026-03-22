import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tab } from './entities/tab.entity';

/**
 * Tab module — SRS 4.3
 * Handles: CRUD tab, drag-sort ordering, protected/pinned flags
 * Max 20 tabs per business
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tab])],
  // providers: [TabService, TabResolver],
  // exports: [TabService],
})
export class TabModule {}
