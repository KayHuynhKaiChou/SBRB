# SBRB Codebase Summary

**Generated:** 2026-04-29 | **Repomix Output:** `./repomix-output.xml` | **Phase Status:** Phase 1-2F ✅ Complete + Platform Admin Role ✅ Complete

---

## Codebase Overview

SBRB is a NX monorepo containing a modern full-stack dashboard builder. All Phase 2 (MVP) phases complete: Auth, Business, Tabs, Canvas & DnD, Data Import/Excel, User Profile. Platform Admin Role (v1) also complete.

### Implementation Status (Authoritative: 2026-04-27)
- **Phase 1 (Scaffold):** ✅ COMPLETE
- **Phase 2A (Auth):** ✅ COMPLETE — 80+ tests passing, JWT+OAuth+email verify fully implemented
- **Phase 2B (Business):** ✅ COMPLETE — 78+ tests passing, multi-tenant with roles + invites fully implemented
- **Phase 2C (Tabs):** ✅ COMPLETE — Tab CRUD, reorder, duplicate, colors, icons, pinning implemented
- **Phase 2D (Canvas & DnD):** ✅ COMPLETE — Canvas 3200×4800px, widget drag/resize, snap grid, collision detection
- **Phase 2E (Data Import):** ✅ COMPLETE — DataSheet CRUD, Excel import via BullMQ, data series management
- **Phase 2F (Profile):** ✅ COMPLETE — /profile route, avatar upload, change password, sessions, ProfileForm component

### Repository Statistics
- **Total Files:** 440+ (including config, tests)
- **Source Files:** 268 TS/TSX files (apps/ + libs/ code)
- **Core Monorepo:** 4 apps (web, api, worker, desktop) + 5 lib packages
- **Test Count:** 250+ tests, 33 test suites, all passing, 0 failures
- **Implemented Modules:** 10 (auth, user, business, tab, widget, datasheet, profile, audit, mail, minio)
- **Lines of Code:** ~18,500 total

---

## Directory Structure

### Applications (apps/)

#### `apps/web/` — ReactJS 18 Frontend
**Purpose:** User-facing dashboard builder web application.

**Key Directories:**
```
apps/web/
├── src/
│   ├── app/                    # Main App component
│   ├── components/             # React components
│   │   ├── FormModal           # Reusable form modal wrapper
│   │   ├── ModalActions        # DRY footer component (save/cancel)
│   │   ├── IconButton          # Ghost-variant icon buttons (uniform)
│   │   ├── CanvasContainer     # 3200×4800px canvas, snap grid, zoom
│   │   ├── WidgetCard          # Draggable widget (react-rnd)
│   │   ├── ChartPanel          # Chart.js live rendering
│   │   ├── SettingsPanel       # Chart type, display settings
│   │   └── DataSelector        # Series picker modal
│   ├── pages/                  # Page-level (Login, Dashboard, DataSheets)
│   ├── stores/                 # Zustand (canvas.store, auth.store)
│   ├── hooks/                  # Custom hooks (useAuth, useCanvas, etc.)
│   ├── apollo/                 # Apollo Client, queries/mutations
│   ├── styles/                 # Tailwind CSS, variables
│   └── utils/                  # Utilities, formatters
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
└── package.json                # Dependencies
```

**Dependencies:**
- React 18.x, TypeScript 5.x, Vite 5.x
- Ant Design 5.x, Tailwind CSS 3.x
- Zustand 4.x (state management)
- Apollo Client 3.x (GraphQL)
- react-rnd 10.4+ (drag/resize)
- Chart.js 4.4+ (bar, line, area, doughnut)
- react-i18next 13.x (i18n)

**Key Features (Phase 2F Complete):**
- ✅ Canvas-based dashboard (3200×4800px, snap grid, zoom)
- ✅ Widget drag-and-drop with collision detection
- ✅ Chart configuration modal (Settings + Chart panels)
- ✅ Data selector for picking series from DataSheets
- ✅ Excel file upload & import
- ✅ User authentication (Email + OAuth)
- ✅ User profile page (/profile with avatar, personal info, membership, security)
- ✅ Multi-language support (vi, en)
- ✅ 4 chart types (Line, Bar, Area, Doughnut)

**Module Boundaries:**
- Depends on: `libs/shared/*`, `libs/ui`, `libs/i18n`
- Cannot depend on: `apps/api`, `apps/worker`

---

#### `apps/api/` — NestJS 10 Backend
**Purpose:** GraphQL + REST API server with PostgreSQL database.

**Key Directories:**
```
apps/api/
├── src/
│   ├── app/
│   │   ├── app.module.ts       # Root module
│   │   └── config/             # Database, app configuration
│   ├── main.ts                 # Entry point (port 4000)
│   ├── common/
│   │   ├── constants/          # Queue, status constants
│   │   ├── guards/             # Auth, role, business guards
│   │   └── decorators/         # @CurrentUser(), @Roles()
│   └── modules/                # Feature modules (10 implemented)
│       ├── auth/               # ✅ Authentication (JWT + OAuth)
│       ├── business/           # ✅ Business CRUD, multi-tenancy
│       ├── user/               # ✅ User management
│       ├── profile/            # ✅ User profile, avatar upload, sessions
│       ├── tab/                # ✅ Tab CRUD, reorder
│       ├── widget/             # ✅ Widget CRUD, position, config
│       ├── datasheet/          # ✅ Data import (Excel), storage
│       ├── notification/       # 🔲 Scaffolded (Phase 4)
│       ├── audit/              # ✅ Audit logging
│       ├── admin/              # ✅ Platform Admin: business mgmt, user mgmt, metrics, audit log (guarded by PlatformAdminGuard)
│       └── mail/               # ✅ Email service (Gmail)
├── jest.config.ts              # Jest test configuration
└── package.json                # Dependencies
```

**Dependencies:**
- NestJS 10.x, TypeScript 5.x
- @nestjs/graphql, Apollo Server 4.x
- TypeORM 0.3+ (PostgreSQL)
- Passport.js (JWT + Google OAuth)
- BullMQ 5.x (job queue)
- Multer (file upload)
- ExcelJS (Excel parsing)
- Redis (cache, pub/sub)
- Sentry (error tracking)

**API Design:**
- **GraphQL:** Queries (widgets, datasheets), Mutations (create/update), Subscriptions (import progress)
- **REST:** POST /files/import, PATCH /widgets/:id/position, GET /files/export/:id, POST /auth/google/callback

**Database (TypeORM + PostgreSQL):**
- User (id, email, passwordHash, businessRoles, platform_role, is_disabled, disabled_at)
- Business (id, name, ownerId, status, inactivated_at, inactivated_by, inactive_reason)
- UserRole (userId, businessId, role) — junction table, 4 roles (owner/manager/staff/viewer)
- Tab (id, businessId, name, order, widgets)
- Widget (id, tabId, x, y, w, h, chartConfig JSON)
- DataSheet (id, businessId, fileName, dataSeries)
- DataSeries (id, dataSheetId, name, dataValues JSON)
- Audit (id, businessId, userId, action, entity, oldValue, newValue, timestamp)
- Notification (id, userId, type, message, readAt)

**Module Boundaries:**
- Depends on: `libs/shared/*`, @nestjs/*, TypeORM, Passport
- Cannot depend on: `apps/web`, `apps/worker` (React code)

---

## Platform Admin Role (v1) ✅ Complete

See full spec: [docs/admin-srs.md](./admin-srs.md) | Plan: `plans/260428-2028-admin-role/`

### Backend (`apps/api/src/modules/admin/`)

Single platform role `admin` (stored as `users.platform_role = 'admin'`). Manual seed via SQL: `UPDATE users SET platform_role='admin' WHERE email='...'`. No UI-based promote/demote in v1.

**Guards:**
- `PlatformAdminGuard` (`apps/api/src/common/guards/platform-admin.guard.ts`) — checks JWT payload `platformRole === 'admin'`, throws 403 otherwise. Applied to all admin resolvers.

**Resolvers:**
- `AdminBusinessResolver` — `adminBusinesses`, `inactivateBusiness`, `reactivateBusiness`
- `AdminUserResolver` — `adminUsers`, `adminUserDetail`, `disableUser`, `enableUser`
- `AdminPlatformResolver` — `adminMetrics`, `adminAuditLog`

**Services:**
- `AdminBusinessService` — list/inactivate/reactivate with audit logging
- `AdminUserService` — list/disable/enable/getUserDetail with session revocation
- `AdminMetricsService` — 6 aggregate counters in parallel via Promise.all
- `AdminAuditService` — paginated audit log with actor email join

**Migrations (in order):**
1. `1777500000000-AddUserPlatformRole` — `platform_role` varchar(20) nullable
2. `1777500001000-AddBusinessStatus` — `status` default 'active', `inactivated_at/by/reason`
3. `1777500002000-AddUserDisabled` — `is_disabled` default false, `disabled_at`

### Frontend (`apps/web/src/`)

**Routes (`/admin/*`):** All wrapped in `<AdminRoute>` (checks `user.platformRole === 'admin'`).
- `/admin` → `AdminDashboardPage` (6 stat cards)
- `/admin/businesses` → `AdminBusinessesPage` (table, inactivate modal)
- `/admin/users` → `AdminUsersPage` (table, user detail drawer)
- `/admin/audit` → `AdminAuditLogPage` (paginated audit log)

**Components:**
- `apps/web/src/components/layout/admin-sidebar.tsx` — icon sidebar dispatched by Sidebar orchestrator when `user.platformRole === 'admin'`
- `apps/web/src/components/layout/admin-layout.tsx` — AdminSidebar + content area
- `apps/web/src/components/auth/admin-route.tsx` — route guard for /admin/* 
- `apps/web/src/components/auth/business-guard.tsx` — checks business status; renders `<BusinessInactivePage>` when `status === 'inactive'`
- `apps/web/src/pages/admin/components/` — AdminBusinessesTable, AdminUsersTable, UserDetailDrawer, InactivateBusinessModal, BusinessStatusTag
- `apps/web/src/pages/business-inactive/` — BusinessInactivePage, InactiveBanner, InactiveActions

**i18n:** Namespace `admin` (en + vi) in `libs/i18n/src/locales/{en,vi}/admin.json`. All admin page text uses `t('admin:...')`. See `docs/admin-srs.md §FR-6`.

---

#### `apps/worker/` — BullMQ Worker
**Purpose:** Background job processing (Excel import, BullMQ queues).

**Key Directories:**
```
apps/worker/
├── src/
│   ├── main.ts                 # Entry point (queue listeners)
│   └── processors/             # Job handlers
│       ├── import-excel.processor.ts
│       ├── notification.processor.ts
│       ├── alert-check.processor.ts
│       └── desktop-sync.processor.ts
└── package.json                # Dependencies
```

**Dependencies:**
- NestJS 10.x, TypeScript 5.x
- BullMQ 5.x (job queue)
- ExcelJS 4.x (Excel parsing)
- TypeORM (PostgreSQL access)
- Redis (queue backend)

**Jobs Handled:**
- ✅ `importExcel`: Parse Excel (matrix format), validate, insert DataSeries + DataValues, emit completion
- ✅ `notification`: Send notifications (in-app + email)
- 🔲 `alertCheck`: Monitor alert thresholds (Phase 4)
- 🔲 `desktopSync`: Compare local SQLite with cloud PostgreSQL (Phase 5)

**Module Boundaries:**
- Depends on: `libs/shared/*`, @nestjs/*, BullMQ
- Cannot depend on: `apps/web`

---

### Shared Libraries (libs/)

#### `libs/shared/types/`
**Purpose:** Shared TypeScript interfaces and DTOs for consistent type definitions across web and API.

**Key Types:**
```typescript
// Widget positioning
interface WidgetPosition {
  x: number;  // Pixel coordinate
  y: number;
  w: number;  // Width
  h: number;  // Height
}

// Chart configuration
interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  seriesIds: string[];
  palette: string[];
  legendPosition: 'top' | 'bottom' | 'right';
}

// Data series
interface DataSeriesDto {
  id: string;
  name: string;
  values: Record<string, number>;  // { "2026-01": 1000, ... }
}

// User & Auth
interface UserPayload {
  userId: string;
  businessId: string;
  role: 'owner' | 'manager' | 'staff' | 'viewer';
  email: string;
}

// Business & multi-tenancy
interface BusinessDto {
  id: string;
  name: string;
  ownerId: string;
  members: UserRoleDto[];
}
```

**File Naming:** `*.ts` for exports, `*.dto.ts` for data transfer objects

---

#### `libs/shared/constants/`
**Purpose:** Shared constant values for configuration, colors, and limits.

**Key Constants:**
```typescript
// Canvas configuration
export const CANVAS_WIDTH = 3200;
export const CANVAS_HEIGHT = 4800;
export const SNAP_GRID = 20;  // pixels

// Widget constraints
export const MIN_WIDGET_WIDTH = 800;
export const MAX_WIDGET_WIDTH = 1600;
export const MIN_WIDGET_HEIGHT = 400;
export const MAX_WIDGET_HEIGHT = 800;
export const MAX_WIDGETS_PER_TAB = 50;

// Chart colors
export const CHART_COLORS = {
  primary: ['#D72A44', '#3498DB', '#27AE60', '#F39C12', '#9B59B6'],
  // ...
};

// Chart types
export const CHART_TYPES = ['line', 'bar', 'pie', 'area'];

// File upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB
```

**Import Usage:** Both web and API import these constants to avoid duplication.

---

#### `libs/shared/utils/`
**Purpose:** Reusable pure functions used by both frontend (client-side) and backend (server-side).

**Key Utilities:**

1. **Collision Detection** (`collision-detection.ts`)
   ```typescript
   export function hasCollision(a: BBox, b: BBox): boolean {
     return a.x < b.x + b.w && a.x + a.w > b.x &&
            a.y < b.y + b.h && a.y + a.h > b.y;
   }

   export function findCollisions(widget: BBox, others: BBox[]): BBox[] {
     return others.filter(other => hasCollision(widget, other));
   }
   ```
   - Used by: Zustand store (web, realtime), NestJS guard (API, validation)
   - No dependencies (pure functions)
   - 100% test coverage required

2. **Snap to Grid** (`snap-grid.ts`)
   ```typescript
   export function snapToGrid(value: number, gridSize: number): number {
     return Math.round(value / gridSize) * gridSize;
   }

   export function snapPosition(pos: WidgetPosition, gridSize: number): WidgetPosition {
     return {
       x: snapToGrid(pos.x, gridSize),
       y: snapToGrid(pos.y, gridSize),
       w: pos.w,  // Width/height not snapped
       h: pos.h,
     };
   }
   ```
   - Used by: Both web and API
   - Configurable grid size (default 20px)

3. **Validators** (`validators/`)
   - `validate-bbox.ts` — Check position within canvas bounds
   - `validate-file-type.ts` — Excel/CSV MIME type check
   - `validate-excel-format.ts` — Matrix structure validation

**Testing:** Each utility has Jest tests in `*.spec.ts` files. 80%+ coverage requirement.

---

#### `libs/ui/`
**Purpose:** Shared React components used by web and desktop apps.

**Key Components:**
```
libs/ui/
├── components/
│   ├── button.tsx           # Primary/secondary/tertiary buttons
│   ├── input.tsx            # Text input with validation states
│   ├── modal.tsx            # Dialog wrapper (2-column layout)
│   ├── tab-bar.tsx          # Tab navigation
│   ├── tooltip.tsx          # Hover tooltips
│   ├── loading-spinner.tsx  # Loading indicator
│   ├── toast.tsx            # Success/error/warning notifications
│   ├── IconButton.tsx       # ✅ Ghost-variant icon buttons (NEW)
│   ├── ModalActions.tsx     # ✅ DRY footer (save/cancel actions) (NEW)
│   ├── FormModal.tsx        # ✅ Ant Modal + Form wrapper (NEW)
│   └── ProfileForm.tsx      # ✅ Reusable profile form (avatar, fullName, phone, language, bio, departmentId) (NEW)
├── hooks/
│   └── use-toast.ts         # Toast notifications hook
└── index.ts                 # Barrel export
```

**New UI Patterns (Phase 2C-2F):**
1. **IconButton:** Ghost variant (Ant Button type="text", shape="circle"), brand colors, 3 sizes (32/40/48px)
2. **ModalActions:** Array of {icon, tooltip, onClick, disabled} footer; save first, close last
3. **FormModal:** Generic Ant Modal + Form wrapper with ModalActions footer, closable={false}
4. **ProfileForm:** Reusable form component for user profile (no useState, uses Form context), handles avatar upload inline with Supabase signed URLs, designed for reuse in member detail pages

**Design System:**
- Colors: Imported from `@sbrb/shared/constants`
- Styling: Ant Design 5 + Tailwind CSS overrides
- Typography: Inter font stack
- Button height: 40px (primary), 32/40/48px (IconButton)
- Input height: 36px

**Dependencies:**
- React 18, TypeScript, Ant Design 5, Tailwind CSS
- Cannot depend on: apps/api, Zustand, Apollo (app-specific state)

---

#### `libs/i18n/`
**Purpose:** Internationalization setup and translations.

**Structure:**
```
libs/i18n/
├── config/
│   └── i18n.config.ts       # i18next initialization
├── locales/
│   ├── en/
│   │   ├── auth.json
│   │   ├── canvas.json
│   │   └── common.json
│   └── vi/
│       └── (same structure)
└── hooks/
    └── use-translation.ts    # Wrapper hook
```

**Supported Languages:** Vietnamese (vi, default), English (en)

**Namespaces:** auth, canvas, widget, datasheet, profile, notification, common

**Usage:**
```typescript
import { useTranslation } from '@sbrb/i18n';

function MyComponent() {
  const { t } = useTranslation('canvas');
  return <h1>{t('dragToDrop')}</h1>;
}
```

---

## Core Modules Breakdown

The per-module backend inventory (key files, responsibilities, entities, guards) for Auth, User, Business, Tab, Widget, DataSheet, Audit, Profile, Mail, Notification, and MinIO has moved to its own companion reference:

➡️ See **[codebase-modules.md](./codebase-modules.md)** for the full module breakdown.

The **Platform Admin module** is documented above in [Platform Admin Role (v1)](#platform-admin-role-v1--complete).

---

## Configuration Files

### `nx.json`
**NX Monorepo Configuration**
- Workspace layout: apps/, libs/
- Plugin configuration (@nx/react, @nx/nest, @nx/node)
- Task definitions (build, test, lint, serve)
- Module boundary enforcement

### `tsconfig.base.json`
**Root TypeScript Configuration**
- Strict mode enabled globally
- Path aliases:
  - `@sbrb/shared/types` → `libs/shared/types`
  - `@sbrb/shared/constants` → `libs/shared/constants`
  - `@sbrb/shared/utils` → `libs/shared/utils`
  - `@sbrb/ui` → `libs/ui`
  - `@sbrb/i18n` → `libs/i18n`

### `package.json` (Root)
**NX Monorepo Root**
- Workspace: apps/*, libs/*
- Scripts: dev:web, dev:api, dev:worker, build:all, test, lint
- DevDeps: @nx/*, TypeScript, ESLint, Prettier, Jest

### `docker-compose.yml`
**Local Development Stack**
- PostgreSQL 15 (database)
- Redis 7 (cache, pub/sub)
- MinIO (S3-compatible storage)
- Seed scripts for initial data

### `.env.example`
**Environment Variables Template**
```
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
MINIO_ENDPOINT=localhost
```

---

## Development Workflow

### Phase 2A (Auth) — ✅ COMPLETE (2026-03-22)

**Status:** ✅ All features implemented, 80+ tests passing.

**Implemented Files:**
- `apps/api/modules/auth/` — All Passport strategies, guards, services
- `apps/api/modules/user/` — User CRUD
- `libs/shared/types/auth.dto.ts` — Auth DTOs
- Tests: 80+ passing

### Phase 2B (Business & Multi-Tenancy) — ✅ COMPLETE (2026-03-22)

**Status:** ✅ All features implemented, 78+ tests passing.

**Implemented Files:**
- `apps/api/modules/business/` — Business CRUD complete
- `apps/api/modules/user/` — User management complete
- `libs/shared/types/business.dto.ts` — Business DTOs
- Tests: 78+ passing

### Phase 2C (Tabs) — ✅ COMPLETE (2026-03-28)

**Status:** ✅ All features implemented, Tab CRUD, reorder, duplicate, colors, icons, pinning.

**Implemented Files:**
- `apps/api/modules/tab/` — Tab CRUD services & resolvers
- `apps/web/src/components/tab-bar.tsx` — Tab navigation UI
- `apps/web/src/stores/tab.store.ts` — Tab state management
- Tests: 15+ passing

### Phase 2D (Canvas & Widgets) — ✅ COMPLETE (2026-03-28)

**Status:** ✅ All features implemented, Canvas 3200×4800px, drag/resize, snap grid, collision detection.

**Implemented Files:**
- `apps/web/src/stores/canvas.store.ts` — Zustand canvas state
- `apps/web/src/components/widget-card.tsx` — Widget component with react-rnd
- `apps/web/src/components/canvas-container.tsx` — Canvas viewport, zoom, snap grid
- `apps/api/modules/widget/` — Widget API (CRUD + position validation)
- `libs/shared/utils/collision-detection.ts` — AABB collision detection
- Tests: 20+ passing

### Phase 2E (Data Import) — ✅ COMPLETE (2026-03-28)

**Status:** ✅ All features implemented, Excel import via BullMQ worker, data series management.

**Implemented Files:**
- `apps/web/src/pages/DataSheets.tsx` — Data sheet management
- `apps/web/src/components/data-selector.tsx` — Series picker modal
- `apps/api/modules/datasheet/` — DataSheet CRUD
- `apps/worker/processors/import-excel.processor.ts` — BullMQ worker (ExcelJS)
- Tests: 15+ passing

### Phase 2F (User Profile) — ✅ COMPLETE (2026-04-27)

**Status:** ✅ All features implemented, /profile route, avatar upload, change password, sessions.

**Implemented Files:**
- `apps/web/src/pages/Profile.tsx` — Profile page with 4 section cards
- `libs/ui/components/ProfileForm.tsx` — Reusable profile form (avatar, fullName, phone, language, bio, departmentId)
- `apps/api/modules/profile/` — Profile CRUD, avatar URLs, sessions, password change
- `apps/api/modules/profile/avatar-storage.service.ts` — Supabase Storage signed URLs
- `apps/web/src/graphql/profile.operations.ts` — 10 GraphQL operations
- Migration: `AddProfileFields` (users table: bio + departmentId)
- i18n namespace: `profile` (vi + en)
- Tests: 13+ passing

---

## Testing Strategy

### Current Test Coverage (Phase 2A-2F Complete)

| Module | Framework | Tests | Status |
|--------|-----------|-------|--------|
| Auth | Jest + db | 80+ | ✅ All passing |
| Business | Jest + db | 78+ | ✅ All passing |
| Tab | Jest + db | 15+ | ✅ All passing |
| Widget | Jest + db | 20+ | ✅ All passing |
| DataSheet | Jest + db | 15+ | ✅ All passing |
| Profile | Jest + db | 13+ | ✅ All passing |
| Other | Jest | 29+ | ✅ All passing |
| **TOTAL** | Jest | **250+** | **✅ 33 suites, 0 failures** |

### Target Coverage by Phase

| Layer | Framework | Coverage Target | Key Files |
|-------|-----------|-----------------|-----------|
| Shared Utils | Jest | 100% | `libs/shared/utils/**/*.spec.ts` |
| API Resolvers | Jest + db | 80% | `apps/api/**/*.spec.ts` |
| React Components | Jest + RTL | 70% | `apps/web/**/*.spec.tsx` |
| E2E | Playwright | 50% | `e2e/tests/**/*.spec.ts` |

**Run Tests:**
```bash
npm run test                  # All tests (currently 202 passing)
nx test api                   # API tests only
nx test shared/utils          # Shared utils tests
```

---

## Dependency Graph (NX)

```
apps/web
  ├─ libs/shared/types      ✓
  ├─ libs/shared/constants  ✓
  ├─ libs/shared/utils      ✓
  ├─ libs/ui                ✓
  ├─ libs/i18n              ✓
  └─ apps/api               ✗ (violation)

apps/api
  ├─ libs/shared/types      ✓
  ├─ libs/shared/constants  ✓
  ├─ libs/shared/utils      ✓
  ├─ @nestjs/*              ✓
  ├─ TypeORM                ✓
  └─ apps/web               ✗ (violation)

apps/worker
  ├─ libs/shared/types      ✓
  ├─ libs/shared/utils      ✓
  ├─ BullMQ                 ✓
  └─ apps/web               ✗ (violation)

libs/ui
  ├─ libs/shared/constants  ✓
  ├─ Ant Design, Tailwind   ✓
  └─ Zustand (app state)    ✗ (violation)
```

---

## Key Metrics

| Metric | Target | Status |
|--------|--------|--------|
| TypeScript Strict Coverage | 100% | On track |
| Jest Test Coverage (utils) | 100% | Phase 2 |
| Jest Test Coverage (modules) | 80%+ | Phase 2+ |
| File Size Limit (200 LOC) | Enforced | Phase 2+ |
| API Response Time | <200ms p95 | Phase 3+ |
| Widget Render FPS | 60 FPS | Phase 2 validation |
| Canvas Capacity | 50 widgets | Phase 2+ testing |

---

---

## Implementation Timeline

- **Phase 1:** ✅ COMPLETE (2026-03-22) — NX scaffold, project setup, CI/CD skeleton
- **Phase 2A:** ✅ COMPLETE (2026-03-22) — Auth (JWT + OAuth + email verification), 80+ tests
- **Phase 2B:** ✅ COMPLETE (2026-03-22) — Business & multi-tenancy (roles + invites), 78+ tests
- **Phase 2C:** ✅ COMPLETE (2026-03-28) — Tab management (CRUD, reorder, colors, icons, pinning)
- **Phase 2D:** ✅ COMPLETE (2026-03-28) — Canvas & widget drag+drop (collision detection, snap grid)
- **Phase 2E:** ✅ COMPLETE (2026-03-28) — Data import (Excel parsing, BullMQ job processing)
- **Phase 3:** NEXT UP — Chart display & export (PNG/PDF)

---

**Document Version:** 2.4 | **Last Updated:** 2026-03-28
**Test Count:** 237 tests, 32 test suites, all passing, 0 failures
**Maintainer:** Documentation Team
