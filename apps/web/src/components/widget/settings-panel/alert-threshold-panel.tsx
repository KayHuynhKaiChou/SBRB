import React from 'react';
import { Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

/** Placeholder for future alert threshold configuration */
export function AlertThresholdPanel() {
  return (
    <div
      style={{
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        padding: '12px',
        background: '#fafafa',
        textAlign: 'center',
      }}
    >
      <BellOutlined style={{ fontSize: 20, color: '#bfbfbf', marginBottom: 6, display: 'block' }} />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Cấu hình cảnh báo (coming soon)
      </Text>
    </div>
  );
}
