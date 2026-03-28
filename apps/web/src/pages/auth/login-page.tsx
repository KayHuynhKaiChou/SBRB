import React from 'react';
import { Form, Input, Button, Divider, Typography, Space } from 'antd';
import { RiMailLine, RiLockLine } from 'react-icons/ri';
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
    <AuthLayout title="Đăng nhập" subtitle="Chào mừng trở lại! Vui lòng nhập thông tin của bạn.">
      <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 500, color: '#374151' }}>Email</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input
            prefix={<RiMailLine color="#9CA3AF" />}
            placeholder="you@example.com"
            autoComplete="email"
            style={{ borderRadius: 8, height: 44 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, color: '#374151' }}>Mật khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password
            prefix={<RiLockLine color="#9CA3AF" />}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{ borderRadius: 8, height: 44 }}
          />
        </Form.Item>

        <div className="flex items-center justify-end mb-4" style={{ marginTop: -8 }}>
          <Link
            to="/auth/forgot-password"
            style={{ fontSize: 14, color: '#D72A44', fontWeight: 500 }}
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loginLoading}
            style={{
              height: 44,
              borderRadius: 8,
              background: '#D72A44',
              border: 'none',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 4px 12px rgba(215,42,68,0.3)',
            }}
          >
            Đăng nhập
          </Button>
        </Form.Item>

        <Divider style={{ color: '#9CA3AF', fontSize: 13, margin: '12px 0' }}>hoặc tiếp tục với</Divider>

        <GoogleOAuthButton />

        <div className="text-center mt-6">
          <Space size={4}>
            <Typography.Text style={{ color: '#6B7280', fontSize: 14 }}>Chưa có tài khoản?</Typography.Text>
            <Link to="/auth/register" style={{ color: '#D72A44', fontWeight: 600, fontSize: 14 }}>
              Đăng ký ngay
            </Link>
          </Space>
        </div>
      </Form>
    </AuthLayout>
  );
}
