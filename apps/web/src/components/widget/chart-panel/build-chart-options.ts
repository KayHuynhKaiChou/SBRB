import type { IChartConfig } from '@sbrb/shared-types';
import { formatChartNumber } from '@sbrb/shared-utils';

/**
 * Builds Chart.js options with support for dual Y-axis and mixed chart modes.
 *
 * @param hasRight  Whether to render a right Y-axis (y1)
 * @param unitRight Independent unit for the right Y-axis
 * @param mixed     When true, stacking is forced off
 */
export function buildOptions(
  config: IChartConfig,
  unit?: string,
  hasRight = false,
  unitRight?: string,
  mixed = false,
) {
  const isStacked = config.stacked === true && !mixed;
  const isPie = config.type === 'pie';

  const datalabelsPlugin = config.showLabels
    ? {
        // Show labels for all real data points; only hide for null/empty (which produce no bar).
        // 'auto' would also hide labels that collide vertically with adjacent bars (e.g. T6
        // Lợi nhuận 1.2K next to Chi phí 1.3K), making bars look like they're missing data.
        display: (context: any) => {
          const value = context.dataset.data[context.dataIndex];
          return value != null;
        },
        clamp: true,
        color: '#555',
        font: { size: 11, weight: 500 as const },
        formatter: (value: number, context: any) => {
          const dsUnit = context.dataset?.yAxisID === 'y1' ? effectiveUnitRight : unit;
          return formatChartNumber(value, { unit: dsUnit, mode: config.numberFormat });
        },
        ...(isStacked
          ? { anchor: 'center' as const, align: 'center' as const }
          : config.type === 'line'
            ? { anchor: 'end' as const, align: 'top' as const, offset: 4 }
            : { anchor: 'end' as const, align: 'top' as const }),
      }
    : { display: false as const };

  const effectiveUnitRight = unitRight ?? unit;

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { bottom: isPie ? 0 : 4 } },
    plugins: {
      legend: { display: config.showLegend },
      datalabels: datalabelsPlugin,
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const axisUnit =
              context.dataset.yAxisID === 'y1' ? effectiveUnitRight : unit;
            const val = formatChartNumber(context.parsed.y ?? context.parsed, {
              unit: axisUnit,
              mode: 'full',
            });
            return `${label}: ${val}`;
          },
        },
      },
    },
    scales: isPie
      ? undefined
      : {
          x: {
            stacked: isStacked,
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          y: {
            stacked: isStacked,
            beginAtZero: config.yAxisFromZero,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              callback: (value: number | string) =>
                typeof value === 'number'
                  ? formatChartNumber(value, { unit, mode: config.numberFormat })
                  : value,
            },
          },
          ...(hasRight
            ? {
                y1: {
                  position: 'right' as const,
                  // Right axis always starts at 0 in dual-axis bar charts: prevents bars
                  // whose value equals the auto-fitted axis minimum from collapsing to 0
                  // height (which also hides their data label via datalabels' display: 'auto').
                  beginAtZero: true,
                  grid: { drawOnChartArea: false },
                  ...(config.yAxisNameRight
                    ? { title: { display: true, text: config.yAxisNameRight } }
                    : {}),
                  ticks: {
                    callback: (value: number | string) =>
                      typeof value === 'number'
                        ? formatChartNumber(value, {
                            unit: effectiveUnitRight,
                            mode: config.numberFormat,
                          })
                        : value,
                  },
                },
              }
            : {}),
        },
  };
}
