import { Module } from '@nestjs/common';

/**
 * Tab module — SRS 4.3
 * Handles: CRUD tab, drag-sort ordering, protected/pinned flags
 * Max 20 tabs per business
 */
@Module({
  imports: [],
  // providers: [TabService, TabResolver],
  // exports: [TabService],
})
export class TabModule {}
