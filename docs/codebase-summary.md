# SBRB Codebase Summary

**Generated:** 2026-03-22 | **Repomix Output:** `./repomix-output.xml` (387 files, 481K tokens)

---

## Codebase Overview

SBRB is a NX monorepo containing a modern full-stack dashboard builder. Phase 1 (scaffolding) complete. Phase 2 (MVP authentication, canvas, widgets) in progress.

### Repository Statistics
- **Total Files:** 387 (including skills, config)
- **Source Files:** ~150 (apps/ + libs/ code)
- **Core Monorepo:** 3 apps + 4 lib packages
- **Total Tokens:** 481,796 (repomix full analysis)

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
│   ├── pages/                  # Page-level components (Login, Dashboard, etc.)
│   ├── stores/                 # Zustand state management
│   ├── hooks/                  # Custom React hooks
│   ├── apollo/                 # Apollo Client setup
│   ├── styles/                 # Global Tailwind CSS
│   └── utils/                  # Utilities (api calls, formatters)
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
└── package.json                # Dependencies
```

**Dependencies:**
- React 18.x, TypeScript 5.x
- Vite 5.x (build tool)
- Ant Design 5.x, Tailwind CSS 3.x
- Zustand (state management)
- Apollo Client 3.x (GraphQL)
- react-rnd (drag+drop canvas)
- Chart.js, react-i18next

**Key Features (MVP):**
- Canvas-based dashboard rendering
- Widget drag-and-drop (react-rnd)
- Chart configuration modal (Settings + Chart panels)
- Data selector for picking series
- Excel file upload
- User authentication
- Multi-language support (vi, en)

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
│   │   ├── guards/             # Auth, role guards
│   │   └── decorators/         # Custom decorators
│   └── modules/                # Feature modules
│       ├── auth/               # Authentication (JWT + OAuth)
│       ├── business/           # Business CRUD, multi-tenancy
│       ├── user/               # User management
│       ├── tab/                # Tab CRUD
│       ├── widget/             # Widget CRUD, position updates
│       ├── datasheet/          # Data import, storage
│       ├── notification/       # In-app & email notifications
│       └── audit/              # Audit logging (Phase 4)
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
**Purpose:** Background job processing (Excel import, sync tasks).

**Key Directories:**
```
apps/worker/
├── src/
│   ├── main.ts                 # Entry point (queue listener)
│   └── processors/             # Job handlers
│       ├── import-excel.processor.ts
│       └── sync.processor.ts
└── package.json                # Dependencies
```

**Dependencies:**
- NestJS 10.x
- BullMQ 5.x (job queue)
- ExcelJS 4.x (Excel parsing)
- TypeORM (PostgreSQL access)
- Redis (queue backend)

**Jobs Handled:**
- `importExcel`: Parse Excel file, validate, insert DataSeries + DataValues to PostgreSQL, emit completion event
- `syncOffline`: (Phase 5) Compare local SQLite with cloud PostgreSQL, resolve conflicts

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
│   └── toast.tsx            # Success/error/warning notifications
├── hooks/
│   └── use-toast.ts         # Toast notifications hook
└── index.ts                 # Barrel export
```

**Design System:**
- Colors: Imported from `@sbrb/shared/constants`
- Styling: Ant Design 5 + Tailwind CSS overrides
- Typography: Inter font stack
- Button height: 40px (primary)
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

### Authentication Module (`apps/api/modules/auth/`)

**Responsibilities:**
- JWT token generation (15m access, 30d refresh)
- Passport strategies (local, Google OAuth)
- Email verification
- Password reset
- HttpOnly refresh token cookie

**Exports:**
- JwtAuthGuard — Validate JWT on all protected routes
- CurrentUserDecorator — Inject user payload into resolvers/controllers

**Security:**
- Bcrypt password hashing
- JWT secret in env var
- Refresh token in HttpOnly, Secure, SameSite=Strict cookie
- CSRF protection via CORS

---

### Business Module (`apps/api/modules/business/`)

**Responsibilities:**
- Create business (Owner only)
- Invite users via email code
- Manage business members (add/remove, role assignment)
- Business settings (name, logo, max tabs)
- Row-level security (RLS) — filter data by businessId

**Entities:**
- Business
- UserRole (junction: User ↔ Business)
- Invite (email invitations)

**Guards:**
- BusinessAccessGuard — Verify user belongs to business
- RoleGuard — Check user role (owner, manager, staff, viewer)

---

### Widget Module (`apps/api/modules/widget/`)

**Responsibilities:**
- CRUD widgets (create, read, update, delete)
- Validate position (bounds, collision, snap grid)
- Update position (debounced REST endpoint)
- Validate chart config

**Entities:** Widget (tabId, x, y, w, h, chartConfig JSON)

**Guards:**
- CollisionGuard — Prevent widget overlap
- BoundsGuard — Check canvas boundaries
- OwnerGuard — Only Owner/Manager can create/delete widgets

**Validators:**
- WidgetPositionValidator — Uses `libs/shared/utils/collision-detection.ts`

---

### DataSheet Module (`apps/api/modules/datasheet/`)

**Responsibilities:**
- Handle Excel file upload (Multer → MinIO S3)
- Enqueue BullMQ import job
- Store DataSheet + DataSeries + DataValues
- Data Selector — Query series by datasheet

**Entities:**
- DataSheet (fileName, uploadedAt, dataSeries)
- DataSeries (name, values JSON)

**Process:**
1. User uploads Excel → REST POST /files/import
2. Multer validates (10MB, xlsx/csv)
3. File stored in MinIO S3
4. BullMQ job enqueued: { fileId, businessId }
5. Worker processes: ExcelJS parse → validate → insert
6. Redis pub/sub notifies frontend: "import:complete"
7. Apollo Subscription fires → toast & refetch

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

### Phase 2A (Auth Implementation)
**Current Focus:** Building JWT login, email verification, Google OAuth.

**Files to Create/Modify:**
- `apps/api/modules/auth/` — Passport strategies, guards
- `apps/web/src/pages/login.tsx` — Login form component
- `libs/shared/types/auth.dto.ts` — Auth DTOs
- Tests in `*.spec.ts` for each module

### Phase 2B (Business & Multi-Tenancy)
**Files to Create:**
- `apps/api/modules/business/` — Business CRUD
- `apps/api/modules/user/` — User management
- `libs/shared/types/business.dto.ts`
- RLS policies in PostgreSQL setup

### Phase 2C (Canvas & Widgets)
**Files to Create:**
- `apps/web/src/stores/canvas.store.ts` — Zustand store
- `apps/web/src/components/widget-card.tsx` — Widget component
- `apps/api/modules/widget/` — Widget API
- `libs/shared/utils/collision-detection.ts` — Tests required

---

## Testing Strategy

| Layer | Framework | Coverage Target | Key Files |
|-------|-----------|-----------------|-----------|
| Shared Utils | Jest | 100% | `libs/shared/utils/**/*.spec.ts` |
| API Resolvers | Jest + db | 80% | `apps/api/**/*.spec.ts` |
| React Components | Jest + RTL | 70% | `apps/web/**/*.spec.tsx` |
| E2E | Playwright | 50% | `e2e/tests/**/*.spec.ts` |

**Run Tests:**
```bash
nx test shared/utils          # Unit tests
nx test api                   # Integration tests
npm run test                  # All tests
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

**Document Version:** 2.2 | **Last Updated:** 2026-03-22
**Codebase Analyzed:** 387 files | **Repomix Tokens:** 481,796
**Maintainer:** Documentation Team
