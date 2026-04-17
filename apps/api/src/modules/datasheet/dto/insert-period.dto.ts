import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';

/**
 * Input type for inserting a new period column at an arbitrary position.
 * `index` is the target slot in `periodHeaders` — 0 = first, N = append (== addPeriod).
 */
@InputType()
export class InsertPeriodDto {
  @Field(() => ID)
  @IsUUID()
  datasheetId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  periodName: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  index: number;
}
