import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../../store/auth.store';
import { useAuthInit } from '../../hooks/use-auth-init';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Attempts silent token refresh on page reload before redirecting to login */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { loading } = useAuthInit();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
