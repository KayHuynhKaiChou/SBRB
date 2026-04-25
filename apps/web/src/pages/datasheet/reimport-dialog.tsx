import React, { useState } from 'react';
import { Modal, Upload, Alert, Progress, Space, Typography } from 'antd';
import { useNotify } from '@sbrb/shared-apollo-client';
import { CloseOutlined, CheckOutlined, InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import type { UploadFile } from 'antd';
import { apiClient } from '../../services/api-client';
import { validateUploadFile } from '../../utils/file-upload-validator';

const { Dragger } = Upload;
const { Text } = Typography;

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
  const { t } = useTranslation(['datasheet', 'common']);
  const notify = useNotify();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const handleClose = () => {
    setFile(null);
    setError(null);
    setLoading(false);
    setProgress(null);
    onClose();
  };

  const handleBeforeUpload = (f: File) => {
    const { valid, error } = validateUploadFile(f);
    if (!valid) {
      setError(error!);
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.upload(`/api/v1/data-sheets/${datasheetId}/reimport`, formData);
      setProgress(100);
      notify.success(t('datasheet:reimport_started'));
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
      title={`${t('common:reimport')}: ${datasheetName}`}
      onCancel={loading ? undefined : handleClose}
      closable={false}
      footer={
        <div className="flex justify-end gap-2">
          <IconButton icon={<CheckOutlined />} tooltip={t('common:reimport')} size="small" onClick={handleConfirm} disabled={!file || loading} />
          <IconButton icon={<CloseOutlined />} tooltip={t('common:cancel')} size="small" onClick={handleClose} disabled={loading} />
        </div>
      }
      width={480}
    >
      <Space direction="vertical" className="!w-full" size="middle">
        <Text type="secondary">
          {t('datasheet:reimport_description')} <strong>{datasheetName}</strong>.
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
