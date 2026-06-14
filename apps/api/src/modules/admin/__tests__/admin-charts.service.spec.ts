import { AdminChartsService } from '../admin-charts.service';
import { EBusinessStatus } from '@sbrb/shared-constants';
import { buildMonthSkeleton } from '../helpers/build-month-skeleton';

/**
 * Routes a raw-SQL string to a canned result set so we can exercise the
 * aggregation/merge logic without a real database.
 */
function makeBusinessQuery() {
  return jest.fn(async (sql: string) => {
    if (sql.includes("date_trunc('month'")) {
      // Only the current month has businesses — proves zero-fill for other months.
      const now = new Date();
      const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      return [{ month, count: 3 }];
    }
    if (sql.includes('GROUP BY status')) {
      return [
        { status: EBusinessStatus.APPROVED, count: 5 },
        { status: EBusinessStatus.PENDING, count: 2 },
      ];
    }
    if (sql.includes('industry')) {
      return [
        { industry: 'Retail', count: 4 },
        { industry: 'F&B', count: 2 },
      ];
    }
    if (sql.includes('company_size')) {
      return [
        { size: '10-49', count: 3 },
        { size: '1-9', count: 1 },
      ];
    }
    return [];
  });
}

function makeUserQuery() {
  return jest.fn(async (sql: string) => {
    if (sql.includes("date_trunc('month'")) {
      const now = new Date();
      const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      return [{ month, count: 7 }];
    }
    if (sql.includes('FILTER')) {
      return [{ active: 40, disabled: 1, active_last_30d: 6 }];
    }
    return [];
  });
}

function buildService() {
  const businessRepo = { query: makeBusinessQuery() };
  const userRepo = { query: makeUserQuery() };
  const service = new AdminChartsService(businessRepo as never, userRepo as never);
  return { service, businessRepo, userRepo };
}

describe('AdminChartsService', () => {
  it('returns 12 month buckets with zero-fill for empty months', async () => {
    const { service } = buildService();
    const { monthlyGrowth } = await service.getCharts();

    expect(monthlyGrowth).toHaveLength(12);
    const current = monthlyGrowth[monthlyGrowth.length - 1];
    expect(current.newBusinesses).toBe(3);
    expect(current.newUsers).toBe(7);
    // earliest month had no signups → zero-filled
    expect(monthlyGrowth[0].newBusinesses).toBe(0);
    expect(monthlyGrowth[0].newUsers).toBe(0);
  });

  it('returns all lifecycle statuses (zero-filled when absent)', async () => {
    const { service } = buildService();
    const { statusBreakdown } = await service.getCharts();

    expect(statusBreakdown).toHaveLength(Object.values(EBusinessStatus).length);
    const map = Object.fromEntries(statusBreakdown.map((s) => [s.status, s.count]));
    expect(map[EBusinessStatus.APPROVED]).toBe(5);
    expect(map[EBusinessStatus.PENDING]).toBe(2);
    expect(map[EBusinessStatus.REJECTED]).toBe(0);
  });

  it('orders company sizes canonically and drops empty buckets', async () => {
    const { service } = buildService();
    const { companySizes } = await service.getCharts();

    // canonical order is 1-9 before 10-49 even though query returned 10-49 first
    expect(companySizes.map((c) => c.size)).toEqual(['1-9', '10-49']);
  });

  it('maps user-activity snake_case fields to camelCase', async () => {
    const { service } = buildService();
    const { userActivity } = await service.getCharts();

    expect(userActivity).toEqual({ active: 40, disabled: 1, activeLast30d: 6 });
  });

  it('passes through top industries as-is', async () => {
    const { service } = buildService();
    const { topIndustries } = await service.getCharts();

    expect(topIndustries).toEqual([
      { industry: 'Retail', count: 4 },
      { industry: 'F&B', count: 2 },
    ]);
  });
});

describe('buildMonthSkeleton', () => {
  it('builds N consecutive YYYY-MM keys from the start date', () => {
    const start = new Date(Date.UTC(2025, 10, 1)); // Nov 2025
    expect(buildMonthSkeleton(start, 3)).toEqual(['2025-11', '2025-12', '2026-01']);
  });
});
