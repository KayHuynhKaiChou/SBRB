import React, { useMemo } from 'react';
import { Select } from 'antd';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { DEPARTMENTS_QUERY } from '../../graphql/department.operations';

interface IDepartment {
  id: string;
  name: string;
  parentId: string | null;
}

interface IDepartmentSelectProps {
  businessId: string;
  value?: string | null;
  onChange: (departmentId: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}

/** Build indented options for nested departments */
function buildOptions(departments: IDepartment[]) {
  const childrenMap = new Map<string | null, IDepartment[]>();
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
      const indent = '\u00A0\u00A0'.repeat(depth);
      const prefix = depth > 0 ? `${indent}— ` : '';
      options.push({ value: dept.id, label: `${prefix}${dept.name}` });
      walk(dept.id, depth + 1);
    }
  }

  walk(null, 0);
  return options;
}

export function DepartmentSelect({
  businessId,
  value,
  onChange,
  placeholder,
  allowClear = true,
  disabled,
}: IDepartmentSelectProps) {
  const { t } = useTranslation(['department']);
  const { data } = useQuery(DEPARTMENTS_QUERY, {
    variables: { businessId },
    skip: !businessId,
  });

  const departments = (data?.departments ?? []) as IDepartment[];
  const options = useMemo(() => buildOptions(departments), [departments]);

  // Hide selector when no departments exist
  if (departments.length === 0) return null;

  return (
    <Select
      value={value ?? undefined}
      onChange={(val) => onChange(val ?? null)}
      onClear={() => onChange(null)}
      placeholder={placeholder ?? t('department:select_department')}
      allowClear={allowClear}
      disabled={disabled}
      options={options}
      className="w-full"
    />
  );
}
