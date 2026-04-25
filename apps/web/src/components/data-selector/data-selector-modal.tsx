import { useMemo } from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { useDataSheets } from '../../hooks/use-datasheet';

import { SheetList } from './sheet-list';

interface IDataSelectorForm {
  sheetId: string;
}

interface IDataSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataSheetId: string, selectedSeries: string[], selectedPeriods: string[] | null) => void;
  businessId: string;
}

function DataSelectorContent({ businessId }: { businessId: string }) {
  const { t } = useTranslation(['datasheet']);
  const { dataSheets } = useDataSheets(businessId);
  // Inactive sheets are archived — hide from widget data picker.
  const activeSheets = useMemo(
    () => dataSheets.filter((s) => s.status === 'active'),
    [dataSheets],
  );

  return (
    <Form.Item
      name="sheetId"
      rules={[{ required: true, message: t('datasheet:select_dataset_error') }]}
      className="!mb-0"
    >
      <SheetList sheets={activeSheets} maxHeight={320} />
    </Form.Item>
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
    // Series selection happens later in the widget settings panel — default = all
    onConfirm(values.sheetId, [], null);
  };

  return (
    <FormModal<IDataSelectorForm>
      title={t('datasheet:select_data_title')}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      okText={t('common:confirm')}
      cancelText={t('common:cancel')}
      width={560}
      modalStyle={{ top: 80 }}
      initialValues={{ sheetId: undefined }}
    >
      <DataSelectorContent businessId={businessId} />
    </FormModal>
  );
}
