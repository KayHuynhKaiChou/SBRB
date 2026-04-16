import type { IChartConfig } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../../hooks/use-chart-data';
import { getChartColor } from './chart-colors';

function getSeriesChartType(
  configKey: string,
  config: IChartConfig,
): 'bar' | 'line' {
  return (
    config.seriesConfig?.[configKey]?.type ??
    (config.type === 'pie' ? 'bar' : (config.type as 'bar' | 'line'))
  );
}

function getConfigKey(ds: { label: string; departmentName?: string | null }) {
  if (ds.departmentName) return ds.departmentName;
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
    datasets.map((ds) => getSeriesChartType(getConfigKey(ds), config)),
  );
  return types.size > 1;
}

/** Returns true when any series is assigned to the right Y-axis. */
export function hasRightAxis(
  datasets: { label: string; departmentName?: string | null }[],
  config: IChartConfig,
): boolean {
  return datasets.some(
    (ds) => config.seriesConfig?.[getConfigKey(ds)]?.yAxis === 'right',
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
  const isDepartmental = chartData.datasets.some(ds => ds.departmentName != null);

  // Group datasets by label/department to understand data shape
  const uniqueLabels = new Set(chartData.datasets.map(ds => ds.label));
  const uniqueDepartments = new Set(chartData.datasets.map(ds => ds.departmentName).filter(Boolean) as string[]);
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
      (ds, i) => config.seriesColors?.[getConfigKey(ds)] || getChartColor(i),
    );
    return {
      labels,
      datasets: [
        { data, backgroundColor: bgColors, borderColor: '#fff', borderWidth: 2 },
      ],
    };
  }
  const effectiveXAxisGroup = config.xAxisGroup || (isDepartmental && !isSingleMetricComparison ? 'criteria' : 'time');

  if (effectiveXAxisGroup === 'criteria') {
    // Labels = unique criteria (e.g. Doanh thu, Chi phí)
    const criteriaLabels = Array.from(uniqueLabels);
    // Group datasets by Department
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
      const seriesType = seriesCfg?.type ?? (config.type as 'bar' | 'line');
      const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';

      // Map criteria -> sum of periods
      const criteriaData = criteriaLabels.map(criteria => {
        // Find dataset for this criteria in this department
        const targetDs = originalDatasets.find(ds => ds.label === criteria);
        if (!targetDs) return 0; // The department doesn't have this criteria
        return targetDs.data.reduce((sum, v) => sum + v, 0); // SUM all selected time periods!
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
      const seriesType = seriesCfg?.type ?? (config.type as 'bar' | 'line');
      const yAxisID = seriesCfg?.yAxis === 'right' ? 'y1' : 'y';

      const deptData = deptLabels.map(dept => {
        const targetDs = originalDatasets.find(ds => ds.departmentName === dept);
        if (!targetDs) return 0;
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
  return {
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, index) => {
      const configKey = getConfigKey(ds);
      // For department colors, we might need a stable index per configKey, but relying on explicit colors is better.
      const seriesColor = config.seriesColors?.[configKey] || ds.backgroundColor || getChartColor(index);
      const seriesCfg = config.seriesConfig?.[configKey];
      const seriesType = seriesCfg?.type ?? (config.type as 'bar' | 'line');
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
