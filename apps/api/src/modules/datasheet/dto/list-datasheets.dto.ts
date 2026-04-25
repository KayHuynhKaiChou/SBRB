import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';

export enum DataSheetStatusFilter {
  active = 'active',
  inactive = 'inactive',
}
registerEnumType(DataSheetStatusFilter, { name: 'DataSheetStatusFilter' });

export enum DataSheetTemplateType {
  simple = 'simple',
  department = 'department',
  pnl = 'pnl',
}
registerEnumType(DataSheetTemplateType, { name: 'DataSheetTemplateType' });

export enum DataSheetSortField {
  widgetCount = 'widgetCount',
  importedAt = 'importedAt',
  createdAt = 'createdAt',
}
registerEnumType(DataSheetSortField, { name: 'DataSheetSortField' });

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
registerEnumType(SortOrder, { name: 'SortOrder' });

@InputType()
export class ListDataSheetsInput {
  @Field(() => [DataSheetStatusFilter], { nullable: true })
  @IsOptional()
  @IsEnum(DataSheetStatusFilter, { each: true })
  status?: DataSheetStatusFilter[];

  @Field(() => [DataSheetTemplateType], { nullable: true })
  @IsOptional()
  @IsEnum(DataSheetTemplateType, { each: true })
  templateType?: DataSheetTemplateType[];

  @Field(() => DataSheetSortField, { nullable: true })
  @IsOptional()
  @IsEnum(DataSheetSortField)
  sortBy?: DataSheetSortField;

  @Field(() => SortOrder, { nullable: true })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
