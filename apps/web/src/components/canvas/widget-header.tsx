import React from 'react';
import { Space, Typography, Button, Dropdown } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { IWidgetDto } from '@sbrb/shared-types';
import type { IChartDataResult } from '../../hooks/use-chart-data';

const { Text } = Typography;

interface IWidgetHeaderProps {
  widget: IWidgetDto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** Chart data passed from parent for rendering legend dots */
  chartData?: IChartDataResult | null;
}

/** Renders a small colored dot + label for each dataset (legend row) */
function LegendRow({ datasets }: { datasets: IChartDataResult['datasets'] }) {
  if (!datasets.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
      {datasets.map((ds) => (
        <span key={ds.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ds.borderColor || ds.backgroundColor,
              flexShrink: 0,
            }}
          />
          <Text style={{ fontSize: 11, color: '#595959' }}>{ds.label}</Text>
        </span>
      ))}
    </div>
  );
}

/** Widget card header: drag handle + title + unit + legend + kebab menu */
export function WidgetHeader({ widget, onEdit, onDelete, chartData }: IWidgetHeaderProps) {
  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa',
      onClick: () => onEdit(widget.id),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa widget',
      danger: true,
      onClick: () => onDelete(widget.id),
    },
  ];

  const hasLegend = chartData && chartData.datasets.length > 0;

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
      {/* Top row: drag handle + title + unit + kebab */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined style={{ fontSize: 15, color: '#8c8c8c' }} />}
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: 4, flexShrink: 0 }}
          />
        </Dropdown>
      </div>

      {/* Legend row — only when chart data available */}
      {hasLegend && <LegendRow datasets={chartData.datasets} />}
    </div>
  );
}
