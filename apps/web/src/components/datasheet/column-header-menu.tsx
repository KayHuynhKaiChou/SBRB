import React, { useState, useRef } from 'react';
import { Dropdown, Input, Button, Popover, Popconfirm, message } from 'antd';
import type { MenuProps, InputRef } from 'antd';
import {
  MoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface IColumnHeaderMenuProps {
  period: string;
  index: number;
  existingPeriods: string[];
  onInsertAt: (periodName: string, index: number) => void;
  onDelete: (period: string) => void;
}

/**
 * Dropdown menu attached to each period column header.
 * Provides excel-like "insert left / insert right / delete" actions.
 *
 * The insert-left and insert-right items each open a mini popover to collect
 * the new period name before calling the mutation.
 */
export function ColumnHeaderMenu({
  period,
  index,
  existingPeriods,
  onInsertAt,
  onDelete,
}: IColumnHeaderMenuProps) {
  const { t } = useTranslation('datasheet');
  const [insertSide, setInsertSide] = useState<'left' | 'right' | null>(null);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<InputRef>(null);

  const closePopover = () => {
    setInsertSide(null);
    setNewName('');
  };

  const confirmInsert = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (existingPeriods.includes(trimmed)) {
      message.warning(t('period_duplicate'));
      return;
    }
    const targetIndex = insertSide === 'right' ? index + 1 : index;
    onInsertAt(trimmed, targetIndex);
    closePopover();
  };

  const insertPopover = (
    <div className="flex flex-col gap-2 w-48" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-gray-500">{t('period_name_label')}</span>
      <Input
        ref={inputRef}
        size="small"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmInsert();
          if (e.key === 'Escape') closePopover();
        }}
        placeholder={t('period_name_placeholder')}
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

  const menuItems: MenuProps['items'] = [
    {
      key: 'insert-left',
      icon: <ArrowLeftOutlined />,
      label: t('insert_column_left'),
      onClick: () => setInsertSide('left'),
    },
    {
      key: 'insert-right',
      icon: <ArrowRightOutlined />,
      label: t('insert_column_right'),
      onClick: () => setInsertSide('right'),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
      label: (
        <Popconfirm
          title={t('confirm_delete_period')}
          onConfirm={() => onDelete(period)}
          okText={t('rename_confirm')}
          cancelText={t('rename_cancel')}
        >
          <span onClick={(e) => e.stopPropagation()}>{t('delete_period')}</span>
        </Popconfirm>
      ),
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
      placement={insertSide === 'right' ? 'bottomRight' : 'bottomLeft'}
      destroyTooltipOnHide
    >
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button
          type="text"
          size="small"
          icon={<MoreOutlined />}
          className="!h-5 !w-5 !min-w-0 !p-0 opacity-0 group-hover/header:!opacity-60 hover:!opacity-100 transition-opacity"
          title={t('column_menu_tooltip')}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </Popover>
  );
}
