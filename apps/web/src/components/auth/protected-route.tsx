import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../store/auth.store';
import { useAuthInit } from '../../hooks/use-auth-init';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Waits for Zustand hydration + silent token refresh before redirecting to login */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { loading } = useAuthInit();

  if (!hasHydrated || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
