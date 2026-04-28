import { Field, InputType } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/** SRS 4.2.1 — Create business input */
@InputType()
export class CreateBusinessDto {
  @Field(() => String)
  @IsString()
  @MinLength(2)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  industry?: string;

  @Field(() => String, { nullable: true, defaultValue: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;
}
