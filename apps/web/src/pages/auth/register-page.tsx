import React, { useState } from 'react';
import { Form, Input, Button, Divider, Typography, Space } from 'antd';
import { RiUserLine, RiMailLine, RiLockLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
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
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: met ? '#22C55E' : '#E5E7EB' }}
      >
        {met
          ? <RiCheckLine size={10} color="white" />
          : <RiCloseLine size={10} color="#9CA3AF" />
        }
      </div>
      <Typography.Text style={{ fontSize: 12, color: met ? '#16A34A' : '#9CA3AF' }}>
        {label}
      </Typography.Text>
    </div>
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng ký thất bại, vui lòng thử lại';
      const isEmailTaken = message.toLowerCase().includes('email') || message.includes('409') || message.includes('conflict');
      form.setFields([
        { name: 'email', errors: [isEmailTaken ? 'Email này đã được đăng ký' : message] },
      ]);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Kiểm tra email">
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: '#FFF7F8', border: '1px solid #FECDD3' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#D72A44' }}
          >
            <RiMailLine size={28} color="white" />
          </div>
          <Typography.Title level={5} style={{ margin: '0 0 8px', color: '#111827' }}>
            Xác nhận email của bạn
          </Typography.Title>
          <Typography.Text style={{ color: '#6B7280', fontSize: 14, display: 'block', marginBottom: 20 }}>
            Chúng tôi đã gửi link xác nhận tới email của bạn. Vui lòng kiểm tra hộp thư.
          </Typography.Text>
          <Link to="/auth/login" style={{ color: '#D72A44', fontWeight: 600, fontSize: 14 }}>
            Quay lại đăng nhập
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Bắt đầu miễn phí ngay hôm nay.">
      <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
        <Form.Item
          name="fullName"
          label={<span style={{ fontWeight: 500, color: '#374151' }}>Họ và tên</span>}
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
        >
          <Input
            prefix={<RiUserLine color="#9CA3AF" />}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            style={{ borderRadius: 8, height: 44 }}
          />
        </Form.Item>

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
            prefix={<RiLockLine color="#9CA3AF" />}
            placeholder="••••••••"
            autoComplete="new-password"
            onChange={(e) => checkPassword(e.target.value)}
            style={{ borderRadius: 8, height: 44 }}
          />
        </Form.Item>

        {/* Password strength indicators */}
        <div
          className="rounded-lg p-3 mb-4 flex flex-col gap-2"
          style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}
        >
          <PasswordRequirement met={strength.hasMinLength} label="Tối thiểu 8 ký tự" />
          <PasswordRequirement met={strength.hasUppercase} label="Ít nhất 1 chữ hoa (A-Z)" />
          <PasswordRequirement met={strength.hasDigit} label="Ít nhất 1 chữ số (0-9)" />
        </div>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={registerLoading}
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
            Tạo tài khoản
          </Button>
        </Form.Item>

        <Divider style={{ color: '#9CA3AF', fontSize: 13, margin: '12px 0' }}>hoặc tiếp tục với</Divider>

        <GoogleOAuthButton label="Đăng ký với Google" />

        <div className="text-center mt-6">
          <Space size={4}>
            <Typography.Text style={{ color: '#6B7280', fontSize: 14 }}>Đã có tài khoản?</Typography.Text>
            <Link to="/auth/login" style={{ color: '#D72A44', fontWeight: 600, fontSize: 14 }}>
              Đăng nhập
            </Link>
          </Space>
        </div>
      </Form>
    </AuthLayout>
  );
}
