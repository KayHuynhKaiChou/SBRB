import React, { useState } from 'react';
import { Modal, Steps, Upload, Alert, Button, Input, Progress, Typography, Space } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { UploadFile } from 'antd';
import { useImportDataSheet } from '../../hooks/use-datasheet';

const { Dragger } = Upload;
const { Text } = Typography;

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface IImportDialogProps {
  open: boolean;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDialog({ open, businessId, onClose, onSuccess }: IImportDialogProps) {
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
    if (f.size > MAX_SIZE_BYTES) {
      setError('File vượt quá 10 MB');
      return Upload.LIST_IGNORE;
    }
    if (!f.name.match(/\.(xlsx|csv)$/i)) {
      setError('Chỉ hỗ trợ file .xlsx hoặc .csv');
      return Upload.LIST_IGNORE;
    }
    setFile(f);
    setImportName(f.name.replace(/\.(xlsx|csv)$/i, ''));
    setError(null);
    return false; // prevent auto upload
  };

  const handleNext = () => {
    if (step === 0 && !file) {
      setError('Vui lòng chọn file');
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleStartImport = async () => {
    if (!file || !importName.trim()) {
      setError('Vui lòng nhập tên cho bộ dữ liệu');
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
      message.success('Import hoàn thành');
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
    { title: 'Chọn file' },
    { title: 'Xem trước' },
    { title: 'Đặt tên và import' },
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
              <Text strong>Thông tin file:</Text>
              <Text>Tên file: {file?.name}</Text>
              <Text>Kích thước: {file ? (file.size / 1024).toFixed(1) + ' KB' : '-'}</Text>
              <Text type="secondary">
                Server sẽ phân tích chi tiết nội dung file khi import.
              </Text>
            </Space>
          </div>
        );
      case 2:
        return (
          <div style={{ padding: '16px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Tên bộ dữ liệu:</Text>
              <Input
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Nhập tên bộ dữ liệu"
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
      return [
        <Button key="cancel" onClick={handleClose}>Huỷ</Button>,
        <Button key="next" type="primary" onClick={handleNext} disabled={!file}>Tiếp theo</Button>,
      ];
    }
    if (step === 1) {
      return [
        <Button key="back" onClick={() => setStep(0)}>Quay lại</Button>,
        <Button key="next" type="primary" onClick={handleNext}>Tiếp theo</Button>,
      ];
    }
    return [
      <Button key="back" onClick={() => setStep(1)} disabled={importing || isUploading}>Quay lại</Button>,
      <Button
        key="import"
        type="primary"
        loading={importing || isUploading}
        onClick={handleStartImport}
        disabled={!importName.trim()}
      >
        Bắt đầu import
      </Button>,
    ];
  };

  return (
    <Modal
      open={open}
      title="Import dữ liệu mới"
      onCancel={importing || isUploading ? undefined : handleClose}
      closable={!(importing || isUploading)}
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
