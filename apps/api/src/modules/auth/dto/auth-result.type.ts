import { Field, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for login/register/refresh mutations */
@ObjectType()
export class AuthResult {
  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => String, { nullable: true })
  message?: string;
}
