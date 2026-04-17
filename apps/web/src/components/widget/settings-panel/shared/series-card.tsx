import React from 'react';
import { Checkbox, Popover, Typography } from 'antd';
import { BarChartOutlined, LineChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import { ColorGrid } from './color-picker-popover';

const { Text } = Typography;

interface ISeriesCardProps {
  name: string;
  color: string;
  usedColors: Set<string>;
  onColorChange: (color: string) => void;
  widgetChartType: ChartType;
  seriesConfig?: ISeriesConfig;
  onSeriesConfigChange?: (config: ISeriesConfig) => void;
  /** When provided, render a leading checkbox for selection (simple layout) */
  checkable?: {
    checked: boolean;
    onToggle: (checked: boolean) => void;
  };
}

/** Reusable card for configuring one series/department/criteria (color + chart type + Y-axis). */
export function SeriesCard({
  name,
  color,
  usedColors,
  onColorChange,
  widgetChartType,
  seriesConfig,
  onSeriesConfigChange,
  checkable,
}: ISeriesCardProps) {
  const { t } = useTranslation('widget');
  // Chart type always mirrors the global widget chart type — per-series override
  // disabled to avoid conflicts with the top-level "Chart type" selector. Defaults
  // to 'bar' when global is unset/pie (matches build-chart-data fallback).
  const chartType: 'bar' | 'line' = widgetChartType === 'line' ? 'line' : 'bar';
  const yAxis = seriesConfig?.yAxis ?? 'left';
  const isPie = widgetChartType === 'pie';

  const handleAxisToggle = () => {
    if (!onSeriesConfigChange || isPie) return;
    const nextAxis = yAxis === 'left' ? 'right' : 'left';
    onSeriesConfigChange({ ...seriesConfig, yAxis: nextAxis });
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-150 hover:shadow-md"
      style={{
        backgroundColor: `${color}0D`,
        border: `1.5px solid ${color}30`,
        minHeight: 72,
      }}
    >
      {/* Header: optional checkbox + color dot + name */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
        {checkable && (
          <Checkbox
            checked={checkable.checked}
            onChange={(e) => checkable.onToggle(e.target.checked)}
          />
        )}
        <Popover
          content={<ColorGrid currentColor={color} usedColors={usedColors} onSelect={onColorChange} />}
          trigger="click"
          placement="bottomLeft"
        >
          <div
            className="w-5 h-5 rounded-full cursor-pointer shrink-0 border-2 border-white shadow-sm hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={t('series_color')}
          />
        </Popover>
        <Text
          className="!text-[12px] !font-semibold !leading-tight truncate"
          title={name}
        >
          {name}
        </Text>
      </div>

      {/* Body: chart type indicator (read-only) + axis toggle */}
      {!isPie && onSeriesConfigChange ? (
        <div className="px-3 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border opacity-60 cursor-not-allowed select-none"
              style={{
                borderColor: '#e5e7eb',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
              }}
              title={t('series_chart_type_locked')}
            >
              {chartType === 'bar'
                ? <BarChartOutlined style={{ fontSize: 13 }} />
                : <LineChartOutlined style={{ fontSize: 13 }} />
              }
              {chartType === 'bar' ? t('chart_bar') : t('chart_line')}
            </button>

            <button
              type="button"
              onClick={handleAxisToggle}
              className="px-2 py-1 rounded-md text-[11px] font-medium border transition-all duration-100 cursor-pointer hover:shadow-sm"
              style={{
                borderColor: yAxis === 'right' ? `${color}50` : '#e5e7eb',
                color: yAxis === 'right' ? color : '#6b7280',
                backgroundColor: yAxis === 'right' ? `${color}15` : '#fff',
              }}
              title={t('series_y_axis')}
            >
              {yAxis === 'left' ? t('y_axis_left') : t('y_axis_right')}
            </button>
          </div>
        </div>
      ) : (
        <div className="pb-3" />
      )}
    </div>
  );
}
