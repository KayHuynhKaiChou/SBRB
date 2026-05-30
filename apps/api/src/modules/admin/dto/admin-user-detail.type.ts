import { Field, ID, ObjectType } from '@nestjs/graphql';

/** Business membership entry in user detail. SRS §5.9 AdminUserBusinessMembership */
@ObjectType()
export class AdminUserBusinessMembershipType {
  @Field(() => ID)
  businessId: string;

  @Field()
  businessName: string;

  @Field()
  role: string;

  @Field(() => Date)
  joinedAt: Date;
}

/** Full read-only profile of a user — loaded when admin clicks row. SRS §5.15 */
@ObjectType()
export class AdminUserDetailType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field({ nullable: true })
  phone?: string | null;

  @Field({ nullable: true })
  avatarUrl?: string | null;

  @Field()
  language: string;

  @Field({ nullable: true })
  bio?: string | null;

  @Field()
  emailVerified: boolean;

  @Field()
  isDisabled: boolean;

  @Field({ nullable: true })
  platformRole?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;

  @Field(() => [AdminUserBusinessMembershipType])
  memberships: AdminUserBusinessMembershipType[];
}
