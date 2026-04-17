import React from 'react';
import { Checkbox, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface IVisibilityCheckboxListProps {
  items: string[];
  selectedItems: string[];
  onChange: (selected: string[]) => void;
  title?: string;
}

export function VisibilityCheckboxList({ items, selectedItems, onChange, title }: IVisibilityCheckboxListProps) {
  const { t } = useTranslation('widget');
  
  const allSelected = selectedItems.length === 0 || selectedItems.length === items.length;
  
  const handleToggle = (item: string, checked: boolean) => {
    if (allSelected) {
      // If currently all selected, checking one off means returning the other N-1
      const newItems = items.filter(i => i !== item);
      onChange(newItems);
    } else if (checked) {
      const newItems = [...selectedItems, item];
      // If all are selected, we can clear the array or pass full array
      onChange(newItems.length === items.length ? [] : newItems);
    } else {
      onChange(selectedItems.filter(i => i !== item));
    }
  };

  const handleSelectAll = () => onChange([]);
  const handleDeselectAll = () => onChange([]);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <Text type="secondary" className="!text-[11px] font-semibold">
          {title || t('global_criteria_filter')}
        </Text>
        <div className="flex gap-2">
          <span className="text-[11px] text-blue-500 cursor-pointer hover:underline" onClick={handleSelectAll}>
            {t('series_select_all')}
          </span>
          <span className="text-[11px] text-gray-300">/</span>
          <span className="text-[11px] text-blue-500 cursor-pointer hover:underline" onClick={handleDeselectAll}>
            {t('series_deselect_all')}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
        {items.map(item => (
          <div key={item} className="flex items-center gap-2 pr-2">
            <Checkbox
              checked={allSelected || selectedItems.includes(item)}
              onChange={(e) => handleToggle(item, e.target.checked)}
            />
            <Text className="!text-xs flex-1 truncate" title={item}>
              {item}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
