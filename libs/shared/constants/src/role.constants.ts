/** Platform-level role — currently only 'admin'. */
export enum EPlatformRole {
  ADMIN = 'admin',
}

/** String-literal union of EPlatformRole values. Nullable — null = regular user. */
export type TPlatformRole = `${EPlatformRole}` | null;

/** Business member roles. Single source of truth for BE auth checks + FE permission UI. */

/** Enum of all 4 business roles. Order = hierarchy (owner highest, viewer lowest). */
export enum EBusinessRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  STAFF = 'staff',
  VIEWER = 'viewer',
}

/** Type alias = string-literal union of enum values. Use this for fields/parameters. */
export type TBusinessRole = `${EBusinessRole}`;

/** Runtime array of all roles in hierarchy order — for iteration/rendering. */
export const BUSINESS_ROLES: readonly TBusinessRole[] = [
  EBusinessRole.OWNER,
  EBusinessRole.MANAGER,
  EBusinessRole.STAFF,
  EBusinessRole.VIEWER,
];

/** Permission helper: does this role have manager-or-higher write privileges? */
export const isManagerRole = (
  role: TBusinessRole | null | undefined,
): role is EBusinessRole.OWNER | EBusinessRole.MANAGER =>
  role === EBusinessRole.OWNER || role === EBusinessRole.MANAGER;

/** Ant Design Tag color mapped per role — used by RoleTag/ProfileForm. */
export const ROLE_TAG_COLOR: Record<TBusinessRole, string> = {
  [EBusinessRole.OWNER]: 'red',
  [EBusinessRole.MANAGER]: 'blue',
  [EBusinessRole.STAFF]: 'default',
  [EBusinessRole.VIEWER]: 'gold',
};
