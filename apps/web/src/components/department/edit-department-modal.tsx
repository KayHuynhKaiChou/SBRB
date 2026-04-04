import React, { useMemo } from 'react';
import { Form, Input, Select } from 'antd';
import { FormModal } from '@sbrb/ui';
import { useTranslation } from 'react-i18next';
import type { IDepartmentDto } from '../../hooks/use-departments';

interface IEditDepartmentValues {
  name: string;
  parentId?: string | null;
}

interface IEditDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: IEditDepartmentValues) => Promise<void>;
  department: IDepartmentDto | null;
  departments: IDepartmentDto[];
}

/** Get all descendant IDs of a department (to exclude from parent selector) */
function getDescendantIds(id: string, departments: IDepartmentDto[]): Set<string> {
  const descendants = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const dept of departments) {
      if (dept.parentId === current && !descendants.has(dept.id)) {
        descendants.add(dept.id);
        queue.push(dept.id);
      }
    }
  }
  return descendants;
}

/** Build indented parent options, excluding self and descendants */
function buildParentOptions(
  departments: IDepartmentDto[],
  excludeIds: Set<string>,
) {
  const childrenMap = new Map<string | null, IDepartmentDto[]>();
  for (const dept of departments) {
    if (excludeIds.has(dept.id)) continue;
    const key = dept.parentId ?? null;
    const list = childrenMap.get(key) ?? [];
    list.push(dept);
    childrenMap.set(key, list);
  }

  const options: { value: string; label: string }[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) ?? [];
    for (const dept of children) {
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

export function EditDepartmentModal({
  open,
  onClose,
  onSubmit,
  department,
  departments,
}: IEditDepartmentModalProps) {
  const { t } = useTranslation(['department', 'common']);

  const excludeIds = useMemo(() => {
    if (!department) return new Set<string>();
    const descendants = getDescendantIds(department.id, departments);
    descendants.add(department.id);
    return descendants;
  }, [department, departments]);

  const parentOptions = useMemo(
    () => buildParentOptions(departments, excludeIds),
    [departments, excludeIds],
  );

  if (!department) return null;

  return (
    <FormModal<IEditDepartmentValues>
      title={t('department:edit_title')}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      okText={t('common:save')}
      cancelText={t('common:cancel')}
      width={440}
      destroyOnClose
      initialValues={{
        name: department.name,
        parentId: department.parentId ?? undefined,
      }}
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
