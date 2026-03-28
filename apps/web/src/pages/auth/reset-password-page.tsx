import React from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { RiLockLine, RiShieldCheckLine } from 'react-icons/ri';
import { useParams } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/auth-layout';
import { useAuth } from '../../hooks/use-auth';

interface ResetFormValues {
  password: string;
  confirm: string;
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const { resetPassword, resetLoading } = useAuth();
  const [form] = Form.useForm<ResetFormValues>();

  const onFinish = async (values: ResetFormValues) => {
    if (!token) return;
    try {
      await resetPassword(token, values.password);
    } catch {
      form.setFields([
        { name: 'password', errors: ['Link không hợp lệ hoặc đã hết hạn'] },
      ]);
    }
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Tạo mật khẩu mới an toàn cho tài khoản của bạn."
    >
      {/* Security badge */}
      <div
        className="flex items-center gap-3 rounded-lg p-3 mb-6"
        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
      >
        <RiShieldCheckLine size={20} color="#16A34A" className="flex-shrink-0" />
        <Typography.Text style={{ fontSize: 13, color: '#15803D' }}>
          Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa và 1 chữ số.
        </Typography.Text>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, color: '#374151' }}>Mật khẩu mới</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                if (value.length < 8 || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
                  return Promise.reject('Tối thiểu 8 ký tự, 1 chữ hoa, 1 số');
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
            style={{ borderRadius: 8, height: 44 }}
          />
        </Form.Item>

        <Form.Item
          name="confirm"
          label={<span style={{ fontWeight: 500, color: '#374151' }}>Xác nhận mật khẩu</span>}
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject('Mật khẩu không khớp');
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<RiLockLine color="#9CA3AF" />}
            placeholder="••••••••"
            autoComplete="new-password"
            style={{ borderRadius: 8, height: 44 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={resetLoading}
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
            Đặt lại mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
}
