/** Admin dashboard analytics types — mirrors API AdminDashboardChartsType. SRS §5.17 */

/** Platform-wide aggregate KPI metrics. */
export interface IAdminMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  inactiveBusinesses: number;
  totalUsers: number;
  newBusinessesLast30d: number;
  newUsersLast30d: number;
}

/** One month bucket of new signups (businesses + users). */
export interface IMonthlyGrowthPoint {
  /** Month key, format YYYY-MM (e.g. "2026-06"). */
  month: string;
  newBusinesses: number;
  newUsers: number;
}

/** Count of businesses in a given lifecycle status. */
export interface IStatusBreakdownPoint {
  status: string;
  count: number;
}

/** Count of businesses in a given industry. */
export interface IIndustryCountPoint {
  industry: string;
  count: number;
}

/** Count of businesses in a given company-size bucket. */
export interface ICompanySizeCountPoint {
  /** Bucket value (1-9 / 10-49 / 50-199 / 200+ / unknown). */
  size: string;
  count: number;
}

/** Platform user-activity snapshot. */
export interface IUserActivity {
  active: number;
  disabled: number;
  /** Users who logged in within the last 30 days. */
  activeLast30d: number;
}

/** Aggregated chart datasets for the admin dashboard. */
export interface IAdminDashboardCharts {
  monthlyGrowth: IMonthlyGrowthPoint[];
  statusBreakdown: IStatusBreakdownPoint[];
  topIndustries: IIndustryCountPoint[];
  companySizes: ICompanySizeCountPoint[];
  userActivity: IUserActivity;
}

/** Admin audit-log row. SRS §5.16 */
export interface IAdminAuditRow {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  targetId: string | null;
  targetType: string | null;
  targetName: string | null;
  businessId: string | null;
  meta: string;
  createdAt: string;
}

/** Admin businesses-table row. SRS §5.9 */
export interface IAdminBusinessRow {
  id: string;
  name: string;
  industry: string;
  ownerEmail: string;
  memberCount: number;
  status: string;
  rejectionReason?: string | null;
  inactivatedAt?: string | null;
  inactiveReason?: string | null;
  createdAt: string;
}

/** Admin users-table row. SRS §5.12 */
export interface IAdminUserRow {
  id: string;
  email: string;
  fullName: string;
  platformRole?: string | null;
  isDisabled: boolean;
  businessCount: number;
  businessNames?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

/** Full business detail for the admin review drawer. SRS §5.10 */
export interface IAdminBusinessDetail {
  id: string;
  name: string;
  industry: string;
  currency: string;
  status: string;
  rejectionReason?: string | null;
  memberCount: number;
  legalName?: string | null;
  taxCode?: string | null;
  businessType?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  licenseSignedUrl?: string | null;
  foundedYear?: number | null;
  companySize?: number | null;
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

/** Pending business change-request for admin review. SRS §5.10 */
export interface IAdminChangeRequest {
  id: string;
  businessId: string;
  businessName: string;
  requestedByEmail: string;
  status: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  createdAt: string;
}
