import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, Input, Divider, Typography, Form } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@apollo/client';
import { IconButton } from '@sbrb/ui';
import type { IWidgetDto, IChartConfig } from '@sbrb/shared-types';
import { useChartData, useAvailableSeries } from '../../hooks/use-chart-data';
import { useWidgetConfig } from '../../hooks/use-widget-config';
import { ChartTypeSelector } from './settings-panel/chart-type-selector';
import { DisplaySettings } from './settings-panel/display-settings';
import { DataSelectorButton } from './settings-panel/data-selector-button';
import { AlertThresholdPanel } from './settings-panel/alert-threshold-panel';
import { SeriesColorPicker } from './settings-panel/series-color-picker';
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
  const [form] = Form.useForm();
  const savingRef = useRef(false);

  useEffect(() => {
    if (savingRef.current) return;
    form.setFieldsValue({
      name: widget.name,
      type: widget.chartConfig.type,
      showLabels: widget.chartConfig.showLabels,
      showLegend: widget.chartConfig.showLegend,
      yAxisFromZero: widget.chartConfig.yAxisFromZero,
      numberFormat: widget.chartConfig.numberFormat,
      seriesColors: widget.chartConfig.seriesColors ?? {},
      stacked: widget.chartConfig.stacked,
      selectedSeriesIds: widget.dataLink?.selectedSeriesIds ?? [],
    });
  }, [widget, form]);

  const { chartData, loading } = useChartData(widget.id);
  const { series: availableSeries } = useAvailableSeries(widget.dataLink?.datasheetId ? widget.id : null);
  const watchedSeriesIds: string[] = Form.useWatch('selectedSeriesIds', form) ?? [];

  // Filter chart datasets client-side based on selected series
  const filteredChartData = useMemo(() => {
    if (!chartData) return null;
    if (watchedSeriesIds.length === 0) return chartData; // empty = all
    const selectedNames = new Set(
      availableSeries.filter((s) => watchedSeriesIds.includes(s.id)).map((s) => s.name),
    );
    return { ...chartData, datasets: chartData.datasets.filter((ds) => selectedNames.has(ds.label)) };
  }, [chartData, watchedSeriesIds, availableSeries]);
  const { updateConfig, updateDataLink, loading: saving } = useWidgetConfig();
  const { removeDataLink } = useWidgetConfig();

  const apolloClient = useApolloClient();

  const handleSave = async () => {
    savingRef.current = true;
    const values = form.getFieldsValue(true);
    // Save config (chart settings + seriesColors) — no refetch yet
    await updateConfig(widget.id, {
      name: values.name,
      type: values.type,
      showLabels: values.showLabels,
      showLegend: values.showLegend,
      yAxisFromZero: values.yAxisFromZero,
      numberFormat: values.numberFormat,
      seriesColors: values.seriesColors,
      stacked: values.stacked,
    } as Parameters<typeof updateConfig>[1]);
    // Save series selection (separate field on widget entity)
    if (widget.dataLink?.datasheetId) {
      await updateDataLink(widget.id, {
        dataSheetId: widget.dataLink.datasheetId,
        selectedSeries: values.selectedSeriesIds ?? [],
        selectedPeriods: widget.dataLink.selectedPeriods,
      });
    }
    // Close first, then refetch — prevents useEffect from resetting form mid-save
    onClose();
    apolloClient.refetchQueries({ include: 'active' });
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
        <div className="flex flex-col" style={{ height: 'calc(90vh - 56px)' }}>
        {/* Header row */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <Form.Item name="name" noStyle>
            <Input
              className="!flex-1 !font-semibold !text-[15px]"
              placeholder={t('widget:widget_name_placeholder')}
              bordered={false}
            />
          </Form.Item>
          <div className="flex gap-2">
            <IconButton icon={<CheckOutlined />} tooltip={t('common:save')} size="small" onClick={handleSave} disabled={saving} loading={saving} />
            <IconButton icon={<CloseOutlined />} tooltip={t('common:close')} size="small" onClick={onClose} />
          </div>
        </div>

        {/* Body: Settings | Chart Preview — re-renders on any config field change */}
        <Form.Item shouldUpdate noStyle>
          {({ getFieldValue }) => {
            const localConfig: IChartConfig = {
              type: getFieldValue('type') ?? widget.chartConfig.type,
              colorIndex: 0,
              showLabels: getFieldValue('showLabels') ?? false,
              showLegend: getFieldValue('showLegend') ?? false,
              yAxisFromZero: getFieldValue('yAxisFromZero') ?? false,
              numberFormat: getFieldValue('numberFormat'),
              seriesColors: getFieldValue('seriesColors') ?? {},
              stacked: getFieldValue('stacked'),
            };

            return (
              <div className="flex flex-1 min-h-0 overflow-hidden">
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
                      {t('widget:data_source_section')}
                    </Text>
                    <DataSelectorButton
                      widget={widget}
                      onOpenSelector={onOpenDataSelector}
                      onRemoveLink={handleRemoveLink}
                    />
                  </div>
                  <Divider className="!m-0" />
                  <Form.Item name="selectedSeriesIds" noStyle>
                    <SeriesColorPicker
                      widgetId={widget.id}
                      hasDataLink={!!widget.dataLink?.datasheetId}
                      seriesColors={localConfig.seriesColors ?? {}}
                      onColorsChange={(colors) => form.setFieldsValue({ seriesColors: colors })}
                    />
                  </Form.Item>
                  <Divider className="!m-0" />
                  <AlertThresholdPanel />
                </div>

                {/* Right panel — chart preview (filter datasets by local series selection) */}
                <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
                  <ChartPreview
                    chartData={filteredChartData}
                    loading={loading}
                    chartType={localConfig.type}
                    config={localConfig}

                    unit={widget.unit}
                  />
                </div>
              </div>
            );
          }}
        </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
