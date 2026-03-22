import React, { useEffect, useState } from 'react';
import { Spin, Result } from 'antd';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/auth-layout';
import { useAuth } from '../../hooks/use-auth';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const { verifyEmail, verifyLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setDone(true))
      .catch(() => setError('Link xác nhận không hợp lệ hoặc đã hết hạn'));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (verifyLoading) {
    return (
      <AuthLayout title="Xác nhận email">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin size="large" />
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout title="Xác nhận email">
        <Result
          status="error"
          title="Xác nhận thất bại"
          subTitle={error}
          extra={<Link to="/auth/login">Quay lại đăng nhập</Link>}
        />
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Xác nhận email">
        <Result
          status="success"
          title="Email đã được xác nhận"
          subTitle="Tài khoản của bạn đã kích hoạt thành công"
          extra={<Link to="/auth/login">Đăng nhập ngay</Link>}
        />
      </AuthLayout>
    );
  }

  return null;
}
