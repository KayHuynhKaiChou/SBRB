import { Field, InputType } from '@nestjs/graphql';
import { IsObject } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

/** SRS 4.5 — Update widget chart/display config */
@InputType()
export class UpdateWidgetConfigDto {
  @Field(() => GraphQLJSON)
  @IsObject()
  config: Record<string, unknown>;
}
