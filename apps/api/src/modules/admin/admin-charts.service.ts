import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EBusinessStatus, COMPANY_SIZE_OPTIONS } from '@sbrb/shared-constants';
import { Business } from '../business/entities/business.entity';
import { User } from '../auth/entities/user.entity';
import {
  AdminDashboardChartsType,
  CompanySizeCountPointType,
  MonthlyGrowthPointType,
  StatusBreakdownPointType,
} from './dto/admin-dashboard-charts.type';
import { buildMonthSkeleton } from './helpers/build-month-skeleton';

/** Number of trailing months (incl. current) in the growth chart. */
const GROWTH_MONTHS = 12;
/** Max industries shown in the "top industries" chart. */
const TOP_INDUSTRIES_LIMIT = 8;
const UNKNOWN_SIZE = 'unknown';

type TMonthCountRow = { month: string; count: number };

/**
 * Computes chart datasets for the admin dashboard (growth trend, status mix,
 * industries, company sizes, user activity). Uses raw SQL for the GROUP BY /
 * date_trunc aggregations the query builder handles poorly. SRS §5.17.
 */
@Injectable()
export class AdminChartsService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getCharts(): Promise<AdminDashboardChartsType> {
    const [monthlyGrowth, statusBreakdown, topIndustries, companySizes, userActivity] =
      await Promise.all([
        this.getMonthlyGrowth(),
        this.getStatusBreakdown(),
        this.getTopIndustries(),
        this.getCompanySizes(),
        this.getUserActivity(),
      ]);

    return { monthlyGrowth, statusBreakdown, topIndustries, companySizes, userActivity };
  }

  /** New businesses + users per month over the trailing GROWTH_MONTHS window. */
  private async getMonthlyGrowth(): Promise<MonthlyGrowthPointType[]> {
    const since = new Date();
    since.setUTCDate(1);
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCMonth(since.getUTCMonth() - (GROWTH_MONTHS - 1));

    const monthSql = (table: string) => `
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
             COUNT(*)::int AS count
      FROM ${table}
      WHERE created_at >= $1
      GROUP BY 1`;

    const [bizRows, userRows] = await Promise.all([
      this.businessRepo.query(monthSql('businesses'), [since]) as Promise<TMonthCountRow[]>,
      this.userRepo.query(monthSql('users'), [since]) as Promise<TMonthCountRow[]>,
    ]);

    const bizByMonth = new Map(bizRows.map((r) => [r.month, Number(r.count)]));
    const userByMonth = new Map(userRows.map((r) => [r.month, Number(r.count)]));

    return buildMonthSkeleton(since, GROWTH_MONTHS).map((month) => ({
      month,
      newBusinesses: bizByMonth.get(month) ?? 0,
      newUsers: userByMonth.get(month) ?? 0,
    }));
  }

  /** Business count per lifecycle status — always returns all statuses (0 when empty). */
  private async getStatusBreakdown(): Promise<StatusBreakdownPointType[]> {
    const rows: Array<{ status: string; count: number }> = await this.businessRepo.query(
      `SELECT status, COUNT(*)::int AS count FROM businesses GROUP BY status`,
    );
    const byStatus = new Map(rows.map((r) => [r.status, Number(r.count)]));
    return Object.values(EBusinessStatus).map((status) => ({
      status,
      count: byStatus.get(status) ?? 0,
    }));
  }

  /** Top industries by business count (blank industry folded into "Other"). */
  private async getTopIndustries() {
    const rows: Array<{ industry: string; count: number }> = await this.businessRepo.query(
      `SELECT COALESCE(NULLIF(TRIM(industry), ''), 'Other') AS industry,
              COUNT(*)::int AS count
       FROM businesses
       GROUP BY 1
       ORDER BY count DESC, industry ASC
       LIMIT $1`,
      [TOP_INDUSTRIES_LIMIT],
    );
    return rows.map((r) => ({ industry: r.industry, count: Number(r.count) }));
  }

  /** Business count per company-size bucket, in canonical order, "unknown" last. */
  private async getCompanySizes(): Promise<CompanySizeCountPointType[]> {
    const rows: Array<{ size: string; count: number }> = await this.businessRepo.query(
      `SELECT COALESCE(NULLIF(TRIM(company_size), ''), '${UNKNOWN_SIZE}') AS size,
              COUNT(*)::int AS count
       FROM businesses
       GROUP BY 1`,
    );
    const bySize = new Map(rows.map((r) => [r.size, Number(r.count)]));
    const order = [...COMPANY_SIZE_OPTIONS.map((o) => o.value), UNKNOWN_SIZE];
    return order
      .map((size) => ({ size, count: bySize.get(size) ?? 0 }))
      .filter((p) => p.count > 0);
  }

  /** Active vs disabled users + 30-day login activity, in a single scan. */
  private async getUserActivity() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [row]: Array<{ active: number; disabled: number; active_last_30d: number }> =
      await this.userRepo.query(
        `SELECT COUNT(*) FILTER (WHERE is_disabled = false)::int AS active,
                COUNT(*) FILTER (WHERE is_disabled = true)::int AS disabled,
                COUNT(*) FILTER (WHERE last_login_at >= $1)::int AS active_last_30d
         FROM users`,
        [thirtyDaysAgo],
      );

    return {
      active: Number(row?.active ?? 0),
      disabled: Number(row?.disabled ?? 0),
      activeLast30d: Number(row?.active_last_30d ?? 0),
    };
  }
}
