import React, { useEffect } from 'react';
import { Modal, Input, Divider, Typography, Form } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import type { IWidgetDto, IChartConfig } from '@sbrb/shared-types';
import { useChartData } from '../../hooks/use-chart-data';
import { useWidgetConfig } from '../../hooks/use-widget-config';
import { ChartTypeSelector } from './settings-panel/chart-type-selector';
import { DisplaySettings } from './settings-panel/display-settings';
import { DataSelectorButton } from './settings-panel/data-selector-button';
import { AlertThresholdPanel } from './settings-panel/alert-threshold-panel';
import { ChartPreview } from './chart-panel/chart-preview';

const { Text } = Typography;

const CONFIG_FIELDS = ['type', 'showLabels', 'showLegend', 'yAxisFromZero', 'xAxisName', 'yAxisName'] as const;

interface IWidgetModalProps {
  widget: IWidgetDto;
  open: boolean;
  onClose: () => void;
  onOpenDataSelector: () => void;
}

export function WidgetModal({ widget, open, onClose, onOpenDataSelector }: IWidgetModalProps) {
  const { t } = useTranslation(['widget', 'common']);
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      name: widget.name,
      type: widget.chartConfig.type,
      showLabels: widget.chartConfig.showLabels,
      showLegend: widget.chartConfig.showLegend,
      yAxisFromZero: widget.chartConfig.yAxisFromZero,
      xAxisName: widget.chartConfig.xAxisName,
      yAxisName: widget.chartConfig.yAxisName,
    });
  }, [widget, form]);

  const { chartData, loading, refetch } = useChartData(widget.id);
  const { updateConfig, loading: saving } = useWidgetConfig();
  const { removeDataLink } = useWidgetConfig();

  const handleSave = async () => {
    const values = form.getFieldsValue();
    await updateConfig(widget.id, {
      name: values.name,
      type: values.type,
      showLabels: values.showLabels,
      showLegend: values.showLegend,
      yAxisFromZero: values.yAxisFromZero,
      xAxisName: values.xAxisName,
      yAxisName: values.yAxisName,
    } as Parameters<typeof updateConfig>[1]);
    onClose();
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
      <Form form={form} component={false}>
        {/* Header row */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <Form.Item name="name" noStyle>
            <Input
              className="!flex-1 !font-semibold !text-[15px]"
              placeholder={t('widget:widget_name_placeholder')}
              bordered={false}
            />
          </Form.Item>
          <div className="flex gap-2">
            <IconButton icon={<CheckOutlined />} tooltip={t('common:save')} size="small" onClick={handleSave} disabled={saving} />
            <IconButton icon={<CloseOutlined />} tooltip={t('common:close')} size="small" onClick={onClose} />
          </div>
        </div>

        {/* Body: Settings | Chart Preview — re-renders on config field changes */}
        <Form.Item dependencies={[...CONFIG_FIELDS]} noStyle>
          {({ getFieldValue }) => {
            const localConfig: IChartConfig = {
              type: getFieldValue('type') ?? widget.chartConfig.type,
              colorIndex: widget.chartConfig.colorIndex,
              showLabels: getFieldValue('showLabels') ?? false,
              showLegend: getFieldValue('showLegend') ?? false,
              yAxisFromZero: getFieldValue('yAxisFromZero') ?? false,
              xAxisName: getFieldValue('xAxisName'),
              yAxisName: getFieldValue('yAxisName'),
            };

            return (
              <div className="flex h-[520px] overflow-hidden">
                {/* Left panel — settings */}
                <div className="w-[260px] shrink-0 border-r border-gray-100 overflow-y-auto p-4 pl-3.5 flex flex-col gap-4">
                  <Form.Item name="type" noStyle>
                    <ChartTypeSelector />
                  </Form.Item>
                  <Divider className="!m-0" />
                  <DisplaySettings config={localConfig} onChange={(partial) => form.setFieldsValue(partial)} />
                  <Divider className="!m-0" />
                  <div>
                    <Text type="secondary" className="!text-[11px] block mb-2">
                      Nguồn dữ liệu
                    </Text>
                    <DataSelectorButton
                      widget={widget}
                      onOpenSelector={onOpenDataSelector}
                      onRemoveLink={handleRemoveLink}
                    />
                  </div>
                  <Divider className="!m-0" />
                  <AlertThresholdPanel />
                </div>

                {/* Right panel — chart preview */}
                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                  <ChartPreview
                    chartData={chartData}
                    loading={loading}
                    chartType={localConfig.type}
                    config={localConfig}
                    onRefresh={refetch}
                  />
                </div>
              </div>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
}
