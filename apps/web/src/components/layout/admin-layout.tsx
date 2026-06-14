import React, { Suspense } from 'react';
import { Layout, Spin } from 'antd';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './admin-sidebar';

const { Content } = Layout;

/**
 * Persistent shell for admin pages — the AdminSidebar mounts ONCE and stays across route
 * changes; only the content area (Outlet) is wrapped in Suspense, so navigating between
 * lazy admin pages no longer flashes/loses the sidebar.
 */
export function AdminLayout() {
  return (
    <Layout className="!h-screen !overflow-hidden">
      <AdminSidebar />
      <Layout
        style={{ marginLeft: 'var(--sidebar-width)' }}
        className="!flex !flex-col !h-screen !overflow-hidden"
      >
        <Content className="!flex-1 !overflow-auto bg-gray-50 p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Spin size="large" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
