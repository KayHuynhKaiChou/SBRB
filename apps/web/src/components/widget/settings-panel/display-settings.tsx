import React from 'react';
import { Switch, Typography, Space, Segmented, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import type { IChartConfig } from '@sbrb/shared-types';

const { Text } = Typography;

interface IDisplaySettingsProps {
  config: IChartConfig;
  onChange: (updated: Partial<IChartConfig>) => void;
  hasRightAxis?: boolean;
  templateType?: 'simple' | 'department' | 'pnl';
}

/** Row helper for label + control */
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <Text className="!text-xs">{label}</Text>
      {children}
    </div>
  );
}

export function DisplaySettings({ config, onChange, hasRightAxis, templateType = 'simple' }: IDisplaySettingsProps) {
  const isDept = templateType === 'department';
  const { t } = useTranslation('widget');

  return (
    <div>
      <Text type="secondary" className="!text-[11px] !block !mb-2">
        {t('display_section')}
      </Text>

      <SettingRow label={t('show_labels')}>
        <Switch
          size="small"
          checked={config.showLabels}
          onChange={(v) => onChange({ showLabels: v })}
        />
      </SettingRow>

      <SettingRow label={t('show_legend')}>
        <Switch
          size="small"
          checked={config.showLegend}
          onChange={(v) => onChange({ showLegend: v })}
        />
      </SettingRow>

      {config.type !== 'pie' && (
        <SettingRow label={t('y_axis_from_zero')}>
          <Switch
            size="small"
            checked={config.yAxisFromZero}
            onChange={(v) => onChange({ yAxisFromZero: v })}
          />
        </SettingRow>
      )}

      {config.type === 'bar' && !isDept && (
        <SettingRow label={t('stacked_chart')}>
          <Switch size="small" checked={config.stacked ?? false} onChange={(v) => onChange({ stacked: v })} />
        </SettingRow>
      )}

      <Space direction="vertical" className="!w-full" size={8}>
        <div>
          <Text className="!text-[11px] !text-[#888]">Nhóm Trục X</Text>
          <Segmented
            size="small"
            block
            options={
              isDept
                ? [
                    { label: 'Thời gian', value: 'time' },
                    { label: 'Phòng ban', value: 'department' },
                    { label: 'Tiêu chí', value: 'criteria' },
                  ]
                : [
                    { label: 'Thời gian', value: 'time' },
                    { label: 'Tiêu chí', value: 'criteria' },
                  ]
            }
            value={config.xAxisGroup ?? 'time'}
            onChange={(v) => onChange({ xAxisGroup: v as 'time' | 'criteria' | 'department' })}
            className="!mt-1 !mb-2"
          />
        </div>
        <div>
          <Text className="!text-[11px] !text-[#888]">{t('number_format_label')}</Text>
          <Segmented
            size="small"
            block
            options={[
              { label: t('number_format_auto'), value: 'auto' },
              { label: t('number_format_short'), value: 'short' },
              { label: t('number_format_full'), value: 'full' },
            ]}
            value={config.numberFormat ?? 'auto'}
            onChange={(v) => onChange({ numberFormat: v as 'auto' | 'full' | 'short' })}
            className="!mt-1"
          />
        </div>
      </Space>

      {hasRightAxis && (
        <div className="mt-3">
          <SettingRow label={t('y_axis_name_right')}>
            <Input
              size="small"
              placeholder={t('y_axis_right_placeholder')}
              value={config.yAxisNameRight ?? ''}
              onChange={(e) => onChange({ yAxisNameRight: e.target.value })}
              className="!w-[120px]"
            />
          </SettingRow>
          <SettingRow label={t('unit_right')}>
            <Input
              size="small"
              placeholder={t('unit_right_placeholder')}
              value={config.unitRight ?? ''}
              onChange={(e) => onChange({ unitRight: e.target.value })}
              className="!w-[120px]"
            />
          </SettingRow>
        </div>
      )}
    </div>
  );
}
