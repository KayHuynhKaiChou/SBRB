import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

/**
 * Audit module — SRS 4.11
 * Handles: audit log (Owner only), 90-day retention, auto-purge,
 * search/filter/sort, CSV export
 * REST: GET /businesses/:id/audit-logs
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
