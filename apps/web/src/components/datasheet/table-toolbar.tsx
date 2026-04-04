import React, { useState, useRef } from 'react';
import { Button, Input, Popover, message } from 'antd';
import type { InputRef } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface ITableToolbarProps {
  datasheetId: string;
  onAddSeries: () => void;
  onAddPeriod: (periodName: string) => void;
  onExport: () => void;
  existingPeriods?: string[];
  loading?: boolean;
}

/** Toolbar above the data table: Add row, Add column (with period-name popover), Export */
export function TableToolbar({
  onAddSeries,
  onAddPeriod,
  onExport,
  existingPeriods = [],
  loading = false,
}: ITableToolbarProps) {
  const { t } = useTranslation('datasheet');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [periodName, setPeriodName] = useState('');
  const inputRef = useRef<InputRef>(null);

  const handleAddPeriodConfirm = () => {
    const trimmed = periodName.trim();
    if (!trimmed) return;
    if (existingPeriods.includes(trimmed)) {
      message.warning(t('period_duplicate'));
      return;
    }
    onAddPeriod(trimmed);
    setPeriodName('');
    setPopoverOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddPeriodConfirm();
    if (e.key === 'Escape') {
      setPeriodName('');
      setPopoverOpen(false);
    }
  };

  const periodPopoverContent = (
    <div className="flex flex-col gap-2 w-48">
      <span className="text-xs text-gray-500">{t('period_name_label')}</span>
      <Input
        ref={inputRef}
        size="small"
        value={periodName}
        onChange={(e) => setPeriodName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('period_name_placeholder')}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button
          size="small"
          onClick={() => {
            setPeriodName('');
            setPopoverOpen(false);
          }}
        >
          {t('rename_cancel')}
        </Button>
        <Button
          size="small"
          type="primary"
          onClick={handleAddPeriodConfirm}
          disabled={!periodName.trim()}
        >
          {t('rename_confirm')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        size="small"
        icon={<PlusOutlined />}
        onClick={onAddSeries}
        disabled={loading}
      >
        {t('add_series')}
      </Button>

      <Popover
        content={periodPopoverContent}
        trigger="click"
        open={popoverOpen}
        onOpenChange={(open) => {
          setPopoverOpen(open);
          if (!open) setPeriodName('');
        }}
      >
        <Button size="small" icon={<PlusOutlined />} disabled={loading}>
          {t('add_period')}
        </Button>
      </Popover>

      <Button
        size="small"
        icon={<DownloadOutlined />}
        onClick={onExport}
        disabled={loading}
      >
        {t('export_excel')}
      </Button>
    </div>
  );
}
