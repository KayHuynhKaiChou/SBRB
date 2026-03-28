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
      <div className="flex items-center gap-3 rounded-lg p-3 mb-6 bg-green-50 border border-green-200">
        <RiShieldCheckLine size={20} color="#16A34A" className="flex-shrink-0" />
        <Typography.Text className="!text-[13px] !text-green-700">
          Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa và 1 chữ số.
        </Typography.Text>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
        <Form.Item
          name="password"
          label={<span className="font-medium text-gray-700">Mật khẩu mới</span>}
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
            className="!rounded-lg !h-11"
          />
        </Form.Item>

        <Form.Item
          name="confirm"
          label={<span className="font-medium text-gray-700">Xác nhận mật khẩu</span>}
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
            className="!rounded-lg !h-11"
          />
        </Form.Item>

        <Form.Item className="!mb-0">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={resetLoading}
            className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold !text-[15px] ![box-shadow:0_4px_12px_rgba(215,42,68,0.3)]"
          >
            Đặt lại mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
}
