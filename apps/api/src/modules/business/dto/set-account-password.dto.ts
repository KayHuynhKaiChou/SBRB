import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_RULE_REGEX } from '@sbrb/shared-constants';

/**
 * Public input for an invited account setting its first password via emailed link.
 * Requires a valid unexpired single-use token AND matching email.
 */
@InputType()
export class SetAccountPasswordDto {
  @Field(() => String)
  @IsString()
  token: string;

  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_RULE_REGEX, {
    message: 'Password must contain at least one uppercase letter and one digit',
  })
  password: string;
}
