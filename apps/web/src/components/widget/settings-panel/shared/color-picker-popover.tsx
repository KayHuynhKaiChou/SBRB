import React from 'react';
import { Popover } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from '@sbrb/shared-constants';

interface IColorGridProps {
  currentColor: string;
  usedColors: Set<string>;
  onSelect: (color: string) => void;
}

export function ColorGrid({ currentColor, usedColors, onSelect }: IColorGridProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 p-1">
      {CHART_COLORS.map((color, i) => {
        const isCurrent = currentColor === color;
        const isUsed = !isCurrent && usedColors.has(color);
        return (
          <div
            key={i}
            onClick={() => !isUsed && onSelect(color)}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${isUsed ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
            style={{
              backgroundColor: color,
              border: isCurrent ? '2px solid #333' : '2px solid transparent',
            }}
          >
            {isCurrent && <CheckOutlined style={{ color: '#fff', fontSize: 9 }} />}
          </div>
        );
      })}
    </div>
  );
}

interface IColorPickerPopoverProps {
  currentColor: string;
  usedColors: Set<string>;
  onSelect: (color: string) => void;
}

export function ColorPickerPopover({ currentColor, usedColors, onSelect }: IColorPickerPopoverProps) {
  const { t } = useTranslation('widget');
  
  return (
    <Popover
      content={<ColorGrid currentColor={currentColor} usedColors={usedColors} onSelect={onSelect} />}
      trigger="click"
      placement="right"
    >
      <div
        className="w-7 h-7 rounded-full cursor-pointer border-2 border-transparent hover:border-gray-400 transition-colors shrink-0"
        style={{ backgroundColor: currentColor }}
        title={t('series_color')}
      />
    </Popover>
  );
}
