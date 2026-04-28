import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ProtectedRoute } from '../components/auth/protected-route';

// Lazy-loaded pages
const LoginPage = React.lazy(() => import('../pages/auth/login-page'));
const RegisterPage = React.lazy(() => import('../pages/auth/register-page'));
const VerifyEmailPage = React.lazy(() => import('../pages/auth/verify-email-page'));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/forgot-password-page'));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/reset-password-page'));
const OnboardingPage = React.lazy(() => import('../pages/onboarding/onboarding-page'));
const DashboardPage = React.lazy(() => import('../pages/dashboard/dashboard-page'));
const DataSheetListPage = React.lazy(() => import('../pages/datasheet/datasheet-list-page'));
const DataSheetDetailPage = React.lazy(() => import('../pages/datasheet/datasheet-detail-page'));
const DepartmentPage = React.lazy(() => import('../pages/department/department-page'));
const ProfilePage = React.lazy(() => import('../pages/profile/profile-page'));
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
        {/* Public auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-sheets"
          element={
            <ProtectedRoute>
              <DataSheetListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/data-sheets/:id"
          element={
            <ProtectedRoute>
              <DataSheetDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <DepartmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/:deptId"
          element={
            <ProtectedRoute>
              <DepartmentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
