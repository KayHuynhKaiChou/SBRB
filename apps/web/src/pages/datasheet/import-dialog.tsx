import React, { useState } from 'react';
import { Modal, Steps, Upload, Alert, Input, Progress, Typography, Space } from 'antd';
import { CloseOutlined, CheckOutlined, ArrowLeftOutlined, ArrowRightOutlined, InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ModalActions } from '../../components/common/modal-actions';
import { message } from 'antd';
import type { UploadFile } from 'antd';
import { useImportDataSheet } from '../../hooks/use-datasheet';
import { validateUploadFile } from '../../utils/file-upload-validator';

const { Dragger } = Upload;
const { Text } = Typography;

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

  const { upload, progress, isUploading } = useImportDataSheet(businessId);

  const handleClose = () => {
    setStep(0);
    setFile(null);
    setImportName('');
    setError(null);
    setImporting(false);
    onClose();
  };

  const handleBeforeUpload = (f: File) => {
    const { valid, error } = validateUploadFile(f);
    if (!valid) {
      setError(error!);
      return Upload.LIST_IGNORE;
    }
    setFile(f);
    setImportName(f.name.replace(/\.(xlsx|csv)$/i, ''));
    setError(null);
    return false; // prevent auto upload
  };

  const handleNext = () => {
    if (step === 0 && !file) {
      setError(t('datasheet:select_file_error'));
      return;
    }
    setError(null);
    setStep((s) => s + 1);
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
      // Wait for progress to reach complete
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
            onRemove={() => { setFile(null); setImportName(''); }}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo thả hoặc click để chọn file</p>
            <p className="ant-upload-hint">Hỗ trợ .xlsx, .csv — tối đa 10 MB</p>
          </Dragger>
        );
      case 1:
        return (
          <div style={{ padding: '16px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t('datasheet:file_info')}:</Text>
              <Text>{t('datasheet:file_name')}: {file?.name}</Text>
              <Text>{t('datasheet:file_size')}: {file ? (file.size / 1024).toFixed(1) + ' KB' : '-'}</Text>
              <Text type="secondary">
                {t('datasheet:server_analyze_hint')}
              </Text>
            </Space>
          </div>
        );
      case 2:
        return (
          <div style={{ padding: '16px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
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
        <ModalActions actions={[
          { icon: <ArrowRightOutlined />, tooltip: t('common:next'), onClick: handleNext, disabled: !file },
          { icon: <CloseOutlined />, tooltip: t('common:cancel'), onClick: handleClose },
        ]} />
      );
    }
    if (step === 1) {
      return (
        <ModalActions actions={[
          { icon: <ArrowRightOutlined />, tooltip: t('common:next'), onClick: handleNext },
          { icon: <ArrowLeftOutlined />, tooltip: t('common:back'), onClick: () => setStep(0) },
        ]} />
      );
    }
    return (
      <ModalActions actions={[
        { icon: <CheckOutlined />, tooltip: t('common:start_import'), onClick: handleStartImport, disabled: !importName.trim() || importing || isUploading },
        { icon: <ArrowLeftOutlined />, tooltip: t('common:back'), onClick: () => setStep(1), disabled: importing || isUploading },
      ]} />
    );
  };

  return (
    <Modal
      open={open}
      title={t('datasheet:import_title')}
      onCancel={importing || isUploading ? undefined : handleClose}
      closable={false}
      footer={renderFooter()}
      width={520}
    >
      <Steps current={step} items={stepItems} style={{ marginBottom: 24 }} />
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 12 }}
        />
      )}
      {renderStepContent()}
    </Modal>
  );
}
