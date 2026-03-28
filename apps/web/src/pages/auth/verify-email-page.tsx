import React, { useEffect, useState } from 'react';
import { Spin, Typography, Button } from 'antd';
import { RiCheckboxCircleLine, RiErrorWarningLine } from 'react-icons/ri';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/auth-layout';
import { useAuth } from '../../hooks/use-auth';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? undefined;
  const { verifyEmail, verifyLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Link xác nhận không hợp lệ');
      return;
    }
    verifyEmail(token)
      .then(() => setDone(true))
      .catch(() => setError('Link xác nhận không hợp lệ hoặc đã hết hạn'));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (verifyLoading) {
    return (
      <AuthLayout title="Xác nhận email">
        <div className="flex flex-col items-center py-10 gap-4">
          <Spin size="large" />
          <Typography.Text className="!text-gray-500 !text-[15px]">
            Đang xác nhận email của bạn...
          </Typography.Text>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout title="Xác nhận email">
        <div className="flex flex-col items-center py-6 text-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-50">
            <RiErrorWarningLine size={36} color="#EF4444" />
          </div>
          <div>
            <Typography.Title level={5} className="!mt-0 !mb-1.5 !text-gray-900">
              Xác nhận thất bại
            </Typography.Title>
            <Typography.Text className="!text-gray-500 !text-sm">{error}</Typography.Text>
          </div>
          <Link to="/auth/login">
            <Button
              type="primary"
              className="!rounded-lg !bg-[#D72A44] !border-none !font-semibold !h-10 !px-6"
            >
              Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Xác nhận email">
        <div className="flex flex-col items-center py-6 text-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-50">
            <RiCheckboxCircleLine size={36} color="#22C55E" />
          </div>
          <div>
            <Typography.Title level={5} className="!mt-0 !mb-1.5 !text-gray-900">
              Email đã được xác nhận!
            </Typography.Title>
            <Typography.Text className="!text-gray-500 !text-sm">
              Tài khoản của bạn đã được kích hoạt thành công.
            </Typography.Text>
          </div>
          <Link to="/auth/login">
            <Button
              type="primary"
              className="!rounded-lg !bg-[#D72A44] !border-none !font-semibold !h-10 !px-6"
            >
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return null;
}
