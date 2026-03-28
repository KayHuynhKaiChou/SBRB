import { useQuery } from '@apollo/client';
import { WIDGET_CHART_DATA_QUERY } from '../graphql/widget-config.operations';
import { getChartColor } from '../components/widget/chart-panel/chart-colors';

export interface IChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
}

export interface IChartTrend {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  vsLabel: string;
}

export interface IChartDataResult {
  labels: string[];
  datasets: IChartDataset[];
  trend: IChartTrend | null;
}

/** Apply kpiee color palette to datasets that lack explicit backend colors */
function applyColorFallback(datasets: IChartDataset[]): IChartDataset[] {
  return datasets.map((ds, index) => {
    const hasColor = ds.backgroundColor && ds.backgroundColor !== '#000000' && ds.backgroundColor !== '';
    return hasColor
      ? ds
      : { ...ds, backgroundColor: getChartColor(index), borderColor: getChartColor(index) };
  });
}

export function useChartData(widgetId: string | null) {
  const { data, loading, refetch } = useQuery<{ widgetChartData: IChartDataResult }>(
    WIDGET_CHART_DATA_QUERY,
    {
      variables: { widgetId },
      skip: !widgetId,
      fetchPolicy: 'cache-and-network',
    },
  );

  const raw = data?.widgetChartData ?? null;
  const chartData = raw
    ? { ...raw, datasets: applyColorFallback(raw.datasets) }
    : null;

  return {
    chartData,
    loading,
    refetch,
  };
}
