import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DepartmentType } from '../../department/dto/department.type';

/** GraphQL UserType — mirrors User entity fields exposed via API */
@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  fullName: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => Boolean)
  emailVerified: boolean;

  @Field(() => String)
  language: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => DepartmentType, { nullable: true })
  department?: DepartmentType | null;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;
}
