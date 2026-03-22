import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/** GraphQL return type for Widget — SRS 4.4 */
@ObjectType()
export class WidgetType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  tabId: string;

  @Field(() => ID)
  createdBy: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  metricName: string | null;

  @Field({ nullable: true })
  unit: string | null;

  @Field(() => Int)
  x: number;

  @Field(() => Int)
  y: number;

  @Field(() => Int)
  w: number;

  @Field(() => Int)
  h: number;

  @Field(() => GraphQLJSON)
  config: Record<string, unknown>;

  @Field(() => ID, { nullable: true })
  dataSheetId: string | null;

  @Field(() => [String])
  selectedSeries: string[];

  @Field(() => [String], { nullable: true })
  selectedPeriods: string[] | null;

  @Field()
  isRestricted: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
