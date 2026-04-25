import React, { useState, useRef } from 'react';
import { Input } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface IDeptNameCellProps {
  deptId: string;
  name: string;
  onRename?: (deptId: string, newName: string) => void;
}

/**
 * Inline-editable department name in column-group header.
 * Mirrors SeriesNameCell behavior — click to edit, Enter commits, Escape cancels,
 * blur commits. Memoized to avoid re-rendering all dept headers when a single
 * dept's row data changes.
 */
export const DeptNameCell = React.memo(function DeptNameCell({
  deptId,
  name,
  onRename,
}: IDeptNameCellProps) {
  const { t } = useTranslation('datasheet');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const committedRef = useRef(false);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRename) return;
    committedRef.current = false;
    setDraft(name);
    setEditing(true);
  };

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      onRename?.(deptId, trimmed);
    }
  };

  const cancel = () => {
    committedRef.current = true;
    setDraft(name);
    setEditing(false);
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
        onClick={(e) => e.stopPropagation()}
        className="!max-w-[180px]"
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${onRename ? 'cursor-pointer group/deptname' : ''}`}
      onClick={startEdit}
      title={onRename ? t('rename_department') : undefined}
    >
      <span>{name}</span>
      {onRename && (
        <EditOutlined className="opacity-0 group-hover/deptname:opacity-50 text-xs shrink-0 transition-opacity" />
      )}
    </span>
  );
});
