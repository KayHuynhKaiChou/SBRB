import React from 'react';
import { Checkbox, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from '@sbrb/shared-constants';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import type { IAvailableSeries } from '../../../../hooks/use-chart-data';
import { ConfigRow } from '../shared/config-row';

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
  const allSelected = selectedSeriesIds.length === 0;
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

  const handleSelectAll = () => onChange([]);
  const handleDeselectAll = () => onChange([]);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Text type="secondary" className="!text-[11px]">
          {t('series_section')}
        </Text>
        <div className="flex gap-2">
          <span className="text-[11px] text-blue-500 cursor-pointer hover:underline" onClick={handleSelectAll}>
            {t('series_select_all')}
          </span>
          <span className="text-[11px] text-gray-300">/</span>
          <span className="text-[11px] text-blue-500 cursor-pointer hover:underline" onClick={handleDeselectAll}>
            {t('series_deselect_all')}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {series.map((s, index) => {
          const currentColor = getEffectiveColor(s.name, index);
          return (
            <div key={s.id} className="flex items-center gap-2">
              <Checkbox
                checked={isSeriesSelected(s.id)}
                onChange={(e) => handleToggle(s.id, e.target.checked)}
              />
              <div className="flex-1 overflow-hidden">
                <ConfigRow
                  label={s.name}
                  color={currentColor}
                  usedColors={allUsedColors}
                  onColorChange={(color) => onColorsChange({ ...seriesColors, [s.name]: color })}
                  widgetChartType={widgetChartType}
                  seriesConfig={seriesConfig[s.name]}
                  onSeriesConfigChange={(config) => onSeriesConfigChange({ ...seriesConfig, [s.name]: config })}
                  showToggle={isSeriesSelected(s.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
