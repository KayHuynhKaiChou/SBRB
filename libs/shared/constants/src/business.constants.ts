/** Business domain constants — onboarding form options, unit presets, status enums. */

/**
 * Unified business lifecycle status — stored in DB column businesses.status.
 * Merges the former approval_status (pending/approved/rejected) + status (active/inactive)
 * into ONE field. State machine: PENDING → APPROVED → INACTIVE (admin lock) ↔ APPROVED;
 * PENDING → REJECTED → PENDING (owner resubmit). See docs/business-approval-rules.md.
 */
export enum EBusinessStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INACTIVE = 'inactive',
}

/** String-literal union — matches the DB varchar value exactly. */
export type TBusinessStatus = `${EBusinessStatus}`;

/** Ant Design Tag color per status — single source of truth (mirrors ROLE_TAG_COLOR pattern). */
export const BUSINESS_STATUS_TAG_COLOR: Record<TBusinessStatus, string> = {
  [EBusinessStatus.PENDING]: 'gold',
  [EBusinessStatus.APPROVED]: 'green',
  [EBusinessStatus.REJECTED]: 'red',
  [EBusinessStatus.INACTIVE]: 'default',
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
  BUSINESS_CHANGE_OWNER = 'business.change_owner',
  BUSINESS_APPROVE = 'business.approve',
  BUSINESS_REJECT = 'business.reject',
  BUSINESS_CHANGE_APPROVE = 'business.change_approve',
  BUSINESS_CHANGE_REJECT = 'business.change_reject',
  USER_DISABLE = 'user.disable',
  USER_ENABLE = 'user.enable',
}

/**
 * Status of an owner-requested change to an already-approved business
 * (business_change_requests.status). See docs/business-approval-rules.md §5.
 */
export enum EBusinessChangeRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type TBusinessChangeRequestStatus = `${EBusinessChangeRequestStatus}`;

/** Legal form / business type options (Vietnam). Stored in businesses.business_type. */
export enum EBusinessType {
  HO_KINH_DOANH = 'ho_kinh_doanh',
  DOANH_NGHIEP_TU_NHAN = 'doanh_nghiep_tu_nhan',
  TNHH = 'tnhh',
  CO_PHAN = 'co_phan',
  KHAC = 'khac',
}

export type TBusinessType = `${EBusinessType}`;

/** Pre-built options for Ant Design Select (label = Vietnamese display). */
export const BUSINESS_TYPE_OPTIONS: ReadonlyArray<{ value: TBusinessType; label: string }> = [
  { value: EBusinessType.HO_KINH_DOANH, label: 'Hộ kinh doanh' },
  { value: EBusinessType.DOANH_NGHIEP_TU_NHAN, label: 'Doanh nghiệp tư nhân' },
  { value: EBusinessType.TNHH, label: 'Công ty TNHH' },
  { value: EBusinessType.CO_PHAN, label: 'Công ty Cổ phần' },
  { value: EBusinessType.KHAC, label: 'Khác' },
];

/** Company size buckets. Stored in businesses.company_size. */
export const COMPANY_SIZE_OPTIONS = [
  { value: '1-9', label: '1–9 người' },
  { value: '10-49', label: '10–49 người' },
  { value: '50-199', label: '50–199 người' },
  { value: '200+', label: '200+ người' },
] as const;
export type TCompanySize = (typeof COMPANY_SIZE_OPTIONS)[number]['value'];

/** Upload limits + allowed mime types for business assets. */
export const BUSINESS_IMAGE_MAX_MB = 2;
export const BUSINESS_DOC_MAX_MB = 10;
export const BUSINESS_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const BUSINESS_DOC_MIME = ['application/pdf', 'image/png', 'image/jpeg'] as const;

/** Asset kinds for the signed-upload service (business + user avatars). */
export enum EBusinessAssetKind {
  AVATAR = 'avatar',
  LOGO = 'logo',
  BANNER = 'banner',
  LICENSE = 'license',
}
export type TBusinessAssetKind = `${EBusinessAssetKind}`;



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
