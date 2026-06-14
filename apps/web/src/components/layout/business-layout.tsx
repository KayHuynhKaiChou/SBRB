import React, { Suspense } from 'react';
import { Layout, Spin } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';

/**
 * Persistent shell for all business-scoped pages. The Sidebar mounts ONCE and stays
 * mounted across route changes — only the content area (Outlet) is wrapped in Suspense,
 * so navigating between lazy pages no longer flashes/loses the sidebar.
 */
export function BusinessLayout() {
  return (
    <Layout className="!h-screen !overflow-hidden">
      <Sidebar />
      <Layout className="!ml-[60px] !h-screen !overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spin size="large" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </Layout>
    </Layout>
  );
}
