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

/** String-literal unions derived from the datasheet list enums. */
export type TTemplateType = `${EDataSheetTemplateType}`;
export type TDataSheetStatus = `${EDataSheetStatusFilter}`;
export type TDataSheetSortField = `${EDataSheetSortField}`;
export type TSortOrder = `${ESortOrder}`;

/** @deprecated Use `TTemplateType`. */
export type TemplateType = TTemplateType;
/** @deprecated Use `TDataSheetStatus`. */
export type DataSheetStatus = TDataSheetStatus;
/** @deprecated Use `TDataSheetSortField`. */
export type DataSheetSortField = TDataSheetSortField;
/** @deprecated Use `TSortOrder`. */
export type SortOrder = TSortOrder;

/** Uploader reference shown in the datasheet list. */
export interface IUploaderInfo {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

/** Filter input for the datasheet list query. */
export interface IListDataSheetsFilter {
  status?: TDataSheetStatus[];
  templateType?: TTemplateType[];
  sortBy?: TDataSheetSortField;
  sortOrder?: TSortOrder;
}

/** DataSheet list-row DTO. */
export interface IDataSheetDto {
  id: string;
  name: string;
  status: string;
  templateType: TemplateType;
  periodHeaders: string[];
  widgetCount: number;
  originalFilename: string | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
  uploader: IUploaderInfo | null;
}

/** DataSeries list-row DTO (one metric row, no values). */
export interface IDataSeriesDto {
  id: string;
  seriesName: string;
  dataSheetId: string;
  rowIndex: number;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
}

/** DataSeries grid row (with period values) for the detail editor. */
export interface IDataSeriesRow {
  id: string;
  seriesName: string;
  rowIndex: number;
  values: Record<string, number | null>;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
}

/** DataSheet detail metadata for the editor view. */
export interface IDataSheetDetail {
  id: string;
  name: string;
  periodHeaders: string[];
  status: string;
  periodType: string;
  templateType?: string;
}

/** Live import progress payload (subscription). */
export interface IImportProgress {
  datasheetId: string;
  percent: number;
  status: string;
  errorMessage?: string;
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
