import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import type { IAvailableSeries } from '../../../../hooks/use-chart-data';
import { SeriesCard } from '../shared/series-card';

const { Text } = Typography;

interface ISimpleLayoutProps {
  series: IAvailableSeries[];
  selectedSeriesIds: string[];
  onChange: (ids: string[]) => void;
  seriesColors: Record<string, string>;
  onColorsChange: (colors: Record<string, string>) => void;
  widgetChartType: ChartType;
  seriesConfig: Record<string, ISeriesConfig>;
  onSeriesConfigChange: (config: Record<string, ISeriesConfig>) => void;
  allUsedColors: Set<string>;
  getEffectiveColor: (key: string, index: number) => string;
}

export function SimpleLayout({
  series,
  selectedSeriesIds,
  onChange,
  seriesColors,
  onColorsChange,
  widgetChartType,
  seriesConfig,
  onSeriesConfigChange,
  allUsedColors,
  getEffectiveColor
}: ISimpleLayoutProps) {
  const { t } = useTranslation('widget');
  const allSelected =
    selectedSeriesIds.length === 0 || selectedSeriesIds.length === series.length;
  const isSeriesSelected = (id: string) => allSelected || selectedSeriesIds.includes(id);

  const handleToggle = (id: string, checked: boolean) => {
    if (allSelected) {
      const newIds = series.filter((s) => s.id !== id).map((s) => s.id);
      onChange(newIds);
    } else if (checked) {
      const newIds = [...selectedSeriesIds, id];
      onChange(newIds.length === series.length ? [] : newIds);
    } else {
      onChange(selectedSeriesIds.filter((sid) => sid !== id));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Text type="secondary" className="!text-[11px] font-semibold">
          {t('series_section')}
        </Text>
        {!allSelected && (
          <span
            className="text-[11px] text-blue-500 cursor-pointer hover:underline"
            onClick={() => onChange([])}
          >
            {t('series_select_all')}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {series.map((s, index) => (
          <SeriesCard
            key={s.id}
            name={s.name}
            color={getEffectiveColor(s.name, index)}
            usedColors={allUsedColors}
            onColorChange={(color) => onColorsChange({ ...seriesColors, [s.name]: color })}
            widgetChartType={widgetChartType}
            seriesConfig={seriesConfig[s.name]}
            onSeriesConfigChange={(config) => onSeriesConfigChange({ ...seriesConfig, [s.name]: config })}
            checkable={{
              checked: isSeriesSelected(s.id),
              onToggle: (checked) => handleToggle(s.id, checked),
            }}
          />
        ))}
      </div>
    </>
  );
}
