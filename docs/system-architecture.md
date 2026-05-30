# SBRB System Architecture

## Monorepo Structure

```
sbrb/
├── apps/
│   ├── web/                    # ReactJS 18 web app (Vite, SPA)
│   ├── api/                    # NestJS 10 GraphQL+REST backend
│   ├── worker/                 # BullMQ worker for async jobs
│   └── desktop/                # Electron cross-platform app
├── libs/
│   ├── shared/
│   │   ├── types/              # TypeScript DTOs, interfaces
│   │   ├── constants/          # CHART_COLORS, SNAP_GRID, sizes
│   │   └── utils/              # Collision detection, snap calculations
│   ├── ui/                     # React components (IconButton, ModalActions, FormModal)
│   └── i18n/                   # i18next translations (vi, en)
├── nx.json                     # NX workspace config
├── tsconfig.base.json          # Root TypeScript config
├── docker-compose.yml          # Local dev: PostgreSQL, Redis, MinIO
└── package.json                # Monorepo root
```

## Technology Stack

### Frontend (apps/web)

| Layer | Stack | Version |
|-------|-------|---------|
| Framework | ReactJS | 18.x |
| Language | TypeScript | 5.x |
| Build | Vite | 5.x |
| UI Components | Ant Design 5 + Tailwind CSS | 5.x + 3.x |
| State Management | Zustand | 4.x |
| GraphQL Client | Apollo Client | 3.x |
| Canvas DnD | react-rnd | 10.4+ |
| Charts | Chart.js | 4.4+ |
| Icons | react-icons | 5.x |
| i18n | react-i18next | 13.x |

**Key Libraries:**
- `class-validator` — Input validation (TanStack Query for REST)
- `tailwind-merge + clsx` — Conditional Tailwind classes
- `react-query` — Server state for file upload progress

### Backend (apps/api & apps/worker)

| Layer | Stack | Version |
|-------|-------|---------|
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.x |
| GraphQL | Apollo Server + @nestjs/graphql | 4.x + 12.x |
| ORM | TypeORM | 0.3+ |
| Database | PostgreSQL (Supabase) | 15+ |
| Cache/PubSub | Redis | 7+ |
| Job Queue | BullMQ | 5.x |
| Auth | Passport.js | 0.6+ |
| File Upload | Multer | 1.x |
| Excel | ExcelJS | 4.x |
| Validation | class-validator | 0.14+ |
| Monitoring | Sentry | 8.x |

**Database:** PostgreSQL with JSONB columns (widget config, chart settings)

**Infrastructure:** MinIO S3-compatible (local dev), Redis Cloud, Supabase

## Data Flow Diagrams

### Web: Canvas Drag+Drop → Position Update

```
User dragging widget
    ↓
react-rnd onDragStop event
    ↓
Zustand store (immediate UI update)
    ↓
Collision detection (libs/shared/utils)
    ↓
Valid? → REST PATCH /widgets/:id/position (debounce 300ms)
    ↓
NestJS guard: validate position + check role
    ↓
TypeORM update widget table
    ↓
Success → Apollo refetch (auto sync via optimistic update)
```

### Web: Chart Data Loading → Live Update

```
Click widget → Modal opens
    ↓
Apollo query: { widget { id, chartConfig { type, seriesIds } } }
    ↓
NestJS GraphQL resolver
    ↓
TypeORM join: widget → dataSeries → values
    ↓
Chart Panel renders via Chart.js
    ↓
User changes series in Settings Panel
    ↓
Apollo mutation: updateWidget(chartConfig)
    ↓
Chart Panel re-renders (Apollo cache)
```

### Web: Excel Import → BullMQ Job → Chart Display

```
User uploads file
    ↓
Multer: POST /files/import (10MB limit)
    ↓
S3 (MinIO) stores file
    ↓
BullMQ job enqueued: importExcel { fileId, businessId }
    ↓
Worker process (apps/worker)
    ├─ ExcelJS parse Excel → matrix
    ├─ Validate: rows as series, cols as periods
    ├─ TypeORM insert dataSeries + dataValues
    └─ Redis pub/sub: "import:fileId:complete"
    ↓
Frontend: GraphQL Subscription listens
    ↓
Toast: "Import hoàn thành" → Dashboard refetch
    ↓
Chart displays new data
```

### API: Multi-Tenant Authentication

```
Login request (email + password or OAuth)
    ↓
Passport strategy (local or google)
    ↓
Verify user → create JWT payload
    ↓
Return: { accessToken (15m), refreshToken (30d HttpOnly) }
    ↓
Zustand stores accessToken in memory
    ↓
GraphQL/REST: Authorization header + refreshToken cookie
    ↓
NestJS guard: validate JWT signature + business_id scope
    ↓
TypeORM: RowLevelSecurity (RLS) filters by business_id + role
```

## Module Boundaries (NX Enforced)

```
boundary "apps/web" {
  ├─ depends on: libs/shared/*, libs/ui, libs/i18n
  └─ CANNOT depend on: apps/api, apps/worker
}

boundary "apps/api" {
  ├─ depends on: libs/shared/*, @nestjs/*, TypeORM
  └─ CANNOT depend on: apps/web, apps/worker React
}

boundary "apps/worker" {
  ├─ depends on: libs/shared/*, @nestjs/*, BullMQ, ExcelJS
  └─ CANNOT depend on: apps/web
}

boundary "libs/shared/*" {
  ├─ types: No runtime, pure TS interfaces
  ├─ constants: Plain JS objects (no side effects)
  └─ utils: Pure functions (collision, snap calculations)
}

boundary "libs/ui" {
  ├─ depends on: libs/shared, Ant Design, Tailwind
  └─ CANNOT depend on: app-specific state (Zustand)
}
```

## API Design (Hybrid GraphQL + REST)

### GraphQL Endpoints (POST /graphql)

```graphql
# Queries
query GetWidget($id: ID!) {
  widget(id: $id) {
    id, x, y, w, h, chartConfig
    dataSeries { id, name, values }
  }
}

# Mutations
mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {
  updateWidget(id: $id, input: $input) { id, chartConfig }
}

# Subscriptions
subscription OnImportProgress($fileId: ID!) {
  importProgress(fileId: $fileId) { percent, status }
}
```

### GraphQL Queries & Mutations (✨ NEW: Admin Module)

**Admin Platform Queries:**
```graphql
query AdminMetrics {
  adminMetrics {
    totalBusinesses: Int
    activeBusinesses: Int
    inactiveBusinesses: Int
    totalUsers: Int
    newBusinesses30d: Int
    newUsers30d: Int
  }
}

query AdminAuditLog($offset: Int, $limit: Int) {
  adminAuditLog(offset: $offset, limit: $limit) {
    items { id, userId, businessId, action, metadata, createdAt }
    total: Int
  }
}

query AdminBusinesses($offset: Int, $limit: Int, $sortBy: String) {
  adminBusinesses(offset: $offset, limit: $limit, sortBy: $sortBy) {
    items { id, name, ownerEmail, memberCount, status, createdAt, inactivatedAt, inactiveReason }
    total: Int
  }
}

query AdminUsers($offset: Int, $limit: Int, $sortBy: String) {
  adminUsers(offset: $offset, limit: $limit, sortBy: $sortBy) {
    items { id, email, fullName, isDisabled, createdAt, disabledAt }
    total: Int
  }
}

query AdminUserDetail($userId: ID!) {
  adminUserDetail(userId: $userId) {
    id, email, fullName, isDisabled, businesses { id, name, role, status }
  }
}
```

**Admin Platform Mutations:**
```graphql
mutation InactivateBusiness($businessId: ID!, $reason: String!) {
  inactivateBusiness(businessId: $businessId, reason: $reason) { id, status, inactivatedAt }
}

mutation ReactivateBusiness($businessId: ID!) {
  reactivateBusiness(businessId: $businessId) { id, status, inactivatedAt }
}

mutation DisableUser($userId: ID!) {
  disableUser(userId: $userId) { id, isDisabled, disabledAt }
}

mutation EnableUser($userId: ID!) {
  enableUser(userId: $userId) { id, isDisabled }
}
```

**Authorization:** All admin queries/mutations guarded by `@UseGuards(JwtAuthGuard, PlatformAdminGuard)`

### REST Endpoints (Base: /api/v1)

```
POST   /files/import              # Upload Excel (Multer, 10MB limit)
GET    /files/export/:widgetId    # Download PNG/PDF
PATCH  /widgets/:id/position      # Bulk position updates (debounced)
POST   /auth/google/callback      # OAuth redirect (Passport)
GET    /health                    # K8s liveness probe
```

## Database Schema (TypeORM)

```typescript
User {
  id: UUID
  email: string
  passwordHash: string
  platformRole: 'admin' | null          // ✨ NEW: Platform-level admin role (v1)
  isDisabled: boolean                   // ✨ NEW: Global account disable flag
  disabledAt: Date | null               // ✨ NEW: When user was disabled
  businessRoles: UserRole[]             // Multi-tenant: user may belong to multiple businesses
}

Business {
  id: UUID
  name: string
  ownerId: UUID
  status: 'active' | 'inactive'         // ✨ NEW: Business active/inactive flag
  inactivatedAt: Date | null            // ✨ NEW: When business was inactivated
  inactivatedBy: UUID | null            // ✨ NEW: Admin user who inactivated (FK users.id)
  inactiveReason: string | null         // ✨ NEW: Reason for inactivation
  createdAt: Date
}

UserRole {
  userId: UUID
  businessId: UUID
  role: "owner" | "manager" | "staff" | "viewer"  // 4 permission levels (business-scoped)
}

Tab {
  id: UUID
  businessId: UUID
  name: string
  widgets: Widget[]
}

Widget {
  id: UUID
  tabId: UUID
  x: number          // Pixel coordinate
  y: number
  w: number          // Width, height
  h: number
  chartConfig: JSON  // JSONB: { type, title, palette, seriesIds }
  createdAt: Date
}

DataSheet {
  id: UUID
  businessId: UUID
  name: string
  fileName: string
  uploadedAt: Date
  dataSeries: DataSeries[]
}

DataSeries {
  id: UUID
  dataSheetId: UUID
  name: string       // "Revenue Q1", "Units Sold"
  dataValues: JSON   // JSONB: { "2026-01": 1000, "2026-02": 1200 }
}

AuditLog {
  id: UUID
  userId: UUID       // FK users.id
  businessId: UUID | null  // ✨ UPDATED: Now nullable (platform-level actions have no business context)
  action: string     // 'create_business', 'inactivate_business', 'disable_user', etc.
  metadata: JSON     // Additional context (target business/user, reason, etc.)
  createdAt: Date
}
```

## Security Model

**Authentication:**
- Email + password (bcrypt hashing)
- JWT: 15-minute access token (memory-only)
- Refresh token: 30-day HttpOnly cookie (secure, sameSite=Strict)
- Google OAuth: Social login via Passport
- ✨ NEW: Disabled user check during login (isDisabled flag blocks authentication)

**Authorization:**
- Role-based access control (RBAC) with 4 business roles (Owner, Manager, Staff, Viewer)
- ✨ NEW: Platform-level `admin` role stored in JWT payload (`IJwtPayload.platformRole`)
- ✨ NEW: `PlatformAdminGuard` authorizes all admin-scoped resolvers (requires `platformRole === 'admin'`)
- Row-level security (RLS) in PostgreSQL by business_id
- ✨ NEW: Business inactivation gates member access via FE `BusinessGuard` component (renders inactive page)
- ✨ NEW: Token revocation on user disable via `RefreshTokenService.revokeAllForUser(userId)`
- Guard on each mutation/query resolver

**Data Protection:**
- HTTPS in production (TLS 1.3+)
- CORS whitelist: ALLOWED_ORIGINS env var
- Input validation: class-validator on all DTOs
- Rate limiting: 100 req/min per IP (Phase 3)
- XSS prevention: React auto-escaping + Content Security Policy header

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                  User Browser                    │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
     ┌───────────────┴───────────────┐
     │                               │
  ┌──▼──┐                         ┌──▼──┐
  │ Web │ (Vercel)                │ API │ (ECS/Heroku)
  │ App │                         │     │
  └─────┘                         └──┬──┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                ┌───▼────┐      ┌────▼────┐      ┌───▼───┐
                │  RDS   │      │  Redis  │      │ MinIO │
                │  (DB)  │      │ (Cache) │      │ (S3)  │
                └────────┘      └────┬────┘      └───────┘
                                     │
                                 ┌───▼───┐
                                 │Worker │ (Lambda/Dyno)
                                 │ (Job) │
                                 └───────┘
```

## Code Quality & Testing Strategy

**Testing Layers:**
- **Unit:** Jest on shared utils, validators (80%+ coverage)
- **Integration:** API resolver tests with test DB (70%+ coverage)
- **E2E:** Playwright on critical user flows (onboarding, import, chart) (50%+ coverage)

**Linting & Formatting:**
- ESLint: @nx/eslint, @typescript-eslint
- Prettier: 2-space indent, single quote, trailing comma
- Pre-commit: Run lint + type-check before push

**Type Safety:**
- TypeScript strict mode globally
- No `any` in app code (exceptions: 3rd-party type gaps)
- Codegen: `@graphql-codegen/cli` for Apollo types from schema

---

## Module Implementation Status (2026-04-29)

| Module | Status | Key Files | Tests |
|--------|--------|-----------|-------|
| auth | ✅ IMPLEMENTED | auth.service.ts, jwt.strategy.ts, google.strategy.ts, refresh-token.service.ts | 80+ ✅ |
| user | ✅ IMPLEMENTED | user.service.ts, user.resolver.ts | Incl. in auth |
| business | ✅ IMPLEMENTED | business.service.ts, business-crud.service.ts, member.service.ts | 78+ ✅ |
| admin | ✅ IMPLEMENTED | admin.module.ts (AdminPlatformResolver, AdminBusinessResolver, AdminUserResolver + 4 services) | Incl. in tests |
| tab | ✅ IMPLEMENTED | tab.service.ts, tab.resolver.ts (CRUD, reorder, colors) | 15+ ✅ |
| widget | ✅ IMPLEMENTED | widget.service.ts, widget.resolver.ts (position, collision) | 20+ ✅ |
| datasheet | ✅ IMPLEMENTED | datasheet.service.ts, import-excel.processor.ts | 15+ ✅ |
| audit | ✅ IMPLEMENTED | audit.service.ts (mutation tracking), businessId now nullable | Incl. in business |
| mail | ✅ IMPLEMENTED | mail.service.ts (Gmail SMTP + Handlebars) | Incl. in auth |
| notification | 🔲 SCAFFOLDED | notification.module.ts (services/resolvers commented out) | — |
| minio | ✅ IMPLEMENTED | minio.service.ts (S3-compatible storage) | — |

## Desktop Application (Phase 5 - Electron)

```typescript
// apps/desktop/ — Electron cross-platform app
├── main.ts                     # Main process (BrowserWindow, IPC)
├── preload.ts                  # Preload script (secure context isolation)
├── renderer/                   # React SPA (same as web app)
│   ├── App.tsx
│   └── pages/                  # Same routes as web (Login, Dashboard, etc.)
├── utils/
│   └── ipc-handlers.ts         # IPC bridge (isOnline, queryOffline, syncToCloud)
└── package.json
```

**Key Features (Phase 5):**
- Main process: Electron BrowserWindow (1440×900), context isolation
- Renderer: React SPA with TanStack Router (same code as apps/web)
- Offline: Embedded NestJS + SQLite (Phase 2 stub, Phase 5 full)
- IPC Bridge: electronAPI (isOnline, queryOffline, syncToCloud, getAppVersion)
- Auto-updater: electron-updater for background checks
- Dependencies: better-sqlite3, electron-store, electron-updater

**Build Targets:**
- Windows: NSIS installer (.exe)
- macOS: DMG package (.dmg)
- Linux: AppImage (.AppImage)

---

## Rate Limiting (IMPLEMENTED)

✅ **Implemented in auth module** via `redis-rate-limit.service.ts`:
- 100 req/min per IP on auth endpoints
- Redis-backed rate limiter (used by login, register, password reset)
- Prevents brute force attacks
- Configurable limits per endpoint

---

---

## Admin Module Architecture (✨ NEW: v1)

**Location:** `apps/api/src/modules/admin/`

**Core Components:**
- `admin.module.ts` — Module definition, imports dependencies
- `admin-platform.resolver.ts` — GraphQL queries: adminMetrics, adminAuditLog
- `admin-business.resolver.ts` — Queries: adminBusinesses; Mutations: inactivateBusiness, reactivateBusiness
- `admin-user.resolver.ts` — Queries: adminUsers, adminUserDetail; Mutations: disableUser, enableUser
- `admin-metrics.service.ts` — Dashboard metric calculations
- `admin-audit.service.ts` — Audit log retrieval + filtering
- `admin-business.service.ts` — Business management (inactivate/reactivate)
- `admin-user.service.ts` — User management (disable/enable)

**Access Control:**
- All resolvers protected by `@UseGuards(JwtAuthGuard, PlatformAdminGuard)`
- `PlatformAdminGuard` (at `common/guards/platform-admin.guard.ts`) checks `request.user.platformRole === 'admin'`

**Pagination Pattern:**
- New DTO: `PageInput` with offset (default 0) and limit (default 20, max 100)
- Responses include items array + total count for pagination
- GraphQL sorts by: EAdminBusinessSortBy, EAdminUserSortBy, EAdminAuditAction

**Frontend Integration:**
- Admin dashboard: `/admin` route
- Business management table: `/admin/businesses` with InactivateBusinessModal + BusinessStatusTag
- User management table: `/admin/users` with UserDetailDrawer
- Audit log page: `/admin/audit`
- Layout: AdminLayout + AdminSidebar (shown when platformRole === 'admin')

---

**Document Version:** 2.5 | **Last Updated:** 2026-04-29 | **Architecture Owner:** Tech Lead
