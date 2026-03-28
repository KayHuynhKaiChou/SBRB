import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for Tab — SRS 4.3 */
@ObjectType()
export class TabType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  businessId: string;

  @Field(() => ID)
  createdBy: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  iconColor: string;

  @Field(() => String)
  iconName: string;

  @Field(() => Int)
  order: number;

  @Field(() => Boolean)
  isProtected: boolean;

  @Field(() => Boolean)
  isPinned: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
