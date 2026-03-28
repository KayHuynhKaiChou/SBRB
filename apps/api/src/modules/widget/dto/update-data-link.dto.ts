import { Field, ID, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

/** SRS 4.5 — Link a widget to a DataSheet with optional series/period filters */
@InputType()
export class UpdateDataLinkDto {
  @Field(() => ID)
  @IsUUID()
  dataSheetId: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  selectedSeries: string[];

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedPeriods: string[] | null;
}
