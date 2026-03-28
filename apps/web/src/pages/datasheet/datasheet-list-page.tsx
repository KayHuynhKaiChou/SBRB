import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Badge,
  Popconfirm,
  Typography,
  Tag,
  Tooltip,
  Empty,
  Layout,
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
import { message } from 'antd';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  useDataSheets,
  useDeleteDataSheet,
  useRenameDataSheet,
  useDownloadTemplate,
  type IDataSheetDto,
} from '../../hooks/use-datasheet';
import { ImportDialog } from './import-dialog';
import { ReimportDialog } from './reimport-dialog';

const { Title } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  processing: { color: 'processing', label: 'Đang xử lý' },
  ready: { color: 'success', label: 'Sẵn sàng' },
  error: { color: 'error', label: 'Lỗi' },
  pending: { color: 'default', label: 'Chờ xử lý' },
};

export default function DataSheetListPage() {
  const { currentBusinessId } = useAuthStore();
  const { t } = useTranslation(['datasheet', 'common']);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [reimportTarget, setReimportTarget] = useState<IDataSheetDto | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [page, setPage] = useState(1);

  if (!currentBusinessId) return <Navigate to="/onboarding" replace />;

  const { dataSheets, loading, refetch } = useDataSheets(currentBusinessId);
  const { deleteDataSheet } = useDeleteDataSheet();
  const { renameDataSheet } = useRenameDataSheet();
  const { downloadTemplate, loading: templateLoading } = useDownloadTemplate();

  const filtered = dataSheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    await deleteDataSheet(id);
    message.success(t('datasheet:deleted_success'));
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
      message.success(t('datasheet:renamed_success'));
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

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
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
        return name;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status] ?? { color: 'default', label: status };
        return <Badge status={cfg.color as 'processing' | 'success' | 'error' | 'default'} text={cfg.label} />;
      },
    },
    {
      title: 'Số kỳ',
      dataIndex: 'periodCount',
      key: 'periodCount',
      width: 80,
    },
    {
      title: 'Số chuỗi',
      dataIndex: 'seriesCount',
      key: 'seriesCount',
      width: 90,
    },
    {
      title: 'Ngày import',
      dataIndex: 'importedAt',
      key: 'importedAt',
      width: 150,
      render: (date: string | null) =>
        date ? new Date(date).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
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
          <Button
            icon={<DownloadOutlined />}
            loading={templateLoading}
            onClick={downloadTemplate}
          >
            {t('datasheet:download_template')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setImportOpen(true)}
          >
            {t('datasheet:import_title')}
          </Button>
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
        loading={loading}
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
