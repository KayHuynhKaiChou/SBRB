import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

/** SRS 4.1.5 — Reset password with token */
@InputType()
export class ResetPasswordDto {
  @Field(() => String)
  @IsString()
  @IsUUID()
  token: string;

  @Field(() => String)
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one digit',
  })
  newPassword: string;
}
