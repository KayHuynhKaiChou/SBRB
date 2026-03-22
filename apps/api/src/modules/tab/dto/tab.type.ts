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

  @Field()
  name: string;

  @Field()
  color: string;

  @Field()
  icon: string;

  @Field(() => Int)
  position: number;

  @Field()
  isProtected: boolean;

  @Field()
  isPinned: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
