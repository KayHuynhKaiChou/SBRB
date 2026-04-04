import React from 'react';
import { Skeleton, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
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
import { Bar, Line, Pie } from 'react-chartjs-2';
import type { ChartType, IChartConfig } from '@sbrb/shared-types';
import { formatChartNumber } from '@sbrb/shared-utils';
import type { IChartDataResult } from '../../../hooks/use-chart-data';
import { TrendBadge } from './trend-badge';
import { getChartColor } from './chart-colors';

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
  onRefresh: () => void;
  /** When true: hides refresh button and trend badge, reduces padding */
  compact?: boolean;
  unit?: string;
}

function buildChartData(chartData: IChartDataResult, config: IChartConfig) {
  const isStacked = config.stacked === true;

  // Pie: one slice per series, value = sum of all periods, color = series color
  if (config.type === 'pie') {
    const labels = chartData.datasets.map((ds) => ds.label);
    const data = chartData.datasets.map((ds) => ds.data.reduce((sum, v) => sum + v, 0));
    const bgColors = chartData.datasets.map((ds, i) => config.seriesColors?.[ds.label] || getChartColor(i));
    return {
      labels,
      datasets: [{ data, backgroundColor: bgColors, borderColor: '#fff', borderWidth: 2 }],
    };
  }

  return {
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, index) => {
      const seriesColor = config.seriesColors?.[ds.label] || getChartColor(index);
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: seriesColor,
        borderColor: seriesColor,
        fill: false,
        tension: config.type === 'line' ? 0.3 : undefined,
        ...(isStacked && config.type === 'bar' ? { stack: 'stack0' } : {}),
      };
    }),
  };
}

function buildOptions(config: IChartConfig, unit?: string) {
  const isStacked = config.stacked === true;
  const isPie = config.type === 'pie';

  // Datalabel configuration per chart type
  const datalabelsPlugin = config.showLabels
    ? {
        display: 'auto' as const,
        clamp: true,
        color: '#555',
        font: { size: 11, weight: 500 as const },
        formatter: (value: number) => formatChartNumber(value, { unit, mode: config.numberFormat }),
        ...(isStacked
          ? { anchor: 'center' as const, align: 'center' as const }
          : config.type === 'line'
          ? { anchor: 'end' as const, align: 'top' as const, offset: 4 }
          : { anchor: 'end' as const, align: 'top' as const }),
      }
    : { display: false as const };

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
            const val = formatChartNumber(context.parsed.y ?? context.parsed, { unit, mode: 'full' });
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
            title: { display: !!config.xAxisName, text: config.xAxisName },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
          y: {
            stacked: isStacked,
            beginAtZero: config.yAxisFromZero,
            title: { display: !!config.yAxisName, text: config.yAxisName },
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              callback: (value: number | string) =>
                typeof value === 'number'
                  ? formatChartNumber(value, { unit, mode: config.numberFormat })
                  : value,
            },
          },
        },
  };
}

export function ChartPreview({ chartData, loading, chartType: rawChartType, config, onRefresh, compact = false, unit }: IChartPreviewProps) {
  const { t } = useTranslation(['widget', 'datasheet']);
  const chartType = rawChartType || 'bar';
  if (loading) {
    return (
      <div style={{ padding: compact ? 4 : 16 }}>
        <Skeleton.Node active className="!w-full" style={{ height: compact ? 120 : 340 }} />
      </div>
    );
  }

  const hasData = chartData && chartData.datasets.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* header row — hidden in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          {chartData?.trend ? <TrendBadge trend={chartData.trend} /> : <span />}
          <IconButton
            icon={<ReloadOutlined />}
            tooltip={t('widget:refresh_chart')}
            size="small"
            onClick={onRefresh}
          />
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
            {chartType === 'bar' && (
              <Bar data={buildChartData(chartData!, config)} options={buildOptions(config, unit)} />
            )}
            {chartType === 'line' && (
              <Line data={buildChartData(chartData!, config)} options={buildOptions(config, unit)} />
            )}
            {chartType === 'pie' && (
              <Pie data={buildChartData(chartData!, config)} options={buildOptions(config, unit)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Stable no-op for onRefresh in compact mode (avoids new function on every render) */
const noOp = () => undefined;

/** Compact inline chart for use inside widget cards — no refresh button or trend badge */
export function InlineChartPreview(props: Omit<IChartPreviewProps, 'onRefresh'>) {
  return <ChartPreview {...props} compact onRefresh={noOp} />;
}
