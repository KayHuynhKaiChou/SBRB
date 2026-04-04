import { Field, Float, ObjectType } from '@nestjs/graphql';

/** Single dataset for a chart series */
@ObjectType()
export class ChartDataset {
  @Field(() => String)
  label: string;

  @Field(() => [Float])
  data: number[];

  @Field(() => String, { nullable: true })
  backgroundColor: string | null;

  @Field(() => String, { nullable: true })
  borderColor: string | null;
}

/** Trend badge comparing last two periods */
@ObjectType()
export class TrendBadge {
  @Field(() => Float)
  value: number;

  @Field(() => String)
  direction: string;

  @Field(() => String)
  vsLabel: string;
}

/** Full chart data payload returned by widgetChartData query — SRS 4.5 */
@ObjectType()
export class ChartData {
  @Field(() => [String])
  labels: string[];

  @Field(() => [ChartDataset])
  datasets: ChartDataset[];

  @Field(() => TrendBadge, { nullable: true })
  trend: TrendBadge | null;

  @Field(() => String, { nullable: true })
  departmentId: string | null;

  @Field(() => String, { nullable: true })
  departmentName: string | null;
}
