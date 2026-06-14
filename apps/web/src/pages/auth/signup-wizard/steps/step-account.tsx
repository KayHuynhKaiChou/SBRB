import React, { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { RiUserLine, RiMailLine, RiLockLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';

export interface IAccountValues {
  fullName: string;
  email: string;
  password: string;
}

interface IStepAccountProps {
  initial?: Partial<IAccountValues>;
  loading: boolean;
  onSubmit: (values: IAccountValues) => void;
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
          met ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        {met ? <RiCheckLine size={10} color="white" /> : <RiCloseLine size={10} color="#9CA3AF" />}
      </div>
      <Typography.Text className={`!text-xs ${met ? '!text-green-600' : '!text-gray-400'}`}>
        {label}
      </Typography.Text>
    </div>
  );
}

/** Wizard step 1 — owner account details (full name, email, password). */
export function StepAccount({ initial, loading, onSubmit }: IStepAccountProps) {
  const { t } = useTranslation(['business', 'auth']);
  const [form] = Form.useForm<IAccountValues>();
  const [strength, setStrength] = useState({
    hasUppercase: false,
    hasDigit: false,
    hasMinLength: false,
  });

  const checkPassword = (value: string) =>
    setStrength({
      hasUppercase: /[A-Z]/.test(value),
      hasDigit: /[0-9]/.test(value),
      hasMinLength: value.length >= 8,
    });

  return (
    <Form
      form={form}
      layout="vertical"
      size="large"
      requiredMark={false}
      initialValues={initial}
      onFinish={onSubmit}
    >
      <Form.Item
        name="fullName"
        label={t('business:wizard_full_name')}
        rules={[{ required: true, message: t('business:wizard_full_name_required') }]}
      >
        <Input prefix={<RiUserLine color="#9CA3AF" />} placeholder="Nguyễn Văn A" autoComplete="name" className="!rounded-lg" />
      </Form.Item>

      <Form.Item
        name="email"
        label={t('auth:email_label')}
        rules={[
          { required: true, message: t('business:wizard_email_required') },
          { type: 'email', message: t('business:wizard_email_invalid') },
        ]}
      >
        <Input prefix={<RiMailLine color="#9CA3AF" />} placeholder="you@example.com" autoComplete="email" className="!rounded-lg" />
      </Form.Item>

      <Form.Item
        name="password"
        label={t('auth:password_label')}
        rules={[
          { required: true, message: t('business:wizard_password_required') },
          {
            validator: (_, value) => {
              if (!value) return Promise.resolve();
              if (value.length < 8 || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
                return Promise.reject(new Error(t('business:wizard_password_weak')));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input.Password
          prefix={<RiLockLine color="#9CA3AF" />}
          placeholder="••••••••"
          autoComplete="new-password"
          onChange={(e) => checkPassword(e.target.value)}
          className="!rounded-lg"
        />
      </Form.Item>

      <div className="rounded-lg p-3 mb-4 flex flex-col gap-2 bg-gray-50 border border-gray-100">
        <PasswordRequirement met={strength.hasMinLength} label={t('business:pw_min')} />
        <PasswordRequirement met={strength.hasUppercase} label={t('business:pw_upper')} />
        <PasswordRequirement met={strength.hasDigit} label={t('business:pw_digit')} />
      </div>

      <Button
        type="primary"
        htmlType="submit"
        block
        loading={loading}
        className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold !text-[15px]"
      >
        {t('business:wizard_continue')}
      </Button>
    </Form>
  );
}
