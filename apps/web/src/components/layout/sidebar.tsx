import React from 'react';
import { EPlatformRole } from '@sbrb/shared-constants';
import { useAuthStore } from '../../store/auth.store';
import { AdminSidebar } from './admin-sidebar';
import { BusinessSidebar } from './business-sidebar';

/**
 * Sidebar dispatcher — renders AdminSidebar for platform admins, BusinessSidebar for regular users.
 * SRS §5.13
 */
export function Sidebar() {
  const platformRole = useAuthStore((s) => s.user?.platformRole);
  return platformRole === EPlatformRole.ADMIN ? <AdminSidebar /> : <BusinessSidebar />;
}
