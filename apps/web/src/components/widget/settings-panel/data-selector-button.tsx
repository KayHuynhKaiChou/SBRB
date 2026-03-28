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
      <div className="border border-dashed border-[#d9d9d9] rounded-lg px-3 py-[14px] text-center bg-[#fafafa]">
        <DatabaseOutlined className="!text-[22px] !text-[#bfbfbf] !mb-1.5 !block" />
        <Text type="secondary" className="!text-xs !block !mb-2.5">
          Chưa có dữ liệu
        </Text>
        <Button
          size="small"
          type="primary"
          ghost
          icon={<PlusOutlined />}
          onClick={onOpenSelector}
          className="!text-xs"
        >
          Chọn dữ liệu từ file đã import
        </Button>
      </div>
    );
  }

  const periodsLabel = periodsCount !== null ? `${periodsCount} kỳ` : 'Tất cả kỳ';

  return (
    <div className="border border-[#e8e8e8] rounded-lg px-3 py-[10px] bg-[#f6ffed] flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <DatabaseOutlined className="!text-[#52c41a] !shrink-0" />
        <div className="min-w-0">
          <Text className="!text-xs !block">DataSheet</Text>
          <Text type="secondary" className="!text-[11px]">
            {seriesCount} series · {periodsLabel}
          </Text>
        </div>
      </div>
      <Button
        size="small"
        danger
        icon={<DisconnectOutlined />}
        onClick={onRemoveLink}
        className="!text-[11px] !shrink-0"
      >
        Xoá liên kết
      </Button>
    </div>
  );
}
