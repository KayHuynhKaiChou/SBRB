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
          label={<span className="font-medium text-gray-700">Email</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input
            prefix={<RiMailLine color="#9CA3AF" />}
            placeholder="you@example.com"
            autoComplete="email"
            className="!rounded-lg !h-11"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="font-medium text-gray-700">Mật khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password
            prefix={<RiLockLine color="#9CA3AF" />}
            placeholder="••••••••"
            autoComplete="current-password"
            className="!rounded-lg !h-11"
          />
        </Form.Item>

        <div className="flex items-center justify-end mb-4 -mt-2">
          <Link to="/auth/forgot-password" className="!text-sm !text-[#D72A44] !font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        <Form.Item className="!mb-3">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loginLoading}
            className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold !text-[15px] ![box-shadow:0_4px_12px_rgba(215,42,68,0.3)]"
          >
            Đăng nhập
          </Button>
        </Form.Item>

        <Divider className="!text-gray-400 !text-[13px] !my-3">hoặc tiếp tục với</Divider>

        <GoogleOAuthButton />

        <div className="text-center mt-6">
          <Space size={4}>
            <Typography.Text className="!text-gray-500 !text-sm">Chưa có tài khoản?</Typography.Text>
            <Link to="/auth/register" className="!text-[#D72A44] !font-semibold !text-sm">
              Đăng ký ngay
            </Link>
          </Space>
        </div>
      </Form>
    </AuthLayout>
  );
}
