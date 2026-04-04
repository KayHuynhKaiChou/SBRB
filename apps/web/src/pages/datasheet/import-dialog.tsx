import React, { useState } from 'react';
import { Modal, Steps, Upload, Alert, Input, Progress, Typography, Space, Spin } from 'antd';
import {
  CloseOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@sbrb/ui';
import { message } from 'antd';
import type { UploadFile } from 'antd';
import { useImportDataSheet } from '../../hooks/use-datasheet';
import { validateUploadFile } from '../../utils/file-upload-validator';
import { useAuthStore } from '../../store/auth.store';
import { ImportPreviewTable } from '../../components/datasheet/import-preview-table';

const { Dragger } = Upload;
const { Text } = Typography;

interface IPreviewData {
  headers: string[];
  rows: { name: string; values: Record<string, number | null> }[];
  warnings: string[];
}

interface IImportDialogProps {
  open: boolean;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDialog({ open, businessId, onClose, onSuccess }: IImportDialogProps) {
  const { t } = useTranslation(['datasheet', 'common']);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<IPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { upload, progress, isUploading } = useImportDataSheet(businessId);

  const handleClose = () => {
    setStep(0);
    setFile(null);
    setImportName('');
    setError(null);
    setImporting(false);
    setPreviewData(null);
    setPreviewLoading(false);
    onClose();
  };

  const handleBeforeUpload = (f: File) => {
    const { valid, error: validationError } = validateUploadFile(f);
    if (!valid) {
      setError(validationError ?? t('datasheet:import_failed'));
      return Upload.LIST_IGNORE;
    }
    setFile(f);
    setImportName(f.name.replace(/\.(xlsx|csv)$/i, ''));
    setError(null);
    setPreviewData(null);
    return false; // prevent auto upload
  };

  const fetchPreview = async (f: File) => {
    setPreviewLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().accessToken;
      const formData = new FormData();
      formData.append('file', f);
      const response = await fetch('/api/v1/data-sheets/preview', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? `HTTP ${response.status}`);
      }
      const data: IPreviewData = await response.json();
      setPreviewData(data);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!file) {
        setError(t('datasheet:select_file_error'));
        return;
      }
      await fetchPreview(file);
      return;
    }
    if (step === 1) {
      setError(null);
      setStep(2);
    }
  };

  const handleStartImport = async () => {
    if (!file || !importName.trim()) {
      setError(t('datasheet:dataset_name_error'));
      return;
    }
    setImporting(true);
    setError(null);
    try {
      await upload(file, importName.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import thất bại';
      setError(msg);
      setImporting(false);
    }
  };

  // Watch progress completion
  React.useEffect(() => {
    if (progress?.status === 'done' || progress?.percent === 100) {
      message.success(t('datasheet:import_complete'));
      setImporting(false);
      onSuccess();
      handleClose();
    } else if (progress?.status === 'error') {
      setError(progress.errorMessage ?? 'Import thất bại');
      setImporting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const stepItems = [
    { title: t('datasheet:step_select_file') },
    { title: t('datasheet:step_preview') },
    { title: t('datasheet:step_name_import') },
  ];

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Dragger
            accept=".xlsx,.csv"
            beforeUpload={handleBeforeUpload}
            fileList={file ? [{ uid: '1', name: file.name, size: file.size } as UploadFile] : []}
            onRemove={() => { setFile(null); setImportName(''); setPreviewData(null); }}
            maxCount={1}
            disabled={previewLoading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t('datasheet:upload_label')}</p>
            <p className="ant-upload-hint">{t('datasheet:upload_hint')}</p>
          </Dragger>
        );
      case 1:
        return (
          <Spin spinning={previewLoading} tip={t('datasheet:preview_loading')}>
            <div className="py-2" style={{ minHeight: 120 }}>
              {previewData && (
                <ImportPreviewTable
                  headers={previewData.headers}
                  rows={previewData.rows}
                  warnings={previewData.warnings}
                />
              )}
            </div>
          </Spin>
        );
      case 2:
        return (
          <div className="py-4">
            <Space direction="vertical" className="!w-full">
              <Text strong>{t('datasheet:dataset_name_label')}:</Text>
              <Input
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder={t('datasheet:dataset_name_placeholder')}
                disabled={importing || isUploading}
              />
              {(importing || isUploading) && progress && (
                <Progress
                  percent={Math.round(progress.percent)}
                  status={progress.status === 'error' ? 'exception' : 'active'}
                />
              )}
            </Space>
          </div>
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    if (step === 0) {
      return (
        <div className="flex justify-end gap-2">
          <IconButton
            icon={<ArrowRightOutlined />}
            tooltip={t('common:next')}
            size="small"
            onClick={handleNext}
            disabled={!file || previewLoading}
          />
          <IconButton
            icon={<CloseOutlined />}
            tooltip={t('common:cancel')}
            size="small"
            onClick={handleClose}
          />
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="flex justify-end gap-2">
          <IconButton
            icon={<ArrowRightOutlined />}
            tooltip={t('common:next')}
            size="small"
            onClick={handleNext}
            disabled={previewLoading}
          />
          <IconButton
            icon={<ArrowLeftOutlined />}
            tooltip={t('common:back')}
            size="small"
            onClick={() => setStep(0)}
            disabled={previewLoading}
          />
        </div>
      );
    }
    return (
      <div className="flex justify-end gap-2">
        <IconButton
          icon={<CheckOutlined />}
          tooltip={t('common:start_import')}
          size="small"
          onClick={handleStartImport}
          disabled={!importName.trim() || importing || isUploading}
        />
        <IconButton
          icon={<ArrowLeftOutlined />}
          tooltip={t('common:back')}
          size="small"
          onClick={() => setStep(1)}
          disabled={importing || isUploading}
        />
      </div>
    );
  };

  return (
    <Modal
      open={open}
      title={t('datasheet:import_title')}
      onCancel={importing || isUploading ? undefined : handleClose}
      closable={false}
      footer={renderFooter()}
      width={600}
    >
      <Steps current={step} items={stepItems} className="!mb-6" />
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="!mb-3"
        />
      )}
      {renderStepContent()}
    </Modal>
  );
}
