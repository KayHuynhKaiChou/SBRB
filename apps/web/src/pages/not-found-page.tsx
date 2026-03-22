import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Result } from 'antd';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn tìm kiếm không tồn tại."
        extra={
          <Link to="/">
            <Button type="primary">Về trang chủ</Button>
          </Link>
        }
      />
    </div>
  );
}
