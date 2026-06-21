import { Form, Input } from 'antd';
import type { Rule } from 'antd/es/form';
import { useTranslation } from 'react-i18next';
import { PASSWORD_MIN_LENGTH, PASSWORD_RULE_REGEX } from '@sbrb/shared-constants';

interface PasswordFormProps {
  /** Show the "current password" field (change-password flow). Default false. */
  requireCurrent?: boolean;
  currentName?: string;
  newName?: string;
  confirmName?: string;
  disabled?: boolean;
}

/**
 * Shared password fields block — renders Form.Item(s) ONLY (no submit button), so it
 * lives inside a parent <Form> (page or FormModal). Used by set-password, reset-password,
 * and change-password. Field names default to currentPassword/newPassword/confirmPassword
 * to stay drop-in compatible with IChangePasswordValues.
 */
export function PasswordForm({
  requireCurrent = false,
  currentName = 'currentPassword',
  newName = 'newPassword',
  confirmName = 'confirmPassword',
  disabled,
}: PasswordFormProps) {
  const { t } = useTranslation('auth');

  const newPasswordRules: Rule[] = [
    { required: true, message: t('pw_required') },
    { min: PASSWORD_MIN_LENGTH, message: t('pw_min', { min: PASSWORD_MIN_LENGTH }) },
    { pattern: PASSWORD_RULE_REGEX, message: t('pw_policy') },
  ];

  return (
    <>
      {requireCurrent && (
        <Form.Item
          label={t('pw_current_label')}
          name={currentName}
          rules={[{ required: true, message: t('pw_required') }]}
        >
          <Input.Password
            autoComplete="current-password"
            placeholder={t('pw_current_ph')}
            disabled={disabled}
          />
        </Form.Item>
      )}

      <Form.Item label={t('pw_new_label')} name={newName} rules={newPasswordRules}>
        <Input.Password
          autoComplete="new-password"
          placeholder={t('pw_new_ph')}
          disabled={disabled}
        />
      </Form.Item>

      <Form.Item
        label={t('pw_confirm_label')}
        name={confirmName}
        dependencies={[newName]}
        rules={[
          { required: true, message: t('pw_required') },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue(newName) === value) return Promise.resolve();
              return Promise.reject(new Error(t('pw_mismatch')));
            },
          }),
        ]}
      >
        <Input.Password
          autoComplete="new-password"
          placeholder={t('pw_confirm_ph')}
          disabled={disabled}
        />
      </Form.Item>
    </>
  );
}
