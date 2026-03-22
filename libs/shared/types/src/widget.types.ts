import type { WidgetPosition } from './canvas.types';

/** Supported chart types — SRS 4.6.2 */
export type ChartType = 'bar' | 'line' | 'area' | 'doughnut';

/** Chart display configuration */
export interface ChartConfig {
  type: ChartType;
  colorIndex: number;     // Index into CHART_COLORS (0–19)
  showLabels: boolean;    // Show value labels on chart
  yAxisFromZero: boolean; // Y axis starts from 0 or auto
  showLegend: boolean;
  xAxisName?: string;
  yAxisName?: string;
}

/** Widget data linking */
export interface WidgetDataLink {
  datasheetId: string;
  selectedSeriesIds: string[];    // DataSeries IDs to display
  selectedPeriods: string[] | null; // null = show all periods
}

/** Full widget DTO (shared FE/BE) */
export interface WidgetDto {
  id: string;
  tabId: string;
  businessId: string;
  name: string;
  metricName: string;
  unit: string;
  position: WidgetPosition;
  chartConfig: ChartConfig;
  dataLink: WidgetDataLink | null;
  isRestricted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Widget position update request (SRS 8.3) */
export interface WidgetPositionUpdateDto {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Server response for collision (SRS 8.3) */
export interface CollisionConflictDto {
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
