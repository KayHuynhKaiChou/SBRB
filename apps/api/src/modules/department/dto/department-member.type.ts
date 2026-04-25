import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserType } from '../../auth/dto/user.type';

/** GraphQL return type for DepartmentMember junction row */
@ObjectType('DepartmentMember')
export class DepartmentMemberType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  departmentId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => UserType)
  user: UserType;

  @Field(() => Boolean)
  isManager: boolean;

  @Field(() => String, { nullable: true })
  businessRole?: string | null;

  @Field(() => Date)
  joinedAt: Date;
}
