import { useQuery } from '@apollo/client';
import { AVAILABLE_SERIES_QUERY, WIDGET_CHART_DATA_QUERY } from '../graphql/widget-config.operations';

export interface IChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  departmentName?: string | null;
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
  departmentId?: string | null;
  departmentName?: string | null;
  allPeriods?: string[];
}

export interface IAvailableSeries {
  id: string;
  name: string;
  templateType?: string;
  departmentName?: string | null;
}

export function useAvailableSeries(widgetId: string | null) {
  const { data, loading } = useQuery<{ availableSeries: IAvailableSeries[] }>(
    AVAILABLE_SERIES_QUERY,
    {
      variables: { widgetId },
      skip: !widgetId,
      // cache-and-network: always refetch when hook re-activates after relink,
      // otherwise stale [] from prior remove-link state would persist
      fetchPolicy: 'cache-and-network',
    },
  );
  return { series: data?.availableSeries ?? [], loading };
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

  // Pass raw data — color fallback is applied in chart-preview.tsx buildChartData()
  const chartData = data?.widgetChartData ?? null;

  return {
    chartData,
    loading,
    refetch,
  };
}
