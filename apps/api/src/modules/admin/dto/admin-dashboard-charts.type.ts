import { Field, Int, ObjectType } from '@nestjs/graphql';

/** One month bucket of new signups (businesses + users). */
@ObjectType()
export class MonthlyGrowthPointType {
  /** Month key, format YYYY-MM (e.g. "2026-06"). */
  @Field()
  month: string;

  @Field(() => Int)
  newBusinesses: number;

  @Field(() => Int)
  newUsers: number;
}

/** Count of businesses in a given lifecycle status. */
@ObjectType()
export class StatusBreakdownPointType {
  /** EBusinessStatus value (pending/approved/rejected/resubmitted/inactive). */
  @Field()
  status: string;

  @Field(() => Int)
  count: number;
}

/** Count of businesses in a given industry. */
@ObjectType()
export class IndustryCountPointType {
  @Field()
  industry: string;

  @Field(() => Int)
  count: number;
}

/** Count of businesses in a given company-size bucket. */
@ObjectType()
export class CompanySizeCountPointType {
  /** Bucket value (1-9 / 10-49 / 50-199 / 200+ / unknown). */
  @Field()
  size: string;

  @Field(() => Int)
  count: number;
}

/** Platform user-activity snapshot. */
@ObjectType()
export class UserActivityType {
  @Field(() => Int)
  active: number;

  @Field(() => Int)
  disabled: number;

  /** Users who logged in within the last 30 days. */
  @Field(() => Int)
  activeLast30d: number;
}

/** Aggregated chart datasets for the admin dashboard. SRS §5.17 */
@ObjectType()
export class AdminDashboardChartsType {
  @Field(() => [MonthlyGrowthPointType])
  monthlyGrowth: MonthlyGrowthPointType[];

  @Field(() => [StatusBreakdownPointType])
  statusBreakdown: StatusBreakdownPointType[];

  @Field(() => [IndustryCountPointType])
  topIndustries: IndustryCountPointType[];

  @Field(() => [CompanySizeCountPointType])
  companySizes: CompanySizeCountPointType[];

  @Field(() => UserActivityType)
  userActivity: UserActivityType;
}
