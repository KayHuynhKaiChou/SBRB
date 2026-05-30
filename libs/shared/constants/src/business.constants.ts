/** Business domain constants — onboarding form options, unit presets, status enums. */

/** Enum for business lifecycle status stored in DB column businesses.status. */
export enum EBusinessStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/** String-literal union — matches the DB varchar value exactly. */
export type TBusinessStatus = `${EBusinessStatus}`;

/** Ant Design Tag color per status — single source of truth (mirrors ROLE_TAG_COLOR pattern). */
export const BUSINESS_STATUS_TAG_COLOR: Record<TBusinessStatus, string> = {
  [EBusinessStatus.ACTIVE]: 'green',
  [EBusinessStatus.INACTIVE]: 'red',
};

/** Enum for sort fields on admin businesses list. */
export enum EAdminBusinessSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  MEMBER_COUNT = 'memberCount',
  STATUS = 'status',
}

/** Enum for sort fields on admin users list. */
export enum EAdminUserSortBy {
  CREATED_AT = 'createdAt',
  EMAIL = 'email',
  FULL_NAME = 'fullName',
  LAST_LOGIN_AT = 'lastLoginAt',
}

/** Audit action strings used by admin mutations — single source of truth. SRS §5.18 */
export enum EAdminAuditAction {
  BUSINESS_INACTIVATE = 'business.inactivate',
  BUSINESS_REACTIVATE = 'business.reactivate',
  USER_DISABLE = 'user.disable',
  USER_ENABLE = 'user.enable',
}



export const INDUSTRIES = [
  'Bán lẻ',
  'Nhà hàng / F&B',
  'Dịch vụ',
  'Sản xuất',
  'Công nghệ',
  'Giáo dục',
  'Y tế',
  'Khác',
] as const;
export type TIndustry = (typeof INDUSTRIES)[number];

/** Pre-built options for Ant Design Select — saves consumers from mapping. */
export const INDUSTRY_OPTIONS: ReadonlyArray<{ value: TIndustry; label: TIndustry }> =
  INDUSTRIES.map((i) => ({ value: i, label: i }));

export const CURRENCIES = [
  { value: 'VND', label: 'VND — Đồng Việt Nam' },
  { value: 'USD', label: 'USD — Đô la Mỹ' },
  { value: 'EUR', label: 'EUR — Euro' },
] as const;

/** Preset unit options for the widget unit selector. */
export const UNIT_PRESETS = ['VND', 'USD', 'EUR', '%', 'Người', 'Điểm'] as const;
export type TUnitPreset = (typeof UNIT_PRESETS)[number];
