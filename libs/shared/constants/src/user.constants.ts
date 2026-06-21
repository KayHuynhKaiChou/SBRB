/** User account lifecycle status — stored in DB column users.status. */

/**
 * Global account status (lives on the User entity, not per-business).
 * State machine:
 *   pending  → active   (invited staff/manager set their password)
 *   active   ↔ inactive (owner/manager or admin deactivate / reactivate)
 * Notes:
 *   - owner self-register → `active` immediately (no pending).
 *   - `pending` & `inactive` are both blocked from login + refresh.
 *   - only `pending` accounts may be hard-deleted.
 */
export enum EUserAccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/** String-literal union — matches the DB varchar value exactly. */
export type TUserAccountStatus = `${EUserAccountStatus}`;

/** Runtime array of all statuses — for iteration/filter options. */
export const USER_ACCOUNT_STATUSES: readonly TUserAccountStatus[] = [
  EUserAccountStatus.PENDING,
  EUserAccountStatus.ACTIVE,
  EUserAccountStatus.INACTIVE,
];

/** Ant Design Tag color per status — single source of truth (mirrors ROLE_TAG_COLOR pattern). */
export const ACCOUNT_STATUS_TAG_COLOR: Record<TUserAccountStatus, string> = {
  [EUserAccountStatus.PENDING]: 'gold',
  [EUserAccountStatus.ACTIVE]: 'green',
  [EUserAccountStatus.INACTIVE]: 'default',
};
