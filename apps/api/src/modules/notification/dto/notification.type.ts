import { Field, ID, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/** GraphQL return type for a single notification (bell item). */
@ObjectType()
export class NotificationType {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  businessId?: string | null;

  @Field(() => String)
  type: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  message: string;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, unknown> | null;

  @Field(() => Date)
  createdAt: Date;
}
