import { Module } from '@nestjs/common';

/**
 * Audit module — SRS 4.11
 * Handles: audit log (Owner only), 90-day retention, auto-purge,
 * search/filter/sort, CSV export
 * REST: GET /businesses/:id/audit-logs
 */
@Module({
  imports: [],
  // providers: [AuditService],
  // controllers: [AuditController],
  // exports: [AuditService],
})
export class AuditModule {}
