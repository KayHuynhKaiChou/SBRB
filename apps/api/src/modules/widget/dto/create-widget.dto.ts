import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

/** SRS 4.4 — Create widget input */
@InputType()
export class CreateWidgetDto {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  metric_name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  config?: Record<string, unknown>;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  is_restricted?: boolean;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  data_sheet_id?: string;
}
