# SBRB Development Roadmap

## Project Timeline & Phases

**Current Date:** 2026-03-22 | **Phase 1 Status:** COMPLETE | **Phase 2 Status:** IN PROGRESS

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

## Phase 2: MVP Authentication, Business, Canvas

**Status:** IN PROGRESS | **Estimated Duration:** 8 weeks | **End Date:** ~2026-05-18

**Priority:** P0 (must-have for demo)

### Phase 2A: Authentication & User Management (Week 1-2)

**Features:**
- User signup (email/password)
- Email verification flow (SendGrid)
- JWT login (15m access, 30d refresh HttpOnly)
- Google OAuth (email as unique constraint)
- Password reset email
- User profile page (edit name, email, language)
- Session management (logout clears refresh token cookie)

**Components to Build:**
- Auth module (NestJS guards, strategies)
- Auth UI (Login, Signup, Forgot Password screens)
- User service (create, verify, update)
- Auth interceptor (Apollo Client token refresh)

**Acceptance Criteria:**
- [ ] Email/password signup → verify email → login works
- [ ] Google OAuth → auto-create user if new → login
- [ ] Refresh token cookie HttpOnly, secure, sameSite=Strict
- [ ] Expired JWT → auto-refresh via refresh token
- [ ] Password reset email works end-to-end
- [ ] E2E test: Signup → verify → login flow

### Phase 2B: Business & Multi-Tenancy (Week 3-4)

**Features:**
- Create Business (Owner only)
- Invite users via email code (Owner/Manager)
- Role assignment (Owner, Manager, Staff, Viewer)
- Business settings page (name, logo, max tabs, max widgets/tab)
- Member list with role management
- Remove member from business

**Database Entities:**
- Business (id, name, ownerId, createdAt, updatedAt)
- UserRole (userId, businessId, role) — junction table
- Invite (code, email, businessId, expiresAt, usedAt)

**API Layer:**
- REST: POST /businesses, POST /invites
- GraphQL: Query businesses, mutation createBusiness
- Guards: Current user scoped to businessId only (RLS)

**Acceptance Criteria:**
- [ ] Owner creates business → appears in business list
- [ ] Owner invites email → email contains join link
- [ ] Invited user clicks link → joins business with role
- [ ] Staff cannot view other members' data (RLS enforced)
- [ ] Manager can invite/remove Staff (not other Managers)
- [ ] Viewer cannot create tabs or widgets

### Phase 2C: Tab Management (Week 5)

**Features:**
- Create Tab within Business
- Rename Tab
- Delete Tab
- Reorder tabs (drag handles)
- Duplicate Tab with widgets

**Database Entity:**
- Tab (id, businessId, name, order, createdAt)

**API Layer:**
- GraphQL: Query tabs(businessId), mutation createTab
- REST: PATCH /tabs/:id (reorder)

**Acceptance Criteria:**
- [ ] Owner creates tab → appears in tab bar
- [ ] Tab canvas renders (empty, 3200×4800px)
- [ ] Rename tab → persists to DB
- [ ] Delete tab → cascade delete widgets
- [ ] Reorder tabs via drag → persists order

### Phase 2D: Canvas & Widget Drag+Drop (Week 6-7)

**Features:**
- Add Widget to Tab (at default position: 0,0)
- Drag widget to new position (react-rnd)
- Resize widget (react-rnd with min size 800×400px, max 1600×800px)
- Snap to 20px grid on drag stop
- Collision detection (prevent overlap)
- Delete widget
- Widget position saved to DB (debounce 300ms)

**Shared Utils:**
- `hasCollision(bboxA, bboxB)` — AABB detection
- `snapToGrid(value, grid)` — Snap calculation
- `validateBBox(bbox, canvasBounds)` — Bounds check

**Frontend State (Zustand):**
- Widgets array with realtime position tracking
- Selected widget ID
- Canvas zoom level

**Acceptance Criteria:**
- [ ] Drag widget → position updates on canvas realtime
- [ ] Drag widget → collision? Revert to previous position
- [ ] Drag widget → release? Snap to grid, persist to DB
- [ ] Resize widget → min/max constraints enforced
- [ ] Collision detection has 100% test coverage
- [ ] Performance: 50 widgets on canvas, 60fps drag

### Phase 2E: Data Import (Excel/CSV) (Week 8)

**Features:**
- Upload Excel file (10MB limit)
- Parse matrix format: rows = data series, columns = time periods
- Store in DataSheet + DataSeries + DataValues tables
- Preview import mapping before confirm
- Background job processing (BullMQ worker)
- Progress toast (GraphQL Subscription)
- Validation: required columns, numeric values

**Worker Process:**
- ExcelJS parse file
- Validate format
- Insert to PostgreSQL (bulk insert)
- Emit completion event

**Acceptance Criteria:**
- [ ] Upload Excel → parse preview shows correct matrix
- [ ] Confirm import → BullMQ job created
- [ ] Worker processes → 100-series file < 10s
- [ ] Import complete → GraphQL Subscription fires "import:complete"
- [ ] Verify data in DataSeries table (SQL check)
- [ ] Error handling: Invalid format → error message in toast

---

## Phase 3: Chart Display & Data Selector

**Status:** PENDING | **Estimated Duration:** 6 weeks | **Start:** ~2026-05-19

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
| Phase 1 Complete | 2026-03-22 | ✓ DONE | Scaffold repo ready |
| Phase 2A Auth | 2026-04-05 | IN PROGRESS | Login/signup works |
| Phase 2B Business | 2026-04-19 | PENDING | Multi-tenant invites |
| Phase 2C Canvas MVP | 2026-05-03 | PENDING | Drag/drop working |
| Phase 2 Complete | 2026-05-18 | PENDING | Demo: full widget flow |
| Phase 3 Export | 2026-07-01 | PENDING | PNG/PDF download |
| Phase 4 Complete | 2026-08-12 | PENDING | Audit logs, notifications |
| Phase 5 Desktop | 2026-10-15 | PENDING | Electron .exe release |

---

## Success Metrics by Phase

**Phase 2:** User can register → create business → invite team → create tab → add widget → import Excel → configure chart → save. Duration: < 5 minutes.

**Phase 3:** User can export dashboard as PNG. 100+ row Excel imports complete < 10 seconds.

**Phase 4:** Audit logs track 100% of mutations. Email notifications deliver within 5 seconds.

**Phase 5:** Desktop app works offline. Sync completes within 30 seconds of reconnection.

**Overall:** 50+ active SME tenants by end of Year 1. 95% uptime. NPS > 40.

---

**Document Version:** 2.2 | **Last Updated:** 2026-03-22 | **Product Manager:** Tech Lead
