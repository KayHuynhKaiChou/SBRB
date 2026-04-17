import React from 'react';
import { Checkbox, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface IPeriodCheckboxListProps {
  allPeriods: string[];
  value: string[];
  onChange: (periods: string[]) => void;
}

/**
 * Controlled period filter — no mutations.
 * Parent manages state; changes are only persisted on Save.
 */
export function PeriodCheckboxList({ allPeriods, value, onChange }: IPeriodCheckboxListProps) {
  const { t } = useTranslation('widget');

  if (!allPeriods || allPeriods.length === 0) return null;

  return (
    <div className="mt-4">
      <Text type="secondary" className="!text-[11px] !block !mb-2">
        {t('period_filter')}
      </Text>
      <div className="max-h-[150px] overflow-y-auto custom-scrollbar">
        <Checkbox.Group
          className="flex flex-col gap-1"
          options={allPeriods}
          value={value}
          onChange={(checkedValues) => onChange(checkedValues as string[])}
        />
      </div>
    </div>
  );
}
