import React, { useMemo } from 'react';
import { Form, Input, Select } from 'antd';
import { FormModal } from '@sbrb/ui';
import { useTranslation } from 'react-i18next';
import type { IDepartmentDto } from '../../hooks/use-departments';

interface ICreateDepartmentValues {
  name: string;
  parentId?: string | null;
}

interface ICreateDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ICreateDepartmentValues) => Promise<void>;
  departments: IDepartmentDto[];
}

/** Build indented options for parent selector */
function buildParentOptions(departments: IDepartmentDto[]) {
  const childrenMap = new Map<string | null, IDepartmentDto[]>();
  for (const dept of departments) {
    const key = dept.parentId ?? null;
    const list = childrenMap.get(key) ?? [];
    list.push(dept);
    childrenMap.set(key, list);
  }

  const options: { value: string; label: string }[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) ?? [];
    for (const dept of children) {
      // Max 3 levels, so don't show depth-2 items as parent options
      if (depth >= 2) continue;
      const indent = '\u00A0\u00A0'.repeat(depth);
      const prefix = depth > 0 ? `${indent}— ` : '';
      options.push({ value: dept.id, label: `${prefix}${dept.name}` });
      walk(dept.id, depth + 1);
    }
  }
  walk(null, 0);
  return options;
}

export function CreateDepartmentModal({
  open,
  onClose,
  onSubmit,
  departments,
}: ICreateDepartmentModalProps) {
  const { t } = useTranslation(['department', 'common']);
  const parentOptions = useMemo(() => buildParentOptions(departments), [departments]);

  return (
    <FormModal<ICreateDepartmentValues>
      title={t('department:create_title')}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      okText={t('common:save')}
      cancelText={t('common:cancel')}
      width={440}
      destroyOnClose
    >
      <Form.Item
        name="name"
        label={t('department:name_label')}
        rules={[
          { required: true, message: t('department:name_required') },
          { min: 2, message: t('department:name_min_length') },
        ]}
      >
        <Input placeholder={t('department:name_placeholder')} />
      </Form.Item>
      <Form.Item name="parentId" label={t('department:parent_label')}>
        <Select
          placeholder={t('department:parent_placeholder')}
          allowClear
          options={parentOptions}
        />
      </Form.Item>
    </FormModal>
  );
}
