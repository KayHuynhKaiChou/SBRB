import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ProtectedRoute } from '../components/auth/protected-route';
import { AdminRoute } from '../components/auth/admin-route';
import { AdminLayout } from '../components/layout/admin-layout';
import { GuideLayout } from '../components/layout/guide-layout';
import { BusinessGuard } from '../components/auth/business-guard';

// Lazy-loaded pages
const LoginPage = React.lazy(() => import('../pages/auth/login-page'));
const SignupWizardPage = React.lazy(
  () => import('../pages/auth/signup-wizard/signup-wizard-page'),
);
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/forgot-password-page'));
const ResetPasswordPage = React.lazy(() => import('../pages/auth/reset-password-page'));
const OnboardingPage = React.lazy(() => import('../pages/onboarding/onboarding-page'));
const DashboardPage = React.lazy(() => import('../pages/dashboard/dashboard-page'));
const DataSheetListPage = React.lazy(() => import('../pages/datasheet/datasheet-list-page'));
const DataSheetDetailPage = React.lazy(() => import('../pages/datasheet/datasheet-detail-page'));
const DepartmentPage = React.lazy(() => import('../pages/department/department-page'));
const MyBusinessPage = React.lazy(() => import('../pages/my-business/my-business-page'));
const ProfilePage = React.lazy(() => import('../pages/profile/profile-page'));
const GuidePage = React.lazy(() => import('../pages/guide/guide-page'));
const NotFoundPage = React.lazy(() => import('../pages/not-found-page'));
const AdminBusinessesPage = React.lazy(
  () => import('../pages/admin/admin-businesses-page'),
);
const AdminUsersPage = React.lazy(
  () => import('../pages/admin/admin-users-page'),
);
const AdminDashboardPage = React.lazy(
  () => import('../pages/admin/admin-dashboard-page'),
);
const AdminAuditLogPage = React.lazy(
  () => import('../pages/admin/admin-audit-log-page'),
);

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
        <Route path="/auth/register" element={<SignupWizardPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Onboarding — protected but outside business gate */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Business-scoped routes — ProtectedRoute → BusinessGuard → page */}
        <Route
          element={
            <ProtectedRoute>
              <BusinessGuard />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/data-sheets" element={<DataSheetListPage />} />
          <Route path="/data-sheets/:id" element={<DataSheetDetailPage />} />
          <Route path="/departments" element={<DepartmentPage />} />
          <Route path="/departments/:deptId" element={<DepartmentPage />} />
          <Route path="/my-business" element={<MyBusinessPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* User Guide — any authenticated role (admin + business users) */}
        <Route element={<GuideLayout />}>
          <Route path="/guide" element={<GuidePage />} />
        </Route>

        {/* Admin routes — platform-admin only; persistent AdminLayout (shared sidebar) */}
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/audit" element={<AdminAuditLogPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
