import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** SRS 4.3.2 — Update tab input (all fields optional) */
@InputType('UpdateTabInput')
export class UpdateTabDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsHexColor()
  iconColor?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconName?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;
}
