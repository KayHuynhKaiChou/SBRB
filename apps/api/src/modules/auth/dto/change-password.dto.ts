import { Field, InputType } from '@nestjs/graphql';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Authenticated user changing their own password */
@InputType()
export class ChangePasswordDto {
  @Field(() => String)
  @IsString()
  @MaxLength(100)
  currentPassword: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one digit',
  })
  newPassword: string;
}
