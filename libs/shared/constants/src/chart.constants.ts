/**
 * Chart color palette — SRS 6.6
 * 20 colors, sufficient contrast on both light and dark backgrounds
 */
export const CHART_COLORS = [
  '#2563EB', // Blue 1
  '#16A34A', // Green 2
  '#D97706', // Amber 3
  '#7C3AED', // Purple 4
  '#0891B2', // Cyan 5
  '#EA580C', // Orange-Red 6
  '#65A30D', // Lime 7
  '#DB2777', // Pink 8
  '#1D4ED8', // Blue 9
  '#15803D', // Green 10
  '#B45309', // Amber 11
  '#6D28D9', // Violet 12
  '#0E7490', // Teal 13
  '#C2410C', // Orange-Red 14
  '#4D7C0F', // Lime 15
  '#BE185D', // Rose 16
  '#3B82F6', // Blue 17
  '#22C55E', // Green 18
  '#F59E0B', // Amber 19
  '#A855F7', // Purple 20
] as const;

/** Get chart color by series index (wraps at 20) */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export const CHART_TYPES = ['bar', 'line', 'pie'] as const;

/** Bar chart: 80% opacity fill */
export const BAR_FILL_OPACITY = 'CC';
/** Area chart: 20% opacity fill */
export const AREA_FILL_OPACITY = '33';
