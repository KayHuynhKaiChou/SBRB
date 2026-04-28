import { Field, InputType } from '@nestjs/graphql';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PHONE_REGEX } from '@sbrb/shared-constants';

/** Update own profile fields */
@InputType()
export class UpdateProfileDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsIn(['vi', 'en'])
  language?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(PHONE_REGEX, { message: 'Invalid phone format' })
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
