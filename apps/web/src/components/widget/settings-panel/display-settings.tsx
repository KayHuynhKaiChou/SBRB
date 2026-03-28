import React from 'react';
import { Switch, Input, Typography, Space } from 'antd';
import type { IChartConfig } from '@sbrb/shared-types';

const { Text } = Typography;

interface IDisplaySettingsProps {
  config: IChartConfig;
  onChange: (updated: Partial<IChartConfig>) => void;
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

export function DisplaySettings({ config, onChange }: IDisplaySettingsProps) {
  return (
    <div>
      <Text type="secondary" className="!text-[11px] !block !mb-2">
        Hiển thị
      </Text>

      <SettingRow label="Hiện nhãn giá trị">
        <Switch
          size="small"
          checked={config.showLabels}
          onChange={(v) => onChange({ showLabels: v })}
        />
      </SettingRow>

      <SettingRow label="Hiện chú thích">
        <Switch
          size="small"
          checked={config.showLegend}
          onChange={(v) => onChange({ showLegend: v })}
        />
      </SettingRow>

      <SettingRow label="Trục Y bắt đầu từ 0">
        <Switch
          size="small"
          checked={config.yAxisFromZero}
          onChange={(v) => onChange({ yAxisFromZero: v })}
        />
      </SettingRow>

      <Space direction="vertical" className="!w-full" size={8}>
        <div>
          <Text className="!text-[11px] !text-[#888]">Nhãn trục X</Text>
          <Input
            size="small"
            value={config.xAxisName ?? ''}
            onChange={(e) => onChange({ xAxisName: e.target.value })}
            placeholder="Trục X"
            className="!mt-1"
          />
        </div>
        <div>
          <Text className="!text-[11px] !text-[#888]">Nhãn trục Y</Text>
          <Input
            size="small"
            value={config.yAxisName ?? ''}
            onChange={(e) => onChange({ yAxisName: e.target.value })}
            placeholder="Trục Y"
            className="!mt-1"
          />
        </div>
      </Space>
    </div>
  );
}
