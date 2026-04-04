import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { InputType, Field, ID } from '@nestjs/graphql';

/** DTO for updating a DataSheet (rename or reassign department) */
@InputType()
export class UpdateDatasheetDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}
