import React from 'react';
import { Row, Col, Divider, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { useDataSheets } from '../../hooks/use-datasheet';
import { SheetList } from './sheet-list';
import { SeriesTable } from './series-table';

interface IDataSelectorForm {
  sheetId: string;
  selectedSeries: string[];
  selectedPeriods?: string[];
}

interface IDataSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataSheetId: string, selectedSeries: string[], selectedPeriods: string[] | null) => void;
  businessId: string;
}

/** Inner content — uses Form.useFormInstance() + dependencies instead of useWatch */
function DataSelectorContent({ businessId }: { businessId: string }) {
  const { t } = useTranslation(['datasheet']);
  const form = Form.useFormInstance<IDataSelectorForm>();
  const { dataSheets } = useDataSheets(businessId);

  const handleSelectionChange = (series: string[], periods: string[] | null) => {
    form.setFieldsValue({ selectedSeries: series, selectedPeriods: periods ?? undefined });
  };

  return (
    <>
      <Form.Item name="selectedSeries" hidden><Input /></Form.Item>
      <Form.Item name="selectedPeriods" hidden><Input /></Form.Item>

      <Row className="h-[60vh]">
        <Col span={8} className="pr-3 h-full overflow-y-auto">
          <Form.Item
            name="sheetId"
            rules={[{ required: true, message: t('datasheet:select_dataset_error') }]}
            className="!h-full !mb-0"
            normalize={(value) => {
              setTimeout(() => form.setFieldsValue({ selectedSeries: [], selectedPeriods: undefined }));
              return value;
            }}
          >
            <SheetList sheets={dataSheets} />
          </Form.Item>
        </Col>

        <Col span={1} className="flex justify-center">
          <Divider type="vertical" className="!h-full" />
        </Col>

        <Col span={15} className="pl-3 h-full overflow-y-auto">
          <Form.Item dependencies={['sheetId', 'selectedSeries', 'selectedPeriods']} noStyle>
            {({ getFieldValue }) => {
              const sheetId = getFieldValue('sheetId');
              const series = getFieldValue('selectedSeries') ?? [];
              const periods = getFieldValue('selectedPeriods');
              const sheet = dataSheets.find((s) => s.id === sheetId);
              return (
                <SeriesTable
                  datasheetId={sheetId}
                  selectedSeries={series}
                  selectedPeriods={periods ?? null}
                  periodHeaders={sheet?.periodHeaders ?? []}
                  onSelectionChange={handleSelectionChange}
                />
              );
            }}
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

export function DataSelectorModal({
  open,
  onClose,
  onConfirm,
  businessId,
}: IDataSelectorModalProps) {
  const { t } = useTranslation(['datasheet', 'common']);

  const handleSubmit = async (values: IDataSelectorForm) => {
    if (!values.selectedSeries?.length) {
      throw new Error(t('datasheet:select_series_error'));
    }
    onConfirm(values.sheetId, values.selectedSeries, values.selectedPeriods ?? null);
  };

  return (
    <FormModal<IDataSelectorForm>
      title={t('datasheet:select_data_title')}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      okText={t('common:confirm')}
      cancelText={t('common:cancel')}
      width="80vw"
      modalStyle={{ top: 40 }}
      initialValues={{ selectedSeries: [], selectedPeriods: undefined }}
    >
      <DataSelectorContent businessId={businessId} />
    </FormModal>
  );
}
