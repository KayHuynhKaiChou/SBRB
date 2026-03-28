import React from 'react';
import { Typography } from 'antd';
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, AreaChartOutlined } from '@ant-design/icons';
import type { ChartType } from '@sbrb/shared-types';

const { Text } = Typography;

const CHART_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Cột', icon: <BarChartOutlined /> },
  { type: 'line', label: 'Đường', icon: <LineChartOutlined /> },
  { type: 'area', label: 'Diện tích', icon: <AreaChartOutlined /> },
  { type: 'doughnut', label: 'Vòng', icon: <PieChartOutlined /> },
];

interface IChartTypeSelectorProps {
  value?: ChartType;
  onChange?: (type: ChartType) => void;
}

export function ChartTypeSelector({ value, onChange }: IChartTypeSelectorProps) {
  return (
    <div>
      <Text type="secondary" className="!text-[11px] !block !mb-2">
        Loại biểu đồ
      </Text>
      <div className="grid grid-cols-2 gap-2">
        {CHART_TYPES.map((item) => {
          const isSelected = value === item.type;
          return (
            <div
              key={item.type}
              onClick={() => onChange?.(item.type)}
              className="flex flex-col items-center gap-1 px-2 py-[10px] rounded-[6px] cursor-pointer transition-all duration-[150ms] select-none"
              style={{
                border: `2px solid ${isSelected ? '#D72A44' : '#e8e8e8'}`,
                background: isSelected ? 'rgba(215,42,68,0.06)' : '#fff',
              }}
            >
              <span style={{ fontSize: 18, color: isSelected ? '#D72A44' : '#666' }}>
                {item.icon}
              </span>
              <Text style={{ fontSize: 11, color: isSelected ? '#D72A44' : '#666' }}>
                {item.label}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
