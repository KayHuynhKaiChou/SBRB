import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, Input, Divider, Typography, Form } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
import { computeDefaultXAxisGroup } from './chart-panel/build-chart-data';
import { PeriodCheckboxList } from './settings-panel/shared/period-checkbox-list';
import type { IChartDataResult } from '../../hooks/use-chart-data';

const { Text } = Typography;

interface IWidgetModalProps {
  widget: IWidgetDto;
  open: boolean;
  onClose: () => void;
  onOpenDataSelector: () => void;
}

/** Filter chart data by selected series and periods (pure function, no hooks) */
function filterChartData(
  chartData: IChartDataResult | null,
  watchedSeriesIds: string[],
  availableSeries: { id: string; name: string }[],
  selectedPeriods: string[] | null,
  allPeriods: string[],
): IChartDataResult | null {
  if (!chartData) return null;
  let result = chartData;

  // Filter by series
  if (watchedSeriesIds.length > 0) {
    const selectedNames = new Set(
      availableSeries.filter((s) => watchedSeriesIds.includes(s.id)).map((s) => s.name),
    );
    result = { ...result, datasets: result.datasets.filter((ds) => selectedNames.has(ds.label)) };
  }

  // Filter by periods (client-side, no API call)
  const effectivePeriods = selectedPeriods ?? allPeriods;
  if (effectivePeriods.length > 0 && effectivePeriods.length < allPeriods.length) {
    const periodSet = new Set(effectivePeriods);
    const keepIndices: number[] = [];
    result.labels.forEach((label, i) => {
      if (periodSet.has(label)) keepIndices.push(i);
    });
    result = {
      ...result,
      labels: keepIndices.map(i => result.labels[i]),
      datasets: result.datasets.map(ds => ({
        ...ds,
        data: keepIndices.map(i => ds.data[i]),
      })),
    };
  }

  return result;
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
      seriesConfig: widget.chartConfig.seriesConfig ?? {},
      unitRight: widget.chartConfig.unitRight,
      yAxisNameRight: widget.chartConfig.yAxisNameRight,
      xAxisGroup: widget.chartConfig.xAxisGroup,
      selectedSeriesIds: widget.dataLink?.selectedSeriesIds ?? [],
      selectedPeriods: widget.dataLink?.selectedPeriods ?? null,
    });
  }, [widget, form]);

  const { chartData, loading } = useChartData(widget.id);
  const { series: availableSeries } = useAvailableSeries(widget.dataLink?.datasheetId ? widget.id : null);
  const templateType = useMemo(() => availableSeries[0]?.templateType ?? 'simple', [availableSeries]) as 'simple' | 'department' | 'pnl';
  const watchedSeriesIds: string[] = Form.useWatch('selectedSeriesIds', form) ?? [];
  const allPeriods = useMemo(() => chartData?.allPeriods ?? chartData?.labels ?? [], [chartData]);
  const defaultXAxisGroup = useMemo(
    () => (chartData ? computeDefaultXAxisGroup(chartData.datasets) : 'time'),
    [chartData],
  );

  const { updateConfig, updateDataLink, loading: saving } = useWidgetConfig();
  const { removeDataLink } = useWidgetConfig();

  const handleSave = async () => {
    savingRef.current = true;
    const values = form.getFieldsValue(true);
    // Save config (chart settings + seriesColors). BE returns the updated Widget;
    // Apollo auto-normalizes by id, so the canvas card refreshes without refetching.
    await updateConfig(widget.id, {
      name: values.name,
      type: values.type,
      showLabels: values.showLabels,
      showLegend: values.showLegend,
      yAxisFromZero: values.yAxisFromZero,
      numberFormat: values.numberFormat,
      seriesColors: values.seriesColors,
      stacked: values.stacked,
      seriesConfig: values.seriesConfig,
      unitRight: values.unitRight,
      yAxisNameRight: values.yAxisNameRight,
      xAxisGroup: values.xAxisGroup,
    } as Parameters<typeof updateConfig>[1]);
    // Save series/period selection. updateDataLink internally refetches the
    // dependent chart-data queries; we don't refetch the Widget itself.
    if (widget.dataLink?.datasheetId) {
      const periods = values.selectedPeriods;
      await updateDataLink(widget.id, {
        dataSheetId: widget.dataLink.datasheetId,
        selectedSeries: values.selectedSeriesIds ?? [],
        selectedPeriods: (!periods || periods.length === 0 || periods.length === allPeriods.length) ? null : periods,
      });
    }
    onClose();
  };

  const handleRemoveLink = async () => {
    await removeDataLink(widget.id);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1080}
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
          <Text strong className="!text-[15px] !flex-1">
            {t('widget:chart_settings_title')}
          </Text>
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
              seriesConfig: getFieldValue('seriesConfig') ?? {},
              unitRight: getFieldValue('unitRight'),
              yAxisNameRight: getFieldValue('yAxisNameRight'),
              xAxisGroup: getFieldValue('xAxisGroup') ?? widget.chartConfig.xAxisGroup,
            };

            // Read periods from form store (re-evaluated on every field change via shouldUpdate)
            const localPeriods: string[] | null = getFieldValue('selectedPeriods');
            const effectivePeriods = localPeriods ?? allPeriods;

            // Filter chart data by series + periods (client-side only)
            const filtered = filterChartData(chartData, watchedSeriesIds, availableSeries, localPeriods, allPeriods);

            return (
              <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Left panel — settings */}
                <div className="w-[340px] shrink-0 border-r border-gray-100 overflow-y-auto p-4 flex flex-col gap-4">
                  <div>
                    <Text type="secondary" className="!text-[11px] block mb-1">
                      {t('widget:name_label')}
                    </Text>
                    <Form.Item name="name" noStyle>
                      <Input
                        placeholder={t('widget:widget_name_placeholder')}
                        size="small"
                      />
                    </Form.Item>
                  </div>
                  <Divider className="!m-0" />
                  {templateType !== 'department' && (
                    <>
                      <Form.Item name="type" noStyle>
                        <ChartTypeSelector />
                      </Form.Item>
                      <Divider className="!m-0" />
                    </>
                  )}
                  <DisplaySettings
                    config={localConfig}
                    onChange={(partial) => form.setFieldsValue(partial)}
                    hasRightAxis={Object.values(localConfig.seriesConfig ?? {}).some(sc => sc.yAxis === 'right')}
                    templateType={templateType}
                    defaultXAxisGroup={defaultXAxisGroup}
                  />
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
                      widgetChartType={localConfig.type}
                      seriesConfig={localConfig.seriesConfig ?? {}}
                      onSeriesConfigChange={(sc) => form.setFieldsValue({ seriesConfig: sc })}
                      xAxisGroup={localConfig.xAxisGroup ?? 'time'}
                      periodHeaders={chartData?.labels ?? []}
                    />
                  </Form.Item>
                  {widget.dataLink?.datasheetId && allPeriods.length > 0 && (
                    <PeriodCheckboxList
                      allPeriods={allPeriods}
                      value={effectivePeriods}
                      onChange={(periods) => {
                        form.setFieldsValue({
                          selectedPeriods: periods.length === allPeriods.length ? null : periods,
                        });
                      }}
                    />
                  )}
                  <Divider className="!m-0" />
                  <AlertThresholdPanel />
                </div>

                {/* Right panel — chart preview (filter datasets by local series + period selection) */}
                <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
                  <Text strong className="!text-[14px] mb-2 shrink-0">
                    {getFieldValue('name') || widget.name}
                    {widget.unit && (
                      <Text type="secondary" className="!text-[12px] !font-normal ml-1.5">
                        ({widget.unit})
                      </Text>
                    )}
                  </Text>
                  <ChartPreview
                    chartData={filtered}
                    loading={loading}
                    chartType={localConfig.type}
                    config={localConfig}
                    unit={widget.unit}
                    hasDataLink={!!widget.dataLink?.datasheetId}
                    onRequestLink={onOpenDataSelector}
                    xAxisGroup={localConfig.xAxisGroup ?? defaultXAxisGroup}
                    selectedPeriods={localPeriods}
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
