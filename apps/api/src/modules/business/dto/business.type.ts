import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for Business */
@ObjectType()
export class BusinessType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  industry: string;

  @Field(() => String)
  currency: string;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field(() => Int)
  weekStart: number;

  @Field(() => Int)
  canvasWidth: number;

  @Field(() => Int)
  canvasHeight: number;

  @Field(() => Int)
  snapGrid: number;

  @Field(() => String)
  ownerId: string;

  @Field(() => String)
  status: string;

  @Field(() => Date, { nullable: true })
  inactivatedAt?: Date | null;

  @Field(() => String, { nullable: true })
  inactiveReason?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
