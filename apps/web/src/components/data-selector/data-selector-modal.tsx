import React, { useState } from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import { useDataSheets, useDataSeries } from '../../hooks/use-datasheet';

import { SheetList } from './sheet-list';
import { TreeSelect, Typography } from 'antd';

const { Text } = Typography;

interface IDataSelectorForm {
  sheetId: string;
  selectedSeriesIds: string[];
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

  const form = Form.useFormInstance<IDataSelectorForm>();
  const sheetId = Form.useWatch('sheetId', form);
  const { dataSeries } = useDataSeries(sheetId);

  const treeData = React.useMemo(() => {
    if (!dataSeries?.length) return [];
    
    // Group by department
    const deptMap = new Map<string, any>();
    const noDeptSeries: any[] = [];

    dataSeries.forEach((series) => {
      const node = {
        title: series.seriesName,
        value: series.id,
        key: series.id,
      };

      if (series.departmentId && series.department) {
        if (!deptMap.has(series.departmentId)) {
          deptMap.set(series.departmentId, {
            title: `🏢 ${series.department.name}`,
            value: `dept-${series.departmentId}`,
            key: `dept-${series.departmentId}`,
            selectable: false,
            children: [],
          });
        }
        deptMap.get(series.departmentId).children.push(node);
      } else {
        noDeptSeries.push(node);
      }
    });

    const result = Array.from(deptMap.values());
    if (noDeptSeries.length > 0) {
      if (result.length > 0) {
        result.push({
          title: '📁 Khác (Không có phòng ban)',
          value: 'dept-none',
          key: 'dept-none',
          selectable: false,
          children: noDeptSeries,
        });
      } else {
        return noDeptSeries;
      }
    }
    return result;
  }, [dataSeries]);

  return (
    <div className="h-[50vh] overflow-y-auto flex flex-col gap-4">
      <div>
        <Text strong className="!block !mb-2">1. Chọn bộ dữ liệu (DataSheet)</Text>
        <Form.Item
          name="sheetId"
          rules={[{ required: true, message: t('datasheet:select_dataset_error') }]}
          className="!mb-0 h-[30vh]"
        >
          <SheetList sheets={dataSheets} />
        </Form.Item>
      </div>

      {sheetId && (
        <div className="border-t border-gray-100 pt-4">
          <Text strong className="!block !mb-2">2. Chọn các chuỗi dữ liệu (Data Series)</Text>
          <Form.Item
            name="selectedSeriesIds"
            className="!mb-0"
            extra="Nếu không chọn, hệ thống sẽ mặc định lấy tất cả."
          >
            <TreeSelect
              treeData={treeData}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              placeholder="Chọn chuỗi dữ liệu..."
              style={{ width: '100%' }}
              maxTagCount="responsive"
              treeDefaultExpandAll
            />
          </Form.Item>
        </div>
      )}
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
    onConfirm(values.sheetId, values.selectedSeriesIds || [], null);
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
      initialValues={{ sheetId: undefined, selectedSeriesIds: [] }}
    >
      <DataSelectorContent businessId={businessId} />
    </FormModal>
  );
}
