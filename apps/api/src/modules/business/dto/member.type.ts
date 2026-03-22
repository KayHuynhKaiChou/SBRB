import { Field, ID, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for BusinessMember */
@ObjectType()
export class MemberType {
  @Field(() => ID)
  id: string;

  @Field()
  businessId: string;

  @Field()
  userId: string;

  @Field()
  role: string;

  @Field()
  status: string;

  @Field(() => [String])
  assignedWidgetIds: string[];

  @Field()
  joinedAt: Date;
}

/** GraphQL return type for BusinessInvitation */
@ObjectType()
export class InvitationType {
  @Field(() => ID)
  id: string;

  @Field()
  businessId: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field()
  token: string;

  @Field()
  expiresAt: Date;

  @Field({ nullable: true })
  usedAt?: Date | null;

  @Field()
  createdAt: Date;
}
