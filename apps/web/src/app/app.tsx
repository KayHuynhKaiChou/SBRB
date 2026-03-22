import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// Lazy-loaded pages (to be implemented)
const LoginPage = React.lazy(() => import('../pages/auth/login-page'));
const RegisterPage = React.lazy(() => import('../pages/auth/register-page'));
const OnboardingPage = React.lazy(() => import('../pages/onboarding/onboarding-page'));
const DashboardPage = React.lazy(() => import('../pages/dashboard/dashboard-page'));
const NotFoundPage = React.lazy(() => import('../pages/not-found-page'));

const AppLoading = () => (
  <div className="flex items-center justify-center h-screen">
    <Spin size="large" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<AppLoading />}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard/:businessId" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
