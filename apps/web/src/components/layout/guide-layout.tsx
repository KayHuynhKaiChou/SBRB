import React, { Suspense } from 'react';
import { Layout, Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';
import { APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/use-auth';
import { Sidebar } from './sidebar';

/**
 * Shell for the public-to-all-roles User Guide. Unlike ProtectedRoute it does NOT
 * redirect admins to /admin — the guide is reachable by every authenticated role.
 * Reuses the Sidebar dispatcher so each role keeps its normal navigation chrome.
 */
export function GuideLayout() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const { status } = useAuth();

  if (!hasHydrated || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

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
