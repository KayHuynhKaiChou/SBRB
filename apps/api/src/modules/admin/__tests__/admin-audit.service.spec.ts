import { AdminAuditService } from '../admin-audit.service';

/** Minimal mock for the audit QueryBuilder chain. */
function buildAuditQb(rawRows: Record<string, unknown>[] = [], count = 0) {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
    getRawMany: jest.fn().mockResolvedValue(rawRows),
  };
}

function makeRawRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    al_id: 'audit-1',
    al_action: 'business.inactivate',
    al_actor_id: 'admin-1',
    al_target_id: 'biz-1',
    al_target_type: 'business',
    al_target_name: 'Test Biz',
    al_business_id: 'biz-1',
    al_metadata: { reason: 'Test reason' },
    al_created_at: new Date('2026-04-28T10:00:00Z'),
    actor_email: 'admin@test.com',
    ...overrides,
  };
}

function buildService() {
  const qb = buildAuditQb([makeRawRow()], 1);
  const auditRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  };
  const service = new AdminAuditService(auditRepo as never);
  return { service, auditRepo, qb };
}

describe('AdminAuditService', () => {
  describe('listAuditLogs — filter pagination', () => {
    it('clamps limit to 100 when oversized page requested', async () => {
      const { service, qb } = buildService();

      await service.listAuditLogs(undefined, { limit: 500, offset: 0 });

      // limit() mock is called with the clamped value
      const limitCall = qb.limit.mock.calls[0][0];
      expect(limitCall).toBe(100);
    });

    it('returns rows and total from query', async () => {
      const { service } = buildService();

      const result = await service.listAuditLogs(
        { actorEmail: 'admin@test.com' },
        { limit: 20, offset: 0 },
      );

      expect(result.total).toBe(1);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe('audit-1');
    });
  });

  describe('listAuditLogs — actorEmail join', () => {
    it('includes actor email from left join in result row', async () => {
      const rawRow = makeRawRow({ actor_email: 'admin@test.com' });
      const qb = buildAuditQb([rawRow], 1);
      const auditRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
      const service = new AdminAuditService(auditRepo as never);

      const result = await service.listAuditLogs();

      expect(result.rows[0].actorEmail).toBe('admin@test.com');
    });

    it('falls back to "system" when actor_email is null (system action)', async () => {
      const rawRow = makeRawRow({ actor_email: null });
      const qb = buildAuditQb([rawRow], 1);
      const auditRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
      const service = new AdminAuditService(auditRepo as never);

      const result = await service.listAuditLogs();

      expect(result.rows[0].actorEmail).toBe('system');
    });
  });
});
