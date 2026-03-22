import React from 'react';
import { Form, Input, Button, Divider, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/auth-layout';
import { GoogleOAuthButton } from '../../components/auth/google-oauth-button';
import { useAuth } from '../../hooks/use-auth';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, loginLoading } = useAuth();
  const [form] = Form.useForm<LoginFormValues>();

  const onFinish = async (values: LoginFormValues) => {
    try {
      await login(values);
    } catch {
      form.setFields([
        { name: 'password', errors: ['Email hoặc mật khẩu không đúng'] },
      ]);
    }
  };

  return (
    <AuthLayout title="Đăng nhập" subtitle="Chào mừng trở lại">
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

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password placeholder="••••••••" autoComplete="current-password" />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link to="/auth/forgot-password">Quên mật khẩu?</Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loginLoading}
          >
            Đăng nhập
          </Button>
        </Form.Item>

        <Divider>hoặc</Divider>

        <GoogleOAuthButton />

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space>
            <Typography.Text type="secondary">Chưa có tài khoản?</Typography.Text>
            <Link to="/auth/register">Đăng ký ngay</Link>
          </Space>
        </div>
      </Form>
    </AuthLayout>
  );
}
