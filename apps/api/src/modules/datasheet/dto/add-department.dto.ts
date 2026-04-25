import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Input for adding a new department (column group) to a department-template datasheet.
 * Creates the Department record (business-scoped) and auto-populates DataSeries rows
 * — one per existing unique seriesName — at the end of the row-order so the new
 * department appears LAST in the rendered table.
 */
@InputType()
export class AddDepartmentToDatasheetDto {
  @Field(() => ID)
  @IsUUID()
  datasheetId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
