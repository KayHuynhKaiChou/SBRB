import React from 'react';
import { Checkbox, Typography, Popover, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { CheckOutlined } from '@ant-design/icons';
import { CHART_COLORS } from '@sbrb/shared-constants';
import type { ChartType, ISeriesConfig } from '@sbrb/shared-types';
import { useAvailableSeries } from '../../../hooks/use-chart-data';
import { SeriesTypeAxisToggle } from './series-type-axis-toggle';

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
}

interface IColorGridProps {
  currentColor: string;
  usedColors: Set<string>;
  onSelect: (color: string) => void;
}

function ColorGrid({ currentColor, usedColors, onSelect }: IColorGridProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 p-1">
      {CHART_COLORS.map((color, i) => {
        const isCurrent = currentColor === color;
        const isUsed = !isCurrent && usedColors.has(color);
        return (
          <div
            key={i}
            onClick={() => !isUsed && onSelect(color)}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${isUsed ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
            style={{
              backgroundColor: color,
              border: isCurrent ? '2px solid #333' : '2px solid transparent',
            }}
          >
            {isCurrent && <CheckOutlined style={{ color: '#fff', fontSize: 9 }} />}
          </div>
        );
      })}
    </div>
  );
}

export function SeriesColorPicker({
  widgetId,
  hasDataLink,
  value: selectedSeriesIds = [],
  onChange,
  seriesColors,
  onColorsChange,
  widgetChartType,
  seriesConfig,
  onSeriesConfigChange,
}: ISeriesColorPickerProps) {
  const { t } = useTranslation('widget');
  const { series, loading } = useAvailableSeries(hasDataLink ? widgetId : null);

  // Compute effective color per series — explicit override, else palette fallback by full-list index
  const getEffectiveColor = (seriesName: string, index: number) =>
    seriesColors[seriesName] || CHART_COLORS[index % CHART_COLORS.length];

  // On first load, persist default colors so chart-preview always uses explicit colors
  // (avoids filtered-index mismatch when some series are unchecked)
  React.useEffect(() => {
    if (series.length === 0) return;
    const hasAnyColor = series.some((s) => seriesColors[s.name]);
    if (hasAnyColor) return; // Already initialized — don't overwrite user picks
    const defaults: Record<string, string> = {};
    series.forEach((s, i) => { defaults[s.name] = CHART_COLORS[i % CHART_COLORS.length]; });
    onColorsChange(defaults);
  }, [series]); // eslint-disable-line react-hooks/exhaustive-deps

  // Empty selectedSeriesIds means all series are selected
  const allSelected = selectedSeriesIds.length === 0;

  const isSeriesSelected = (id: string) => allSelected || selectedSeriesIds.includes(id);

  const handleToggle = (id: string, checked: boolean) => {
    if (allSelected) {
      const newIds = series.filter((s) => s.id !== id).map((s) => s.id);
      onChange?.(newIds);
    } else if (checked) {
      const newIds = [...selectedSeriesIds, id];
      onChange?.(newIds.length === series.length ? [] : newIds);
    } else {
      onChange?.(selectedSeriesIds.filter((sid) => sid !== id));
    }
  };

  const handleSelectAll = () => onChange?.([]);
  const handleDeselectAll = () => onChange?.([]);

  // Compute set of all used colors (for disabling in color grid)
  const allUsedColors = new Set(Object.values(seriesColors));

  const handleColorChange = (seriesName: string, color: string) => {
    onColorsChange({ ...seriesColors, [seriesName]: color });
  };

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Text type="secondary" className="!text-[11px]">
          {t('series_section')}
        </Text>
        <div className="flex gap-2">
          <span
            className="text-[11px] text-blue-500 cursor-pointer hover:underline"
            onClick={handleSelectAll}
          >
            {t('series_select_all')}
          </span>
          <span className="text-[11px] text-gray-300">/</span>
          <span
            className="text-[11px] text-blue-500 cursor-pointer hover:underline"
            onClick={handleDeselectAll}
          >
            {t('series_deselect_all')}
          </span>
        </div>
      </div>

      {/* Series list */}
      {loading ? (
        <div className="flex justify-center py-3">
          <Spin size="small" />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {series.map((s, index) => {
            const currentColor = getEffectiveColor(s.name, index);
            return (
              <div key={s.id} className="flex items-center gap-2">
                <Checkbox
                  checked={isSeriesSelected(s.id)}
                  onChange={(e) => handleToggle(s.id, e.target.checked)}
                />
                <Text className="!text-xs flex-1 truncate" title={s.name}>
                  {s.name}
                </Text>
                {widgetChartType !== 'pie' && (
                  <SeriesTypeAxisToggle
                    chartType={seriesConfig[s.name]?.type ?? (widgetChartType as 'bar' | 'line')}
                    yAxis={seriesConfig[s.name]?.yAxis ?? 'left'}
                    disabled={!isSeriesSelected(s.id)}
                    onTypeChange={(type) => {
                      const current = seriesConfig[s.name] ?? { type: widgetChartType as 'bar' | 'line', yAxis: 'left' as const };
                      onSeriesConfigChange({ ...seriesConfig, [s.name]: { ...current, type } });
                    }}
                    onAxisChange={(axis) => {
                      const current = seriesConfig[s.name] ?? { type: widgetChartType as 'bar' | 'line', yAxis: 'left' as const };
                      onSeriesConfigChange({ ...seriesConfig, [s.name]: { ...current, yAxis: axis } });
                    }}
                  />
                )}
                <Popover
                  content={
                    <ColorGrid
                      currentColor={currentColor}
                      usedColors={allUsedColors}
                      onSelect={(color) => handleColorChange(s.name, color)}
                    />
                  }
                  trigger="click"
                  placement="right"
                >
                  <div
                    className="w-7 h-7 rounded-full cursor-pointer border-2 border-transparent hover:border-gray-400 transition-colors shrink-0"
                    style={{ backgroundColor: currentColor }}
                    title={t('series_color')}
                  />
                </Popover>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
