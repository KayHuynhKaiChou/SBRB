# SBRB Project Changelog

All notable changes to the SBRB project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2026-06-21] — Personnel Management & Account Lifecycle

**Plan:** `plans/260621-xxxx-personnel-management/` | **Rules:** Integrated into `docs/business-approval-rules.md` + new `docs/account-lifecycle-rules.md` (pending)

### Added
- **Account Lifecycle** — User.status enum (pending|active|inactive) replaces `is_disabled`/`disabled_at`. Migration `1777500012000-AddUserAccountStatus`: backup old columns as view, set status accordingly. pending & inactive blocked from login + refresh token endpoint.
- **Staff/Manager Account Creation** — Owner/manager invoke `createStaffAccount(email, role)` → email invite sent with `/set-password?token=&email=` link (24h TTL). Invitee clicks link → `setAccountPassword(token, newPassword)` → status flips to `active`.
- **Personnel Page** (`/members`) — Ant Table + search/role/status filters (pending/active/inactive). Row actions: pending = resend/delete, others = deactivate/reactivate. Owner/manager only. Navigation: sidebar `TeamOutlined` button. Paginated via `businessMembers` query.
- **Mutations** — `createStaffAccount`, `setAccountPassword` (public), `resendAccountInvite`, `deletePendingAccount` (pending only), `setMemberAccountStatus` (deactivate revokes refresh tokens via RefreshTokenService).
- **Query** — `businessMembers(businessId, filter: { search?, role?, status?, offset?, limit? })` → `{ rows, total }` — offset paginated, owner/manager gated.
- **Shared Components & Types:**
  - New `<PasswordForm/>` in `apps/web/src/components/auth/password-form.tsx` — reused across set-password / reset-password / change-password pages. Shared validation: `PASSWORD_RULE_REGEX` from constants.
  - New shared types: `IBusinessMemberRow`, `IBusinessMembersResult` in `@sbrb/shared-types`.
  - New shared constants: `EUserAccountStatus`, `ACCOUNT_STATUS_TAG_COLOR`, `ACCOUNT_INVITE_EXPIRY_HOURS`, `PASSWORD_RULE_REGEX`.
  - New shared auth success screen (AntD Result component for common use).
- **i18n** — Extended `member.json`, `auth.json`, `guide.json` (vi+en). Guide hub gained `personnel_management` feature entry + Tour.
- **Admin Compatibility** — Admin disable/enable now writes `status='inactive'`. GraphQL `isDisabled` field kept as derived `status==='inactive'` for backward-compatible admin UI.
- **Tests** — account-lifecycle.service.spec + admin-user.service.spec updated. Frontend: password-form / members-table / set-password-page / change-password-modal specs.

### Changed
- User entity: `status` (varchar) added; `is_disabled`/`disabled_at` retained (view-only for migration safety)
- Auth login: blocks `status IN ('pending', 'inactive')` (stricter than `is_disabled`)
- RefreshTokenService: `revokeAllForUser` extracted for reuse in deactivation flow
- reset-password route: moved to query param `?token=` (consistent with set-password route style)

### Migration Required
```
npx nx run api:migration:run
```
Migration: `1777500012000-AddUserAccountStatus`
- Adds `status` varchar(20) NOT NULL, backed by enum check constraint
- Populates: owner → 'active', others with is_disabled=false → 'active', is_disabled=true → 'inactive'
- Existing staff created via invite (old flow) → 'active' (no pending in old system)

---

## [2026-06-14] — In-app User Guide / Help hub with antd Tour

**Plan:** `plans/260614-1600-user-guide-tour-hub/` (incl. `feature-catalog.md`)

### Added
- **User Guide hub** (`/guide`) — accessible to every logged-in role via a dedicated `GuideLayout` (reuses role-aware Sidebar; unlike `ProtectedRoute` it does NOT redirect admins). Sidebar entry (`QuestionCircleOutlined`) added to business + admin sidebars.
- **Guide UI** — grouped feature cards (`Collapse` + `Card` grid) across 8 areas, **roles & permissions matrix** (`Table`), **business-approval lifecycle** (`Steps`). Built features show a role-gated **Usage** button; unbuilt features show a `(coming soon)` `Tag`. Driven by `guide-catalog.ts`; all text in `guide.json` (en/vi).
- **Guided tours (antd `Tour`)** — `tour.store` (zustand) + `useFeatureTour` (`?tour=<id>` ∪ store, consumes on close) + `FeatureTour` wrapper. Usage button navigates to the feature page and launches its tour. Page-level tours wired on: dashboard, data-sheets, departments, my-business, profile (+notification bell), onboarding, admin dashboard/businesses/users/audit. Added `data-testid` anchors as tour targets.
- Shared types in `@sbrb/shared-types` (`guide.types.ts`); `GUIDE` route constant. 16 guide tests (catalog integrity, hook, usage-button gating, en/vi i18n parity).

### Deferred
- Modal/drawer-level deep tour steps (widget settings, import dialog, dept modals, review drawer, change-owner, user detail drawer) — page-level tours shipped; sub-page steps are a follow-up.

---

## [2026-05-31] — Owner signup wizard + business verification/approval

**Plan:** `plans/260531-1742-owner-signup-business-approval/` | **Rules:** `docs/business-approval-rules.md`

### Added
- **Owner signup wizard** (`/auth/register`) — 3-step antd `Steps`: account → verify email (link, polled via login) → full KYB business form → "chờ duyệt". Replaces old single-form register + onboarding (create/join).
- **Business verification lifecycle** — `approval_status` (pending/approved/rejected) independent of operational `status`; KYB columns on `businesses` (legal name, tax code, business type, address, contacts, website, description, logo/banner/license, founded year, company size). Existing rows backfilled `approved`.
- **Admin review** — pending-business filter + detail drawer (owner info + KYB + signed-URL licence) with Approve / Reject(reason); "Change requests" tab with before→after diff. Behind `PlatformAdminGuard`.
- **Change-request flow** — after approval, KYB edits create a `business_change_requests` shadow diff (one open per business, DB partial-unique); admin approval applies it in a transaction. Live edit only while pending/rejected.
- **Notification module** — wired `notifications` table (service/resolver/DTO); submit/approve/reject events to owner / all admins. In-app bell (Popover + unread Badge, 45s polling) in business + admin sidebars.
- **My Business page** (`/my-business`); **BusinessGuard** gates pending/rejected → pending page (except my-business/profile).
- Storage buckets `banner` (public) + `business-docs` (private licence). Migrations: AddBusinessApprovalAndKyb, CreateBusinessChangeRequests, CreateNotifications. 34 API unit tests.

### Removed
- Public `register-page.tsx` + onboarding create/join UI; `ACCEPT_INVITATION_MUTATION` no longer a public entry (staff added by owner).

---

## [2026-05-30] — Fix: API boot crash (admin GraphQL schema)

### Fixed
- API failed to start — GraphQL schema build threw `UndefinedTypeError` for `AdminBusinessRowType.inactiveReason`. Root cause: nullable `@Field` decorators on union-typed (`string | null`) properties emit `Object` reflection metadata, so NestJS GraphQL cannot infer the type. Added explicit `@Field(() => String, { nullable: true })` to 8 fields across 4 admin DTOs (`admin-business-row`, `admin-audit-row`, `admin-user-detail`, `admin-user-row`). Type-check passed but the error only surfaced at runtime schema generation. Admin specs 26/26 green; API now boots and maps `/graphql`.

---

## [2026-04-29] — Platform Admin Role v1 (Phases 1-6)

**Plan:** `plans/260428-2028-admin-role/` | **SRS:** `docs/admin-srs.md`

### Added
- `PlatformAdminGuard` — JWT-level check for `platformRole === 'admin'`, applies to all admin GraphQL resolvers
- `apps/api/src/modules/admin/` — new module with 4 services + 3 resolvers: AdminBusinessService, AdminUserService, AdminMetricsService, AdminAuditService, AdminBusinessResolver, AdminUserResolver, AdminPlatformResolver
- `apps/api/src/modules/auth/refresh-token.service.ts` — extracted `revokeAllForUser` for cross-module use (called on user disable)
- 3 TypeORM migrations: `AddUserPlatformRole`, `AddBusinessStatus`, `AddUserDisabled`
- `apps/web/src/pages/admin/` — 4 admin pages + 5 sub-components (AdminBusinessesTable, AdminUsersTable, UserDetailDrawer, InactivateBusinessModal, BusinessStatusTag)
- `apps/web/src/pages/business-inactive/` — BusinessInactivePage, InactiveBanner, InactiveActions
- `apps/web/src/components/auth/admin-route.tsx` — route guard for /admin/* paths
- `apps/web/src/components/auth/business-guard.tsx` — renders BusinessInactivePage when business.status === 'inactive'
- `apps/web/src/components/layout/admin-sidebar.tsx` + `admin-layout.tsx` — admin navigation and layout
- `apps/web/src/graphql/admin.operations.ts`, `business.operations.ts` — new GraphQL operations
- `apps/web/src/hooks/use-admin-businesses.ts`, `use-admin-users.ts`, `use-admin-metrics.ts`, `use-admin-audit.ts` — data hooks
- i18n namespace `admin` (en + vi): `libs/i18n/src/locales/{en,vi}/admin.json` + copied to `apps/web/public/locales/`
- 7 test suites (32 unit tests): PlatformAdminGuard, AdminBusinessService, AdminUserService, RefreshTokenService, AdminMetricsService, AdminAuditService, AdminPlatformResolver

### Changed
- `apps/api/src/modules/auth/entities/user.entity.ts` — added `platformRole`, `isDisabled`, `disabledAt` columns
- `apps/api/src/modules/business/entities/business.entity.ts` — added `status`, `inactivatedAt`, `inactivatedBy`, `inactiveReason` columns
- `apps/api/src/modules/auth/auth-login.service.ts` — blocks login when `user.isDisabled === true`; adds `platformRole` to JWT payload
- `apps/api/src/modules/auth/dto/user.type.ts` — added `platformRole` to UserType
- `apps/web/src/app/app.tsx` — added /admin/* routes wrapped in AdminRoute
- `apps/web/src/components/layout/sidebar.tsx` — dispatches AdminSidebar vs BusinessSidebar based on `user.platformRole`
- `apps/web/src/components/layout/business-switcher.tsx` — "Closed" badge for inactive businesses (i18n)
- `apps/web/src/hooks/use-auth.ts` — login redirect: platformRole='admin' → /admin
- `apps/web/src/components/auth/protected-route.tsx` — admin users redirected to /admin (cannot enter business routes)
- `libs/i18n/src/index.ts` — added `'admin'` to `I18N_NAMESPACES`
- `apps/web/src/i18n/index.ts` — added `'profile'` and `'admin'` to ns array
- `libs/shared/constants/src/routes.constants.ts` — added ADMIN, ADMIN_BUSINESSES, ADMIN_USERS, ADMIN_AUDIT routes
- `libs/shared/constants/src/role.constants.ts` — added EPlatformRole enum
- `libs/shared/constants/src/business.constants.ts` — added EBusinessStatus, BUSINESS_STATUS_TAG_COLOR
- `libs/shared/types/src/user.types.ts` — added platformRole to IUserDto

### Migrations Required
```
npx nx run api:migration:run
```
Migrations (in order):
1. `1777500000000-AddUserPlatformRole` — `platform_role` varchar(20) nullable, indexed
2. `1777500001000-AddBusinessStatus` — `status` default 'active', `inactivated_*` columns
3. `1777500002000-AddUserDisabled` — `is_disabled` boolean default false, `disabled_at` nullable

Seed admin account manually after migration:
```sql
UPDATE users SET platform_role = 'admin' WHERE email = '<your-email>';
```

---

## [2026-04-27] — Phase 2F: User Profile

### Added
- `/profile` route with 4 section cards: Personal Info, Membership, Business (owner-only), Security
- Common `<ProfileForm/>` component in `@sbrb/ui` (avatar, fullName, phone, language, bio, departmentId) — designed for member detail reuse
- Backend mutations: `getAvatarUploadUrl` (generates Supabase signed URL for avatar upload), `updateProfile`, `changePassword`
- Backend resolvers: `myMembership` (user's membership in current business), `getProfile`, `getSessions`, `logoutSession`
- Frontend GraphQL operations: `apps/web/src/graphql/profile.operations.ts` (10 operations: getProfile, updateProfile, changePassword, getSessions, logoutSession, etc.)
- Avatar upload via Supabase Storage bucket `avatar` (signed URLs, 5MB limit)
- Change password modal with old password verification
- Active sessions table with current session highlight and logout-current-session action
- i18n namespace `profile` (Vietnamese + English)
- AvatarStorageService: Supabase Storage integration for signed URLs + cleanup on update

### Changed
- `IUserDto` field renamed: `name` → `fullName` (synced with backend UserType)
- `UpdateProfileDto` extended: now includes `phone`, `bio`, `departmentId` fields
- `UserPayload` (JWT): added optional `sessionId` field for session tracking
- `SessionType` entity: added `isCurrent` boolean field (marks user's current session)

### Migration Required
- Run: `npm run typeorm migration:run`
- Migration name: `AddProfileFields` (adds `bio` string + `department_id` uuid columns to users table)
- Supabase setup:
  - Create bucket `avatar` (bucket name singular)
  - Enable public read access on bucket
  - Set CORS policy to allow Origin: localhost:3000 (dev), your domain (prod)

### Environment Variables
New required Supabase variables (add to .env):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_AVATAR_BUCKET=avatar
```

### Testing
- Profile module: 13+ unit tests (all passing)
- Covered: profile CRUD, avatar URL generation, password change, session management
- Avatar upload validation: file size, MIME type, signed URL generation

### Files Modified
- Backend: `apps/api/modules/profile/` (new module, 4 services + resolvers)
- Frontend: `apps/web/src/pages/Profile.tsx` (new page), `libs/ui/components/ProfileForm.tsx` (new component)
- Shared: `libs/shared/types/profile.dto.ts` (new DTOs)
- i18n: `libs/i18n/locales/{vi,en}/profile.json` (new namespace)
- Database: TypeORM migration file (AddProfileFields)

### Notes
- ProfileForm designed for reuse; no useState, uses Ant Form context
- Avatar signed URLs expire after 1 hour (configurable)
- Sessions identified by JWT jti (JWT ID) claim
- Only owner can view business info card; other roles see read-only membership info

---

## [2026-03-28] — Phase 2E: Data Import (Excel/CSV)

### Added
- `/datasheets` page for Excel file upload & management
- Data Selector modal (searchable series list for widget configuration)
- BullMQ background job processing (Excel import, data validation)
- GraphQL subscriptions for import progress tracking
- DataSheet, DataSeries, DataValues database entities
- File upload handling (10MB limit via Multer)
- Matrix format parser (rows = series, columns = time periods)

### Changed
- Widget configuration now requires selected DataSeries IDs
- Chart config added to Widget entity

### Migration
- `npm run typeorm migration:run` for DataSheet schema

### Testing
- DataSheet module: 15+ tests
- Excel parser validation: format checking, bounds checking
- BullMQ job processing: 100-series file < 10s

---

## [2026-03-28] — Phase 2D: Canvas & Widget Drag+Drop

### Added
- Canvas component (3200×4800px, pixel-based layout)
- Widget drag-and-drop via react-rnd library
- Snap grid alignment (20px default, configurable)
- Collision detection (AABB algorithm, client + server validation)
- Widget resize with min/max constraints (800×400px to 1600×800px)
- Canvas zoom control (50%-125% range)
- Widget position persistence (debounce 300ms)

### Changed
- Widget model: added `positionX`, `positionY`, `width`, `height` fields
- Canvas view replaces simple list

### Testing
- Widget module: 20+ tests
- Collision detection: 100% coverage
- Performance: 50 widgets on canvas, smooth drag interaction

---

## [2026-03-28] — Phase 2C: Tab Management

### Added
- Tab CRUD operations (create, rename, delete, reorder)
- Tab colors & icons (customizable per tab)
- Tab pinning (mark important tabs for quick access)
- Duplicate Tab (copies widgets to new tab)
- Tab bar UI with drag-to-reorder handle

### Changed
- Dashboard layout: Tab navigation bar + Canvas view
- Tab entity: added `color`, `icon`, `isPinned` fields

### Testing
- Tab module: 15+ tests
- Reorder persistence: verified in database

---

## [2026-03-22] — Phase 2B: Business & Multi-Tenancy

### Added
- Business CRUD (Owner-only create)
- Email-based user invitations (invite by email, claim by code)
- Role-based access control (Owner, Manager, Staff, Viewer)
- Member management (add, remove, update role)
- Row-level security by businessId

### Changed
- User model: added `UserRole` junction table (businessId + role per user)
- Auth: JWT now includes `businessId` + `role`

### Migration
- `npm run typeorm migration:run` for Business + UserRole schema

### Testing
- Business module: 78+ tests
- Invitation flow: email → claim code → role assignment

---

## [2026-03-22] — Phase 2A: Authentication & User Management

### Added
- User signup (email/password) with email verification
- JWT login (15m access token, 30d refresh HttpOnly cookie)
- Google OAuth integration (auto-create user if new)
- Password reset flow (email-based)
- User profile management (name, email, language)
- Session management (logout clears refresh token)
- Redis-backed rate limiting on auth endpoints

### Changed
- None (new feature)

### Testing
- Auth module: 80+ tests
- Email verification: Handlebars templates, Gmail SMTP
- OAuth: Google strategy integration
- Rate limiting: Redis-backed, prevents brute force

---

## [2026-03-22] — Phase 1: Project Scaffold & Foundation

### Added
- NX monorepo structure (apps/web, apps/api, apps/worker, libs/*)
- CI/CD skeleton (GitHub Actions, ESLint, TypeScript strict mode)
- Docker Compose stack (PostgreSQL, Redis, MinIO)
- React + Vite frontend initialization (Ant Design 5, Tailwind CSS)
- NestJS GraphQL backend scaffold (Apollo Server 4)
- Shared libraries (types, constants, utils)
- Jest test framework setup

### Testing
- All dependencies install without error
- dev:web, dev:api, dev:worker servers start correctly
- docker:up brings full local stack
- type-check, lint pass with 0 errors

---

**Document Version:** 1.1 | **Last Updated:** 2026-06-21
