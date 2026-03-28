import React from 'react';
import { Switch, InputNumber, Input, Typography, Space } from 'antd';
import type { IChartConfig } from '@sbrb/shared-types';

const { Text } = Typography;

interface IDisplaySettingsProps {
  config: IChartConfig;
  onChange: (updated: Partial<IChartConfig>) => void;
}

/** Row helper for label + control */
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontSize: 12 }}>{label}</Text>
      {children}
    </div>
  );
}

export function DisplaySettings({ config, onChange }: IDisplaySettingsProps) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
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

      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <div>
          <Text style={{ fontSize: 11, color: '#888' }}>Nhãn trục X</Text>
          <Input
            size="small"
            value={config.xAxisName ?? ''}
            onChange={(e) => onChange({ xAxisName: e.target.value })}
            placeholder="Trục X"
            style={{ marginTop: 4 }}
          />
        </div>
        <div>
          <Text style={{ fontSize: 11, color: '#888' }}>Nhãn trục Y</Text>
          <Input
            size="small"
            value={config.yAxisName ?? ''}
            onChange={(e) => onChange({ yAxisName: e.target.value })}
            placeholder="Trục Y"
            style={{ marginTop: 4 }}
          />
        </div>
      </Space>
    </div>
  );
}
