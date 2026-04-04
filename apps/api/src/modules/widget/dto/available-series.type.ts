import { Field, ID, ObjectType } from '@nestjs/graphql';

/** A single series entry returned by availableSeries query */
@ObjectType()
export class AvailableSeriesType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;
}
