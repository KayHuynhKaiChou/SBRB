import { Field, ID, ObjectType } from '@nestjs/graphql';

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

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
