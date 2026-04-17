import React from 'react';
import { Skeleton, Typography } from 'antd';
import { DatabaseOutlined, InboxOutlined } from '@ant-design/icons';
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
import { formatPeriodRange } from './format-period-range';

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
  /** When false, shows "link a data source" empty state regardless of chartData (guards against stale cache after remove link). */
  hasDataLink?: boolean;
  /** Called when user clicks the import CTA in the empty state. */
  onRequestLink?: () => void;
  /** Effective X-axis grouping (passed in so preview can adapt subtitle/trend). */
  xAxisGroup?: 'time' | 'department' | 'criteria';
  /** User-selected periods (null = all). Used to label the criteria-mode aggregation. */
  selectedPeriods?: string[] | null;
}

export function ChartPreview({
  chartData,
  loading,
  chartType: rawChartType,
  config,
  compact = false,
  unit,
  hasDataLink = true,
  onRequestLink,
  xAxisGroup,
  selectedPeriods,
}: IChartPreviewProps) {
  const { t } = useTranslation(['widget', 'datasheet']);
  const chartType = rawChartType || 'bar';
  const isCriteriaMode = xAxisGroup === 'criteria';
  const periodInfo =
    isCriteriaMode && chartData
      ? formatPeriodRange(selectedPeriods ?? null, chartData.allPeriods ?? chartData.labels)
      : null;
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Skeleton.Node active className="!w-full !h-full" style={{ minHeight: compact ? 120 : 200 }} />
      </div>
    );
  }

  const hasData = hasDataLink && chartData && chartData.datasets.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Criteria-mode subtitle — clarifies bars are sums across selected periods */}
      {!compact && hasData && periodInfo && periodInfo.count > 0 && (
        <div className="mb-1">
          <Text type="secondary" className="!text-[12px]">
            {periodInfo.count === 1
              ? t('widget:criteria_sum_subtitle_one', { range: periodInfo.rangeText })
              : t('widget:criteria_sum_subtitle', {
                  count: periodInfo.count,
                  range: periodInfo.rangeText,
                })}
          </Text>
        </div>
      )}

      {/* trend badge — hidden in compact mode and in criteria mode (sum semantics conflict with period-over-period delta) */}
      {!compact && !isCriteriaMode && chartData?.trend && (
        <div className="mb-2">
          <TrendBadge trend={chartData.trend} />
        </div>
      )}

      {/* chart area — absolute positioning ensures canvas stays within bounds */}
      <div className="flex-1 relative min-h-0">
        {!hasData ? (
          !hasDataLink ? (
            <div
              className={`h-full flex flex-col items-center justify-center gap-3 ${onRequestLink ? 'cursor-pointer hover:bg-[#fafafa] transition-colors rounded-lg' : ''}`}
              onClick={onRequestLink}
            >
              <div className="w-20 h-20 rounded-full bg-[#f0f5ff] flex items-center justify-center">
                <InboxOutlined className="!text-[38px] !text-[#1677ff]" />
              </div>
              <Text strong className="!text-[14px] !text-[#434343]">
                {t('widget:empty_preview_title')}
              </Text>
              <Text type="secondary" className="!text-[12px] !text-center !max-w-[280px]">
                {t('widget:empty_preview_subtitle')}
              </Text>
              {onRequestLink && (
                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1677ff]/10 text-[#1677ff] text-[12px] font-medium">
                  <DatabaseOutlined />
                  {t('widget:select_data_from_import')}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#bfbfbf] gap-2">
              <Text type="secondary" className="!text-[13px]">
                {t('datasheet:no_data_hint')}
              </Text>
            </div>
          )
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
