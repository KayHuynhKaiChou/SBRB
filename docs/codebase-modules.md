# SBRB Core Modules Breakdown

> Companion reference to [codebase-summary.md](./codebase-summary.md). Per-module backend inventory (key files, responsibilities, entities, guards). The **Platform Admin module** is documented in [codebase-summary.md → Platform Admin Role (v1)](./codebase-summary.md#platform-admin-role-v1--complete).

## ✅ Authentication Module (`apps/api/modules/auth/`) — IMPLEMENTED

**Status:** ✅ COMPLETE — 80+ tests passing.

**Key Files:**
- `auth.service.ts` — Main auth orchestration
- `auth-login.service.ts` — Login logic (email/password + Google OAuth)
- `auth-register.service.ts` — Signup + email verification
- `auth-password.service.ts` — Password reset flow
- `refresh-token.service.ts` — Refresh token issue/rotate/revoke (`revokeAllForUser` used on admin user-disable)
- `jwt.strategy.ts` — JWT validation
- `google.strategy.ts` — Google OAuth strategy
- `redis-rate-limit.service.ts` — Rate limiting on auth endpoints
- `auth.controller.ts` — REST endpoints
- `auth.resolver.ts` — GraphQL resolvers

**Responsibilities:**
- JWT token generation (15m access, 30d refresh)
- Passport strategies (local, Google OAuth, JWT)
- Email verification (Gmail SMTP + Handlebars templates)
- Password reset (email-based)
- HttpOnly refresh token cookie with secure flags
- Redis-backed rate limiting (prevent brute force)
- Disabled-user login block (`isDisabled` check)

**Exports:**
- `JwtAuthGuard` — Validate JWT on all protected routes
- `GqlJwtAuthGuard` — GraphQL-specific JWT guard
- `CurrentUserDecorator` — Inject user payload
- `RefreshTokenService` — Token revocation reused by the Admin module

**Security:**
- ✅ Bcrypt password hashing (10+ rounds)
- ✅ JWT secret in env var (min 32 chars production)
- ✅ Refresh token: HttpOnly, Secure, SameSite=Strict cookie
- ✅ CORS whitelist via ALLOWED_ORIGINS env var
- ✅ Rate limiting: 100 req/min per IP on auth endpoints

---

## ✅ User Module (`apps/api/modules/user/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `user.service.ts` — User CRUD
- `user.resolver.ts` — GraphQL user queries
- `user.controller.ts` — REST endpoints

---

## ✅ Business Module (`apps/api/modules/business/`) — IMPLEMENTED

**Status:** ✅ COMPLETE — 78+ tests passing.

**Key Files:**
- `business.service.ts` — Main business orchestration
- `business-crud.service.ts` — Business create/read/update/delete
- `business-ownership.service.ts` — Ownership & access control
- `member.service.ts` — Member management (add/remove/role update)
- `invitation.service.ts` — Invitation creation & acceptance
- `business.controller.ts` — REST endpoints
- `business.resolver.ts` — GraphQL business resolvers
- `member.resolver.ts` — GraphQL member queries/mutations

**Responsibilities:**
- ✅ Create business (Owner only)
- ✅ Invite users via email code (Owner/Manager)
- ✅ Manage business members (add/remove, role assignment)
- ✅ Role-based access control (Owner, Manager, Staff, Viewer)
- ✅ Row-level security (RLS) — filter data by businessId

**Entities Implemented:**
- `Business` — id, name, ownerId, status, inactivatedAt, inactivatedBy, inactiveReason, createdAt, updatedAt
- `UserRole` — userId, businessId, role (junction table)
- `Invite` — code, email, businessId, expiresAt, usedAt

**Guards:**
- `BusinessAccessGuard` — Verify user belongs to business
- `RoleGuard` — Check user role (owner, manager, staff, viewer)

---

## ✅ Tab Module (`apps/api/modules/tab/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `tab.service.ts` — CRUD operations
- `tab.resolver.ts` — GraphQL resolvers
- `tab.controller.ts` — REST endpoints

**Responsibilities:**
- ✅ Create Tab within Business
- ✅ Rename/update Tab
- ✅ Delete Tab (cascade delete widgets)
- ✅ Reorder tabs (drag handles)
- ✅ Duplicate Tab with widgets
- ✅ Tab colors, icons, pinning

**Entities:** Tab (id, businessId, name, order, color, icon, pinned, createdAt)

---

## ✅ Widget Module (`apps/api/modules/widget/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `widget.service.ts` — CRUD operations
- `widget.resolver.ts` — GraphQL resolvers
- `widget.controller.ts` — REST endpoints
- `widget-validator.service.ts` — Position + collision validation

**Responsibilities:**
- ✅ CRUD widgets (create, read, update, delete)
- ✅ Validate position (bounds, collision, snap grid)
- ✅ Update position (PATCH /widgets/:id/position, debounced)
- ✅ Validate chart config
- ✅ Widget chart preview, resize constraints

**Entities:** Widget (id, tabId, x, y, w, h, chartConfig JSON, createdAt)

---

## ✅ DataSheet Module (`apps/api/modules/datasheet/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `datasheet.service.ts` — DataSheet CRUD
- `datasheet.resolver.ts` — GraphQL resolvers
- `import-excel.processor.ts` — BullMQ worker (ExcelJS parsing)

**Responsibilities:**
- ✅ Handle Excel file upload (Multer → MinIO S3)
- ✅ Enqueue BullMQ import job
- ✅ Store DataSheet + DataSeries + DataValues (JSONB)
- ✅ Data Selector — Query series by datasheet
- ✅ Reimport existing datasheet

**Entities:** DataSheet (id, businessId, fileName, uploadedAt), DataSeries (id, dataSheetId, name, dataValues JSON)

---

## ✅ Audit Module (`apps/api/modules/audit/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `audit.service.ts` — Audit log creation & querying
- `audit.module.ts` — Module registration

**Responsibilities:**
- Track all business mutations (create/update/delete)
- Immutable audit log with businessId (nullable for platform-scope events), userId, action, entity, oldValue, newValue, timestamp

---

## ✅ Profile Module (`apps/api/modules/profile/`) — IMPLEMENTED

**Status:** ✅ COMPLETE (Phase 2F, 2026-04-27)

**Key Files:**
- `profile.service.ts` — Profile CRUD, password change, avatar URL generation
- `profile.resolver.ts` — GraphQL resolvers: getProfile, updateProfile, changePassword, getSessions, logoutSession
- `avatar-storage.service.ts` — Supabase Storage integration (signed URLs, bucket `avatar`)
- `profile.operations.ts` — GraphQL operations (10 ops for web client)
- `__tests__/` — Unit tests for all services

**Responsibilities:**
- User profile retrieval & update (fullName, phone, language, bio, departmentId)
- Avatar upload via Supabase Storage bucket `avatar` with signed URLs
- Change password with old password verification
- Session management (list active sessions, logout current session)
- Membership info retrieval (myMembership resolver)

**Key Services:**
- `AvatarStorageService` — Handles Supabase Storage signed URL generation for avatar upload/download
- Validates avatar file size + type before upload
- Cleans up old avatar on update

---

## ✅ Mail Module (`apps/api/modules/mail/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `mail.service.ts` — Email sending via Gmail SMTP
- `mail.module.ts` — Module registration

**Responsibilities:**
- Send emails (verification, password reset, invitations)
- Handlebars template rendering
- Gmail SMTP integration

---

## 🔲 Notification Module (`apps/api/modules/notification/`) — SCAFFOLDED

**Status:** 🔲 Scaffolded (services/resolvers commented out, ready for Phase 4)

---

## 🔲 MinIO Module (`apps/api/modules/minio/`) — STUB

**Status:** 🔲 Stub implementation (returns mock URLs; real minio pkg not installed yet)

**Responsibilities (Phase 2E+):**
- S3-compatible file storage (local dev via MinIO, prod via AWS S3)
