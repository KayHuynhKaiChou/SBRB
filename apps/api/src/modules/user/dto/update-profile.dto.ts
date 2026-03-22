import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Update own profile fields */
@InputType()
export class UpdateProfileDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['vi', 'en'])
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
