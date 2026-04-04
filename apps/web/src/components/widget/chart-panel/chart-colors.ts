import { CHART_COLORS } from '@sbrb/shared-constants';

/** SBRB chart color palette — backwards compat alias */
export const SBRB_CHART_COLORS = CHART_COLORS;

/** Returns a chart color by cycling through the palette */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/** Returns a chart color with alpha transparency */
export function getChartColorWithAlpha(index: number, alpha: number): string {
  const hex = getChartColor(index).replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
