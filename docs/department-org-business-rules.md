# Department / Org-Chart Business Rules

> Business rules for the Department (Org Chart) feature and platform-admin ownership transfer.
> Last updated: 2026-05-30. Enforcement points are linked; backend is the source of truth.

## 1. Department structure

| Rule | Detail | Enforced |
|------|--------|----------|
| Single root | Each business has one top/root department (e.g. "Ban giám đốc") with `parentId = null`. Its head = the business director/owner. | — |
| Max nesting depth | A department tree may be at most **3 levels** deep. Re-parenting that would create a 4th level is rejected. | `department.service.ts` `MAX_DEPTH = 3`, `validateParent()` |
| No cycles | A department cannot become a descendant of itself. | `assertNotDescendant()` |
| Delete guards | The root department cannot be deleted; a department with children cannot be deleted (remove sub-departments first). | `department.service.ts` `delete()` |

## 2. Members & department assignment

- **One department per employee (per business).** A regular employee belongs to exactly one department.
- **Adding = transfer (implicit).** Adding an employee who already belongs to another department **moves** them: their existing non-manager membership in the business is dropped, then they are inserted into the target department. No warning — the transfer is silent. Enforced atomically in `department-member.service.ts` `addMembers()`.
- **Add-member candidate list.** When adding members to a department, the candidates are business members who are:
  - role **NOT** `owner` and **NOT** `manager` (i.e. `staff` / `viewer` only — owners/managers are heads, assigned via manager flow), and
  - status `active`, and
  - not already in the viewed department.
  - Multi-select (checkbox) is allowed — add/transfer several at once.
- Members in other departments still appear in the candidate list (selecting them = transfer).

## 3. Department manager (head) assignment

| Rule | Detail | Enforced |
|------|--------|----------|
| Owner-only | Only the **business owner** may change a department's manager. Managers/staff cannot. | `department-member.service.ts` `setManager()` |
| Manager eligibility | The appointee must have business role `owner` or `manager`. A `staff`/`viewer` cannot be a department manager. | `setManager()` `MANAGER_ALLOWED_ROLES` |
| Root head is protected | The **root department's** head (the business director) **cannot** be reassigned through the normal flow — even by the owner. It changes only via a **platform-admin ownership transfer** (see §5). | `setManager()` blocks `isRoot \|\| parentId === null` |
| No orphan removal | A department's current manager cannot be removed without first assigning a new manager. | `removeMember()` |

## 4. Org-chart display semantics (direct reports)

- **Node-card count** (`directReportCount`) = the department's **own non-manager members** + the **managers of its direct child departments** (one level down). It is **not** a full subtree roll-up. Computed in `department.service.ts` `findTree()`.
- **Detail-modal member list** = the same set: the department's own direct members + the **managers of its direct child departments**. Each row shows the member's **real department** and an `isDirect` flag. Computed in `department-member.service.ts` `findSubtreeMembers()`.
- The department's own direct **manager** is shown separately (MANAGER card), not duplicated in the member table.

## 5. Platform-admin: transfer business ownership

Triggered when a director/owner steps down and hands over to another owner. Exposed only to platform admins (`adminChangeBusinessOwner`, guarded by `PlatformAdminGuard`). In one transaction:

1. The current owner(s) are demoted to `manager`.
2. The new owner's business role is set to `owner`.
3. `business.ownerId` is updated.
4. The **root department head is reassigned to the new owner** (the director seat moves with ownership).
5. The action is audit-logged (`business.change_owner`); an audit failure does not roll back the transfer.

Constraint: the new owner **must already be a member** of the business (admin adds them first if needed).
Enforced in `admin-business.service.ts` `changeOwner()`.

## 6. Member detail (view / edit)

- Any business member can **view** a member's detail (reuses the profile form UI, read-only).
- Only the **business owner** may **edit**, and only **`fullName`** and **`phone`**. Email, role, avatar, language and bio are read-only here.
- Backend: owner-gated, business-scoped, audited (`updateMemberInfo`).
- Caveat: `fullName`/`phone` are global account fields (shared across the user's businesses) — acceptable for an internal org tool; revisit for multi-tenant scenarios.

## 7. Permissions summary

| Action | Owner | Manager | Staff/Viewer | Platform admin |
|--------|:----:|:------:|:-----------:|:--------------:|
| View department / members | ✅ | ✅ | ✅ | ✅ |
| Add / transfer members | ✅ | ✅¹ | ✅¹ | — |
| Change a department manager (non-root) | ✅ | ❌ | ❌ | — |
| Change the **root** department head | ❌ | ❌ | ❌ | ✅ (via ownership transfer) |
| Manage sub-department members from a parent | ✅ (targets the member's real dept) | view-only | view-only | — |
| Edit a member's name/phone | ✅ | ❌ | ❌ | — |
| Transfer business ownership | ❌ | ❌ | ❌ | ✅ |

¹ Adding members currently requires only business membership (not restricted to owner); tighten if needed.

## Open questions / future
- Should adding members be restricted to owner/manager only?
- Allow choosing a new owner who is **not yet** a business member (auto-add)?
- Show an explicit "this employee will be transferred from <dept>" confirmation instead of a silent transfer?
