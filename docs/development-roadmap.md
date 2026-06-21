# SBRB Development Roadmap

## Project Timeline & Phases

**Current Date:** 2026-06-21 | **Phase 1 Status:** ✅ COMPLETE | **Phase 2 Status:** Phase 2A-2F ✅ COMPLETE | **Personnel Mgmt Status:** ✅ COMPLETE | **Phase 3:** Next

---

## Phase 1: Project Scaffold & Foundation

**Status:** ✓ COMPLETE (2026-03-22)

**Duration:** 3 weeks

**Key Deliverables:**
- NX monorepo structure set up (apps/web, apps/api, apps/worker, libs/*)
- CI/CD skeleton (GitHub Actions, ESLint, TypeScript strict mode)
- Docker Compose: PostgreSQL, Redis, MinIO local dev stack
- Auth module scaffold (Passport JWT + Google OAuth strategy)
- GraphQL server bootstrap (@nestjs/graphql, Apollo Server)
- React + Vite app initialization (Tailwind CSS, Ant Design 5)
- Shared libs: types, constants, utils (empty stubs)
- Documentation foundation (README, CLAUDE.md, code standards)

**Acceptance Criteria:**
- [ ] `npm install` → all dependencies install without error
- [ ] `npm run dev:web` starts Vite server on 3000
- [ ] `npm run dev:api` starts NestJS on 4000
- [ ] `npm run docker:up` brings up full local stack
- [ ] `npm run type-check` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] Git workflow established (branch naming, commit format)

---

## Phase 2: MVP Authentication, Business, Canvas, Data, Profile

**Status:** Phase 2A-2F ✅ COMPLETE (2026-04-27)

**Priority:** P0 (must-have for demo)

### Phase 2A: Authentication & User Management ✅ COMPLETE (2026-03-22)

**Status:** ✅ COMPLETE — All tests passing, JWT+OAuth fully implemented.

**Implemented Features:**
- User signup (email/password) with email verification (Gmail SMTP + Handlebars)
- JWT login (15m access token, 30d refresh HttpOnly cookie)
- Google OAuth integration (auto-create user if new)
- Password reset flow (email-based)
- User profile management (name, email, language)
- Session management (logout clears refresh token cookie)
- Redis-backed rate limiting on auth endpoints
- 80+ unit tests, all passing

**Key Files Implemented:**
- `auth.service.ts`, `auth-login.service.ts`, `auth-register.service.ts`, `auth-password.service.ts`
- `jwt.strategy.ts`, `google.strategy.ts`
- `redis-rate-limit.service.ts`
- `auth.controller.ts`, `auth.resolver.ts`
- `__tests__/` — comprehensive test suite

**Verification:**
- ✅ Email/password signup → verify email → login works
- ✅ Google OAuth → auto-create user if new → login
- ✅ Refresh token cookie HttpOnly, secure, sameSite=Strict
- ✅ Expired JWT → auto-refresh via refresh token
- ✅ Password reset email works end-to-end
- ✅ Rate limiting prevents brute force attacks

### Phase 2B: Business & Multi-Tenancy ✅ COMPLETE (2026-03-22)

**Status:** ✅ COMPLETE — 78+ tests passing, multi-tenant business management fully implemented.

**Implemented Features:**
- Create Business (Owner only)
- Invite users via email code (Owner/Manager)
- Role assignment (Owner, Manager, Staff, Viewer)
- Member list with role management
- Remove/update member from business
- Business CRUD operations
- Invitation acceptance flow

**Implemented Entities:**
- Business (id, name, ownerId, createdAt, updatedAt)
- UserRole (userId, businessId, role) — junction table
- Invite (code, email, businessId, expiresAt, usedAt)

**Key Files Implemented:**
- `business.service.ts`, `business-crud.service.ts`, `business-ownership.service.ts`
- `member.service.ts`, `invitation.service.ts`
- `business.controller.ts`, `business.resolver.ts`, `member.resolver.ts`
- `__tests__/` — comprehensive test suite (dev-1: 28, dev-2: 29, dev-3: 21 tests)

**Verification:**
- ✅ Owner creates business → appears in business list
- ✅ Owner invites email → email contains join link
- ✅ Invited user clicks link → joins business with role
- ✅ Staff cannot view other members' data (RLS enforced)
- ✅ Manager can invite/remove Staff (not other Managers)
- ✅ Viewer cannot create tabs or widgets

### Phase 2C: Tab Management ✅ COMPLETE (2026-03-28)

**Features:**
- ✅ Create Tab within Business
- ✅ Rename Tab
- ✅ Delete Tab (cascade delete widgets)
- ✅ Reorder tabs (drag handles)
- ✅ Duplicate Tab with widgets
- ✅ Tab colors, icons, pinning

**Verification:**
- ✅ Owner creates tab → appears in tab bar
- ✅ Tab canvas renders (empty, 3200×4800px)
- ✅ Rename tab → persists to DB
- ✅ Delete tab → cascade deletes widgets
- ✅ Reorder tabs via drag → persists order
- ✅ 15+ tests passing

### Phase 2D: Canvas & Widget Drag+Drop ✅ COMPLETE (2026-03-28)

**Features:**
- ✅ Add Widget to Tab (at default position: 0,0)
- ✅ Drag widget to new position (react-rnd)
- ✅ Resize widget (react-rnd with min size 800×400px, max 1600×800px)
- ✅ Snap to 20px grid on drag stop
- ✅ Collision detection (prevent overlap)
- ✅ Delete widget
- ✅ Widget position saved to DB (debounce 300ms)
- ✅ Canvas zoom (50-125%)
- ✅ Snap grid configuration

**Verification:**
- ✅ Drag widget → position updates on canvas realtime
- ✅ Drag widget → collision? Revert to previous position
- ✅ Drag widget → release? Snap to grid, persist to DB
- ✅ Resize widget → min/max constraints enforced
- ✅ Collision detection has 100% test coverage
- ✅ Performance: 50 widgets on canvas, smooth drag
- ✅ 20+ tests passing

### Phase 2E: Data Import (Excel/CSV) ✅ COMPLETE (2026-03-28)

**Features:**
- ✅ Upload Excel file (10MB limit)
- ✅ Parse matrix format: rows = data series, columns = time periods
- ✅ Store in DataSheet + DataSeries + DataValues tables
- ✅ Preview import mapping before confirm
- ✅ Background job processing (BullMQ worker)
- ✅ Progress notification (GraphQL Subscription)
- ✅ Data Selector modal (pick series for widget)
- ✅ Reimport existing datasheet

**Verification:**
- ✅ Upload Excel → parse preview shows correct matrix
- ✅ Confirm import → BullMQ job created
- ✅ Worker processes → 100-series file < 10s
- ✅ Import complete → GraphQL Subscription fires
- ✅ Verify data in DataSeries table (SQL check)
- ✅ Error handling: Invalid format → error message
- ✅ 15+ tests passing

### Phase 2F: User Profile ✅ COMPLETE (2026-04-27)

**Features:**
- ✅ `/profile` route with 4 section cards (Personal, Membership, Business owner-only, Security)
- ✅ Avatar upload via Supabase Storage bucket `avatar` with signed URLs
- ✅ Change password modal with old password verification
- ✅ Active sessions table with logout-current-session action
- ✅ Common ProfileForm component (avatar, fullName, phone, language, bio, departmentId)
- ✅ Profile GraphQL operations (10 ops: getProfile, updateProfile, changePassword, getSessions, logoutSession, etc.)
- ✅ Backend: myMembership query, getAvatarUploadUrl mutation
- ✅ Backend: users table (bio, departmentId fields), JWT sessionId, SessionType.isCurrent
- ✅ i18n profile namespace (vi + en)

**Verification:**
- ✅ Navigate to /profile → 4 cards render correctly
- ✅ Upload avatar → signed URL generated, image persists
- ✅ Change password → old password validated, hash updated
- ✅ View sessions → current session marked, logout works
- ✅ Edit profile form → updates persisted to DB
- ✅ ProfileForm reusable for member detail pages

---

## Personnel Management & Account Lifecycle ✅ COMPLETE (2026-06-21)

**Status:** ✅ COMPLETE — All account lifecycle features implemented, migrations applied, tests passing.

**Features:**
- ✅ User.status enum (pending|active|inactive) replaces is_disabled/disabled_at paradigm
- ✅ Owner/manager create staff/manager accounts via `createStaffAccount(email, role)` → invite email with 24h token link
- ✅ Invitee sets password via `/set-password?token=&email=` (public) → status → active
- ✅ `/members` page (Personnel Management): Ant Table, paginated, search + role + status filters, row actions
  - Pending accounts: resend invite, delete account
  - Active/inactive accounts: deactivate/reactivate (reactivate revokes refresh tokens)
- ✅ GraphQL mutations: createStaffAccount, setAccountPassword (public), resendAccountInvite, deletePendingAccount (pending only), setMemberAccountStatus
- ✅ GraphQL query: businessMembers(first, after, role?, status?) — paginated, owner/manager gated
- ✅ Shared PasswordForm component — reused in set-password / reset-password / change-password flows
- ✅ Shared types: IBusinessMemberRow, IBusinessMembersResult in @sbrb/shared-types
- ✅ Shared constants: EUserAccountStatus, ACCOUNT_STATUS_TAG_COLOR, ACCOUNT_INVITE_EXPIRY_HOURS, PASSWORD_RULE_REGEX
- ✅ i18n: member.json, auth.json, guide.json extended (vi + en); guide hub gained personnel_management tour
- ✅ Admin compatibility: admin disable/enable writes status='inactive'; isDisabled field kept as derived value
- ✅ Tests: account-lifecycle.service.spec, admin-user.service.spec updated; frontend: password-form, members-table, set-password-page, change-password-modal specs

**Verification:**
- ✅ Owner creates staff account → email invite sent (token + email params)
- ✅ Invitee clicks link → /set-password?token=... page loads
- ✅ Set password → account status='active', can now login
- ✅ Owner navigates /members → table shows pending/active/inactive with correct row actions
- ✅ Deactivate member → status='inactive', refresh token revoked, next login blocked
- ✅ Resend invite → new token generated, email resent
- ✅ Delete pending → only works for status='pending'
- ✅ Admin disable/enable → status field updated, admin UI unchanged (isDisabled derived)

**Database Migration:**
- `1777500012000-AddUserAccountStatus` — adds status varchar(20), migrates is_disabled → status, adds invite token fields

---

## Platform Admin Role (v1) ✅ COMPLETE (2026-04-29)

**Status:** ✅ COMPLETE — All 6 phases (Phase 1-6) delivered. Plan: `plans/260428-2028-admin-role/`. SRS: `docs/admin-srs.md`.

**Delivered Features:**
- ✅ `PlatformAdminGuard` — JWT-level authorization check for all admin resolvers (no FE trust)
- ✅ Admin business management: list all businesses, inactivate with reason + confirm-name modal, reactivate
- ✅ Admin user management: list all users, disable/enable (with session revocation), read-only user detail drawer
- ✅ Business inactive gate: `<BusinessGuard>` renders `<BusinessInactivePage>` for inactive business members
- ✅ Admin dashboard: 6 platform stat cards (total/active/inactive biz, total/new users, new biz)
- ✅ Admin audit log: paginated table with actor email join and action/date filters
- ✅ DB migrations (3): AddUserPlatformRole, AddBusinessStatus, AddUserDisabled
- ✅ i18n namespace `admin` (en + vi) — zero hardcoded strings in admin pages
- ✅ 30+ source files added/modified; 7 test suites (32 tests) passing

**Acceptance Criteria Verified:**
- AC-1: Admin login → redirect /admin (platformRole in JWT payload)
- AC-2: `adminBusinesses` query → 403 for non-admin
- AC-3: Inactivate business → modal + mutation + status change
- AC-4: Inactive business member → BusinessInactivePage rendered
- AC-5: Multi-biz user — active biz accessible, inactive biz → closed page
- AC-6: Admin disable self → 400 "Cannot disable yourself"
- AC-7: Disabled user login → 401 "Account disabled"
- AC-8: `promoteUserToAdmin` not in schema (out of scope v1)
- AC-9: Migrations idempotent — all existing biz status='active', users platform_role=null, is_disabled=false

**Out of scope (deferred v2):**
- Multi-admin UI (promote/demote)
- Email notification on inactivate
- WebSocket realtime kick on inactivation
- BusinessActiveGuard on BE business mutations
- System settings UI

---

## Phase 3: Chart Display & Data Selector

**Status:** PENDING | **Estimated Duration:** 6 weeks | **Start:** ~2026-06-03

**Features:**
- Click widget → Settings + Chart modal opens
- Settings panel: choose chart type (Line, Bar, Pie, Area)
- Data Selector: pick series from imported DataSheet
- Chart Panel: renders Chart.js live
- Chart config saved to widget
- Export dashboard as PNG/PDF
- Datasheet editor (view, edit, delete series)

**Components to Build:**
- SettingsPanel component (chart type selector)
- ChartPanel component (Chart.js renderer)
- DataSelector modal (searchable series list)
- ExportCanvas service (html2canvas + PDFKit)

**Acceptance Criteria:**
- [ ] Widget click → modal opens with live chart
- [ ] Change chart type → Chart.js re-renders
- [ ] Select series in DataSelector → chart data updates
- [ ] Modify chart title/legend → persists to DB
- [ ] Export canvas → PNG/PDF valid file downloaded
- [ ] Datasheet editor: add/edit/delete series works

---

## Phase 4: Notifications & Audit Logging

**Status:** PENDING | **Estimated Duration:** 4 weeks | **Start:** ~2026-07-01

**Features:**
- In-app notifications (invite accepted, user joined, widget shared)
- Email notifications (configurable per user)
- Audit log: track all mutations (create/update/delete widget, invite, role change)
- Audit dashboard: filter logs by action, user, date range
- Retention: 30 days logs in-DB, 1 year in S3 archive

**Database Entities:**
- Notification (id, userId, type, message, readAt, createdAt)
- AuditLog (id, businessId, userId, action, entity, oldValue, newValue, timestamp)

**Acceptance Criteria:**
- [ ] Business action → audit log entry created
- [ ] Email notification queue → SendGrid sending
- [ ] Notification bell icon shows unread count
- [ ] Audit filter works (user, action, date range)
- [ ] Logs archive to S3 after 30 days (job scheduled)

---

## Phase 5: Desktop (Electron) & Offline Sync

**Status:** PENDING | **Estimated Duration:** 10 weeks | **Start:** ~2026-08-12

**Features:**
- Electron app scaffold (main + renderer)
- Embed NestJS API in main process (SQLite local DB)
- IPC bridge: renderer ↔ main process
- Offline mode: all features work without network
- Sync on reconnect: SQLite diff → PostgreSQL
- Auto-update: Check new version, download, restart
- Native window menu, system tray
- Packaged releases (.exe, .dmg, .AppImage)

**Architecture:**
- Main process: NestJS server, SQLite TypeORM
- Renderer: React app (same as web, imports from libs/ui)
- IPC: @electron/remote for safe API access
- Sync worker: BullMQ sync job triggered on network change

**Acceptance Criteria:**
- [ ] Electron app builds & runs on Windows, macOS, Linux
- [ ] Offline: Create widget, import Excel, drag, save (SQLite)
- [ ] Go online → Sync job compares SQLite vs PostgreSQL
- [ ] Sync resolves conflicts (last-write-wins on updated_at)
- [ ] Auto-update check, download, restart works
- [ ] Release .exe, .dmg, .AppImage on GitHub Releases

---

## Phase 6: Enhancements & Polish (Future)

**Deferred features (roadmap TBD):**
- Real-time collaboration (Yjs/CRDT for concurrent editing)
- Mobile app (React Native)
- Custom chart plugin API
- Data transformation (pivot tables, aggregations)
- Scheduled exports (daily/weekly reports via email)
- API public access (read-only JSON endpoints)
- SSO (SAML, OAuth2 provider)
- White-label (custom domain, branding)

---

## Milestone Summary

| Milestone | Target Date | Status | Key Deliverable |
|-----------|------------|--------|-----------------|
| Phase 1 Complete | 2026-03-22 | ✅ DONE | Scaffold repo ready |
| Phase 2A Auth | 2026-03-22 | ✅ COMPLETE | Login/signup/OAuth, 80+ tests |
| Phase 2B Business | 2026-03-22 | ✅ COMPLETE | Multi-tenant, roles, invites, 78+ tests |
| Phase 2C Tabs | 2026-03-28 | ✅ COMPLETE | Tab CRUD, colors, icons, pinning |
| Phase 2D Canvas | 2026-03-28 | ✅ COMPLETE | Drag/resize, snap grid, collision, 20+ tests |
| Phase 2E Data Import | 2026-03-28 | ✅ COMPLETE | Excel import, BullMQ, 15+ tests |
| Phase 2F Profile | 2026-04-27 | ✅ COMPLETE | /profile route, avatar upload, sessions, ProfileForm |
| Phase 2 Complete | 2026-04-27 | ✅ DONE | Full user profile + widget flow, 250+ tests total |
| Personnel Mgmt | 2026-06-21 | ✅ DONE | Account lifecycle, /members page, staff creation |
| Phase 3 Export | 2026-07-29 | NEXT | PNG/PDF download, chart display |
| Phase 4 Complete | 2026-08-26 | PENDING | Audit logs, notifications |
| Phase 5 Desktop | 2026-10-28 | PENDING | Electron .exe release |

---

## Success Metrics by Phase

**Phase 2:** User can register → create business → invite team → create tab → add widget → import Excel → configure chart → save. Duration: < 5 minutes.

**Phase 3:** User can export dashboard as PNG. 100+ row Excel imports complete < 10 seconds.

**Phase 4:** Audit logs track 100% of mutations. Email notifications deliver within 5 seconds.

**Phase 5:** Desktop app works offline. Sync completes within 30 seconds of reconnection.

**Overall:** 50+ active SME tenants by end of Year 1. 95% uptime. NPS > 40.

---

---

## Test Coverage Summary (Phase 2A-2F Complete)

**Total Tests Passing:** 250+ | **Test Suites:** 33 | **Failures:** 0

- Auth module: 80+ tests ✅
- Business module: 78+ tests ✅
- Tab module: 15+ tests ✅
- Widget module: 20+ tests ✅
- DataSheet module: 15+ tests ✅
- Profile module: 13+ tests ✅
- Other: 29+ tests ✅
- Overall: 250+ tests passing, 0 failures

---

**Document Version:** 2.6 | **Last Updated:** 2026-06-21 | **Product Manager:** Tech Lead
