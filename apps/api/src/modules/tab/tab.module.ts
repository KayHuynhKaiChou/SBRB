import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessMember } from '../business/entities/business-member.entity';
import { Tab } from './entities/tab.entity';
import { TabResolver } from './tab.resolver';
import { TabService } from './tab.service';

/**
 * Tab module — SRS 4.3
 * Handles: CRUD tab, drag-sort ordering, protected/pinned flags
 * Max 20 tabs per business
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tab, BusinessMember])],
  providers: [TabService, TabResolver],
  exports: [TabService],
})
export class TabModule {}
