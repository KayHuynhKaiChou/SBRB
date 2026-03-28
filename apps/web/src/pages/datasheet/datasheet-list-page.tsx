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
    message.success('Đã xoá bộ dữ liệu');
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
      message.success('Đã đổi tên');
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
                style={{ width: 180 }}
              />
              <Button
                size="small"
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleConfirmRename(record.id)}
              />
              <Button
                size="small"
                type="text"
                icon={<CloseOutlined />}
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
          <Tooltip title="Đổi tên">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleStartRename(record)}
            />
          </Tooltip>
          <Tooltip title="Reimport">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => setReimportTarget(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xoá bộ dữ liệu này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Tooltip title="Xoá">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 60 }}>
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Quản lý dữ liệu
        </Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            loading={templateLoading}
            onClick={downloadTemplate}
          >
            Tải mẫu Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setImportOpen(true)}
          >
            Import mới
          </Button>
        </Space>
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder="Tìm kiếm bộ dữ liệu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12, width: 300 }}
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
              description="Chưa có dữ liệu nào. Hãy import file Excel."
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
