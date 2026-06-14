import { Field, ID, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/** A pending business change-request as seen by admin (with business + owner context). */
@ObjectType()
export class AdminBusinessChangeRequestType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  businessId: string;

  @Field()
  businessName: string;

  @Field()
  requestedByEmail: string;

  @Field()
  status: string;

  /** { field: { old, new } } for the changed fields only. */
  @Field(() => GraphQLJSON)
  changes: Record<string, { old: unknown; new: unknown }>;

  @Field(() => Date)
  createdAt: Date;
}
