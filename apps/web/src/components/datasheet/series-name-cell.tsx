import React, { useState, useRef } from 'react';
import { Input } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useToggle } from '@uidotdev/usehooks';

interface ISeriesNameCellProps {
  seriesId: string;
  name: string;
  onRename?: (seriesId: string, newName: string) => void;
}

/** Inline-editable series name cell: shows name with edit icon, switches to Input on click */
export const SeriesNameCell = React.memo(function SeriesNameCell({
  seriesId,
  name,
  onRename,
}: ISeriesNameCellProps) {
  const { t } = useTranslation('datasheet');
  const [editing, toggleEditing] = useToggle(false);
  const [draft, setDraft] = useState(name);
  const committedRef = useRef(false);

  const startEdit = () => {
    if (!onRename) return;
    committedRef.current = false;
    setDraft(name);
    toggleEditing(true);
  };

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    toggleEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onRename?.(seriesId, trimmed);
    }
  };

  const cancel = () => {
    committedRef.current = true;
    setDraft(name);
    toggleEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  if (editing) {
    return (
      <Input
        autoFocus
        size="small"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="!w-full"
      />
    );
  }

  return (
    <span
      className={`flex items-center gap-1.5 group/name font-medium text-gray-800 ${onRename ? 'cursor-pointer' : ''}`}
      onClick={startEdit}
      title={onRename ? t('rename_series') : undefined}
    >
      <span className="flex-1 truncate">{name}</span>
      {onRename && (
        <EditOutlined className="opacity-0 group-hover/name:opacity-50 text-xs shrink-0 transition-opacity" />
      )}
    </span>
  );
});
