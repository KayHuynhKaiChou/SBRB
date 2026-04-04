import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, IsNumber, IsOptional, MaxLength } from 'class-validator';

/** Input type for updating a single cell value in a DataSeries — SRS 4.8 */
@InputType()
export class UpdateSeriesValueDto {
  @Field(() => ID)
  @IsUUID()
  seriesId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  period: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  value: number | null;
}
