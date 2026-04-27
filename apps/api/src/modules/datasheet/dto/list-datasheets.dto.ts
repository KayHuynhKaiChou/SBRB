import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import {
  EDataSheetSortField,
  EDataSheetStatusFilter,
  EDataSheetTemplateType,
  ESortOrder,
} from '@sbrb/shared-types';

// Re-export for back-compat with existing imports.
export {
  EDataSheetSortField,
  EDataSheetStatusFilter,
  EDataSheetTemplateType,
  ESortOrder,
};

// Register with GraphQL — keep external schema names unchanged so FE queries don't break.
registerEnumType(EDataSheetStatusFilter, { name: 'DataSheetStatusFilter' });
registerEnumType(EDataSheetTemplateType, { name: 'DataSheetTemplateType' });
registerEnumType(EDataSheetSortField, { name: 'DataSheetSortField' });
registerEnumType(ESortOrder, { name: 'SortOrder' });

@InputType()
export class ListDataSheetsInput {
  @Field(() => [EDataSheetStatusFilter], { nullable: true })
  @IsOptional()
  @IsEnum(EDataSheetStatusFilter, { each: true })
  status?: EDataSheetStatusFilter[];

  @Field(() => [EDataSheetTemplateType], { nullable: true })
  @IsOptional()
  @IsEnum(EDataSheetTemplateType, { each: true })
  templateType?: EDataSheetTemplateType[];

  @Field(() => EDataSheetSortField, { nullable: true })
  @IsOptional()
  @IsEnum(EDataSheetSortField)
  sortBy?: EDataSheetSortField;

  @Field(() => ESortOrder, { nullable: true })
  @IsOptional()
  @IsEnum(ESortOrder)
  sortOrder?: ESortOrder;
}
