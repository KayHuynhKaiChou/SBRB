import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { EPlatformRole, APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/use-auth';
import { ErrorBoundary } from '../error-boundary';

interface IAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for platform-admin-only pages.
 * Non-admins are redirected to /dashboard; guests to /auth/login.
 */
export function AdminRoute({ children }: IAdminRouteProps) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const { status, user } = useAuth();

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

  if (user?.platformRole !== EPlatformRole.ADMIN) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
