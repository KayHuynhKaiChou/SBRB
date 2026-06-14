import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import { AdminMetricsService } from './admin-metrics.service';
import { AdminChartsService } from './admin-charts.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminMetricsType } from './dto/admin-metrics.type';
import { AdminDashboardChartsType } from './dto/admin-dashboard-charts.type';
import { AdminAuditListResultType } from './dto/admin-audit-list-result.type';
import { AdminAuditFilterInput } from './dto/admin-audit-filter.input';
import { PageInput } from '../../common/dto/page.input';

/** Platform-level admin queries — metrics + audit log. SRS §5.9, §5.11 */
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Resolver()
export class AdminPlatformResolver {
  constructor(
    private readonly metricsService: AdminMetricsService,
    private readonly chartsService: AdminChartsService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Query(() => AdminMetricsType, {
    description: 'Platform-wide aggregate stats for admin dashboard. Admin only.',
  })
  async adminMetrics(): Promise<AdminMetricsType> {
    return this.metricsService.getMetrics();
  }

  @Query(() => AdminDashboardChartsType, {
    description: 'Chart datasets (growth, status mix, industries, sizes, activity). Admin only.',
  })
  async adminDashboardCharts(): Promise<AdminDashboardChartsType> {
    return this.chartsService.getCharts();
  }

  @Query(() => AdminAuditListResultType, {
    description: 'Paginated audit log of all admin mutations. Admin only.',
  })
  async adminAuditLog(
    @Args('filter', { nullable: true }) filter?: AdminAuditFilterInput,
    @Args('page', { nullable: true }) page?: PageInput,
  ): Promise<AdminAuditListResultType> {
    return this.auditService.listAuditLogs(filter, page);
  }
}
