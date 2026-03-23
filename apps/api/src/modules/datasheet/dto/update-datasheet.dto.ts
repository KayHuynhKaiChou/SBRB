import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

/** DTO for renaming a DataSheet */
@InputType()
export class UpdateDatasheetDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
