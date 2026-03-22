/**
 * DataSheet types — SRS 4.7 / 4.8
 */

export type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'custom';

export type ImportStatus = 'processing' | 'ready' | 'error';

/** A single row in a DataSheet (one series = one metric over time) */
export interface DataSeriesDto {
  id: string;
  datasheetId: string;
  name: string; // Row label (e.g., "Doanh thu cửa hàng A")
  /** Values keyed by period label. e.g., { "T1": 1000, "T2": 2000 } */
  values: Record<string, number | null>;
}

export interface DataSheetDto {
  id: string;
  businessId: string;
  name: string;
  periodType: PeriodType;
  /** Column headers (period labels) in order */
  periods: string[];
  seriesCount: number;
  importedAt: string;
  importedBy: string; // userId
  sizeBytes: number;
}

export interface ImportBatchDto {
  id: string;
  datasheetId: string;
  businessId: string;
  fileName: string;
  status: ImportStatus;
  errorMessage?: string;
  rowsImported?: number;
  createdAt: string;
  completedAt?: string;
}
