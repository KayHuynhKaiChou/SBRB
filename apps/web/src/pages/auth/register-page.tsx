import React, { useState } from 'react';
import { Form, Input, Button, Divider, Typography, Space } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/auth-layout';
import { GoogleOAuthButton } from '../../components/auth/google-oauth-button';
import { useAuth } from '../../hooks/use-auth';

interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
}

interface PasswordStrength {
  hasUppercase: boolean;
  hasDigit: boolean;
  hasMinLength: boolean;
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <Space size={4}>
      {met ? (
        <CheckCircleFilled style={{ color: '#52c41a' }} />
      ) : (
        <CloseCircleFilled style={{ color: '#d9d9d9' }} />
      )}
      <Typography.Text type={met ? 'success' : 'secondary'} style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
    </Space>
  );
}

export default function RegisterPage() {
  const { register, registerLoading } = useAuth();
  const [form] = Form.useForm<RegisterFormValues>();
  const [strength, setStrength] = useState<PasswordStrength>({
    hasUppercase: false,
    hasDigit: false,
    hasMinLength: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const checkPassword = (value: string) => {
    setStrength({
      hasUppercase: /[A-Z]/.test(value),
      hasDigit: /[0-9]/.test(value),
      hasMinLength: value.length >= 8,
    });
  };

  const onFinish = async (values: RegisterFormValues) => {
    try {
      await register(values);
      setSubmitted(true);
    } catch {
      form.setFields([
        { name: 'email', errors: ['Email này đã được đăng ký'] },
      ]);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Kiểm tra email">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Typography.Text>
            Vui lòng kiểm tra email để xác nhận tài khoản
          </Typography.Text>
          <div style={{ marginTop: 16 }}>
            <Link to="/auth/login">Quay lại đăng nhập</Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Đăng ký" subtitle="Tạo tài khoản mới">
      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
        >
          <Input placeholder="Nguyễn Văn A" autoComplete="name" />
        </Form.Item>

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
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                if (value.length < 8 || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
                  return Promise.reject('Mật khẩu chưa đủ yêu cầu');
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.Password
            placeholder="••••••••"
            autoComplete="new-password"
            onChange={(e) => checkPassword(e.target.value)}
          />
        </Form.Item>

        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <PasswordRequirement met={strength.hasUppercase} label="Ít nhất 1 chữ hoa" />
          <PasswordRequirement met={strength.hasDigit} label="Ít nhất 1 chữ số" />
          <PasswordRequirement met={strength.hasMinLength} label="Tối thiểu 8 ký tự" />
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={registerLoading}
          >
            Đăng ký
          </Button>
        </Form.Item>

        <Divider>hoặc</Divider>

        <GoogleOAuthButton label="Đăng ký với Google" />

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space>
            <Typography.Text type="secondary">Đã có tài khoản?</Typography.Text>
            <Link to="/auth/login">Đăng nhập</Link>
          </Space>
        </div>
      </Form>
    </AuthLayout>
  );
}
