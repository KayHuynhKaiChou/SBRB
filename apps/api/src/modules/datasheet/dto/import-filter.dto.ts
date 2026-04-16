import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/** Query params for template download endpoint */
export class ImportFilterDto {
  @IsOptional()
  @IsIn(['month', 'quarter', 'year', 'custom'])
  periodType?: 'month' | 'quarter' | 'year' | 'custom' = 'month';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  count?: number = 3;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['simple', 'department', 'pnl'])
  templateType?: 'simple' | 'department' | 'pnl' = 'simple';
}
