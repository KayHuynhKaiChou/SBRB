import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import {
  EPlatformRole,
  EBusinessStatus,
  APP_ROUTES,
} from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { BUSINESS_QUERY } from '../../graphql/business.operations';
import { useQuery } from '@apollo/client';
import { BusinessInactivePage } from '../../pages/business-inactive/business-inactive-page';
import { BusinessPendingPage } from '../../pages/business-pending/business-pending-page';
import { BusinessLayout } from '../layout/business-layout';

interface IBusinessData {
  business: {
    id: string;
    name: string;
    status: string;
    rejectionReason?: string | null;
    inactivatedAt?: string | null;
    inactiveReason?: string | null;
  };
}

/** Routes a pending/rejected owner is still allowed to reach (to fix + resubmit). */
const APPROVAL_ALLOWED_PATHS = [APP_ROUTES.MY_BUSINESS, APP_ROUTES.PROFILE];

/**
 * Route gate for all business-scoped pages (SRS §5.7 + business-approval-rules §3).
 *
 * - Platform admins bypass → render Outlet (they operate in /admin/*).
 * - No currentBusinessId → /onboarding.
 * - status inactive → BusinessInactivePage.
 * - status pending/rejected → BusinessPendingPage, EXCEPT /my-business + /profile.
 * - status approved → Outlet.
 */
export function BusinessGuard() {
  const platformRole = useAuthStore((s) => s.user?.platformRole);
  const currentBusinessId = useAuthStore((s) => s.currentBusinessId);
  const location = useLocation();

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

  const business = data?.business;

  if (business?.status === EBusinessStatus.INACTIVE) {
    return <BusinessInactivePage business={business} />;
  }

  // Pending or rejected → gated, except the owner's fix-and-resubmit surfaces.
  const notApproved = business && business.status !== EBusinessStatus.APPROVED;
  if (notApproved) {
    const allowed = APPROVAL_ALLOWED_PATHS.some((p) =>
      location.pathname.startsWith(p),
    );
    if (!allowed) {
      return <BusinessPendingPage business={business} />;
    }
  }

  // Approved (or the allowed pending/rejected surfaces) → persistent shell with shared sidebar.
  return <BusinessLayout />;
}
