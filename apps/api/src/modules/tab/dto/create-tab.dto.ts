import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** SRS 4.3.1 — Create tab input */
@InputType('CreateTabInput')
export class CreateTabDto {
  @Field(() => ID)
  @IsUUID()
  businessId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(30)
  name: string;

  @Field(() => String, { nullable: true, defaultValue: '#D72A44' })
  @IsOptional()
  @IsHexColor()
  iconColor?: string;

  @Field(() => String, { nullable: true, defaultValue: 'chart-bar' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconName?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;
}
