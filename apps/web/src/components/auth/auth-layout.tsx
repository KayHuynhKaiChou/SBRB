import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/** Centered card wrapper for all auth pages */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <Title level={2} style={{ color: '#D72A44', margin: 0 }}>
            SBRB
          </Title>
          {subtitle && (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          )}
        </div>
        <Card
          title={<Title level={4} style={{ margin: 0 }}>{title}</Title>}
          style={{ borderRadius: 12 }}
        >
          {children}
        </Card>
      </div>
    </div>
  );
}
