import React, { useState, useRef, useMemo } from 'react';
import { InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { useToggle } from '@uidotdev/usehooks';

interface IEditableCellProps {
  value: number | null;
  onSave: (value: number | null) => void;
}

/** Cell that shows a formatted number and switches to InputNumber on click */
export const EditableCell = React.memo(function EditableCell({ value, onSave }: IEditableCellProps) {
  const { t, i18n } = useTranslation('datasheet');
  const [editing, toggleEditing] = useToggle(false);
  const [draft, setDraft] = useState<number | null>(value);
  const committedRef = useRef(false);

  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  const startEdit = () => {
    committedRef.current = false;
    setDraft(value);
    toggleEditing(true);
  };

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    toggleEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  const cancel = () => {
    committedRef.current = true;
    setDraft(value);
    toggleEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  if (editing) {
    return (
      <InputNumber
        autoFocus
        size="small"
        value={draft}
        onChange={(v) => setDraft(v)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="!w-full"
        controls={false}
      />
    );
  }

  const display = value == null ? '–' : formatter.format(value);

  return (
    <span
      className="block w-full cursor-pointer rounded px-2 py-0.5 text-right font-mono text-gray-700 tabular-nums hover:bg-blue-100/60 hover:ring-1 hover:ring-blue-300/50 transition-all"
      onClick={startEdit}
      title={t('click_to_edit')}
    >
      {display}
    </span>
  );
});
