import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

/** Nested position object — SRS 4.4.3 */
@ObjectType('WidgetPosition')
export class WidgetPositionType {
  @Field(() => Int)
  x: number;

  @Field(() => Int)
  y: number;

  @Field(() => Int)
  w: number;

  @Field(() => Int)
  h: number;
}

/** Position input for create/update */
@InputType('WidgetPositionInput')
export class WidgetPositionInput {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  x?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  y?: number;

  @Field(() => Int, { nullable: true, defaultValue: 1000 })
  @IsOptional()
  @IsNumber()
  w?: number;

  @Field(() => Int, { nullable: true, defaultValue: 500 })
  @IsOptional()
  @IsNumber()
  h?: number;
}

/** Chart config nested type — SRS 4.5 */
@ObjectType('ChartConfig')
export class ChartConfigType {
  @Field(() => String, { nullable: true })
  type: string | null;

  @Field(() => Int, { nullable: true })
  colorIndex: number | null;

  @Field(() => Boolean, { nullable: true })
  showLabels: boolean | null;

  @Field(() => Boolean, { nullable: true })
  yAxisFromZero: boolean | null;

  @Field(() => Boolean, { nullable: true })
  showLegend: boolean | null;
}

/** GraphQL return type for Widget — SRS 4.4 */
@ObjectType('Widget')
export class WidgetType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  tabId: string;

  @Field(() => ID)
  businessId: string;

  @Field(() => ID)
  createdBy: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  metricName: string | null;

  @Field(() => String, { nullable: true })
  unit: string | null;

  @Field(() => WidgetPositionType)
  position: WidgetPositionType;

  @Field(() => ChartConfigType, { nullable: true })
  chartConfig: ChartConfigType | null;

  @Field(() => GraphQLJSON, { nullable: true })
  config: Record<string, unknown> | null;

  @Field(() => ID, { nullable: true })
  dataSheetId: string | null;

  @Field(() => [String])
  selectedSeries: string[];

  @Field(() => [String], { nullable: true })
  selectedPeriods: string[] | null;

  @Field(() => Boolean)
  isRestricted: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
