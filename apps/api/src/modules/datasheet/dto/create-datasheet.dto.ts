import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/** DTO for creating a DataSheet entry */
export class CreateDatasheetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  businessId: string;
}
