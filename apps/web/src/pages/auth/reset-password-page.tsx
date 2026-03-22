import React from 'react';
import { Form, Input, Button } from 'antd';
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
    <AuthLayout title="Đặt lại mật khẩu">
      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          name="password"
          label="Mật khẩu mới"
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
          <Input.Password placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirm"
          label="Xác nhận mật khẩu"
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
          <Input.Password placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={resetLoading}
          >
            Đặt lại mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
}
