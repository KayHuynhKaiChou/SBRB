import React, { useState } from 'react';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormModal } from '@sbrb/ui';

interface IInactivateValues {
  reason: string;
  confirmName: string;
}

interface IInactivateBusinessModalProps {
  open: boolean;
  businessName: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

/**
 * Modal for inactivating a business.
 * Requires: reason textarea + confirm-by-typing-name field (fat-finger prevention, SRS §10).
 * - Double-submit protected via local `submitting` flag.
 * - Confirm-name validator is case-insensitive + trim (SRS §5.14).
 */
export function InactivateBusinessModal({
  open,
  businessName,
  loading,
  onClose,
  onSubmit,
}: IInactivateBusinessModalProps) {
  const { t } = useTranslation('admin');
  const [submitting, setSubmitting] = useState(false);
  const isBlocked = submitting || loading;

  const handleSubmit = async (values: IInactivateValues) => {
    if (isBlocked) return; // double-tap guard
    setSubmitting(true);
    try {
      await onSubmit(values.reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal<IInactivateValues>
      title={t('inactivate_modal_title')}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      okText={t('inactivate_modal_ok')}
      cancelText={t('common:cancel', 'Cancel')}
      width={520}
      destroyOnClose
    >
      <p className="text-sm text-gray-600 mb-4">
        {t('inactivate_modal_warning_pre', 'This will set')}{' '}
        <strong>{businessName}</strong>{' '}
        {t('inactivate_modal_warning_post', 'to inactive. Members will lose access on next navigation. This action can be reversed.')}
      </p>

      <Form.Item
        name="reason"
        label={t('inactivate_modal_reason_label')}
        rules={[
          { required: true, message: t('inactivate_modal_reason_required') },
          { max: 500, message: t('inactivate_modal_reason_max') },
          { min: 1, message: t('inactivate_modal_reason_required') },
        ]}
      >
        <Input.TextArea
          rows={4}
          maxLength={500}
          showCount
          placeholder={t('inactivate_modal_reason_ph')}
          disabled={isBlocked}
        />
      </Form.Item>

      <Form.Item
        name="confirmName"
        label={t('inactivate_modal_confirm_label', { name: businessName })}
        rules={[
          { required: true, message: t('inactivate_modal_confirm_required') },
          {
            // Case-insensitive + trim — fat-finger prevention, not a security gate
            validator: (_, value: string) =>
              (value ?? '').trim().toLowerCase() === businessName.trim().toLowerCase()
                ? Promise.resolve()
                : Promise.reject(new Error(t('inactivate_modal_confirm_mismatch', { name: businessName }))),
          },
        ]}
      >
        <Input placeholder={businessName} disabled={isBlocked} />
      </Form.Item>
    </FormModal>
  );
}
