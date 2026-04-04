import { describe, it, expect, vi } from 'vitest';
import type { IChartConfig } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../hooks/use-chart-data';

vi.mock('../../components/widget/chart-panel/chart-colors', () => ({
  getChartColor: (i: number) => `#color${i}`,
}));

import {
  buildChartData,
  isMixedChart,
  hasRightAxis,
} from '../../components/widget/chart-panel/build-chart-data';

const baseConfig: IChartConfig = {
  type: 'bar',
  colorIndex: 0,
  showLabels: false,
  yAxisFromZero: true,
  showLegend: false,
};

const twoSeries = [
  { label: 'Revenue', data: [100, 200], backgroundColor: '#a', borderColor: '#a' },
  { label: 'Growth', data: [5, 10], backgroundColor: '#b', borderColor: '#b' },
];

const chartData: IChartDataResult = {
  labels: ['Q1', 'Q2'],
  datasets: twoSeries,
  trend: null,
};

/* ─── isMixedChart ─── */

describe('isMixedChart', () => {
  it('returns false when no seriesConfig (all default to base type)', () => {
    expect(isMixedChart(twoSeries, baseConfig)).toBe(false);
  });

  it('returns false when all series have the same explicit type', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: {
        Revenue: { type: 'line', yAxis: 'left' },
        Growth: { type: 'line', yAxis: 'left' },
      },
    };
    expect(isMixedChart(twoSeries, config)).toBe(false);
  });

  it('returns true when series have different types', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: {
        Revenue: { type: 'bar', yAxis: 'left' },
        Growth: { type: 'line', yAxis: 'left' },
      },
    };
    expect(isMixedChart(twoSeries, config)).toBe(true);
  });

  it('returns false for pie type regardless of seriesConfig', () => {
    const config: IChartConfig = {
      ...baseConfig,
      type: 'pie',
      seriesConfig: {
        Revenue: { type: 'bar', yAxis: 'left' },
        Growth: { type: 'line', yAxis: 'left' },
      },
    };
    expect(isMixedChart(twoSeries, config)).toBe(false);
  });
});

/* ─── hasRightAxis ─── */

describe('hasRightAxis', () => {
  it('returns false when no seriesConfig', () => {
    expect(hasRightAxis(twoSeries, baseConfig)).toBe(false);
  });

  it('returns true when at least one series has yAxis=right', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: { Growth: { type: 'bar', yAxis: 'right' } },
    };
    expect(hasRightAxis(twoSeries, config)).toBe(true);
  });

  it('returns false when all series have yAxis=left', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: {
        Revenue: { type: 'bar', yAxis: 'left' },
        Growth: { type: 'bar', yAxis: 'left' },
      },
    };
    expect(hasRightAxis(twoSeries, config)).toBe(false);
  });
});

/* ─── buildChartData ─── */

describe('buildChartData', () => {
  it('returns datasets without type key when not mixed', () => {
    const result = buildChartData(chartData, baseConfig, false);
    expect(result.datasets).toHaveLength(2);
    result.datasets.forEach((ds) => {
      expect(ds).not.toHaveProperty('type');
    });
  });

  it('returns datasets with per-series type when mixed', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: {
        Revenue: { type: 'bar', yAxis: 'left' },
        Growth: { type: 'line', yAxis: 'left' },
      },
    };
    const result = buildChartData(chartData, config, true);
    expect(result.datasets[0].type).toBe('bar');
    expect(result.datasets[1].type).toBe('line');
  });

  it('sets yAxisID=y1 for series with right axis', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: { Growth: { type: 'bar', yAxis: 'right' } },
    };
    const result = buildChartData(chartData, config, false);
    expect(result.datasets[0].yAxisID).toBe('y');
    expect(result.datasets[1].yAxisID).toBe('y1');
  });

  it('returns pie format (labels + single dataset with summed data)', () => {
    const pieConfig: IChartConfig = { ...baseConfig, type: 'pie' };
    const result = buildChartData(chartData, pieConfig, false);
    expect(result.labels).toEqual(['Revenue', 'Growth']);
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toEqual([300, 15]); // sum of [100,200] and [5,10]
  });

  it('gives line datasets order:0 and bar datasets order:1', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: {
        Revenue: { type: 'bar', yAxis: 'left' },
        Growth: { type: 'line', yAxis: 'left' },
      },
    };
    const result = buildChartData(chartData, config, true);
    expect(result.datasets[0].order).toBe(1); // bar
    expect(result.datasets[1].order).toBe(0); // line
  });

  it('gives line datasets tension:0.3 and bar datasets tension:undefined', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesConfig: {
        Revenue: { type: 'bar', yAxis: 'left' },
        Growth: { type: 'line', yAxis: 'left' },
      },
    };
    const result = buildChartData(chartData, config, true);
    expect(result.datasets[0].tension).toBeUndefined(); // bar
    expect(result.datasets[1].tension).toBe(0.3); // line
  });

  it('uses seriesColors when provided', () => {
    const config: IChartConfig = {
      ...baseConfig,
      seriesColors: { Revenue: '#ff0000' },
    };
    const result = buildChartData(chartData, config, false);
    expect(result.datasets[0].backgroundColor).toBe('#ff0000');
    expect(result.datasets[1].backgroundColor).toBe('#color1'); // fallback
  });

  it('adds stack:stack0 when stacked bar and not mixed', () => {
    const config: IChartConfig = { ...baseConfig, stacked: true };
    const result = buildChartData(chartData, config, false);
    result.datasets.forEach((ds) => {
      expect(ds.stack).toBe('stack0');
    });
  });

  it('does not add stack when stacked but mixed', () => {
    const config: IChartConfig = {
      ...baseConfig,
      stacked: true,
      seriesConfig: {
        Revenue: { type: 'bar', yAxis: 'left' },
        Growth: { type: 'line', yAxis: 'left' },
      },
    };
    const result = buildChartData(chartData, config, true);
    result.datasets.forEach((ds) => {
      expect(ds).not.toHaveProperty('stack');
    });
  });
});
