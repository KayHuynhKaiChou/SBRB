import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** Single row in the admin business list — aggregates owner email + member count. SRS §5.9 */
@ObjectType()
export class AdminBusinessRowType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  industry: string;

  @Field()
  ownerEmail: string;

  @Field(() => Int)
  memberCount: number;

  @Field()
  status: string;

  @Field(() => Date, { nullable: true })
  inactivatedAt?: Date | null;

  @Field(() => String, { nullable: true })
  inactiveReason?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
