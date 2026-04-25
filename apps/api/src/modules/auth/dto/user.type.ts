import { Field, ID, ObjectType } from '@nestjs/graphql';

/** GraphQL UserType — mirrors User entity fields exposed via API */
@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  fullName: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => Boolean)
  emailVerified: boolean;

  @Field(() => String)
  language: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;
}
