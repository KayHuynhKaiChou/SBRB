import type { IChartConfig } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../../hooks/use-chart-data';
import { getChartColor } from './chart-colors';

function getSeriesChartType(
  _configKey: string,
  config: IChartConfig,
): 'bar' | 'line' {
  // Per-series chart type override is disabled — always use the global widget chart type.
  return config.type === 'pie' ? 'bar' : (config.type as 'bar' | 'line');
}

/**
 * Resolves the config/color key for a dataset.
 * - Multi-dept (>1 unique department): key by departmentName so all metrics of that dept share color/type.
 * - Single-dept or no-dept (simple template, even if backend attaches a default dept):
 *   key by ds.label so each series gets its own color, matching SimpleLayout's color storage.
 * - PnL labels with " > " separator key by their top-level segment.
 */
function getConfigKey(
  ds: { label: string; departmentName?: string | null },
  datasets: { departmentName?: string | null }[],
) {
  const uniqueDepts = new Set(datasets.map(d => d.departmentName).filter(Boolean) as string[]);
  const isMultiDept = uniqueDepts.size > 1;
  if (isMultiDept && ds.departmentName) return ds.departmentName;
  if (ds.label.includes(' > ')) return ds.label.split(' > ')[0];
  return ds.label;
}

/** Returns true when datasets have mixed types (bar + line). Always false for pie. */
export function isMixedChart(
  datasets: { label: string; departmentName?: string | null }[],
  config: IChartConfig,
): boolean {
  if (config.type === 'pie') return false;
  const types = new Set(
    datasets.map((ds) => getSeriesChartType(getConfigKey(ds, datasets), config)),
  );
  return types.size > 1;
}

/**
 * Computes default X-axis grouping from dataset shape.
 * Single source of truth — used by both buildChartData fallback and UI default.
 * Rules:
 *  - Multi-department + multi-metric → 'criteria' (compare depts side-by-side per metric)
 *  - Single-metric across depts → 'time' (show trend for that metric per dept)
 *  - Everything else → 'time'
 */
export function computeDefaultXAxisGroup(
  datasets: { label: string; departmentName?: string | null }[],
): 'time' | 'criteria' {
  const uniqueLabels = new Set(datasets.map(ds => ds.label));
  const uniqueDepartments = new Set(datasets.map(ds => ds.departmentName).filter(Boolean) as string[]);
  const isDepartmental = datasets.some(ds => ds.departmentName != null);
  const isSingleMetricComparison = isDepartmental && uniqueLabels.size === 1;
  const isMultiDepartment = uniqueDepartments.size > 1;
  return isMultiDepartment && !isSingleMetricComparison ? 'criteria' : 'time';
}

/** Returns true when any series is assigned to the right Y-axis. */
export function hasRightAxis(
  datasets: { label: string; departmentName?: string | null }[],
  config: IChartConfig,
): boolean {
  return datasets.some(
    (ds) => config.seriesConfig?.[getConfigKey(ds, datasets)]?.yAxis === 'right',
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

  // Group datasets by label/department to understand data shape
  const uniqueLabels = new Set(chartData.datasets.map(ds => ds.label));
  const uniqueDepartments = new Set(chartData.datasets.map(ds => ds.departmentName).filter(Boolean) as string[]);
  // "Departmental" means MULTI-dept. A single department attached by import (e.g. simple
  // template auto-tagged with default dept) should render as simple, not as departmental.
  const isDepartmental = uniqueDepartments.size > 1;
  const isSingleMetricComparison = isDepartmental && uniqueLabels.size === 1;

  // Pie: one slice per series, value = sum of all periods
  if (config.type === 'pie') {
    const labels = chartData.datasets.map((ds) =>
      isSingleMetricComparison ? ds.departmentName! : (isDepartmental ? `${ds.departmentName} - ${ds.label}` : ds.label)
    );
    const data = chartData.datasets.map((ds) =>
      ds.data.reduce((sum, v) => sum + v, 0),
    );
    const bgColors = chartData.datasets.map(
      (ds, i) => config.seriesColors?.[getConfigKey(ds, chartData.datasets)] || getChartColor(i),
    );
    return {
      labels,
      datasets: [
        { data, backgroundColor: bgColors, borderColor: '#fff', borderWidth: 2 },
      ],
    };
  }
  const effectiveXAxisGroup = config.xAxisGroup || computeDefaultXAxisGroup(chartData.datasets);

  if (effectiveXAxisGroup === 'criteria') {
    // Labels = unique criteria (e.g. Doanh thu, Chi phí)
    const criteriaLabels = Array.from(uniqueLabels);

    // Single-dept simple template: each criterion is its own dataset/color/yAxis.
    // (Without this branch we'd group all under one "Sales"-style dept → single series, all-same color.)
    if (!isDepartmental) {
      const datasets = criteriaLabels.map((criteria, i) => {
        const targetDs = chartData.datasets.find(ds => ds.label === criteria);
        const total = targetDs ? targetDs.data.reduce((s, v) => s + v, 0) : 0;
        const seriesColor = config.seriesColors?.[criteria] || getChartColor(i);
        const seriesCfg = config.seriesConfig?.[criteria];
        // Per-series chart type override is disabled — global widget chart type wins.
      const seriesType = config.type as 'bar' | 'line';
        const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';
        // Sparse data: only this criterion's index has a value; others null so Chart.js skips them.
        const data = criteriaLabels.map((_, j) => (j === i ? total : (null as unknown as number)));
        return {
          label: criteria,
          data,
          ...(mixed ? { type: seriesType as any } : {}),
          yAxisID,
          backgroundColor: seriesColor,
          borderColor: seriesColor,
          fill: false,
          tension: seriesType === 'line' ? 0.3 : undefined,
          order: seriesType === 'line' ? 0 : 1,
        };
      });
      return { labels: criteriaLabels, datasets };
    }

    // Multi-dept: group datasets by department (compare depts side-by-side per criteria).
    const departmentMap = new Map<string, typeof chartData.datasets[0][]>();
    chartData.datasets.forEach(ds => {
      const dept = ds.departmentName || 'Default';
      if (!departmentMap.has(dept)) departmentMap.set(dept, []);
      departmentMap.get(dept)!.push(ds);
    });

    const datasets = Array.from(departmentMap.entries()).map(([deptName, originalDatasets], deptIndex) => {
      const configKey = deptName; // For departmental grouping, configKey is the deptName
      const seriesColor = config.seriesColors?.[configKey] || getChartColor(deptIndex);
      const seriesCfg = config.seriesConfig?.[configKey];
      // Per-series chart type override is disabled — global widget chart type wins.
      const seriesType = config.type as 'bar' | 'line';
      const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';

      // Map criteria -> sum of periods (null for missing combos so Chart.js skips the bar)
      const criteriaData = criteriaLabels.map(criteria => {
        const targetDs = originalDatasets.find(ds => ds.label === criteria);
        if (!targetDs) return null as unknown as number; // dept lacks this criteria
        return targetDs.data.reduce((sum, v) => sum + v, 0);
      });

      return {
        label: deptName,
        data: criteriaData,
        ...(mixed ? { type: seriesType as any } : {}),
        yAxisID,
        backgroundColor: seriesColor,
        borderColor: seriesColor,
        fill: false,
        tension: seriesType === 'line' ? 0.3 : undefined,
        order: seriesType === 'line' ? 0 : 1,
        ...(isStacked && seriesType === 'bar' && !mixed
          ? { stack: 'stack0' } // Stack by criteria internally, single stack is fine per dept
          : {}),
      };
    });

    return {
      labels: criteriaLabels,
      datasets,
    };
  }

  if (effectiveXAxisGroup === 'department' && isDepartmental) {
    // Labels = department names, group by criteria
    const deptLabels = Array.from(uniqueDepartments);
    const criteriaMap = new Map<string, typeof chartData.datasets[0][]>();
    chartData.datasets.forEach(ds => {
      if (!criteriaMap.has(ds.label)) criteriaMap.set(ds.label, []);
      criteriaMap.get(ds.label)!.push(ds);
    });

    const datasets = Array.from(criteriaMap.entries()).map(([criteriaName, originalDatasets], idx) => {
      const configKey = criteriaName;
      const seriesColor = config.seriesColors?.[configKey] || getChartColor(idx);
      const seriesCfg = config.seriesConfig?.[configKey];
      // Per-series chart type override is disabled — global widget chart type wins.
      const seriesType = config.type as 'bar' | 'line';
      const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';

      const deptData = deptLabels.map(dept => {
        const targetDs = originalDatasets.find(ds => ds.departmentName === dept);
        if (!targetDs) return null as unknown as number;
        return targetDs.data.reduce((sum, v) => sum + v, 0);
      });

      return {
        label: criteriaName,
        data: deptData,
        ...(mixed ? { type: seriesType as any } : {}),
        yAxisID,
        backgroundColor: seriesColor,
        borderColor: seriesColor,
        fill: false,
        tension: seriesType === 'line' ? 0.3 : undefined,
        order: seriesType === 'line' ? 0 : 1,
      };
    });

    return { labels: deptLabels, datasets };
  }

  // Default Time-based X-Axis
  // Multi-dept + multi-metric → group by department (sum metrics per period) → 1 series per dept
  const isMultiDeptMultiMetric = uniqueDepartments.size > 1 && uniqueLabels.size > 1;
  if (isMultiDeptMultiMetric) {
    const deptMap = new Map<string, typeof chartData.datasets[0][]>();
    chartData.datasets.forEach(ds => {
      const dept = ds.departmentName || 'Default';
      if (!deptMap.has(dept)) deptMap.set(dept, []);
      deptMap.get(dept)!.push(ds);
    });

    const datasets = Array.from(deptMap.entries()).map(([deptName, deptDatasets], deptIndex) => {
      const configKey = deptName;
      const seriesColor = config.seriesColors?.[configKey] || getChartColor(deptIndex);
      const seriesCfg = config.seriesConfig?.[configKey];
      // Per-series chart type override is disabled — global widget chart type wins.
      const seriesType = config.type as 'bar' | 'line';
      const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';

      // Sum all metrics for this dept at each period
      const summedData = chartData.labels.map((_, periodIdx) =>
        deptDatasets.reduce((sum, ds) => sum + (ds.data[periodIdx] ?? 0), 0),
      );

      return {
        label: deptName,
        data: summedData,
        ...(mixed ? { type: seriesType as any } : {}),
        yAxisID,
        backgroundColor: seriesColor,
        borderColor: seriesColor,
        fill: false,
        tension: seriesType === 'line' ? 0.3 : undefined,
        order: seriesType === 'line' ? 0 : 1,
        ...(isStacked && seriesType === 'bar' && !mixed ? { stack: 'stack0' } : {}),
      };
    });

    return { labels: chartData.labels, datasets };
  }

  return {
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, index) => {
      const configKey = getConfigKey(ds, chartData.datasets);
      // For department colors, we might need a stable index per configKey, but relying on explicit colors is better.
      const seriesColor = config.seriesColors?.[configKey] || ds.backgroundColor || getChartColor(index);
      const seriesCfg = config.seriesConfig?.[configKey];
      // Per-series chart type override is disabled — global widget chart type wins.
      const seriesType = config.type as 'bar' | 'line';
      const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';

      const displayLabel = isSingleMetricComparison ? ds.departmentName! : (isDepartmental ? `${ds.departmentName} - ${ds.label}` : ds.label);

      return {
        label: displayLabel,
        data: ds.data,
        ...(mixed ? { type: seriesType as any } : {}),
        yAxisID,
        backgroundColor: seriesColor,
        borderColor: seriesColor,
        fill: false,
        tension: seriesType === 'line' ? 0.3 : undefined,
        order: seriesType === 'line' ? 0 : 1,
        ...(isStacked && seriesType === 'bar' && !mixed
          ? { stack: isDepartmental ? ds.departmentName! : 'stack0' }
          : {}),
      };
    }),
  };
}
