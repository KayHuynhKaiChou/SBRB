import React, { useState, useRef, useCallback } from 'react';
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
import type { UploadFile } from 'antd';
import { useNotify } from '@sbrb/shared-apollo-client';
import { useImportDataSheet } from '../../hooks/use-datasheet';
import { useInterval } from '../../hooks/use-interval';
import { validateUploadFile } from '../../utils/file-upload-validator';
import { useAuthStore } from '../../store/auth.store';
import { ImportPreviewTable } from '../../components/datasheet/import-preview-table';
import { ImportTemplateSelector } from '../../components/datasheet/import-template-selector';
import { DepartmentSelect } from '../../components/department/department-select';

const { Dragger } = Upload;
const { Text } = Typography;

interface IPreviewData {
  headers: string[];
  rows: { name: string; values: Record<string, number | null> }[];
  warnings: string[];
  groups?: { departmentName: string; seriesCount: number }[];
  categories?: { name: string; level: number; hasValues: boolean }[];
  departmentColumns?: { name: string; startCol: number; endCol: number; periods: string[] }[];
}

interface IImportDialogProps {
  open: boolean;
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDialog({ open, businessId, onClose, onSuccess }: IImportDialogProps) {
  const { t } = useTranslation(['datasheet', 'common', 'department']);
  const notify = useNotify();
  const [step, setStep] = useState(0);
  const [templateType, setTemplateType] = useState<'simple' | 'department' | 'pnl'>('simple');
  const [file, setFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<IPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { upload, progress, isUploading } = useImportDataSheet(businessId);
  // Setting this to a datasheet id starts the REST polling fallback (useInterval below).
  // null pauses + clears the interval.
  const [pollingDatasheetId, setPollingDatasheetId] = useState<string | null>(null);

  const handleClose = () => {
    setPollingDatasheetId(null);
    setStep(0);
    setTemplateType('simple');
    setFile(null);
    setImportName('');
    setDepartmentId(null);
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
      const response = await fetch(`/api/v1/data-sheets/preview?templateType=${templateType}`, {
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

  const doneRef = useRef(false);
  const handleImportDone = useCallback(() => {
    if (doneRef.current) return; // dedup: poll + WebSocket may both fire
    doneRef.current = true;
    setPollingDatasheetId(null);
    notify.success(t('datasheet:import_complete'));
    setImporting(false);
    onSuccess();
    // Reset state inline instead of calling handleClose (avoids stale closure)
    setStep(0);
    setTemplateType('simple');
    setFile(null);
    setImportName('');
    setDepartmentId(null);
    setError(null);
    setPreviewData(null);
    setPreviewLoading(false);
    onClose();
  }, [onSuccess, onClose, t, notify]);

  const handleStartImport = async () => {
    if (!file || !importName.trim()) {
      setError(t('datasheet:dataset_name_error'));
      return;
    }
    setImporting(true);
    setError(null);
    doneRef.current = false;
    try {
      const datasheetId = await upload(file, importName.trim(), departmentId, templateType);
      // REST polling fallback (WebSocket may miss if job completes before subscription).
      // useInterval below picks up the new id and starts polling.
      setPollingDatasheetId(datasheetId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('datasheet:import_failed');
      setError(msg);
      setImporting(false);
    }
  };

  // Poll the datasheet status every 2s while pollingDatasheetId is set.
  // Auto-cleans on unmount or when id flips back to null (handleImportDone/handleClose).
  useInterval(
    async () => {
      if (!pollingDatasheetId) return;
      try {
        const token = useAuthStore.getState().accessToken;
        const res = await fetch(`/api/v1/data-sheets/${pollingDatasheetId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const sheet = await res.json();
        // After status refactor: successful import → 'active'. Failed import rolls
        // the row back (not reachable via GET), so the only "stuck polling" case we'd
        // still observe is a legitimate 'active' — stop and report done.
        if (sheet.status === 'active') handleImportDone();
      } catch { /* ignore poll errors */ }
    },
    pollingDatasheetId ? 2000 : null,
  );

  // Watch progress completion (dedup via doneRef — poll handler may also fire)
  React.useEffect(() => {
    if (progress?.status === 'done' || progress?.percent === 100) {
      handleImportDone();
    } else if (progress?.status === 'error') {
      setError(progress.errorMessage ?? t('datasheet:import_failed'));
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
          <>
          <ImportTemplateSelector
            templateType={templateType}
            onChange={setTemplateType}
            disabled={previewLoading}
          />
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
          </>
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
                  templateType={templateType}
                  groups={previewData.groups}
                  categories={previewData.categories}
                  departmentColumns={previewData.departmentColumns}
                />
              )}
            </div>
          </Spin>
        );
      case 2:
        return (
          <div className="py-4">
            <Space direction="vertical" className="!w-full">
              <DepartmentSelect
                businessId={businessId}
                value={departmentId}
                onChange={setDepartmentId}
                disabled={importing || isUploading}
              />
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
      width={800}
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
