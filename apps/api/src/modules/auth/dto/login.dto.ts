import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength } from 'class-validator';

/** SRS 4.1.2 — Login input */
@InputType()
export class LoginDto {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsString()
  @MaxLength(100)
  password: string;
}
