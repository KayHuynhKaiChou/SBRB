import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { WidgetPositionInput } from './widget.type';

/** SRS 4.4 — Create widget input */
@InputType('CreateWidgetInput')
export class CreateWidgetDto {
  @Field(() => ID)
  @IsUUID()
  tabId: string;

  @Field(() => ID)
  @IsUUID()
  businessId: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  metricName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @Field(() => WidgetPositionInput, { nullable: true })
  @IsOptional()
  position?: WidgetPositionInput;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isRestricted?: boolean;
}
