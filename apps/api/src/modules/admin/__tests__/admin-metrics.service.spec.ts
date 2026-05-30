import { AdminMetricsService } from '../admin-metrics.service';
import { EBusinessStatus } from '@sbrb/shared-constants';

/** Minimal QueryBuilder mock for count queries. */
function buildCountQb(count = 0) {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
  };
}

function buildService(counts: number[] = [0, 0, 0, 0, 0, 0]) {
  let callIndex = 0;
  const businessRepo = {
    createQueryBuilder: jest.fn().mockImplementation(() => buildCountQb(counts[callIndex++] ?? 0)),
  };
  const userRepo = {
    createQueryBuilder: jest.fn().mockImplementation(() => buildCountQb(counts[callIndex++] ?? 0)),
  };
  const service = new AdminMetricsService(
    businessRepo as never,
    userRepo as never,
  );
  return { service, businessRepo, userRepo };
}

describe('AdminMetricsService', () => {
  describe('getMetrics — parallel counts', () => {
    it('returns all six counts aggregated in parallel', async () => {
      /**
       * Promise.all is used internally — here we verify the output shape
       * and that createQueryBuilder is called 6 times (3 biz + 1 user + 1 newBiz + 1 newUser).
       */
      const { service, businessRepo, userRepo } = buildService([10, 4, 6, 20, 2, 5]);

      const result = await service.getMetrics();

      // businessRepo called 4x: total, active, inactive, newBiz30d
      expect(businessRepo.createQueryBuilder).toHaveBeenCalledTimes(4);
      // userRepo called 2x: totalUsers, newUsers30d
      expect(userRepo.createQueryBuilder).toHaveBeenCalledTimes(2);

      expect(result).toMatchObject({
        totalBusinesses: 10,
        activeBusinesses: 4,
        inactiveBusinesses: 6,
        totalUsers: 20,
        newBusinessesLast30d: 2,
        newUsersLast30d: 5,
      });
    });
  });

  describe('getMetrics — enum filter', () => {
    it('passes correct status enum value for active/inactive filters', async () => {
      const businessQb = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      const userQb = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      let bizCallCount = 0;
      const businessRepo = {
        createQueryBuilder: jest.fn().mockImplementation(() => {
          bizCallCount++;
          return businessQb;
        }),
      };
      const userRepo = {
        createQueryBuilder: jest.fn().mockImplementation(() => userQb),
      };

      const service = new AdminMetricsService(
        businessRepo as never,
        userRepo as never,
      );

      await service.getMetrics();

      // Verify that 'where' was called with active and inactive enum values
      const whereCalls = businessQb.where.mock.calls.map((c: unknown[]) => c[1]);
      const statusValues = whereCalls
        .filter((args): args is Record<string, string> => args != null)
        .map((args) => args['status']);

      expect(statusValues).toContain(EBusinessStatus.ACTIVE);
      expect(statusValues).toContain(EBusinessStatus.INACTIVE);
    });
  });
});
