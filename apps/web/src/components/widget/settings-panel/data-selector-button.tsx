import React from 'react';
import { Button, Typography } from 'antd';
import { DatabaseOutlined, PlusOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { IWidgetDto } from '@sbrb/shared-types';
import { useDataSheets } from '../../../hooks/use-datasheet';

const { Text } = Typography;

interface IDataSelectorButtonProps {
  widget: IWidgetDto;
  onOpenSelector: () => void;
  onRemoveLink: () => void;
}

export function DataSelectorButton({ widget, onOpenSelector, onRemoveLink }: IDataSelectorButtonProps) {
  const { t } = useTranslation('widget');
  const { dataLink } = widget;
  const hasLink = !!dataLink?.datasheetId;
  // Look up the linked datasheet's name. useDataSheets is cache-and-network — query
  // result is shared with DataSelectorModal's sheet picker, so no extra fetch on repeat.
  const { dataSheets } = useDataSheets(hasLink ? widget.businessId : '');
  const linkedSheet = hasLink
    ? dataSheets.find((s) => s.id === dataLink!.datasheetId)
    : null;
  const displayName = linkedSheet?.name || linkedSheet?.originalFilename || 'DataSheet';

  if (!hasLink) {
    return (
      <div className="border border-dashed border-[#d9d9d9] rounded-lg px-3 py-[14px] text-center bg-[#fafafa]">
        <DatabaseOutlined className="!text-[22px] !text-[#bfbfbf] !mb-1.5 !block" />
        <Text type="secondary" className="!text-xs !block !mb-2.5">
          {t('no_data')}
        </Text>
        <Button
          size="small"
          type="primary"
          ghost
          icon={<PlusOutlined />}
          onClick={onOpenSelector}
          className="!text-xs"
        >
          {t('select_data_from_import')}
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-[#e8e8e8] rounded-lg px-3 py-[10px] bg-[#f6ffed] flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <DatabaseOutlined className="!text-[#52c41a] !shrink-0" />
        <Text className="!text-xs !block !truncate" title={displayName}>
          {displayName}
        </Text>
      </div>
      <Button
        size="small"
        danger
        icon={<DisconnectOutlined />}
        onClick={onRemoveLink}
        className="!text-[11px] !shrink-0"
      >
        {t('unlink_data')}
      </Button>
    </div>
  );
}
