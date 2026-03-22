import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for Business */
@ObjectType()
export class BusinessType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  industry: string;

  @Field()
  timezone: string;

  @Field()
  currency: string;

  @Field({ nullable: true })
  logoUrl?: string | null;

  @Field()
  primaryColor: string;

  @Field(() => Int)
  canvasWidth: number;

  @Field(() => Int)
  canvasHeight: number;

  @Field(() => Int)
  snapGrid: number;

  @Field()
  ownerId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
