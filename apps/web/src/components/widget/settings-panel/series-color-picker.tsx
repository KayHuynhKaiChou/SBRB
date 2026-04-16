import React, { useMemo } from 'react';
import { Typography, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from '@sbrb/shared-constants';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import { useAvailableSeries } from '../../../hooks/use-chart-data';
import { SimpleLayout } from './layouts/simple-layout';
import { DepartmentalLayout } from './layouts/departmental-layout';
import { PnLLayout } from './layouts/pnl-layout';

const { Text } = Typography;

interface ISeriesColorPickerProps {
  widgetId: string;
  hasDataLink: boolean;
  value?: string[];              // Form.Item injects selectedSeriesIds
  onChange?: (ids: string[]) => void; // Form.Item injects handler
  seriesColors: Record<string, string>;
  onColorsChange: (colors: Record<string, string>) => void;
  widgetChartType: ChartType;
  seriesConfig: Record<string, ISeriesConfig>;
  onSeriesConfigChange: (config: Record<string, ISeriesConfig>) => void;
  xAxisGroup?: 'time' | 'department' | 'criteria';
  periodHeaders?: string[];
}

export function SeriesColorPicker({
  widgetId,
  hasDataLink,
  value: selectedSeriesIds = [],
  onChange = () => {},
  seriesColors,
  onColorsChange,
  widgetChartType,
  seriesConfig,
  onSeriesConfigChange,
  xAxisGroup = 'time',
  periodHeaders = [],
}: ISeriesColorPickerProps) {
  const { t } = useTranslation('widget');
  const { series, loading } = useAvailableSeries(hasDataLink ? widgetId : null);

  // Identify the global template type from the first series
  const templateType = useMemo(() => {
    if (!series || series.length === 0) return 'simple';
    return series[0].templateType || 'simple';
  }, [series]);

  // Compute effective color per series/department — explicit override, else palette fallback by internal index computation
  const getEffectiveColor = (key: string, index: number) =>
    seriesColors[key] || CHART_COLORS[index % CHART_COLORS.length];

  const allUsedColors = useMemo(() => new Set(Object.values(seriesColors)), [seriesColors]);

  // Initial colors
  React.useEffect(() => {
    if (series.length === 0) return;
    const hasAnyColor = Object.keys(seriesColors).length > 0;
    if (hasAnyColor) return;
    
    const defaults: Record<string, string> = {};
    if (templateType === 'simple') {
      series.forEach((s, i) => { defaults[s.name] = CHART_COLORS[i % CHART_COLORS.length]; });
    } else if (templateType === 'department') {
      const deps = Array.from(new Set(series.map(s => s.departmentName).filter(Boolean))) as string[];
      deps.forEach((d, i) => { defaults[d] = CHART_COLORS[i % CHART_COLORS.length]; });
    } else if (templateType === 'pnl') {
      const topLevels = Array.from(new Set(series.map(s => s.name.split(' > ')[0]).filter(Boolean))) as string[];
      topLevels.forEach((top, i) => { defaults[top] = CHART_COLORS[i % CHART_COLORS.length]; });
    }
    
    if (Object.keys(defaults).length > 0) {
      onColorsChange(defaults);
    }
  }, [series, templateType]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasDataLink) {
    return (
      <div>
        <Text type="secondary" className="!text-[11px] !block !mb-2">
          {t('series_section')}
        </Text>
        <Text type="secondary" className="!text-xs italic">
          {t('no_datasheet_linked')}
        </Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Spin size="small" />
      </div>
    );
  }

  const commonProps = {
    series,
    selectedSeriesIds,
    onChange,
    seriesColors,
    onColorsChange,
    widgetChartType,
    seriesConfig,
    onSeriesConfigChange,
    allUsedColors,
    getEffectiveColor,
    xAxisGroup,
    periodHeaders,
  };

  return (
    <div className="series-color-picker-container">
      {templateType === 'department' ? (
        <DepartmentalLayout {...commonProps} />
      ) : templateType === 'pnl' ? (
        <PnLLayout {...commonProps} />
      ) : (
        <SimpleLayout {...commonProps} />
      )}
    </div>
  );
}
