# Business Onboarding, Verification & Change-Approval Rules

> Business rules for: owner self-signup (account + business in one wizard), platform-admin
> verification/approval of new businesses, the owner "My Business" profile, and the
> admin-gated change-request flow for editing an approved business.
> Backend is the source of truth. Notifications are delivered in-app (bell), non-realtime (polling).
> Status: ACTIVE (implemented). Last updated: 2026-06-14.
>
> **Update 2026-06-14:** (a) email verification is a **6-digit OTP** entered in the wizard (not a link);
> (b) `approval_status` and the operational `status` are **merged into one `status`** column with four
> values: `pending | approved | rejected | inactive`. All references below use the unified field.

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
| 1 | Tài khoản | fullName, email, password (+ strength rules) → `register` mutation (sends OTP) | account created |
| 2 | Xác nhận | enter the **6-digit OTP** emailed to the user → `verifyEmailOtp(email, code)` | OTP valid → user auto-logged-in, advance |
| 3 | Doanh nghiệp | business KYB form (see §4) incl. logo/banner/license upload → `createBusiness` | required fields valid + business created with `status = pending` |
| 4 | Chờ duyệt | confirmation + "đang chờ admin duyệt" | — (terminal; user can log in later to track) |

- Email verification uses a **6-digit OTP** (crypto-random, 15-min expiry) entered in step 2,
  not a link. Resend has a cooldown + Redis rate-limit.
- Creating the business in step 3 is what puts it into `pending`.

## 3. Lifecycle (single unified `status`)

A business has **one** `status` with four values: `pending | approved | rejected | inactive`.

State machine:

```
                    (owner submits / resubmits in wizard or My Business)
        ┌───────────────────────────────────────────────────────┐
        ▼                                                         │
   ┌─────────┐  admin approve   ┌──────────┐  admin inactivate   │
   │ pending │ ───────────────► │ approved │ ◄────────────────┐  │
   └─────────┘                  └──────────┘                  │  │
        │ ▲                          │ ▲ admin reactivate      │  │
 admin  │ │ owner resubmits          ▼ │                       │  │
 reject │ │ (per rejection_reason)  ┌──────────┐               │  │
        ▼ │                         │ inactive │ ──────────────┘  │
   ┌──────────┐                     └──────────┘                  │
   │ rejected │ ──────────────────────────────────────────────────
   └──────────┘
```

- New business → `status = pending`. Owner CANNOT use business features yet.
- Admin **approve** (from pending/rejected) → `approved`; `approved_at`, `approved_by` set; owner
  notified; business becomes usable.
- Admin **reject** (from pending) → `rejected` + `rejection_reason` (required); `rejected_at`,
  `rejected_by` set; owner notified with reason.
- Owner edits in **My Business** and **resubmits** → back to `pending` (reason cleared).
- Admin **inactivate** (only from `approved`) → `inactive` + `inactive_reason`; **reactivate**
  (only from `inactive`) → back to `approved`.
- Audit metadata columns (`approved_*`, `rejected_*`, `inactivated_*`, `rejection_reason`,
  `inactive_reason`) are retained.

### Access by status (owner login always allowed)

- `inactive` → `BusinessInactivePage`.
- `pending` / `rejected` → `BusinessPendingPage`, EXCEPT **My Business** + **Profile** (owner can
  view/edit/resubmit). The sidebar disables every feature menu except **My Business** while
  `status ≠ approved`.
- `approved` → full app access.

## 4. Business fields (KYB)

Existing: `name`, `industry`, `currency`, `logoUrl`, canvas config, `status` (unified, §3), `ownerId`.

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
| `status` | varchar(20) | (system) | – | unified: pending/approved/rejected/inactive (§3) |
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
  admin review surface but are distinct records (business `status` vs `business_change_request`).

## 6. Admin review surface (platform-admin only)

- Admin Businesses list has **one Status column** (4-value tag) and **one status filter**
  (`pending/approved/rejected/inactive`). Admin opens a **detail drawer** showing: owner personal
  info (name, email, phone, avatar) + full business KYB + uploaded license/banner (license from
  private bucket via signed read URL).
- **Status transitions happen in the drawer**, with only the valid next action(s) shown per the §3
  state machine: pending → Approve / Reject · rejected → Approve · approved → Inactivate ·
  inactive → Reactivate. **Reject** and **Inactivate** open a popup requiring a reason (textarea).
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
| Use business features (dashboard, etc.) | only when `status = approved` | — |

## 9. Open questions / future

- How do staff get accounts (owner creates vs invite)? — separate feature, not in this scope.
- Cleanup of orphaned uploads from rejected change-requests (cron?).
- Tax-code uniqueness / external verification (VN tax API) — not in v1.
- Multi-admin: any admin can approve; no assignment/locking in v1.
