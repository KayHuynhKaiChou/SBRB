import React, { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { RiMailLine, RiSendPlaneLine, RiArrowLeftLine } from 'react-icons/ri';
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
        <div className="rounded-xl p-6 text-center bg-[#FFF7F8] border border-rose-200">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#D72A44]">
            <RiSendPlaneLine size={26} color="white" />
          </div>
          <Typography.Title level={5} className="!mt-0 !mb-2 !text-gray-900">
            Email đã được gửi!
          </Typography.Title>
          <Typography.Text className="!text-gray-500 !text-sm !block !mb-5">
            Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.
          </Typography.Text>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1 !text-[#D72A44] !font-semibold !text-sm"
          >
            <RiArrowLeftLine size={16} />
            Quay lại đăng nhập
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu."
    >
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

        <Form.Item className="!mb-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={forgotLoading}
            className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold !text-[15px] ![box-shadow:0_4px_12px_rgba(215,42,68,0.3)]"
          >
            Gửi link đặt lại
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1 !text-gray-500 !text-sm !font-medium"
          >
            <RiArrowLeftLine size={16} />
            Quay lại đăng nhập
          </Link>
        </div>
      </Form>
    </AuthLayout>
  );
}
