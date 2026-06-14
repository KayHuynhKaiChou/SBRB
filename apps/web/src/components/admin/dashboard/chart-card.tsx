import React from 'react';
import { Card, Empty, Skeleton, Typography } from 'antd';

const { Text } = Typography;

interface IChartCardProps {
  title: string;
  loading?: boolean;
  /** When false, renders an empty-state instead of the chart. */
  hasData?: boolean;
  emptyText?: string;
  /** Canvas wrapper height in px (chart.js needs a bounded parent). */
  height?: number;
  children: React.ReactNode;
}

/** Card shell for a dashboard chart: title, loading skeleton, empty state. */
export function ChartCard({
  title,
  loading = false,
  hasData = true,
  emptyText,
  height = 280,
  children,
}: IChartCardProps) {
  return (
    <Card className="h-full" styles={{ body: { padding: 20 } }}>
      <Text strong className="!text-[15px] !text-gray-700">
        {title}
      </Text>
      <div className="mt-4 relative" style={{ height }}>
        {loading ? (
          <Skeleton.Node active className="!w-full !h-full">
            <span />
          </Skeleton.Node>
        ) : hasData ? (
          children
        ) : (
          <div className="h-full flex items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text type="secondary">{emptyText}</Text>}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
