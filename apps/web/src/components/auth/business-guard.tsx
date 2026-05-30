import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useQuery } from '@apollo/client';
import { EPlatformRole, EBusinessStatus, APP_ROUTES } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { BUSINESS_QUERY } from '../../graphql/business.operations';
import { BusinessInactivePage } from '../../pages/business-inactive/business-inactive-page';

interface IBusinessData {
  business: {
    id: string;
    name: string;
    status: string;
    inactivatedAt?: string | null;
    inactiveReason?: string | null;
  };
}

/**
 * Route gate for all business-scoped pages (SRS §5.7).
 *
 * - Platform admins bypass: they operate only in /admin/* — render Outlet directly.
 * - No currentBusinessId → redirect to /onboarding.
 * - business.status === 'inactive' → render <BusinessInactivePage>.
 * - Otherwise → render <Outlet>.
 *
 * Uses fetchPolicy 'cache-and-network' so admin inactivating a business mid-session
 * is detected on next route transition (SRS §5.19 — no websocket kick required for v1).
 */
export function BusinessGuard() {
  const platformRole = useAuthStore((s) => s.user?.platformRole);
  const currentBusinessId = useAuthStore((s) => s.currentBusinessId);

  const { data, loading } = useQuery<IBusinessData>(BUSINESS_QUERY, {
    variables: { id: currentBusinessId ?? '' },
    skip: !currentBusinessId || platformRole === EPlatformRole.ADMIN,
    fetchPolicy: 'cache-and-network',
  });

  if (platformRole === EPlatformRole.ADMIN) {
    return <Outlet />;
  }

  if (!currentBusinessId) {
    return <Navigate to={APP_ROUTES.ONBOARDING} replace />;
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (data?.business?.status === EBusinessStatus.INACTIVE) {
    return <BusinessInactivePage business={data.business} />;
  }

  return <Outlet />;
}
