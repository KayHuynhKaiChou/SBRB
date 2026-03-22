import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { CreateBusinessDto } from './create-business.dto';

/** SRS 4.2.2 — Update business input */
@InputType()
export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  snap_grid?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvas_width?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvas_height?: number;
}
