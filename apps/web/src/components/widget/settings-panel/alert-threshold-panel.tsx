import React from 'react';
import { Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

/** Placeholder for future alert threshold configuration */
export function AlertThresholdPanel() {
  return (
    <div className="border border-[#e8e8e8] rounded-lg p-3 bg-[#fafafa] text-center">
      <BellOutlined className="!text-[20px] !text-[#bfbfbf] !mb-1.5 !block" />
      <Text type="secondary" className="!text-xs">
        Cấu hình cảnh báo (coming soon)
      </Text>
    </div>
  );
}
