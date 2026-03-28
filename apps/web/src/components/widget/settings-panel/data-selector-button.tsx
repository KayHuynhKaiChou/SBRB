import React from 'react';
import { Button, Typography } from 'antd';
import { DatabaseOutlined, PlusOutlined, DisconnectOutlined } from '@ant-design/icons';
import type { IWidgetDto } from '@sbrb/shared-types';

const { Text } = Typography;

interface IDataSelectorButtonProps {
  widget: IWidgetDto;
  onOpenSelector: () => void;
  onRemoveLink: () => void;
}

export function DataSelectorButton({ widget, onOpenSelector, onRemoveLink }: IDataSelectorButtonProps) {
  const { dataLink } = widget;
  const hasLink = !!dataLink?.datasheetId;
  const seriesCount = dataLink?.selectedSeriesIds?.length ?? 0;
  const periodsCount = dataLink?.selectedPeriods?.length ?? null;

  if (!hasLink) {
    return (
      <div
        style={{
          border: '1.5px dashed #d9d9d9',
          borderRadius: 8,
          padding: '14px 12px',
          textAlign: 'center',
          background: '#fafafa',
        }}
      >
        <DatabaseOutlined style={{ fontSize: 22, color: '#bfbfbf', marginBottom: 6, display: 'block' }} />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
          Chưa có dữ liệu
        </Text>
        <Button
          size="small"
          type="primary"
          ghost
          icon={<PlusOutlined />}
          onClick={onOpenSelector}
          style={{ fontSize: 12 }}
        >
          Chọn dữ liệu từ file đã import
        </Button>
      </div>
    );
  }

  const periodsLabel = periodsCount !== null ? `${periodsCount} kỳ` : 'Tất cả kỳ';

  return (
    <div
      style={{
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        padding: '10px 12px',
        background: '#f6ffed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <DatabaseOutlined style={{ color: '#52c41a', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <Text style={{ fontSize: 12, display: 'block' }}>DataSheet</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {seriesCount} series · {periodsLabel}
          </Text>
        </div>
      </div>
      <Button
        size="small"
        danger
        icon={<DisconnectOutlined />}
        onClick={onRemoveLink}
        style={{ fontSize: 11, flexShrink: 0 }}
      >
        Xoá liên kết
      </Button>
    </div>
  );
}
