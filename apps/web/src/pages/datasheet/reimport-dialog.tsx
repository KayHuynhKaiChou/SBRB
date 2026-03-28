import React, { useState } from 'react';
import { Modal, Upload, Alert, Button, Progress, Space, Typography, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useAuthStore } from '../../store/auth.store';

const { Dragger } = Upload;
const { Text } = Typography;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface IReimportDialogProps {
  open: boolean;
  datasheetId: string | null;
  datasheetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReimportDialog({
  open,
  datasheetId,
  datasheetName,
  onClose,
  onSuccess,
}: IReimportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const handleClose = () => {
    setFile(null);
    setError(null);
    setProgress(null);
    onClose();
  };

  const handleBeforeUpload = (f: File) => {
    if (f.size > MAX_SIZE_BYTES) {
      setError('File vượt quá 10 MB');
      return Upload.LIST_IGNORE;
    }
    if (!f.name.match(/\.(xlsx|csv)$/i)) {
      setError('Chỉ hỗ trợ file .xlsx hoặc .csv');
      return Upload.LIST_IGNORE;
    }
    setFile(f);
    setError(null);
    return false;
  };

  const handleConfirm = async () => {
    if (!datasheetId || !file) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    const accessToken = useAuthStore.getState().accessToken;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/v1/data-sheets/${datasheetId}/reimport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Reimport thất bại' }));
        throw new Error(err.message ?? 'Reimport thất bại');
      }

      setProgress(100);
      message.success('Đã bắt đầu reimport');
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reimport thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Reimport: ${datasheetName}`}
      onCancel={loading ? undefined : handleClose}
      closable={!loading}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          Huỷ
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={loading}
          disabled={!file}
          onClick={handleConfirm}
        >
          Reimport
        </Button>,
      ]}
      width={480}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text type="secondary">
          Chọn file mới để thay thế dữ liệu cũ của bộ <strong>{datasheetName}</strong>.
        </Text>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        <Dragger
          accept=".xlsx,.csv"
          beforeUpload={handleBeforeUpload}
          fileList={file ? [{ uid: '1', name: file.name, size: file.size } as UploadFile] : []}
          onRemove={() => setFile(null)}
          maxCount={1}
          disabled={loading}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Kéo thả hoặc click để chọn file</p>
          <p className="ant-upload-hint">Hỗ trợ .xlsx, .csv — tối đa 10 MB</p>
        </Dragger>

        {loading && progress !== null && (
          <Progress percent={progress} status="active" />
        )}
      </Space>
    </Modal>
  );
}
