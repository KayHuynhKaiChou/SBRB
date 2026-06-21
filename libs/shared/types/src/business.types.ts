/** Business & role types — SRS 3.1 / 4.2 */

import type { TBusinessRole } from '@sbrb/shared-constants';

/** @deprecated Use `TBusinessRole` from `@sbrb/shared-constants` directly. */
export type BusinessRole = TBusinessRole;

export interface IBusinessDto {
  id: string;
  name: string;
  logoUrl?: string;
  currency: string; // e.g., "VND", "USD"
  createdAt: string;
}

export interface IBusinessMemberDto {
  id: string;
  businessId: string;
  userId: string;
  role: BusinessRole;
  name: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  status: 'active' | 'invited';
}

/** Business member table row (members table — nested user object). */
export interface IBusinessMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
}

/**
 * Personnel (/members) table row — flat shape returned by the `businessMembers` query.
 * `status` = account lifecycle (pending|active|inactive, from User). `role` = business role.
 */
export interface IBusinessMemberRow {
  userId: string;
  fullName: string;
  email: string;
  role: TBusinessRole;
  status: string;
  joinedAt: string;
  lastLoginAt: string | null;
}

/** Paginated result of the `businessMembers` query. */
export interface IBusinessMembersResult {
  rows: IBusinessMemberRow[];
  total: number;
}

/** Business switcher item (header dropdown) */
export interface IBusinessSwitcherItem {
  businessId: string;
  businessName: string;
  logoUrl?: string;
  myRole: BusinessRole;
}

/** Summary row returned by the `myBusinesses` query — used by the header badge and business chooser. */
export interface IMyBusinessSummary {
  id: string;
  name: string;
  status: string;
  logoUrl: string | null;
}

export interface ITabDto {
  id: string;
  businessId: string;
  name: string;        // ≤30 chars
  iconColor: string;  // One of 12 preset colors
  iconName: string;   // One of 30 presets
  order: number;
  isPinned: boolean;
  isProtected: boolean;
  createdAt: string;
}

export interface ICreateTabInput {
  businessId: string;
  name: string;
  iconColor?: string;
  iconName?: string;
  isPinned?: boolean;
}

export interface IUpdateTabInput {
  name?: string;
  iconColor?: string;
  iconName?: string;
  isPinned?: boolean;
  isProtected?: boolean;
}
