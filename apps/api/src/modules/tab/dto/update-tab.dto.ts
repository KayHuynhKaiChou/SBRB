import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** SRS 4.3.2 — Update tab input (all fields optional) */
@InputType()
export class UpdateTabDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;
}
