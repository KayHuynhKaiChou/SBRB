import { Field, ID, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/** GraphQL return type for an owner-requested business change (shadow diff). */
@ObjectType()
export class BusinessChangeRequestType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  businessId: string;

  @Field(() => ID)
  requestedBy: string;

  @Field(() => String)
  status: string;

  /** { field: { old, new } } for only the changed fields. */
  @Field(() => GraphQLJSON)
  changes: Record<string, { old: unknown; new: unknown }>;

  @Field(() => String, { nullable: true })
  reviewReason?: string | null;

  @Field(() => Date, { nullable: true })
  reviewedAt?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
