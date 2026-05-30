# SBRB Project Changelog

All notable changes to the SBRB project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

**Document Version:** 1.0 | **Last Updated:** 2026-04-27
