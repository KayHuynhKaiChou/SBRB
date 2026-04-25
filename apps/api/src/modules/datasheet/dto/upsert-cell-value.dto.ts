import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Upsert a cell value in a department-template datasheet.
 * Targets (dataSheetId, departmentId, seriesName, period):
 *   - If a matching DataSeries row exists → atomic JSONB update of `values[period]`.
 *   - Otherwise → create a new DataSeries inheriting rowIndex from any existing row
 *     sharing the same `seriesName` (so rows stay aligned across departments).
 * `value = null` → remove the key / skip create.
 */
@InputType()
export class UpsertCellValueDto {
  @Field(() => ID)
  @IsUUID()
  datasheetId: string;

  @Field(() => ID)
  @IsUUID()
  departmentId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  seriesName: string;

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
