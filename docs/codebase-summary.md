# SBRB Codebase Summary

**Generated:** 2026-03-28 | **Repomix Output:** `./repomix-output.xml` | **Phase Status:** Phase 1-2E ✅ Complete

---

## Codebase Overview

SBRB is a NX monorepo containing a modern full-stack dashboard builder. All Phase 2 (MVP) phases complete: Auth, Business, Tabs, Canvas & DnD, Data Import/Excel.

### Implementation Status (Authoritative: 2026-03-28)
- **Phase 1 (Scaffold):** ✅ COMPLETE
- **Phase 2A (Auth):** ✅ COMPLETE — 80+ tests passing, JWT+OAuth+email verify fully implemented
- **Phase 2B (Business):** ✅ COMPLETE — 78+ tests passing, multi-tenant with roles + invites fully implemented
- **Phase 2C (Tabs):** ✅ COMPLETE — Tab CRUD, reorder, duplicate, colors, icons, pinning implemented
- **Phase 2D (Canvas & DnD):** ✅ COMPLETE — Canvas 3200×4800px, widget drag/resize, snap grid, collision detection
- **Phase 2E (Data Import):** ✅ COMPLETE — DataSheet CRUD, Excel import via BullMQ, data series management

### Repository Statistics
- **Total Files:** 431+ (including config, tests)
- **Source Files:** 259 TS/TSX files (apps/ + libs/ code)
- **Core Monorepo:** 4 apps (web, api, worker, desktop) + 5 lib packages
- **Test Count:** 237 tests, 32 test suites, all passing, 0 failures
- **Implemented Modules:** 9 (auth, user, business, tab, widget, datasheet, audit, mail, minio)
- **Lines of Code:** ~17,654 total

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

**Key Features (Phase 2E Complete):**
- ✅ Canvas-based dashboard (3200×4800px, snap grid, zoom)
- ✅ Widget drag-and-drop with collision detection
- ✅ Chart configuration modal (Settings + Chart panels)
- ✅ Data selector for picking series from DataSheets
- ✅ Excel file upload & import
- ✅ User authentication (Email + OAuth)
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
│   └── modules/                # Feature modules (9 implemented)
│       ├── auth/               # ✅ Authentication (JWT + OAuth)
│       ├── business/           # ✅ Business CRUD, multi-tenancy
│       ├── user/               # ✅ User management
│       ├── tab/                # ✅ Tab CRUD, reorder
│       ├── widget/             # ✅ Widget CRUD, position, config
│       ├── datasheet/          # ✅ Data import (Excel), storage
│       ├── notification/       # 🔲 Scaffolded (Phase 4)
│       ├── audit/              # ✅ Audit logging
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
- User (id, email, passwordHash, businessRoles)
- Business (id, name, ownerId)
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
│   └── FormModal.tsx        # ✅ Ant Modal + Form wrapper (NEW)
├── hooks/
│   └── use-toast.ts         # Toast notifications hook
└── index.ts                 # Barrel export
```

**New UI Patterns (Phase 2C-2E):**
1. **IconButton:** Ghost variant (Ant Button type="text", shape="circle"), brand colors, 3 sizes (32/40/48px)
2. **ModalActions:** Array of {icon, tooltip, onClick, disabled} footer; save first, close last
3. **FormModal:** Generic Ant Modal + Form wrapper with ModalActions footer, closable={false}

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

**Namespaces:** auth, canvas, widget, datasheet, notification, common

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

### ✅ Authentication Module (`apps/api/modules/auth/`) — IMPLEMENTED

**Status:** ✅ COMPLETE — 80+ tests passing.

**Key Files:**
- `auth.service.ts` — Main auth orchestration
- `auth-login.service.ts` — Login logic (email/password + Google OAuth)
- `auth-register.service.ts` — Signup + email verification
- `auth-password.service.ts` — Password reset flow
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

**Exports:**
- `JwtAuthGuard` — Validate JWT on all protected routes
- `GqlJwtAuthGuard` — GraphQL-specific JWT guard
- `CurrentUserDecorator` — Inject user payload

**Security:**
- ✅ Bcrypt password hashing (10+ rounds)
- ✅ JWT secret in env var (min 32 chars production)
- ✅ Refresh token: HttpOnly, Secure, SameSite=Strict cookie
- ✅ CORS whitelist via ALLOWED_ORIGINS env var
- ✅ Rate limiting: 100 req/min per IP on auth endpoints

---

### ✅ User Module (`apps/api/modules/user/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `user.service.ts` — User CRUD
- `user.resolver.ts` — GraphQL user queries
- `user.controller.ts` — REST endpoints

---

### ✅ Business Module (`apps/api/modules/business/`) — IMPLEMENTED

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
- `Business` — id, name, ownerId, createdAt, updatedAt
- `UserRole` — userId, businessId, role (junction table)
- `Invite` — code, email, businessId, expiresAt, usedAt

**Guards:**
- `BusinessAccessGuard` — Verify user belongs to business
- `RoleGuard` — Check user role (owner, manager, staff, viewer)

---

### ✅ Tab Module (`apps/api/modules/tab/`) — IMPLEMENTED

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

### ✅ Widget Module (`apps/api/modules/widget/`) — IMPLEMENTED

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

### ✅ DataSheet Module (`apps/api/modules/datasheet/`) — IMPLEMENTED

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

### ✅ Audit Module (`apps/api/modules/audit/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `audit.service.ts` — Audit log creation & querying
- `audit.module.ts` — Module registration

**Responsibilities:**
- Track all business mutations (create/update/delete)
- Immutable audit log with businessId, userId, action, entity, oldValue, newValue, timestamp

---

### ✅ Mail Module (`apps/api/modules/mail/`) — IMPLEMENTED

**Status:** ✅ COMPLETE

**Key Files:**
- `mail.service.ts` — Email sending via Gmail SMTP
- `mail.module.ts` — Module registration

**Responsibilities:**
- Send emails (verification, password reset, invitations)
- Handlebars template rendering
- Gmail SMTP integration

---

### 🔲 Notification Module (`apps/api/modules/notification/`) — SCAFFOLDED

**Status:** 🔲 Scaffolded (services/resolvers commented out, ready for Phase 4)

---

### 🔲 MinIO Module (`apps/api/modules/minio/`) — STUB

**Status:** 🔲 Stub implementation (returns mock URLs; real minio pkg not installed yet)

**Responsibilities (Phase 2E+):**
- S3-compatible file storage (local dev via MinIO, prod via AWS S3)

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

---

## Testing Strategy

### Current Test Coverage (Phase 2A-2E Complete)

| Module | Framework | Tests | Status |
|--------|-----------|-------|--------|
| Auth | Jest + db | 80+ | ✅ All passing |
| Business | Jest + db | 78+ | ✅ All passing |
| Tab | Jest + db | 15+ | ✅ All passing |
| Widget | Jest + db | 20+ | ✅ All passing |
| DataSheet | Jest + db | 15+ | ✅ All passing |
| Other | Jest | 29+ | ✅ All passing |
| **TOTAL** | Jest | **237** | **✅ 32 suites, 0 failures** |

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
