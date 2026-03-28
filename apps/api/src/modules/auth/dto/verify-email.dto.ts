import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsUUID } from 'class-validator';

/** Token from verification email link */
@InputType()
export class VerifyEmailDto {
  @Field(() => String)
  @IsString()
  @IsUUID()
  token: string;
}
