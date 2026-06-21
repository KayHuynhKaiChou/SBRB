import { useState } from 'react';
import { Button, Form } from 'antd';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../components/auth/auth-layout';
import { PasswordForm } from '../../components/auth/password-form';
import { useAuth } from '../../hooks/use-auth';
import { AuthSuccess } from './auth-success-page';

interface ResetFormValues {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Forgot-password reset page. Reads `?token=` query param (matches backend email link)
 * and reuses the shared <PasswordForm />. On success → password-changed success screen.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const routeParams = useParams<{ token?: string }>();
  const token = params.get('token') ?? routeParams.token ?? '';
  const { resetPassword, resetLoading } = useAuth();
  const [form] = Form.useForm<ResetFormValues>();
  const [done, setDone] = useState(false);

  const onFinish = async (values: ResetFormValues) => {
    if (!token) return;
    try {
      await resetPassword(token, values.newPassword);
      setDone(true);
    } catch {
      form.setFields([{ name: 'newPassword', errors: [t('set_password_invalid_token')] }]);
    }
  };

  if (done) {
    return (
      <AuthSuccess
        title={t('reset_success_title')}
        description={t('reset_success_desc')}
        ctaLabel={t('go_to_login')}
      />
    );
  }

  return (
    <AuthLayout title={t('reset_password_title')} subtitle={t('reset_password_subtitle')}>
      <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
        <PasswordForm requireCurrent={false} />

        <Form.Item className="!mb-0">
          <Button type="primary" htmlType="submit" block loading={resetLoading}>
            {t('reset_password_submit')}
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
}
