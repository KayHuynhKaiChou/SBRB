import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';

/**
 * Input for inserting a new series (row) at an arbitrary position.
 * `index` is the target slot in the rendered row list — 0 = first, N = append.
 * For department template one "row" = N DataSeries (one per department), created atomically.
 */
@InputType()
export class InsertSeriesDto {
  @Field(() => ID)
  @IsUUID()
  datasheetId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  index: number;
}
