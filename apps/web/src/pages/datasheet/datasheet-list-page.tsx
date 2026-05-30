import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Switch,
  Popconfirm,
  Typography,
  Tag,
  Tooltip,
  Empty,
  Layout,
  Avatar,
  Badge,
} from 'antd';
import { Sidebar } from '../../components/layout/sidebar';
import {
  PlusOutlined,
  DownloadOutlined,
  SearchOutlined,
  EditOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { IconButton } from '@sbrb/ui';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useNotify } from '@sbrb/shared-apollo-client';
import { useAuthStore } from '../../store/auth.store';
import {
  useDataSheets,
  useDeleteDataSheet,
  useRenameDataSheet,
  useDownloadTemplate,
  type IDataSheetDto,
  type IListDataSheetsFilter,
  type DataSheetSortField,
  type SortOrder,
} from '../../hooks/use-datasheet';
import type { TableProps, TableColumnsType } from 'antd';
import { useToggleDataSheetStatus } from '../../hooks/use-datasheet-mutations';
import { ImportDialog } from './import-dialog';
import { ReimportDialog } from './reimport-dialog';

const { Title, Text } = Typography;

export default function DataSheetListPage() {
  const { currentBusinessId } = useAuthStore();
  const { t, i18n } = useTranslation(['datasheet', 'common']);
  const navigate = useNavigate();
  const notify = useNotify();
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [reimportTarget, setReimportTarget] = useState<IDataSheetDto | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<IListDataSheetsFilter>({});

  if (!currentBusinessId) return <Navigate to="/onboarding" replace />;

  const { dataSheets, loading, refetch } = useDataSheets(currentBusinessId, filter);

  const handleTableChange: TableProps<IDataSheetDto>['onChange'] = (_pagination, filters, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortKey = s?.columnKey as DataSheetSortField | undefined;
    const sortBy: DataSheetSortField | undefined =
      sortKey && s?.order ? sortKey : undefined;
    const sortOrder: SortOrder | undefined =
      s?.order === 'ascend' ? 'ASC' : s?.order === 'descend' ? 'DESC' : undefined;

    setFilter({
      status: (filters.status as string[] | null)?.length
        ? (filters.status as IListDataSheetsFilter['status'])
        : undefined,
      templateType: (filters.templateType as string[] | null)?.length
        ? (filters.templateType as IListDataSheetsFilter['templateType'])
        : undefined,
      sortBy,
      sortOrder,
    });
    setPage(1);
  };
  const { deleteDataSheet } = useDeleteDataSheet();
  const { renameDataSheet } = useRenameDataSheet();
  const { downloadTemplate, loading: templateLoading } = useDownloadTemplate();
  const { toggleStatus, loading: toggleLoading } = useToggleDataSheetStatus();

  const filtered = dataSheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    await deleteDataSheet(id);
    notify.success(t('datasheet:deleted_success'));
    await refetch();
  };

  const handleStartRename = (sheet: IDataSheetDto) => {
    setRenamingId(sheet.id);
    setRenameValue(sheet.name);
  };

  const handleConfirmRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await renameDataSheet(id, renameValue.trim());
      notify.success(t('datasheet:renamed_success'));
      setRenamingId(null);
      await refetch();
    } catch {
      // error handled inside hook
    }
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const columns: TableColumnsType<IDataSheetDto> = [
    {
      title: t('datasheet:col_name'),
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: { showTitle: false },
      render: (name: string, record: IDataSheetDto) => {
        if (renamingId === record.id) {
          return (
            <Space>
              <Input
                size="small"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onPressEnter={() => handleConfirmRename(record.id)}
                autoFocus
                className="!w-[180px]"
              />
              <IconButton
                icon={<CheckOutlined />}
                tooltip={t('common:confirm')}
                size="small"
                onClick={() => handleConfirmRename(record.id)}
              />
              <IconButton
                icon={<CloseOutlined />}
                tooltip={t('common:cancel')}
                size="small"
                onClick={handleCancelRename}
              />
            </Space>
          );
        }
        return (
          <Text ellipsis={{ tooltip: name }} className="block">
            {name}
          </Text>
        );
      },
    },
    {
      title: t('datasheet:status_col'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: [
        { text: t('datasheet:status_active'), value: 'active' },
        { text: t('datasheet:status_inactive'), value: 'inactive' },
      ],
      filteredValue: filter.status ?? null,
      render: (status: string, record: IDataSheetDto) => {
        const isActive = status === 'active';
        return (
          // Stop propagation so clicking the switch doesn't also trigger the row-level
          // navigate-to-detail handler.
          <span onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t('datasheet:toggle_status_tooltip')}>
              <Switch
                size="small"
                checked={isActive}
                loading={toggleLoading}
                onChange={() => toggleStatus(record.id, status)}
                checkedChildren={t('datasheet:status_active')}
                unCheckedChildren={t('datasheet:status_inactive')}
              />
            </Tooltip>
          </span>
        );
      },
    },
    {
      title: t('datasheet:col_type'),
      dataIndex: 'templateType',
      key: 'templateType',
      width: 130,
      filters: [
        { text: `📊 ${t('datasheet:type_simple')}`, value: 'simple' },
        { text: `🏢 ${t('datasheet:type_department')}`, value: 'department' },
        { text: `💰 ${t('datasheet:type_pnl')}`, value: 'pnl' },
      ],
      filteredValue: filter.templateType ?? null,
      render: (type: IDataSheetDto['templateType']) => {
        const meta = {
          simple: { icon: '📊', label: t('datasheet:type_simple'), color: 'blue' },
          department: { icon: '🏢', label: t('datasheet:type_department'), color: 'purple' },
          pnl: { icon: '💰', label: t('datasheet:type_pnl'), color: 'green' },
        }[type ?? 'simple'] ?? { icon: '📊', label: type, color: 'default' };
        return (
          <Tag color={meta.color} className="!m-0">
            <span className="mr-1">{meta.icon}</span>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: t('datasheet:col_widget_count'),
      dataIndex: 'widgetCount',
      key: 'widgetCount',
      width: 130,
      sorter: true,
      sortOrder:
        filter.sortBy === 'widgetCount'
          ? filter.sortOrder === 'ASC'
            ? 'ascend'
            : 'descend'
          : null,
      render: (count: number) => (
        <Tooltip title={t('datasheet:widget_count_tooltip', { count: count ?? 0 })}>
          <Badge
            count={count ?? 0}
            showZero
            color={count > 0 ? '#D72A44' : '#bfbfbf'}
            overflowCount={99}
          />
        </Tooltip>
      ),
    },
    {
      title: t('datasheet:col_uploader'),
      dataIndex: 'uploader',
      key: 'uploader',
      width: 180,
      render: (uploader: IDataSheetDto['uploader']) => {
        if (!uploader) return <span className="text-gray-400">—</span>;
        const initial = (uploader.fullName || uploader.email || '?').charAt(0).toUpperCase();
        const uploaderName = uploader.fullName || uploader.email;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              size="small"
              src={uploader.avatarUrl ?? undefined}
              style={{ backgroundColor: '#D72A44', verticalAlign: 'middle' }}
              className="shrink-0"
            >
              {initial}
            </Avatar>
            <Text ellipsis={{ tooltip: uploaderName }} className="flex-1 min-w-0 text-sm">
              {uploaderName}
            </Text>
          </div>
        );
      },
    },
    {
      title: t('datasheet:col_import_date'),
      dataIndex: 'importedAt',
      key: 'importedAt',
      width: 150,
      sorter: true,
      sortOrder:
        filter.sortBy === 'importedAt'
          ? filter.sortOrder === 'ASC'
            ? 'ascend'
            : 'descend'
          : null,
      render: (date: string | null) =>
        date ? new Date(date).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') : '-',
    },
    {
      title: t('datasheet:col_actions'),
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: IDataSheetDto) => (
        <Space size={4}>
          <IconButton
            icon={<EditOutlined />}
            tooltip={t('datasheet:rename_tooltip')}
            size="small"
            onClick={() => handleStartRename(record)}
          />
          <IconButton
            icon={<ReloadOutlined />}
            tooltip={t('datasheet:reimport_tooltip')}
            size="small"
            onClick={() => setReimportTarget(record)}
          />
          <Popconfirm
            title={t('common:confirm_delete_title')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common:delete')}
            cancelText={t('common:cancel')}
          >
            <IconButton
              icon={<DeleteOutlined />}
              tooltip={t('common:delete')}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="!min-h-screen">
      <Sidebar />
      <Layout className="!ml-[60px]">
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!m-0">
          {t('datasheet:manage_title')}
        </Title>
        <Space>
          <IconButton
            icon={<DownloadOutlined />}
            tooltip={t('datasheet:download_template')}
            variant="ghost"
            loading={templateLoading}
            onClick={downloadTemplate}
          />
          <IconButton
            icon={<PlusOutlined />}
            tooltip={t('datasheet:import_title')}
            variant="ghost"
            onClick={() => setImportOpen(true)}
          />
        </Space>
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder={t('datasheet:search_placeholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="!mb-3 !w-[300px]"
        allowClear
      />

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading && dataSheets.length === 0}
        onChange={handleTableChange}
        scroll={{ x: 1060 }}
        onRow={(record) => ({
          onClick: (e) => {
            // Don't navigate when clicking action buttons
            const target = e.target as HTMLElement;
            if (target.closest('.ant-space')) return;
            navigate(`/data-sheets/${record.id}`);
          },
          style: { cursor: 'pointer' },
        })}
        pagination={{
          pageSize: 20,
          current: page,
          onChange: setPage,
          showSizeChanger: false,
        }}
        locale={{
          emptyText: (
            <Empty
              description={t('datasheet:no_data_empty')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />

      <ImportDialog
        open={importOpen}
        businessId={currentBusinessId}
        onClose={() => setImportOpen(false)}
        onSuccess={async () => {
          setImportOpen(false);
          await refetch();
        }}
      />

      <ReimportDialog
        open={!!reimportTarget}
        datasheetId={reimportTarget?.id ?? null}
        datasheetName={reimportTarget?.name ?? ''}
        onClose={() => setReimportTarget(null)}
        onSuccess={async () => {
          setReimportTarget(null);
          await refetch();
        }}
      />
    </div>
      </Layout>
    </Layout>
  );
}
