import React, { useMemo } from 'react';
import { Space, Typography } from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import type { IWidgetDto } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../hooks/use-chart-data';
import { buildChartData, isMixedChart } from '../widget/chart-panel/build-chart-data';

const { Text } = Typography;

interface ILegendItem {
  label: string;
  color: string;
}

interface IWidgetHeaderProps {
  widget: IWidgetDto;
  /** Chart data passed from parent for rendering legend dots */
  chartData?: IChartDataResult | null;
}

/** Renders a small colored dot + label for each legend entry */
function LegendRow({ items }: { items: ILegendItem[] }) {
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
      {items.map((item) => (
        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: item.color,
              flexShrink: 0,
            }}
          />
          <Text style={{ fontSize: 11, color: '#595959' }}>{item.label}</Text>
        </span>
      ))}
    </div>
  );
}

/** Widget card header: drag handle + title + unit + legend */
export function WidgetHeader({ widget, chartData }: IWidgetHeaderProps) {
  const hasLegend = chartData && chartData.datasets.length > 0;
  const config = widget.chartConfig;

  const legendItems = useMemo((): ILegendItem[] => {
    if (!chartData || chartData.datasets.length === 0) return [];

    const isDepartmental = chartData.datasets.some(ds => ds.departmentName != null);

    // Departmental template: use buildChartData to get grouped legend (by dept or criteria)
    if (isDepartmental && config) {
      const mixed = isMixedChart(chartData.datasets, config);
      const processed = buildChartData(chartData, config, mixed);

      if (config.type === 'pie') {
        const ds = processed.datasets[0];
        const colors = ds.backgroundColor as string[];
        return (processed.labels as string[]).map((label, i) => ({
          label,
          color: Array.isArray(colors) ? colors[i] : (colors as string),
        }));
      }

      return processed.datasets
        .filter((ds): ds is typeof ds & { label: string } => 'label' in ds)
        .map(ds => ({
          label: ds.label,
          color: (ds.borderColor || ds.backgroundColor) as string,
        }));
    }

    // Simple template: use raw datasets directly (unchanged behavior)
    return chartData.datasets.map(ds => ({
      label: ds.label,
      color: ds.borderColor || ds.backgroundColor,
    }));
  }, [chartData, config]);

  return (
    <div
      className="widget-drag-handle"
      style={{
        cursor: 'move',
        userSelect: 'none',
        padding: '10px 12px 8px 12px',
        background: '#ffffff',
        borderBottom: '1px solid #f0f0f5',
      }}
    >
      {/* Top row: drag handle + title + unit */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Space size={6} style={{ flex: 1, minWidth: 0 }}>
          <HolderOutlined style={{ fontSize: 13, color: '#d9d9d9', cursor: 'grab', flexShrink: 0 }} />
          <Text
            strong
            ellipsis
            style={{ fontSize: 14, color: '#1a1a2e', lineHeight: '20px' }}
          >
            {widget.name}
          </Text>
          {widget.unit && (
            <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
              ({widget.unit})
            </Text>
          )}
        </Space>
      </div>

      {/* Legend row — only when chart data available */}
      {hasLegend && <LegendRow items={legendItems} />}
    </div>
  );
}
