import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** SRS 4.3.1 — Create tab input */
@InputType()
export class CreateTabDto {
  @Field()
  @IsString()
  @MaxLength(30)
  name: string;

  @Field({ nullable: true, defaultValue: '#D72A44' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @Field({ nullable: true, defaultValue: 'chart-bar' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;
}
