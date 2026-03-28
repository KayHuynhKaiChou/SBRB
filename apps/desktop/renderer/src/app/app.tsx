import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin, notification } from 'antd';

// Lazy-loaded pages — same routes as apps/web
const LoginPage      = React.lazy(() => import('../pages/auth/login-page'));
const RegisterPage   = React.lazy(() => import('../pages/auth/register-page'));
const OnboardingPage = React.lazy(() => import('../pages/onboarding/onboarding-page'));
const DashboardPage  = React.lazy(() => import('../pages/dashboard/dashboard-page'));
const NotFoundPage   = React.lazy(() => import('../pages/not-found-page'));

const AppLoading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

/**
 * Desktop App — same routes as web app.
 * Additional: listens for auto-update events from Electron main process.
 */
export function App() {
  const [notifApi, notifContext] = notification.useNotification();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check network status on mount
    window.electronAPI?.isOnline().then(setIsOnline);

    // Poll network status every 30s
    const interval = setInterval(async () => {
      const online = await window.electronAPI?.isOnline();
      setIsOnline(!!online);
    }, 30_000);

    // Listen for auto-update events from main process
    window.electronAPI?.onUpdateAvailable(() => {
      notifApi.info({
        message: 'Có phiên bản mới',
        description: 'Đang tải bản cập nhật...',
        duration: 0,
      });
    });

    window.electronAPI?.onUpdateDownloaded(() => {
      notifApi.success({
        message: 'Cập nhật sẵn sàng',
        description: 'Khởi động lại để áp dụng bản cập nhật mới.',
        btn: (
          <button onClick={() => window.electronAPI?.installUpdate()}>
            Khởi động lại ngay
          </button>
        ),
        duration: 0,
      });
    });

    return () => clearInterval(interval);
  }, [notifApi]);

  return (
    <>
      {notifContext}
      {!isOnline && (
        <div style={{
          background: '#FEF2F4', color: '#D72A44',
          textAlign: 'center', padding: '4px 0', fontSize: 12,
        }}>
          Đang offline — dữ liệu được lưu cục bộ và sẽ sync khi có mạng
        </div>
      )}
      <Suspense fallback={<AppLoading />}>
        <Routes>
          <Route path="/auth/login"             element={<LoginPage />} />
          <Route path="/auth/register"          element={<RegisterPage />} />
          <Route path="/onboarding"             element={<OnboardingPage />} />
          <Route path="/dashboard"              element={<DashboardPage />} />
          <Route path="/"                       element={<Navigate to="/auth/login" replace />} />
          <Route path="*"                       element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
