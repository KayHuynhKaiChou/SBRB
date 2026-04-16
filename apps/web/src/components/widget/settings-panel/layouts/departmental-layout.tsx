import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import type { IAvailableSeries } from '../../../../hooks/use-chart-data';
import { ConfigRow } from '../shared/config-row';
import { VisibilityCheckboxList } from '../shared/visibility-checkbox-list';

const { Text } = Typography;

interface IDepartmentalLayoutProps {
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
  xAxisGroup?: 'time' | 'department' | 'criteria';
  periodHeaders?: string[];
}

/**
 * Departmental layout adapts based on xAxisGroup:
 *
 * X=time:       ConfigRows per department  + Filter by criteria
 * X=department: ConfigRows per criteria    + Filter by period
 * X=criteria:   ConfigRows per department  + Filter by period
 */
export function DepartmentalLayout({
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
  xAxisGroup = 'time',
  periodHeaders = [],
}: IDepartmentalLayoutProps) {
  const { t } = useTranslation('widget');

  const { departments, criteriaNames } = useMemo(() => {
    const deps = new Set<string>();
    const crits = new Set<string>();
    series.forEach(s => {
      if (s.departmentName) deps.add(s.departmentName);
      crits.add(s.name);
    });
    return { departments: Array.from(deps), criteriaNames: Array.from(crits) };
  }, [series]);

  // Determine config rows based on xAxisGroup
  // X=time or X=criteria → config per department (color/type/axis)
  // X=department → config per criteria
  const isGroupByDept = xAxisGroup === 'time' || xAxisGroup === 'criteria';
  const configItems = isGroupByDept ? departments : criteriaNames;
  const configTitle = isGroupByDept
    ? t('departments_config', 'Phòng ban (Màu / Loại)')
    : t('criteria_config', 'Tiêu chí (Màu / Loại)');

  // Criteria filter only shown when X=time (criteria is the filtered dimension)
  // Period filter is handled by standalone PeriodCheckboxList (always present)
  const showCriteriaFilter = xAxisGroup === 'time';

  // Criteria selection logic (only used when showCriteriaFilter)
  const allSelected = selectedSeriesIds.length === 0;

  const selectedCriteriaNames = useMemo(() => {
    if (!showCriteriaFilter) return criteriaNames;
    if (allSelected) return criteriaNames;
    const idsSet = new Set(selectedSeriesIds);
    return criteriaNames.filter(name =>
      series.some(s => s.name === name && idsSet.has(s.id)),
    );
  }, [allSelected, selectedSeriesIds, showCriteriaFilter, criteriaNames, series]);

  const handleCriteriaFilterChange = (selected: string[]) => {
    if (selected.length === 0 || selected.length === criteriaNames.length) {
      onChange([]);
      return;
    }
    const nameSet = new Set(selected);
    const newIds = series.filter(s => nameSet.has(s.name)).map(s => s.id);
    onChange(newIds);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Text type="secondary" className="!text-[11px] font-semibold">
          {configTitle}
        </Text>
      </div>

      <div className="flex flex-col gap-1.5 mb-2">
        {configItems.map((item, index) => {
          const currentColor = getEffectiveColor(item, index);
          return (
            <div key={item} className="flex overflow-hidden">
              <ConfigRow
                label={item}
                isBold={isGroupByDept}
                color={currentColor}
                usedColors={allUsedColors}
                onColorChange={(color) => onColorsChange({ ...seriesColors, [item]: color })}
                widgetChartType={widgetChartType}
                seriesConfig={seriesConfig[item]}
                onSeriesConfigChange={(config) => onSeriesConfigChange({ ...seriesConfig, [item]: config })}
                showToggle={true}
              />
            </div>
          );
        })}
      </div>

      {showCriteriaFilter && criteriaNames.length > 0 && (
        <VisibilityCheckboxList
          title={t('global_criteria_filter', 'Bộ lọc tiêu chí')}
          items={criteriaNames}
          selectedItems={selectedCriteriaNames}
          onChange={handleCriteriaFilterChange}
        />
      )}
    </>
  );
}
