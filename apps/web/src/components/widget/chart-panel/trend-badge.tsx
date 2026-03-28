import React from 'react';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import type { IChartTrend } from '../../../hooks/use-chart-data';

const DIRECTION_CONFIG = {
  up: { color: '#52c41a', icon: <ArrowUpOutlined /> },
  down: { color: '#ff4d4f', icon: <ArrowDownOutlined /> },
  neutral: { color: '#8c8c8c', icon: <MinusOutlined /> },
};

interface ITrendBadgeProps {
  trend: IChartTrend;
}

export function TrendBadge({ trend }: ITrendBadgeProps) {
  const { color, icon } = DIRECTION_CONFIG[trend.direction];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[13px] font-medium"
      style={{
        background: `${color}18`,
        color,
      }}
    >
      {icon}
      {Math.abs(trend.value).toFixed(1)}%
      <span className="text-[#8c8c8c] text-[11px] font-normal">vs {trend.vsLabel}</span>
    </span>
  );
}
