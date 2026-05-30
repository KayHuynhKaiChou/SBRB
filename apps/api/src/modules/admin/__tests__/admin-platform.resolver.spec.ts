import { Reflector } from '@nestjs/core';
import { AdminPlatformResolver } from '../admin-platform.resolver';
import { AdminMetricsService } from '../admin-metrics.service';
import { AdminAuditService } from '../admin-audit.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../../common/guards/platform-admin.guard';

const mockMetrics = {
  totalBusinesses: 5,
  activeBusinesses: 3,
  inactiveBusinesses: 2,
  totalUsers: 10,
  newBusinessesLast30d: 1,
  newUsersLast30d: 4,
};

const mockAuditResult = {
  rows: [
    {
      id: 'audit-1',
      action: 'business.inactivate',
      actorId: 'admin-1',
      actorEmail: 'admin@test.com',
      targetId: 'biz-1',
      targetType: 'business',
      targetName: 'Test Biz',
      businessId: 'biz-1',
      meta: '{"reason":"test"}',
      createdAt: new Date(),
    },
  ],
  total: 1,
};

function buildResolver() {
  const metricsService = {
    getMetrics: jest.fn().mockResolvedValue(mockMetrics),
  } as unknown as AdminMetricsService;

  const auditService = {
    listAuditLogs: jest.fn().mockResolvedValue(mockAuditResult),
  } as unknown as AdminAuditService;

  const resolver = new AdminPlatformResolver(metricsService, auditService);
  return { resolver, metricsService, auditService };
}

describe('AdminPlatformResolver', () => {
  describe('adminMetrics query', () => {
    it('delegates to metricsService.getMetrics and returns result', async () => {
      const { resolver, metricsService } = buildResolver();

      const result = await resolver.adminMetrics();

      expect(metricsService.getMetrics).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('adminAuditLog query', () => {
    it('delegates to auditService.listAuditLogs with filter/page and returns result', async () => {
      const { resolver, auditService } = buildResolver();

      const filter = { actorEmail: 'admin@test.com' };
      const page = { limit: 20, offset: 0 };

      const result = await resolver.adminAuditLog(filter, page);

      expect(auditService.listAuditLogs).toHaveBeenCalledWith(filter, page);
      expect(result.total).toBe(1);
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('guard metadata', () => {
    it('has JwtAuthGuard and PlatformAdminGuard applied via @UseGuards decorator', () => {
      /**
       * NestJS @UseGuards stores guard metadata on the class constructor via Reflect.
       * We verify the resolver class has both guards registered.
       */
      const reflector = new Reflector();
      const guards = Reflect.getMetadata('__guards__', AdminPlatformResolver) as (new () => unknown)[];
      expect(Array.isArray(guards)).toBe(true);
      expect(guards.some((g) => g === JwtAuthGuard || g.name === 'JwtAuthGuard')).toBe(true);
      expect(guards.some((g) => g === PlatformAdminGuard || g.name === 'PlatformAdminGuard')).toBe(true);
    });
  });
});
