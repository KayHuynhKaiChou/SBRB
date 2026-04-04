import React from 'react';
import { Segmented } from 'antd';
import { BarChartOutlined, LineChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface ISeriesTypeAxisToggleProps {
  chartType: 'bar' | 'line';
  yAxis: 'left' | 'right';
  disabled?: boolean;
  onTypeChange: (type: 'bar' | 'line') => void;
  onAxisChange: (axis: 'left' | 'right') => void;
}

export function SeriesTypeAxisToggle({
  chartType,
  yAxis,
  disabled,
  onTypeChange,
  onAxisChange,
}: ISeriesTypeAxisToggleProps) {
  const { t } = useTranslation('widget');

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Segmented
        size="small"
        disabled={disabled}
        value={chartType}
        onChange={(v) => onTypeChange(v as 'bar' | 'line')}
        options={[
          { value: 'bar', icon: <BarChartOutlined /> },
          { value: 'line', icon: <LineChartOutlined /> },
        ]}
      />
      <Segmented
        size="small"
        disabled={disabled}
        value={yAxis}
        onChange={(v) => onAxisChange(v as 'left' | 'right')}
        options={[
          { value: 'left', label: t('y_axis_left') },
          { value: 'right', label: t('y_axis_right') },
        ]}
      />
    </div>
  );
}
