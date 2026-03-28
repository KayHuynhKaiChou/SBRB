/** KPIEE chart color palette — matches kpiee-dashboard-1.png reference design */
export const KPIEE_CHART_COLORS = [
  '#4FA8E8', // blue (primary)
  '#E87F6A', // coral
  '#F5B96A', // orange
  '#6BCB8B', // green
  '#B07FE8', // purple
  '#E8C44F', // yellow
];

/** Returns a chart color by cycling through the palette */
export function getChartColor(index: number): string {
  return KPIEE_CHART_COLORS[index % KPIEE_CHART_COLORS.length];
}

/** Returns a chart color with alpha transparency */
export function getChartColorWithAlpha(index: number, alpha: number): string {
  const hex = getChartColor(index).replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
