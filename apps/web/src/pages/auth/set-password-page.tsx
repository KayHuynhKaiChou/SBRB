import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../components/auth/auth-layout';
import { PasswordForm } from '../../components/auth/password-form';
import { useAuth } from '../../hooks/use-auth';
import { AuthSuccess } from './auth-success-page';

interface SetPasswordValues {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Public page for invited accounts to set their first password via emailed link.
 * URL: /set-password?token=<t>&email=<e>. On success → activation success screen.
 */
export default function SetPasswordPage() {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const { setAccountPassword, setPasswordLoading } = useAuth();
  const [form] = Form.useForm<SetPasswordValues>();
  const [done, setDone] = useState(false);

  const missingParams = !token || !email;

  const onFinish = async (values: SetPasswordValues) => {
    try {
      await setAccountPassword({ token, email, password: values.newPassword });
      setDone(true);
    } catch {
      // Error toast handled by useAppMutation; surface inline hint too.
      form.setFields([{ name: 'newPassword', errors: [t('set_password_invalid_token')] }]);
    }
  };

  if (done) {
    return (
      <AuthSuccess
        title={t('set_password_success_title')}
        description={t('set_password_success_desc')}
        ctaLabel={t('go_to_login')}
      />
    );
  }

  return (
    <AuthLayout title={t('set_password_title')} subtitle={t('set_password_subtitle')}>
      {missingParams ? (
        <Alert type="error" showIcon message={t('set_password_invalid_token')} />
      ) : (
        <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
          <Form.Item label={t('set_password_email_label')}>
            <Input value={email} disabled />
          </Form.Item>

          <PasswordForm requireCurrent={false} />

          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" block loading={setPasswordLoading}>
              {t('set_password_btn')}
            </Button>
          </Form.Item>
        </Form>
      )}
    </AuthLayout>
  );
}
