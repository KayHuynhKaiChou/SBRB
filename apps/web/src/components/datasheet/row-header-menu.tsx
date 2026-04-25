import React, { memo, useState } from 'react';
import { Dropdown, Input, Button, Popover, Popconfirm, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { useNotify } from '@sbrb/shared-apollo-client';
import {
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface IRowHeaderMenuProps {
  seriesName: string;
  seriesKey: string;
  index: number;
  existingSeries: string[];
  canDelete: boolean;
  onInsertAt: (name: string, index: number) => void;
  onDelete: (key: string) => void;
}

/**
 * Dropdown menu attached to each data row (series name cell).
 * Excel-like "insert above / insert below / delete" actions.
 * Delete is disabled when the sheet has only a single series (guard against empty).
 *
 * Memoized: parent components should pass stable `onInsertAt` / `onDelete` references
 * (via useCallback) so re-renders only occur when row-specific props actually change.
 */
export const RowHeaderMenu = memo(function RowHeaderMenu({
  seriesName,
  seriesKey,
  index,
  existingSeries,
  canDelete,
  onInsertAt,
  onDelete,
}: IRowHeaderMenuProps) {
  const { t } = useTranslation('datasheet');
  const notify = useNotify();
  const [insertSide, setInsertSide] = useState<'above' | 'below' | null>(null);
  const [newName, setNewName] = useState('');

  const closePopover = () => {
    setInsertSide(null);
    setNewName('');
  };

  const confirmInsert = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (existingSeries.includes(trimmed)) {
      notify.warning(t('series_duplicate'));
      return;
    }
    const targetIndex = insertSide === 'below' ? index + 1 : index;
    onInsertAt(trimmed, targetIndex);
    closePopover();
  };

  const insertPopover = (
    <div className="flex flex-col gap-2 w-48" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-gray-500">{t('series_name_label')}</span>
      <Input
        size="small"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmInsert();
          if (e.key === 'Escape') closePopover();
        }}
        placeholder={t('series_name_placeholder')}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button size="small" onClick={closePopover}>
          {t('rename_cancel')}
        </Button>
        <Button
          size="small"
          type="primary"
          onClick={confirmInsert}
          disabled={!newName.trim()}
        >
          {t('rename_confirm')}
        </Button>
      </div>
    </div>
  );

  const deleteLabel = canDelete ? (
    <Popconfirm
      title={t('confirm_delete_series')}
      onConfirm={() => onDelete(seriesKey)}
      okText={t('rename_confirm')}
      cancelText={t('rename_cancel')}
    >
      <span onClick={(e) => e.stopPropagation()}>{t('delete_series')}</span>
    </Popconfirm>
  ) : (
    <Tooltip title={t('cannot_delete_last_series')} placement="right">
      <span className="text-gray-400 cursor-not-allowed" onClick={(e) => e.stopPropagation()}>
        {t('delete_series')}
      </span>
    </Tooltip>
  );

  const menuItems: MenuProps['items'] = [
    {
      key: 'insert-above',
      icon: <ArrowUpOutlined />,
      label: t('insert_row_above'),
      onClick: () => setInsertSide('above'),
    },
    {
      key: 'insert-below',
      icon: <ArrowDownOutlined />,
      label: t('insert_row_below'),
      onClick: () => setInsertSide('below'),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: canDelete,
      disabled: !canDelete,
      label: deleteLabel,
    },
  ];

  return (
    <Popover
      open={insertSide !== null}
      onOpenChange={(open) => {
        if (!open) closePopover();
      }}
      content={insertPopover}
      trigger={[]}
      placement="bottomRight"
      destroyTooltipOnHide
    >
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomLeft">
        <Button
          type="text"
          size="small"
          icon={<MoreOutlined />}
          className="!h-5 !w-5 !min-w-0 !p-0 opacity-0 group-hover/row:!opacity-60 hover:!opacity-100 transition-opacity"
          title={t('row_menu_tooltip')}
          aria-label={`${t('row_menu_tooltip')} — ${seriesName}`}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </Popover>
  );
});
