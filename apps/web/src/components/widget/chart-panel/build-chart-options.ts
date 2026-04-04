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
        display: 'auto' as const,
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
                  beginAtZero: config.yAxisFromZero,
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
