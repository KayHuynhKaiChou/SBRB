import React from 'react';
import { Typography } from 'antd';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import { SeriesTypeAxisToggle } from '../series-type-axis-toggle';
import { ColorPickerPopover } from './color-picker-popover';

const { Text } = Typography;

export interface IConfigRowProps {
  label: string;
  isBold?: boolean;
  indent?: number;
  color: string;
  usedColors: Set<string>;
  onColorChange: (color: string) => void;
  widgetChartType: ChartType;
  seriesConfig?: ISeriesConfig;
  onSeriesConfigChange?: (config: ISeriesConfig) => void;
  showToggle?: boolean;
}

export function ConfigRow({
  label,
  isBold = false,
  indent = 0,
  color,
  usedColors,
  onColorChange,
  widgetChartType,
  seriesConfig,
  onSeriesConfigChange,
  showToggle = true,
}: IConfigRowProps) {
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: indent * 16 }}>
      <Text className={`!text-xs flex-1 truncate ${isBold ? 'font-semibold' : ''}`} title={label}>
        {label}
      </Text>
      
      {showToggle && widgetChartType !== 'pie' && onSeriesConfigChange && (
        <SeriesTypeAxisToggle
          chartType={seriesConfig?.type ?? (widgetChartType as 'bar' | 'line')}
          yAxis={seriesConfig?.yAxis ?? 'left'}
          onTypeChange={(type) => {
            const current = seriesConfig ?? { type: widgetChartType as 'bar' | 'line', yAxis: 'left' as const };
            onSeriesConfigChange({ ...current, type });
          }}
          onAxisChange={(axis) => {
            const current = seriesConfig ?? { type: widgetChartType as 'bar' | 'line', yAxis: 'left' as const };
            onSeriesConfigChange({ ...current, yAxis: axis });
          }}
        />
      )}
      
      <ColorPickerPopover
        currentColor={color}
        usedColors={usedColors}
        onSelect={onColorChange}
      />
    </div>
  );
}
