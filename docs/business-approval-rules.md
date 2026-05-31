# Business Onboarding, Verification & Change-Approval Rules

> Business rules for: owner self-signup (account + business in one wizard), platform-admin
> verification/approval of new businesses, the owner "My Business" profile, and the
> admin-gated change-request flow for editing an approved business.
> Backend is the source of truth. Notifications are delivered in-app (bell), non-realtime (polling).
> Status: SPEC (target). Last updated: 2026-05-31.

Related: [[department-org-business-rules]] (owner/role model), `admin-srs.md`.

## 1. Identity model

- **One account = one OWNER.** Public registration always creates a user who is the **owner**
  of a newly-created business. There is no public self-registration for staff.
- **Roles below owner** (`manager` / `staff` / `viewer`) are created/added by the owner from
  inside the business (member-management UI — separate feature, out of scope here).
- A user may own up to **3 businesses** (existing limit); each additional business also goes
  through the approval flow below.

## 2. Signup wizard (antd `Steps`, public `/auth/register`)

Single page, 3 steps. Cannot skip ahead; each step gates the next.

| Step | Title | Content | Gate to advance |
|------|-------|---------|-----------------|
| 1 | Tài khoản | fullName, email, password (+ strength rules as today) → `register` mutation | account created **and email verified via link** (same mechanism as today — user clicks the email link; wizard polls/awaits `emailVerified=true`, then auto-advances) |
| 2 | Doanh nghiệp | business KYB form (see §4) incl. logo/banner/license upload → `createBusiness` | required fields valid + business created with `approvalStatus = pending` |
| 3 | Chờ duyệt | confirmation + "đang chờ admin duyệt" status | — (terminal; user can log in later to track) |

- Email verification keeps the **link** flow (decided): no OTP code. Between step 1 and step 2
  the wizard shows "kiểm tra email" and unlocks step 2 once verified.
- Creating the business in step 2 is what puts it into `pending`.

## 3. Approval lifecycle

A business has **two independent dimensions**:

- `approval_status`: `pending` → `approved` → (admin can never silently change back); `rejected`.
- `status` (existing, operational lock, only meaningful once approved): `active` | `inactive`.

State machine for `approval_status`:

```
                       (owner submits in wizard)
        ┌──────────────────────────────────────────────┐
        ▼                                                │
   ┌─────────┐  admin approve   ┌──────────┐            │
   │ pending │ ───────────────► │ approved │            │
   └─────────┘                  └──────────┘            │
        │ ▲                                              │
 admin  │ │ owner edits & resubmits                      │
 reject │ │ (fixes per rejection_reason)                 │
        ▼ │                                              │
   ┌──────────┐                                          │
   │ rejected │ ─────────────────────────────────────────
   └──────────┘
```

- New business → `approval_status = pending`. Owner CANNOT use business features yet.
- Admin **approve** → `approved`; `approved_at`, `approved_by` set; owner notified; business
  becomes usable (subject to `status = active`).
- Admin **reject** → `rejected` + `rejection_reason` (required); `rejected_at`, `rejected_by`
  set; owner notified with reason.
- Owner edits in **My Business** and **resubmits** → back to `pending` (reason cleared).
- After `approved`, admin may still **inactivate/reactivate** via existing flow (`status`).

### Access while pending/rejected (owner login allowed)

- Owner CAN log in. `BusinessGuard` routes any business-scoped page to a **"Chờ duyệt"** screen
  while `approval_status ∈ {pending, rejected}`.
- Owner CAN access **My Business** (view + edit + resubmit) and **Profile** while pending/rejected.
- Owner CANNOT access dashboard / data-sheets / departments until `approved`.

## 4. Business fields (KYB)

Existing: `name`, `industry`, `currency`, `logoUrl`, canvas config, `status`, `ownerId`.

New fields:

| Field | Type | Required at create | Sensitive¹ | Notes |
|-------|------|:--:|:--:|-------|
| `legal_name` | varchar(150) | ✓ | ✓ | Tên pháp lý / trên ĐKKD |
| `tax_code` | varchar(20) | ✓ | ✓ | Mã số thuế (MST) |
| `business_type` | varchar(30) | – | ✓ | Loại hình (hộ KD / TNHH / CP…), enum |
| `address` | varchar(255) | ✓ | – | Địa chỉ trụ sở |
| `contact_phone` | varchar(30) | ✓ | – | SĐT doanh nghiệp |
| `contact_email` | varchar(255) | – | – | Email doanh nghiệp |
| `website` | varchar(255) | – | – | – |
| `description` | text | – | – | Giới thiệu |
| `banner_url` | text | – | – | Ảnh bìa (public bucket) |
| `license_file_url` | text | ✓ | ✓ | Giấy phép KD — **private** bucket (admin/owner only) |
| `founded_year` | smallint | – | – | – |
| `company_size` | varchar(20) | – | – | enum (1-9 / 10-49 / 50-199 / 200+) |
| `approval_status` | varchar(20) | (system) | – | pending/approved/rejected |
| `rejection_reason` | text | – | – | last admin reject reason |
| `approved_at`/`approved_by` | tstz/uuid | – | – | – |
| `rejected_at`/`rejected_by` | tstz/uuid | – | – | – |

¹ "Sensitive" is informational only — per decision **all** post-approval edits require admin
re-approval (see §5), so the column is not used to gate; kept for future granularity.

## 5. Change-request (edit an APPROVED business)

**Decision: every change to an approved business requires admin approval before it takes effect.**

- Editing in My Business does NOT write to the `businesses` row directly. It creates a
  **`business_change_request`** record (shadow/diff):
  - `business_id`, `requested_by`, `status` (`pending`/`approved`/`rejected`),
    `changes` JSONB (only changed fields: `{field: {old, new}}`), `review_reason`,
    `reviewed_at`, `reviewed_by`, `created_at`.
  - File changes: owner uploads to storage first → the **new URL** goes into the diff;
    the live `businesses` row is updated only on approval. (Rejected → uploaded file orphaned;
    acceptable for v1.)
- **At most one open (`pending`) change-request per business** (KISS). New edit while one is
  open → update the open request (replace diff).
- Admin **approve** → apply diff onto `businesses` row in one transaction; mark request approved;
  notify owner. Admin **reject** → request rejected + `review_reason`; live data unchanged;
  notify owner.
- The very first approval (new business in §3) and subsequent change-requests share the same
  admin review surface but are distinct records (`approval_status` on business vs
  `business_change_request`).

## 6. Admin review surface (platform-admin only)

- **Pending businesses** appear in admin Businesses list filtered by `approval_status=pending`
  (badge/count). Admin opens a **detail drawer** showing: owner personal info (name, email,
  phone, avatar) + full business KYB + uploaded license/banner (license from private bucket via
  signed read URL). Actions: **Approve** / **Reject (reason required)**.
- **Pending change-requests**: a list/section showing each request with a **before→after diff**;
  Approve / Reject (reason). Admin can view the proposed files.
- All decisions audit-logged (extend `EAdminAuditAction`: `business.approve`, `business.reject`,
  `business.change_approve`, `business.change_reject`).

## 7. Notifications (bell, in-app, non-realtime)

Wire the existing `notifications` table (entity present, table migrated) into a module.

| Event | Recipient | type |
|-------|-----------|------|
| New business submitted (pending) | all platform admins | `business.submitted` |
| Business approved | owner | `business.approved` |
| Business rejected (+reason) | owner | `business.rejected` |
| Change-request submitted | all platform admins | `business.change_submitted` |
| Change-request approved/rejected | owner | `business.change_approved` / `business.change_rejected` |

- Bell shows unread count (Badge) + dropdown list (title, message, time, read state),
  mark-one / mark-all read, click → navigate to relevant surface.
- Delivery: client **polls** (`pollInterval` ~45s) + refetch on bell open. No websocket.
- Present in both business layout and admin layout.

## 8. Permissions summary

| Action | Owner | Admin (platform) |
|--------|:----:|:----:|
| Register account + create business | ✓ | — |
| View/edit own business while pending/rejected | ✓ | — |
| Submit change-request on approved business | ✓ | — |
| Approve/reject business or change-request | — | ✓ |
| View owner personal info + license doc | own only | ✓ (any) |
| Use business features (dashboard, etc.) | only when `approved` + `active` | — |

## 9. Open questions / future

- How do staff get accounts (owner creates vs invite)? — separate feature, not in this scope.
- Cleanup of orphaned uploads from rejected change-requests (cron?).
- Tax-code uniqueness / external verification (VN tax API) — not in v1.
- Multi-admin: any admin can approve; no assignment/locking in v1.
