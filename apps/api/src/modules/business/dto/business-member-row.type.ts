import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** One personnel row for the /members table (User joined with BusinessMember). */
@ObjectType()
export class BusinessMemberRowType {
  @Field(() => ID)
  userId: string;

  @Field(() => String)
  fullName: string;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field(() => String)
  role: string;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  joinedAt: Date;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;
}

/** Paginated result for the personnel table. */
@ObjectType()
export class BusinessMembersResultType {
  @Field(() => [BusinessMemberRowType])
  rows: BusinessMemberRowType[];

  @Field(() => Int)
  total: number;
}
