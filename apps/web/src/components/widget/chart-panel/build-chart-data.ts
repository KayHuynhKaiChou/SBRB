import type { IChartConfig } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../../hooks/use-chart-data';
import { getChartColor } from './chart-colors';

function getSeriesChartType(
  seriesName: string,
  config: IChartConfig,
): 'bar' | 'line' {
  return (
    config.seriesConfig?.[seriesName]?.type ??
    (config.type === 'pie' ? 'bar' : (config.type as 'bar' | 'line'))
  );
}

/** Returns true when datasets have mixed types (bar + line). Always false for pie. */
export function isMixedChart(
  datasets: { label: string }[],
  config: IChartConfig,
): boolean {
  if (config.type === 'pie') return false;
  const types = new Set(
    datasets.map((ds) => getSeriesChartType(ds.label, config)),
  );
  return types.size > 1;
}

/** Returns true when any series is assigned to the right Y-axis. */
export function hasRightAxis(
  datasets: { label: string }[],
  config: IChartConfig,
): boolean {
  return datasets.some(
    (ds) => config.seriesConfig?.[ds.label]?.yAxis === 'right',
  );
}

/**
 * Builds Chart.js-compatible data from widget chart data.
 * When `mixed` is true, each dataset gets its own `type` and `yAxisID`.
 */
export function buildChartData(
  chartData: IChartDataResult,
  config: IChartConfig,
  mixed: boolean,
) {
  const isStacked = config.stacked === true;

  // Pie: one slice per series, value = sum of all periods
  if (config.type === 'pie') {
    const labels = chartData.datasets.map((ds) => ds.label);
    const data = chartData.datasets.map((ds) =>
      ds.data.reduce((sum, v) => sum + v, 0),
    );
    const bgColors = chartData.datasets.map(
      (ds, i) => config.seriesColors?.[ds.label] || getChartColor(i),
    );
    return {
      labels,
      datasets: [
        { data, backgroundColor: bgColors, borderColor: '#fff', borderWidth: 2 },
      ],
    };
  }

  return {
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, index) => {
      const seriesColor =
        config.seriesColors?.[ds.label] || getChartColor(index);
      const seriesCfg = config.seriesConfig?.[ds.label];
      const seriesType = seriesCfg?.type ?? (config.type as 'bar' | 'line');
      const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';

      return {
        label: ds.label,
        data: ds.data,
        ...(mixed ? { type: seriesType as any } : {}),
        yAxisID,
        backgroundColor: seriesColor,
        borderColor: seriesColor,
        fill: false,
        tension: seriesType === 'line' ? 0.3 : undefined,
        order: seriesType === 'line' ? 0 : 1,
        ...(isStacked && seriesType === 'bar' && !mixed
          ? { stack: 'stack0' }
          : {}),
      };
    }),
  };
}
