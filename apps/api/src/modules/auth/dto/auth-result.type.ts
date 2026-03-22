import { Field, ObjectType } from '@nestjs/graphql';

/** GraphQL return type for login/register/refresh mutations */
@ObjectType()
export class AuthResult {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  message?: string;
}
