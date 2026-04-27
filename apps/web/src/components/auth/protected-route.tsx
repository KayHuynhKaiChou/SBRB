import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
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
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
