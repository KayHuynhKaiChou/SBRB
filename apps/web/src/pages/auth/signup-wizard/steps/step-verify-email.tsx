import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Typography } from 'antd';
import { RiMailSendLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { EMAIL_VERIFY_OTP_LENGTH, API_ROUTES } from '@sbrb/shared-constants';

interface IStepVerifyEmailProps {
  email: string;
  loading: boolean;
  /** Verify the entered OTP; resolves true when the code is correct. */
  onVerify: (code: string) => Promise<boolean>;
  onVerified: () => void;
}

const RESEND_COOLDOWN_S = 60;

/**
 * Wizard step 2 — enter the 6-digit OTP sent by email. Uses antd `Input.OTP`
 * inside a Form (no manual state). Auto-submits when all digits are filled.
 */
export function StepVerifyEmail({ email, loading, onVerify, onVerified }: IStepVerifyEmailProps) {
  const { t } = useTranslation('business');
  const [form] = Form.useForm<{ code: string }>();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submit = async (code: string) => {
    if (!code || code.length < EMAIL_VERIFY_OTP_LENGTH) return;
    const ok = await onVerify(code);
    if (ok) {
      onVerified();
    } else {
      form.setFields([{ name: 'code', errors: [t('verify_otp_invalid')] }]);
    }
  };

  const resend = async () => {
    try {
      await fetch(API_ROUTES.AUTH.RESEND_VERIFICATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setCooldown(RESEND_COOLDOWN_S);
      form.resetFields();
    } catch {
      /* ignore — user can retry */
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#FFF1F3]">
        <RiMailSendLine size={32} color="#D72A44" />
      </div>
      <div>
        <Typography.Title level={5} className="!mt-0 !mb-1.5">
          {t('verify_title')}
        </Typography.Title>
        <Typography.Text className="!text-gray-500 !text-sm">
          {t('verify_otp_desc')}{' '}
          <span className="font-semibold text-gray-700">{email}</span>
        </Typography.Text>
      </div>

      <Form form={form} onFinish={(v) => submit(v.code)} className="w-full">
        <Form.Item
          name="code"
          rules={[{ required: true, message: t('verify_otp_required') }]}
          className="!mb-3 flex justify-center"
        >
          <Input.OTP
            length={EMAIL_VERIFY_OTP_LENGTH}
            size="large"
            autoFocus
            onChange={(val) => {
              if (val.length === EMAIL_VERIFY_OTP_LENGTH) void submit(val);
            }}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold"
        >
          {t('verify_confirm')}
        </Button>
      </Form>

      <Button type="link" disabled={cooldown > 0} onClick={resend} className="!text-[#D72A44]">
        {cooldown > 0 ? t('verify_resend_cooldown', { s: cooldown }) : t('verify_resend')}
      </Button>
    </div>
  );
}
