import { describe, it, expect, vi } from 'vitest';
import type { IChartConfig } from '@sbrb/shared-types';

vi.mock('@sbrb/shared-utils', () => ({
  formatChartNumber: (v: number, opts?: { unit?: string; mode?: string }) => {
    if (opts?.unit === '%') return `${v.toFixed(2)}%`;
    if (opts?.mode === 'full') return v.toLocaleString();
    return `${v}`;
  },
}));

import { buildOptions } from '../../components/widget/chart-panel/build-chart-options';

const baseConfig: IChartConfig = {
  type: 'bar',
  colorIndex: 0,
  showLabels: false,
  yAxisFromZero: true,
  showLegend: false,
};

describe('buildOptions', () => {
  it('returns responsive and maintainAspectRatio:false', () => {
    const opts = buildOptions(baseConfig);
    expect(opts.responsive).toBe(true);
    expect(opts.maintainAspectRatio).toBe(false);
  });

  it('does not include y1 scale when hasRight=false', () => {
    const opts = buildOptions(baseConfig, undefined, false);
    expect(opts.scales).toBeDefined();
    expect(opts.scales!.y1).toBeUndefined();
  });

  it('includes y1 scale with position:right when hasRight=true', () => {
    const opts = buildOptions(baseConfig, undefined, true);
    expect(opts.scales!.y1).toBeDefined();
    expect(opts.scales!.y1!.position).toBe('right');
    expect(opts.scales!.y1!.grid.drawOnChartArea).toBe(false);
  });

  it('uses unitRight for y1 tick formatting when provided', () => {
    const opts = buildOptions(baseConfig, 'won', true, '%');
    const callback = opts.scales!.y1!.ticks.callback;
    expect(callback(50, 0, [])).toBe('50.00%');
  });

  it('falls back to unit for y1 when unitRight not provided', () => {
    const opts = buildOptions(baseConfig, '%', true, undefined);
    const callback = opts.scales!.y1!.ticks.callback;
    expect(callback(50, 0, [])).toBe('50.00%');
  });

  it('passes unit to y (left) tick callback', () => {
    const opts = buildOptions(baseConfig, '%');
    const callback = opts.scales!.y!.ticks.callback;
    expect(callback(50, 0, [])).toBe('50.00%');
  });

  it('forces stacked false when mixed=true', () => {
    const config: IChartConfig = { ...baseConfig, stacked: true };
    const opts = buildOptions(config, undefined, false, undefined, true);
    expect(opts.scales!.x!.stacked).toBe(false);
    expect(opts.scales!.y!.stacked).toBe(false);
  });

  it('enables stacking when stacked=true and not mixed', () => {
    const config: IChartConfig = { ...baseConfig, stacked: true };
    const opts = buildOptions(config);
    expect(opts.scales!.x!.stacked).toBe(true);
    expect(opts.scales!.y!.stacked).toBe(true);
  });

  it('returns no scales for pie chart', () => {
    const config: IChartConfig = { ...baseConfig, type: 'pie' };
    const opts = buildOptions(config);
    expect(opts.scales).toBeUndefined();
  });

  it('sets yAxisNameRight as title when provided', () => {
    const config: IChartConfig = { ...baseConfig, yAxisNameRight: 'Growth %' };
    const opts = buildOptions(config, undefined, true);
    expect(opts.scales!.y1!.title).toEqual({ display: true, text: 'Growth %' });
  });

  it('does not set y1 title when yAxisNameRight not provided', () => {
    const opts = buildOptions(baseConfig, undefined, true);
    expect(opts.scales!.y1!.title).toBeUndefined();
  });

  it('uses unitRight in tooltip label callback for y1 datasets', () => {
    const opts = buildOptions(baseConfig, 'won', true, '%');
    const labelCb = opts.plugins.tooltip.callbacks.label;
    const ctx = { dataset: { label: 'Rev', yAxisID: 'y1' }, parsed: { y: 100 } };
    // tooltip uses mode='full' → toLocaleString, but unit='%' → formatChartNumber returns "100.00%"
    expect(labelCb(ctx)).toBe('Rev: 100.00%');
  });

  it('uses unit in tooltip label callback for y (left) datasets', () => {
    const opts = buildOptions(baseConfig, '%', true, 'units');
    const labelCb = opts.plugins.tooltip.callbacks.label;
    const ctx = { dataset: { label: 'Sales', yAxisID: 'y' }, parsed: { y: 50 } };
    // unit='%' → formatChartNumber returns "50.00%"
    expect(labelCb(ctx)).toBe('Sales: 50.00%');
  });

  it('enables datalabels when showLabels=true', () => {
    const config: IChartConfig = { ...baseConfig, showLabels: true };
    const opts = buildOptions(config);
    expect(opts.plugins.datalabels.display).toBe('auto');
  });

  it('disables datalabels when showLabels=false', () => {
    const opts = buildOptions(baseConfig);
    expect(opts.plugins.datalabels.display).toBe(false);
  });

  it('sets beginAtZero from config.yAxisFromZero', () => {
    const opts = buildOptions(baseConfig);
    expect(opts.scales!.y!.beginAtZero).toBe(true);

    const config2: IChartConfig = { ...baseConfig, yAxisFromZero: false };
    const opts2 = buildOptions(config2);
    expect(opts2.scales!.y!.beginAtZero).toBe(false);
  });
});
