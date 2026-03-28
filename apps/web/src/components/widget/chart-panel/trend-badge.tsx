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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 12,
        background: `${color}18`,
        color,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {icon}
      {Math.abs(trend.value).toFixed(1)}%
      <span style={{ color: '#8c8c8c', fontSize: 11, fontWeight: 400 }}>vs {trend.vsLabel}</span>
    </span>
  );
}
