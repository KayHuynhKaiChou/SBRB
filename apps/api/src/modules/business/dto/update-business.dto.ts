import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CreateBusinessDto } from './create-business.dto';

/** SRS 4.2.2 — Update business input. All fields optional; only defined keys get applied. */
@InputType()
export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  snapGrid?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasWidth?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasHeight?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;
}
