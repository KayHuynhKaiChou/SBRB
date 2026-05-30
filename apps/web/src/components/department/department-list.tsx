import React, { useMemo } from 'react';
import { Table, Space, Popconfirm, Empty, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { IconButton } from '@sbrb/ui';
import { useTranslation } from 'react-i18next';
import type { IDepartmentDto } from '../../hooks/use-departments';

const { Text } = Typography;

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

  const columns: TableColumnsType<IDepartmentRow> = [
    {
      title: t('department:name_label'),
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: { showTitle: false },
      render: (name: string, record: IDepartmentRow) => (
        <span style={{ paddingLeft: record.depth * 24 }} className="flex items-center min-w-0">
          {record.depth > 0 && <span className="text-gray-400 mr-1 shrink-0">—</span>}
          <Text ellipsis={{ tooltip: name }} className="flex-1 min-w-0">
            {name}
          </Text>
        </span>
      ),
    },
    {
      title: t('department:parent_label'),
      dataIndex: 'parentId',
      key: 'parentId',
      width: 200,
      ellipsis: { showTitle: false },
      render: (parentId: string | null) => {
        const parentName = parentId ? (parentMap.get(parentId) ?? '—') : '—';
        return (
          <Text ellipsis={{ tooltip: parentName ?? undefined }} className="block">
            {parentName}
          </Text>
        );
      },
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
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
    <Table<IDepartmentRow>
      dataSource={rows}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, size: 'small' }}
      scroll={{ x: 520 }}
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
