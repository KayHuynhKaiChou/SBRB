import { Field, ID, ObjectType } from '@nestjs/graphql';

/** Single member row returned by adminBusinessMembers query. */
@ObjectType()
export class AdminBusinessMemberType {
  @Field(() => ID)
  userId: string;

  @Field()
  fullName: string;

  @Field()
  email: string;

  @Field()
  role: string;
}
