/**
 * DataSheet types — SRS 4.7 / 4.8
 */

export type TPeriodType = 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'custom';
/** @deprecated Use `TPeriodType`. */
export type PeriodType = TPeriodType;

export type TImportStatus = 'processing' | 'ready' | 'error';
/** @deprecated Use `TImportStatus`. */
export type ImportStatus = TImportStatus;

/** DataSheet list query enums — kept as runtime enums for GraphQL @Field schema compatibility. */
export enum EDataSheetStatusFilter {
  active = 'active',
  inactive = 'inactive',
}

export enum EDataSheetTemplateType {
  simple = 'simple',
  department = 'department',
  pnl = 'pnl',
}

export enum EDataSheetSortField {
  widgetCount = 'widgetCount',
  importedAt = 'importedAt',
  createdAt = 'createdAt',
}

export enum ESortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/** A single row in a DataSheet (one series = one metric over time) */
export interface IDataSeriesDto {
  id: string;
  datasheetId: string;
  name: string; // Row label (e.g., "Doanh thu cửa hàng A")
  /** Values keyed by period label. e.g., { "T1": 1000, "T2": 2000 } */
  values: Record<string, number | null>;
}

export interface IDataSheetDto {
  id: string;
  businessId: string;
  name: string;
  periodType: TPeriodType;
  /** Column headers (period labels) in order */
  periods: string[];
  seriesCount: number;
  importedAt: string;
  importedBy: string; // userId
  sizeBytes: number;
}

export interface IImportBatchDto {
  id: string;
  datasheetId: string;
  businessId: string;
  fileName: string;
  status: TImportStatus;
  errorMessage?: string;
  rowsImported?: number;
  createdAt: string;
  completedAt?: string;
}
