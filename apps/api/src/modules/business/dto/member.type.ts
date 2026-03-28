import { Field, ID, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for BusinessMember */
@ObjectType()
export class MemberType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  role: string;

  @Field(() => String)
  status: string;

  @Field(() => [String])
  assignedWidgetIds: string[];

  @Field(() => Date)
  joinedAt: Date;
}

/** GraphQL return type for BusinessInvitation */
@ObjectType()
export class InvitationType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  role: string;

  @Field(() => String)
  token: string;

  @Field(() => Date)
  expiresAt: Date;

  @Field(() => Date, { nullable: true })
  usedAt?: Date | null;

  @Field(() => Date)
  createdAt: Date;
}
