import React, { useState } from 'react';
import { Modal, Table, Button, Space, Form, Input, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';
import type { IAdminChangeRequest } from '../../../hooks/use-admin-business-review';
import { BUSINESS_FIELD_LABEL_KEY } from './business-field-label';

interface IChangeRequestDiffProps {
  request: IAdminChangeRequest | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  approveLoading: boolean;
  rejectLoading: boolean;
}

interface IDiffRow {
  field: string;
  old: unknown;
  new: unknown;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Modal showing a before→after diff for a change-request, with approve/reject. */
export function ChangeRequestDiff({
  request,
  open,
  onClose,
  onApprove,
  onReject,
  approveLoading,
  rejectLoading,
}: IChangeRequestDiffProps) {
  const { t } = useTranslation(['admin', 'business']);
  const [rejectOpen, setRejectOpen] = useState(false);
  const fieldLabel = (k: string) =>
    BUSINESS_FIELD_LABEL_KEY[k] ? t(`business:${BUSINESS_FIELD_LABEL_KEY[k]}`) : k;

  const rows: IDiffRow[] = request
    ? Object.entries(request.changes).map(([field, c]) => ({ field, old: c.old, new: c.new }))
    : [];

  return (
    <>
      <Modal
        title={t('cr_diff_title')}
        open={open}
        onCancel={onClose}
        width={640}
        footer={
          <Space className="!w-full !justify-end">
            <Button danger onClick={() => setRejectOpen(true)} loading={rejectLoading}>
              {t('cr_reject')}
            </Button>
            <Button
              type="primary"
              onClick={() => request && onApprove(request.id)}
              loading={approveLoading}
              className="!bg-[#D72A44] !border-[#D72A44]"
            >
              {t('cr_approve')}
            </Button>
          </Space>
        }
      >
        {request && (
          <Typography.Paragraph type="secondary" className="!mb-3">
            {t('cr_business')}: <strong>{request.businessName}</strong> · {t('cr_requested_by')}:{' '}
            {request.requestedByEmail}
          </Typography.Paragraph>
        )}
        <Table<IDiffRow>
          dataSource={rows}
          rowKey="field"
          pagination={false}
          size="small"
          columns={[
            { title: t('cr_field'), dataIndex: 'field', key: 'field', width: 160, render: (f: string) => fieldLabel(f) },
            { title: t('cr_old'), dataIndex: 'old', key: 'old', render: (v) => <span className="text-gray-400">{fmt(v)}</span> },
            { title: t('cr_new'), dataIndex: 'new', key: 'new', render: (v) => <span className="text-green-600 font-medium">{fmt(v)}</span> },
          ]}
        />
      </Modal>

      {rejectOpen && request && (
        <FormModal<{ reason: string }>
          title={t('cr_reject_title')}
          open={rejectOpen}
          onClose={() => setRejectOpen(false)}
          onSubmit={async (v) => {
            await onReject(request.id, v.reason);
            setRejectOpen(false);
          }}
          okText={t('reject_modal_ok')}
          cancelText={t('common:cancel', 'Cancel')}
        >
          <Form.Item
            name="reason"
            label={t('reject_modal_reason_label')}
            rules={[{ required: true, message: t('reject_modal_reason_required') }]}
          >
            <Input.TextArea rows={4} maxLength={500} showCount placeholder={t('reject_modal_reason_ph')} />
          </Form.Item>
        </FormModal>
      )}
    </>
  );
}
