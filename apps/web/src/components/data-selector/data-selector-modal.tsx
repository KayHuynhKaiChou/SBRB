import React, { useState } from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { useDataSheets } from '../../hooks/use-datasheet';
import { DepartmentSelect } from '../department/department-select';
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
  const [filterDeptId, setFilterDeptId] = useState<string | null>(null);
  const { dataSheets } = useDataSheets(businessId, filterDeptId);

  return (
    <div className="h-[50vh] overflow-y-auto">
      <div className="mb-3">
        <DepartmentSelect
          businessId={businessId}
          value={filterDeptId}
          onChange={setFilterDeptId}
        />
      </div>
      <Form.Item
        name="sheetId"
        rules={[{ required: true, message: t('datasheet:select_dataset_error') }]}
        className="!h-full !mb-0"
      >
        <SheetList sheets={dataSheets} />
      </Form.Item>
    </div>
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
    // Link sheet with empty selectedSeries (= all) and null selectedPeriods (= all)
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
      width={480}
      modalStyle={{ top: 80 }}
      initialValues={{ sheetId: undefined }}
    >
      <DataSelectorContent businessId={businessId} />
    </FormModal>
  );
}
