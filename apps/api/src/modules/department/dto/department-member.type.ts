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

  /** Name of the department this member actually belongs to. Populated by the subtree-members query. */
  @Field(() => String, { nullable: true })
  departmentName?: string | null;

  /** True when this member belongs directly to the queried department (not inherited from a sub-department). */
  @Field(() => Boolean, { nullable: true })
  isDirect?: boolean;

  @Field(() => Date)
  joinedAt: Date;
}
