import React from 'react';
import { Typography } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CHART_COLORS } from '@sbrb/shared-constants';

const { Text } = Typography;

interface IColorPaletteSelectorProps {
  value?: number;
  onChange?: (index: number) => void;
}

export function ColorPaletteSelector({ value = 0, onChange }: IColorPaletteSelectorProps) {
  const { t } = useTranslation('widget');
  return (
    <div>
      <Text type="secondary" className="!text-[11px] !block !mb-2">
        {t('color_palette_label')}
      </Text>
      <div className="grid grid-cols-5 gap-1.5">
        {CHART_COLORS.map((color, i) => (
          <div
            key={i}
            onClick={() => onChange?.(i)}
            className="w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              border: value === i ? '2px solid #333' : '2px solid transparent',
            }}
          >
            {value === i && <CheckOutlined style={{ color: '#fff', fontSize: 10 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
