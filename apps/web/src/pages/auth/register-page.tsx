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
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${met ? 'bg-green-500' : 'bg-gray-200'}`}>
        {met
          ? <RiCheckLine size={10} color="white" />
          : <RiCloseLine size={10} color="#9CA3AF" />
        }
      </div>
      <Typography.Text className={`!text-xs ${met ? '!text-green-600' : '!text-gray-400'}`}>
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
        <div className="rounded-xl p-6 text-center bg-[#FFF7F8] border border-rose-200">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#D72A44]">
            <RiMailLine size={28} color="white" />
          </div>
          <Typography.Title level={5} className="!mt-0 !mb-2 !text-gray-900">
            Xác nhận email của bạn
          </Typography.Title>
          <Typography.Text className="!text-gray-500 !text-sm !block !mb-5">
            Chúng tôi đã gửi link xác nhận tới email của bạn. Vui lòng kiểm tra hộp thư.
          </Typography.Text>
          <Link to="/auth/login" className="!text-[#D72A44] !font-semibold !text-sm">
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
          label={<span className="font-medium text-gray-700">Họ và tên</span>}
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
        >
          <Input
            prefix={<RiUserLine color="#9CA3AF" />}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            className="!rounded-lg !h-11"
          />
        </Form.Item>

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
            className="!rounded-lg !h-11"
          />
        </Form.Item>

        {/* Password strength indicators */}
        <div className="rounded-lg p-3 mb-4 flex flex-col gap-2 bg-gray-50 border border-gray-100">
          <PasswordRequirement met={strength.hasMinLength} label="Tối thiểu 8 ký tự" />
          <PasswordRequirement met={strength.hasUppercase} label="Ít nhất 1 chữ hoa (A-Z)" />
          <PasswordRequirement met={strength.hasDigit} label="Ít nhất 1 chữ số (0-9)" />
        </div>

        <Form.Item className="!mb-3">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={registerLoading}
            className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold !text-[15px] ![box-shadow:0_4px_12px_rgba(215,42,68,0.3)]"
          >
            Tạo tài khoản
          </Button>
        </Form.Item>

        <Divider className="!text-gray-400 !text-[13px] !my-3">hoặc tiếp tục với</Divider>

        <GoogleOAuthButton label="Đăng ký với Google" />

        <div className="text-center mt-6">
          <Space size={4}>
            <Typography.Text className="!text-gray-500 !text-sm">Đã có tài khoản?</Typography.Text>
            <Link to="/auth/login" className="!text-[#D72A44] !font-semibold !text-sm">
              Đăng nhập
            </Link>
          </Space>
        </div>
      </Form>
    </AuthLayout>
  );
}
