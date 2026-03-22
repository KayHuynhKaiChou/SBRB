import { Field, InputType } from '@nestjs/graphql';
import {
  IsHexColor,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/** SRS 4.2.1 — Create business input */
@InputType()
export class CreateBusinessDto {
  @Field()
  @IsString()
  @MinLength(2)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  industry?: string;

  @Field({ nullable: true, defaultValue: 'Asia/Ho_Chi_Minh' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true, defaultValue: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  primary_color?: string;
}
