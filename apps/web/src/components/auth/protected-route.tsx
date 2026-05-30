import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { EPlatformRole, APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
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

  // Platform admins are not permitted in business routes — redirect to admin area (SRS §5.14)
  if (status === 'authenticated' && user?.platformRole === EPlatformRole.ADMIN) {
    return <Navigate to={APP_ROUTES.ADMIN} replace />;
  }

  return <>{children}</>;
}
