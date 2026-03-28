import React from 'react';
import { Skeleton, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
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
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { ChartType, IChartConfig } from '@sbrb/shared-types';
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
}

function buildChartData(chartData: IChartDataResult, config: IChartConfig) {
  const isStacked = (config as IChartConfig & { stacked?: boolean }).stacked === true;
  return {
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, index) => {
      // Apply kpiee color palette when backend doesn't provide colors
      const bgColor = ds.backgroundColor && ds.backgroundColor !== '#000000' && ds.backgroundColor !== ''
        ? ds.backgroundColor
        : getChartColor(index);
      const borderColor = ds.borderColor && ds.borderColor !== '#000000' && ds.borderColor !== ''
        ? ds.borderColor
        : getChartColor(index);
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: bgColor,
        borderColor: borderColor,
        fill: config.type === 'area',
        tension: config.type === 'area' || config.type === 'line' ? 0.3 : undefined,
        ...(isStacked ? { stack: 'stack0' } : {}),
      };
    }),
  };
}

function buildOptions(config: IChartConfig) {
  const isStacked = (config as IChartConfig & { stacked?: boolean }).stacked === true;
  const isDoughnut = config.type === 'doughnut';

  // Datalabel configuration per chart type
  const datalabelsPlugin = config.showLabels
    ? {
        display: true,
        color: '#555',
        font: { size: 11, weight: 500 as const },
        ...(isStacked
          ? { anchor: 'center' as const, align: 'center' as const }
          : config.type === 'line' || config.type === 'area'
          ? { anchor: 'end' as const, align: 'top' as const, offset: 4 }
          : { anchor: 'end' as const, align: 'top' as const }),
      }
    : { display: false };

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: config.showLegend },
      datalabels: datalabelsPlugin,
    },
    scales: isDoughnut
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
          },
        },
  };
}

export function ChartPreview({ chartData, loading, chartType: rawChartType, config, onRefresh, compact = false }: IChartPreviewProps) {
  const chartType = rawChartType || 'bar';
  if (loading) {
    return (
      <div style={{ padding: compact ? 4 : 16 }}>
        <Skeleton.Node active style={{ width: '100%', height: compact ? 120 : 340 }} />
      </div>
    );
  }

  const hasData = chartData && chartData.datasets.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header row — hidden in compact mode */}
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {chartData?.trend ? <TrendBadge trend={chartData.trend} /> : <span />}
          <Button
            size="small"
            type="text"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            title="Làm mới dữ liệu"
          />
        </div>
      )}

      {/* chart area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {!hasData ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bfbfbf',
              gap: 8,
            }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              Chưa có dữ liệu
            </Text>
          </div>
        ) : (
          <>
            {chartType === 'bar' && (
              <Bar data={buildChartData(chartData!, config)} options={buildOptions(config)} />
            )}
            {(chartType === 'line' || chartType === 'area') && (
              <Line data={buildChartData(chartData!, config)} options={buildOptions(config)} />
            )}
            {chartType === 'doughnut' && (
              <Doughnut data={buildChartData(chartData!, config)} options={buildOptions(config)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Compact inline chart for use inside widget cards — no refresh button or trend badge */
export function InlineChartPreview(props: Omit<IChartPreviewProps, 'onRefresh'>) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return <ChartPreview {...props} compact onRefresh={() => {}} />;
}
