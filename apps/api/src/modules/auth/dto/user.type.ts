import { Field, ID, ObjectType } from '@nestjs/graphql';

/** GraphQL UserType — mirrors User entity fields exposed via API */
@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field({ nullable: true })
  avatarUrl?: string | null;

  @Field()
  emailVerified: boolean;

  @Field()
  language: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  lastLoginAt?: Date | null;
}
