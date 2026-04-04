import React, { useMemo } from 'react';
import { Table, Space, Popconfirm, Empty, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { IconButton } from '@sbrb/ui';
import { useTranslation } from 'react-i18next';
import type { IDepartmentDto } from '../../hooks/use-departments';

interface IDepartmentListProps {
  departments: IDepartmentDto[];
  loading: boolean;
  onEdit: (dept: IDepartmentDto) => void;
  onDelete: (id: string) => void;
}

interface IDepartmentRow extends IDepartmentDto {
  depth: number;
}

/** Build flat list sorted parent-first with depth info */
function buildSortedRows(departments: IDepartmentDto[]): IDepartmentRow[] {
  const childrenMap = new Map<string | null, IDepartmentDto[]>();
  for (const dept of departments) {
    const key = dept.parentId ?? null;
    const list = childrenMap.get(key) ?? [];
    list.push(dept);
    childrenMap.set(key, list);
  }

  const rows: IDepartmentRow[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) ?? [];
    for (const dept of children) {
      rows.push({ ...dept, depth });
      walk(dept.id, depth + 1);
    }
  }
  walk(null, 0);
  return rows;
}

function hasChildren(id: string, departments: IDepartmentDto[]): boolean {
  return departments.some((d) => d.parentId === id);
}

export function DepartmentList({ departments, loading, onEdit, onDelete }: IDepartmentListProps) {
  const { t } = useTranslation(['department', 'common']);
  const rows = useMemo(() => buildSortedRows(departments), [departments]);

  const parentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const dept of departments) map.set(dept.id, dept.name);
    return map;
  }, [departments]);

  const columns = [
    {
      title: t('department:name_label'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: IDepartmentRow) => (
        <span style={{ paddingLeft: record.depth * 24 }}>
          {record.depth > 0 && <span className="text-gray-400 mr-1">—</span>}
          {name}
        </span>
      ),
    },
    {
      title: t('department:parent_label'),
      dataIndex: 'parentId',
      key: 'parentId',
      width: 200,
      render: (parentId: string | null) =>
        parentId ? parentMap.get(parentId) ?? '—' : '—',
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: IDepartmentRow) => {
        const isParent = hasChildren(record.id, departments);
        return (
          <Space size={4}>
            <IconButton
              icon={<EditOutlined />}
              tooltip={t('common:edit')}
              size="small"
              onClick={() => onEdit(record)}
            />
            {isParent ? (
              <Tooltip title={t('department:delete_has_children')}>
                <span>
                  <IconButton
                    icon={<DeleteOutlined />}
                    tooltip={t('department:delete_has_children')}
                    size="small"
                    disabled
                  />
                </span>
              </Tooltip>
            ) : (
              <Popconfirm
                title={t('department:delete_confirm')}
                onConfirm={() => onDelete(record.id)}
                okText={t('common:delete')}
                cancelText={t('common:cancel')}
              >
                <IconButton
                  icon={<DeleteOutlined />}
                  tooltip={t('common:delete')}
                  size="small"
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={false}
      locale={{
        emptyText: (
          <Empty
            description={t('department:no_departments')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
    />
  );
}
