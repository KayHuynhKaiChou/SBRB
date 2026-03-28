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
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: '#FFF7F8', border: '1px solid #FECDD3' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#D72A44' }}
          >
            <RiSendPlaneLine size={26} color="white" />
          </div>
          <Typography.Title level={5} style={{ margin: '0 0 8px', color: '#111827' }}>
            Email đã được gửi!
          </Typography.Title>
          <Typography.Text style={{ color: '#6B7280', fontSize: 14, display: 'block', marginBottom: 20 }}>
            Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.
          </Typography.Text>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1"
            style={{ color: '#D72A44', fontWeight: 600, fontSize: 14 }}
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

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={forgotLoading}
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
            Gửi link đặt lại
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1"
            style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}
          >
            <RiArrowLeftLine size={16} />
            Quay lại đăng nhập
          </Link>
        </div>
      </Form>
    </AuthLayout>
  );
}
