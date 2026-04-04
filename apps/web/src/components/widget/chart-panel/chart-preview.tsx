import React from 'react';
import { Skeleton, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Pie, Chart } from 'react-chartjs-2';
import type { ChartType, IChartConfig } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../../hooks/use-chart-data';
import { TrendBadge } from './trend-badge';
import { buildChartData, isMixedChart, hasRightAxis } from './build-chart-data';
import { buildOptions } from './build-chart-options';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title,
  ChartDataLabels,
);

const { Text } = Typography;

export interface IChartPreviewProps {
  chartData: IChartDataResult | null;
  loading: boolean;
  chartType: ChartType;
  config: IChartConfig;
  /** When true: hides trend badge, reduces padding */
  compact?: boolean;
  unit?: string;
}

export function ChartPreview({ chartData, loading, chartType: rawChartType, config, compact = false, unit }: IChartPreviewProps) {
  const { t } = useTranslation(['widget', 'datasheet']);
  const chartType = rawChartType || 'bar';
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Skeleton.Node active className="!w-full !h-full" style={{ minHeight: compact ? 120 : 200 }} />
      </div>
    );
  }

  const hasData = chartData && chartData.datasets.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* trend badge — hidden in compact mode */}
      {!compact && chartData?.trend && (
        <div className="mb-2">
          <TrendBadge trend={chartData.trend} />
        </div>
      )}

      {/* chart area — absolute positioning ensures canvas stays within bounds */}
      <div className="flex-1 relative min-h-0">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-[#bfbfbf] gap-2">
            <Text type="secondary" className="!text-[13px]">
              {t('datasheet:no_data_hint')}
            </Text>
          </div>
        ) : (
          <div className="absolute inset-0 pb-2">
            {(() => {
              const mixed = isMixedChart(chartData!.datasets, config);
              const rightAxis = hasRightAxis(chartData!.datasets, config);
              const data = buildChartData(chartData!, config, mixed);
              const options = buildOptions(config, unit, rightAxis, config.unitRight, mixed);

              if (config.type === 'pie') return <Pie data={data} options={options} />;
              if (mixed) return <Chart type="bar" data={data} options={options} />;
              if (config.type === 'line') return <Line data={data} options={options} />;
              return <Bar data={data} options={options} />;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact inline chart for use inside widget cards — no trend badge */
export function InlineChartPreview(props: IChartPreviewProps) {
  return <ChartPreview {...props} compact />;
}
