import React from 'react';
import { Layout } from 'antd';
import { AdminSidebar } from './admin-sidebar';

const { Content } = Layout;

interface IAdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Shell layout for admin pages — sidebar + scrollable content area.
 * No business switcher or tab bar (admin has no business context).
 */
export function AdminLayout({ children }: IAdminLayoutProps) {
  return (
    <Layout className="!h-screen !overflow-hidden">
      <AdminSidebar />
      <Layout
        style={{ marginLeft: 'var(--sidebar-width)' }}
        className="!flex !flex-col !h-screen !overflow-hidden"
      >
        <Content className="!flex-1 !overflow-auto bg-gray-50 p-6">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
