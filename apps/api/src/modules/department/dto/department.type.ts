import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { DepartmentMemberType } from './department-member.type';

/** GraphQL return type for Department */
@ObjectType()
export class DepartmentType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  businessId: string;

  @Field(() => String, { nullable: true })
  parentId?: string | null;

  @Field(() => String)
  name: string;

  @Field(() => Boolean)
  isRoot: boolean;

  @Field(() => Float, { nullable: true })
  positionX?: number | null;

  @Field(() => Float, { nullable: true })
  positionY?: number | null;

  @Field(() => Int, { nullable: true })
  memberCount?: number;

  @Field(() => DepartmentMemberType, { nullable: true })
  manager?: DepartmentMemberType | null;

  @Field(() => [DepartmentType], { nullable: true })
  children?: DepartmentType[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class DepartmentPositionInput {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  positionX: number;

  @Field(() => Float)
  positionY: number;
}
