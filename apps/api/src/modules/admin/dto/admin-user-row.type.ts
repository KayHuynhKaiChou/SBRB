import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** Single row in the admin user list. SRS §5.9 AdminUserRow */
@ObjectType()
export class AdminUserRowType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field({ nullable: true })
  platformRole?: string | null;

  @Field()
  isDisabled: boolean;

  @Field(() => Int)
  businessCount: number;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;

  @Field(() => Date)
  createdAt: Date;
}
