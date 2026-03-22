/** Business & role types — SRS 3.1 / 4.2 */

export type BusinessRole = 'owner' | 'manager' | 'staff' | 'viewer';

export interface BusinessDto {
  id: string;
  name: string;
  logoUrl?: string;
  currency: string; // e.g., "VND", "USD"
  createdAt: string;
}

export interface BusinessMemberDto {
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

/** Business switcher item (header dropdown) */
export interface BusinessSwitcherItem {
  businessId: string;
  businessName: string;
  logoUrl?: string;
  myRole: BusinessRole;
}

export interface TabDto {
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
