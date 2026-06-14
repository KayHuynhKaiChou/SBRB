import type { IWidgetPosition } from './canvas.types';

/** Supported chart types — SRS 4.6.2 */
export type ChartType = 'bar' | 'line' | 'pie';

/** Per-series chart type and Y-axis override for combo/mixed charts */
export interface ISeriesConfig {
  type: 'bar' | 'line';
  yAxis: 'left' | 'right';
}

/** Chart display configuration */
export interface IChartConfig {
  type: ChartType;
  colorIndex: number;     // Index into CHART_COLORS (0–19)
  showLabels: boolean;    // Show value labels on chart
  yAxisFromZero: boolean; // Y axis starts from 0 or auto
  showLegend: boolean;
  xAxisName?: string;
  yAxisName?: string;
  numberFormat?: 'auto' | 'full' | 'short'; // Number display format for labels/axis
  stacked?: boolean;     // Stack bars/areas
  seriesColors?: Record<string, string>; // Maps seriesId → hex color override
  seriesConfig?: Record<string, ISeriesConfig>; // Maps seriesName → per-series type/axis overrides
  unitRight?: string;      // Right Y-axis unit (e.g. "%" or "units"), independent from widget.unit
  yAxisNameRight?: string; // Right Y-axis label (dual axis mode)
  xAxisGroup?: 'time' | 'criteria' | 'department'; // Pivot X-axis mapping
}

/** Widget data linking */
export interface IWidgetDataLink {
  datasheetId: string;
  selectedSeriesIds: string[];    // DataSeries IDs to display
  selectedPeriods: string[] | null; // null = show all periods
}

/** Full widget DTO (shared FE/BE) */
export interface IWidgetDto {
  id: string;
  tabId: string;
  businessId: string;
  name: string;
  metricName: string;
  unit: string;
  position: IWidgetPosition;
  chartConfig: IChartConfig;
  dataLink: IWidgetDataLink | null;
  isRestricted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Widget position update request (SRS 8.3) */
export interface IWidgetPositionUpdateDto {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Server response for collision (SRS 8.3) */
export interface ICollisionConflictDto {
  error: 'COLLISION';
  conflictingWidgets: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

/** Input shape matching GraphQL UpdateDataLinkDto */
export interface IUpdateDataLinkInput {
  dataSheetId: string;
  selectedSeries: string[];
  selectedPeriods: string[] | null;
}

/** Result shape returned from add-widget modal */
export interface IAddWidgetResult {
  name: string;
  unit: string;
  dataSheetId: string | null;
  selectedSeries: string[];
}

/** Chart.js-shaped dataset for widget chart rendering. */
export interface IChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  departmentName?: string | null;
}

/** Period-over-period trend summary for a widget chart. */
export interface IChartTrend {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  vsLabel: string;
}

/** Resolved chart data payload (labels + datasets + trend). */
export interface IChartDataResult {
  labels: string[];
  datasets: IChartDataset[];
  trend: IChartTrend | null;
  departmentId?: string | null;
  departmentName?: string | null;
  allPeriods?: string[];
}

/** A series selectable as a widget data source. */
export interface IAvailableSeries {
  id: string;
  name: string;
  templateType?: string;
  departmentName?: string | null;
}
