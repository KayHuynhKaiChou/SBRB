import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import type { IAvailableSeries } from '../../../../hooks/use-chart-data';
import { ConfigRow } from '../shared/config-row';
import { VisibilityCheckboxList } from '../shared/visibility-checkbox-list';

const { Text } = Typography;

interface IPnLLayoutProps {
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

export function PnLLayout({
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
}: IPnLLayoutProps) {
  const { t } = useTranslation('widget');

  // Extract top-level categories and full criteria mapping
  const { topLevels, sortedSeries } = useMemo(() => {
    const rootSet = new Set<string>();
    series.forEach(s => {
      const top = s.name.split(' > ')[0];
      if (top) rootSet.add(top);
    });
    return {
      topLevels: Array.from(rootSet),
      sortedSeries: [...series].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [series]);

  // Compute selected items
  const allSelected = selectedSeriesIds.length === 0;
  const getSelectedCriteriaNames = () => {
    if (allSelected) return sortedSeries.map(s => s.name);
    const idsSet = new Set(selectedSeriesIds);
    return sortedSeries.filter(s => idsSet.has(s.id)).map(s => s.name);
  };
  
  const selectedCriteriaNames = getSelectedCriteriaNames();

  const handleCriteriaChange = (selectedNames: string[]) => {
    if (selectedNames.length === 0 || selectedNames.length === sortedSeries.length) {
      onChange([]);
    } else {
      const nameSet = new Set(selectedNames);
      const newIds = sortedSeries.filter(s => nameSet.has(s.name)).map(s => s.id);
      onChange(newIds);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Text type="secondary" className="!text-[11px] font-semibold">
          {t('pnl_root_config', 'Cấu hình Hạng mục gốc')}
        </Text>
      </div>

      {/* Top-Level Category Settings */}
      <div className="flex flex-col gap-1.5 mb-2">
        {topLevels.map((topLevel, index) => {
          const currentColor = getEffectiveColor(topLevel, index);
          return (
            <div key={topLevel} className="flex overflow-hidden">
              <ConfigRow
                label={topLevel}
                isBold={true}
                color={currentColor}
                usedColors={allUsedColors}
                onColorChange={(color) => onColorsChange({ ...seriesColors, [topLevel]: color })}
                widgetChartType={widgetChartType}
                seriesConfig={seriesConfig[topLevel]}
                onSeriesConfigChange={(config) => onSeriesConfigChange({ ...seriesConfig, [topLevel]: config })}
                showToggle={true}
              />
            </div>
          );
        })}
      </div>

      {/* Hierarchical Visibility Checkboxes */}
      {sortedSeries.length > 0 && (
        <VisibilityCheckboxList
          title={t('pnl_criteria_filter', 'Bật/tắt tiêu chí chi tiết')}
          items={sortedSeries.map(s => s.name)}
          selectedItems={selectedCriteriaNames}
          onChange={handleCriteriaChange}
        />
      )}
    </>
  );
}
