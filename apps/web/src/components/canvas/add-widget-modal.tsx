import React, { useState, useMemo } from 'react';
import {
  Modal,
  Steps,
  Form,
  Input,
  Select,
  Checkbox,
  Empty,
  Spin,
  Space,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { IconButton, MODAL_BODY_SCROLL } from '@sbrb/ui';
import { UNIT_PRESETS } from '@sbrb/shared-constants';
import type { IAddWidgetResult } from '@sbrb/shared-types';
import {
  DATA_SHEETS_QUERY,
  DATA_SERIES_QUERY,
} from '../../graphql/datasheet.operations';

const { Text } = Typography;

// Re-export for back-compat with existing consumers in this app.
export type { IAddWidgetResult };

interface IAddWidgetModalProps {
  open: boolean;
  businessId: string;
  onClose: () => void;
  onSubmit: (input: IAddWidgetResult) => Promise<void>;
}

export function AddWidgetModal({
  open,
  businessId,
  onClose,
  onSubmit,
}: IAddWidgetModalProps) {
  const { t } = useTranslation(['widget', 'common', 'datasheet']);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);

  // Step 2 state
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([]);

  // Fetch datasheets for business
  const { data: sheetsData, loading: sheetsLoading } = useQuery(DATA_SHEETS_QUERY, {
    variables: { businessId },
    skip: !businessId || !open,
  });

  const datasheets = useMemo(() => {
    const sheets = (sheetsData?.dataSheets ?? []) as {
      id: string;
      name: string;
      status: string;
    }[];
    return sheets.filter((s) => s.status === 'active');
  }, [sheetsData]);

  // Fetch series for selected datasheet
  const { data: seriesData, loading: seriesLoading } = useQuery(DATA_SERIES_QUERY, {
    variables: { datasheetId: selectedSheetId },
    skip: !selectedSheetId,
  });

  const seriesList = useMemo(
    () =>
      (seriesData?.dataSeries ?? []) as {
        id: string;
        seriesName: string;
        departmentId?: string | null;
        department?: { id: string; name: string } | null;
      }[],
    [seriesData],
  );

  // For departmental data: deduplicate by criteria name
  const isDeptTemplate = seriesList.some((s) => s.departmentId);
  const criteriaNames = useMemo(() => {
    if (!isDeptTemplate) return [];
    const seen = new Set<string>();
    return seriesList.filter((s) => {
      if (seen.has(s.seriesName)) return false;
      seen.add(s.seriesName);
      return true;
    });
  }, [seriesList, isDeptTemplate]);

  const handleClose = () => {
    setStep(0);
    setName('');
    setUnit('');
    setSelectedSheetId(null);
    setSelectedSeriesIds([]);
    setSubmitting(false);
    onClose();
  };

  const handleNext = () => {
    if (!name.trim()) return;
    if (selectedSheetId) {
      setStep(1);
      // Auto-select all series
      if (selectedSeriesIds.length === 0 && seriesList.length > 0) {
        setSelectedSeriesIds(seriesList.map((s) => s.id));
      }
    } else {
      // No datasheet selected → skip step 2, submit directly
      handleSubmit();
    }
  };

  const handleSheetChange = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setSelectedSeriesIds([]); // Reset series when sheet changes
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        unit,
        dataSheetId: selectedSheetId,
        selectedSeries: selectedSeriesIds,
      });
      handleClose();
    } catch {
      setSubmitting(false);
    }
  };

  // Auto-select all when series load
  React.useEffect(() => {
    if (seriesList.length > 0 && selectedSeriesIds.length === 0 && step === 1) {
      setSelectedSeriesIds(seriesList.map((s) => s.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesList]);

  const toggleSeries = (id: string) => {
    setSelectedSeriesIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  /** For dept template: toggle all series with a given criteria name */
  const toggleCriteria = (criteriaName: string) => {
    const matchingIds = seriesList.filter((s) => s.seriesName === criteriaName).map((s) => s.id);
    const allSelected = matchingIds.every((id) => selectedSeriesIds.includes(id));
    if (allSelected) {
      setSelectedSeriesIds((prev) => prev.filter((id) => !matchingIds.includes(id)));
    } else {
      setSelectedSeriesIds((prev) => [...new Set([...prev, ...matchingIds])]);
    }
  };

  const toggleAll = () => {
    if (selectedSeriesIds.length === seriesList.length) {
      setSelectedSeriesIds([]);
    } else {
      setSelectedSeriesIds(seriesList.map((s) => s.id));
    }
  };

  const canNext = name.trim().length > 0;
  const canSubmit = step === 0
    ? canNext
    : selectedSeriesIds.length > 0;

  const stepItems = [
    { title: t('widget:create_step_info') },
    { title: t('widget:create_step_series') },
  ];

  return (
    <Modal
      open={open}
      title={t('widget:create_title')}
      onCancel={submitting ? undefined : handleClose}
      closable={false}
      footer={
        <div className="flex justify-end gap-2">
          {step === 0 ? (
            <>
              <IconButton
                icon={selectedSheetId ? <ArrowRightOutlined /> : <CheckOutlined />}
                tooltip={selectedSheetId ? t('common:next') : t('common:confirm')}
                size="small"
                onClick={handleNext}
                disabled={!canNext || submitting}
                loading={submitting}
              />
              <IconButton
                icon={<CloseOutlined />}
                tooltip={t('common:cancel')}
                size="small"
                onClick={handleClose}
                disabled={submitting}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={<CheckOutlined />}
                tooltip={t('common:confirm')}
                size="small"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                loading={submitting}
              />
              <IconButton
                icon={<ArrowLeftOutlined />}
                tooltip={t('common:back')}
                size="small"
                onClick={() => setStep(0)}
                disabled={submitting}
              />
            </>
          )}
        </div>
      }
      width={500}
      centered
      classNames={{ body: MODAL_BODY_SCROLL }}
    >
      {selectedSheetId && (
        <Steps current={step} items={stepItems} className="!mb-6" size="small" />
      )}

      {step === 0 && (
        <Form layout="vertical" className="!mb-0">
          <Form.Item
            label={t('widget:name_label')}
            required
            className="!mb-4"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('widget:name_placeholder')}
              maxLength={40}
              disabled={submitting}
            />
          </Form.Item>

          <Form.Item label={t('widget:unit_label')} className="!mb-4">
            <Select
              value={unit || undefined}
              onChange={setUnit}
              placeholder={t('widget:unit_placeholder')}
              allowClear
              showSearch
              disabled={submitting}
              options={[
                ...UNIT_PRESETS.map((u) => ({ label: u, value: u })),
                { label: `── ${t('widget:unit_custom')} ──`, value: '__divider__', disabled: true },
              ]}
              popupRender={(menu) => (
                <>
                  {menu}
                  <div className="px-2 py-1.5 border-t border-gray-100">
                    <Input
                      size="small"
                      placeholder={t('widget:unit_custom_placeholder')}
                      onPressEnter={(e) => {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          setUnit(val);
                        }
                      }}
                    />
                  </div>
                </>
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('widget:create_datasheet_label')}
            className="!mb-0"
          >
            <Select
              value={selectedSheetId ?? undefined}
              onChange={handleSheetChange}
              placeholder={t('widget:create_datasheet_placeholder')}
              allowClear
              onClear={() => setSelectedSheetId(null)}
              loading={sheetsLoading}
              disabled={submitting}
              notFoundContent={
                sheetsLoading ? <Spin size="small" /> : <Empty description={t('datasheet:no_data_hint')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              }
              options={datasheets.map((ds) => ({
                label: ds.name,
                value: ds.id,
              }))}
            />
            <Text type="secondary" className="!text-xs !mt-1 block">
              {t('widget:create_datasheet_hint')}
            </Text>
          </Form.Item>
        </Form>
      )}

      {step === 1 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <Text strong>{t('widget:series_section')}</Text>
            <a onClick={toggleAll} className="text-xs">
              {selectedSeriesIds.length === seriesList.length
                ? t('widget:series_deselect_all')
                : t('widget:series_select_all')}
            </a>
          </div>

          {seriesLoading ? (
            <Spin className="block !my-6 !mx-auto" />
          ) : seriesList.length === 0 ? (
            <Empty description={t('datasheet:no_series')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space direction="vertical" className="!w-full max-h-60 overflow-y-auto">
              {isDeptTemplate
                ? criteriaNames.map((s) => {
                    const matchingIds = seriesList.filter((r) => r.seriesName === s.seriesName).map((r) => r.id);
                    const allChecked = matchingIds.every((id) => selectedSeriesIds.includes(id));
                    return (
                      <Checkbox
                        key={s.seriesName}
                        checked={allChecked}
                        onChange={() => toggleCriteria(s.seriesName)}
                      >
                        {s.seriesName}
                      </Checkbox>
                    );
                  })
                : seriesList.map((s) => (
                    <Checkbox
                      key={s.id}
                      checked={selectedSeriesIds.includes(s.id)}
                      onChange={() => toggleSeries(s.id)}
                    >
                      {s.seriesName}
                    </Checkbox>
                  ))}
            </Space>
          )}
        </div>
      )}
    </Modal>
  );
}
