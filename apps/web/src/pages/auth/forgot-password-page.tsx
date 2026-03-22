import React, { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/auth-layout';
import { useAuth } from '../../hooks/use-auth';

interface ForgotFormValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const { forgotPassword, forgotLoading } = useAuth();
  const [sent, setSent] = useState(false);
  const [form] = Form.useForm<ForgotFormValues>();

  const onFinish = async (values: ForgotFormValues) => {
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch {
      // Silent — do not reveal if email exists (security)
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Kiểm tra email">
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <Typography.Paragraph>
            Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.
          </Typography.Paragraph>
          <Link to="/auth/login">Quay lại đăng nhập</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email để nhận link đặt lại mật khẩu">
      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input placeholder="you@example.com" autoComplete="email" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={forgotLoading}
          >
            Gửi link đặt lại
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Link to="/auth/login">Quay lại đăng nhập</Link>
        </div>
      </Form>
    </AuthLayout>
  );
}
