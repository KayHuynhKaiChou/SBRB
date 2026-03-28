import React, { useState, useEffect } from 'react';
import { Modal, Input, Divider, Typography } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ModalActions } from '../common/modal-actions';
import type { IWidgetDto, IChartConfig } from '@sbrb/shared-types';
import { useChartData } from '../../hooks/use-chart-data';
import { useWidgetConfig } from '../../hooks/use-widget-config';
import { ChartTypeSelector } from './settings-panel/chart-type-selector';
import { DisplaySettings } from './settings-panel/display-settings';
import { DataSelectorButton } from './settings-panel/data-selector-button';
import { AlertThresholdPanel } from './settings-panel/alert-threshold-panel';
import { ChartPreview } from './chart-panel/chart-preview';

const { Text } = Typography;

interface IWidgetModalProps {
  widget: IWidgetDto;
  open: boolean;
  onClose: () => void;
  onOpenDataSelector: () => void;
}

export function WidgetModal({ widget, open, onClose, onOpenDataSelector }: IWidgetModalProps) {
  const { t } = useTranslation(['widget', 'common']);
  const [widgetName, setWidgetName] = useState(widget.name);
  const [localConfig, setLocalConfig] = useState<IChartConfig>({ ...widget.chartConfig });

  // Re-sync when widget prop changes (e.g. after save)
  useEffect(() => {
    setWidgetName(widget.name);
    setLocalConfig({ ...widget.chartConfig });
  }, [widget]);

  const { chartData, loading, refetch } = useChartData(widget.id);
  const { updateConfig, loading: saving } = useWidgetConfig();
  const { removeDataLink } = useWidgetConfig();

  const handleSave = async () => {
    await updateConfig(widget.id, { ...localConfig, name: widgetName } as Parameters<typeof updateConfig>[1]);
    onClose();
  };

  const handleConfigChange = (partial: Partial<IChartConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleRemoveLink = async () => {
    await removeDataLink(widget.id);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={960}
      centered
      destroyOnClose
      closable={false}
      footer={null}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header row */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Input
          value={widgetName}
          onChange={(e) => setWidgetName(e.target.value)}
          style={{ flex: 1, fontWeight: 600, fontSize: 15 }}
          placeholder={t('widget:widget_name_placeholder')}
          bordered={false}
        />
        <ModalActions
          actions={[
            { icon: <CheckOutlined />, tooltip: t('common:save'), onClick: handleSave, disabled: saving },
            { icon: <CloseOutlined />, tooltip: t('common:close'), onClick: onClose },
          ]}
        />
      </div>

      {/* Body: Settings | Chart Preview */}
      <div style={{ display: 'flex', height: 520, overflow: 'hidden' }}>
        {/* Left panel — settings (260px fixed) */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: '1px solid #f0f0f0',
            overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <ChartTypeSelector value={localConfig.type} onChange={(t) => handleConfigChange({ type: t })} />
          <Divider style={{ margin: '0' }} />
          <DisplaySettings config={localConfig} onChange={handleConfigChange} />
          <Divider style={{ margin: '0' }} />
          <div>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
              Nguồn dữ liệu
            </Text>
            <DataSelectorButton
              widget={widget}
              onOpenSelector={onOpenDataSelector}
              onRemoveLink={handleRemoveLink}
            />
          </div>
          <Divider style={{ margin: '0' }} />
          <AlertThresholdPanel />
        </div>

        {/* Right panel — chart preview (flex-grow) */}
        <div style={{ flex: 1, padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChartPreview
            chartData={chartData}
            loading={loading}
            chartType={localConfig.type}
            config={localConfig}
            onRefresh={refetch}
          />
        </div>
      </div>
    </Modal>
  );
}
