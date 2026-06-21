import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { EBusinessRole } from '@sbrb/shared-constants';

/**
 * Input for owner/manager creating a staff/manager account directly.
 * owner → manager|staff; manager → staff only (enforced in service).
 */
@InputType()
export class CreateStaffAccountDto {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName: string;

  @Field(() => String)
  @IsEnum([EBusinessRole.MANAGER, EBusinessRole.STAFF])
  role: EBusinessRole.MANAGER | EBusinessRole.STAFF;
}
