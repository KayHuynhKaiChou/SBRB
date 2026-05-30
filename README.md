# SBRB — Small Business Report Board

Free-form canvas dashboard builder for SMEs. Place charts anywhere on a pixel canvas, drag & resize freely with collision detection.

## Status

- **Phase 1:** ✅ COMPLETE
- **Phase 2A (Auth):** ✅ COMPLETE — 80+ tests, JWT+OAuth fully implemented
- **Phase 2B (Business):** ✅ COMPLETE — 78+ tests, multi-tenant with roles + invites
- **Phase 2C (Tabs):** ✅ COMPLETE — Tab CRUD, reorder, duplicate, colors, icons, pinning
- **Phase 2D (Canvas & Widget DnD):** ✅ COMPLETE — Canvas 3200×4800px, drag/resize, snap grid, collision detection
- **Phase 2E (Data Import/Excel):** ✅ COMPLETE — Excel import via BullMQ worker, data series management
- **Phase 2F (Profile):** ✅ COMPLETE — /profile route, avatar upload, change password, sessions, ProfileForm component
- **Phase 2G (Platform Admin Role v1):** ✅ COMPLETE — Admin dashboard, business inactivation, user disable, audit log
- **Test Coverage:** 250+ tests passing, 33 test suites, 0 failures

## Stack

| Layer | Tech |
|-------|------|
| Frontend | ReactJS 18, TypeScript, Vite, Ant Design 5, Tailwind CSS, Zustand, Apollo Client, react-rnd, Chart.js |
| Backend | NestJS 10, TypeORM, PostgreSQL (Supabase), Apollo Server 4, GraphQL |
| Queue | BullMQ 5, Redis Cloud |
| Storage | MinIO (local dev) → AWS S3 (production) |
| Auth | JWT (HttpOnly cookie) + Google OAuth + Email verification |
| Monorepo | NX 22 |

## Structure

```
apps/
  web/       — ReactJS web app (Vite)
  api/       — NestJS REST + GraphQL API
  worker/    — BullMQ Excel import worker
libs/
  shared/
    types/      — @sbrb/shared-types (WidgetDto, ChartConfig, etc.)
    constants/  — @sbrb/shared-constants (CHART_COLORS, canvas sizes)
    utils/      — @sbrb/shared-utils (collision detection, snap calc)
  ui/         — @sbrb/ui (shared React components)
  i18n/       — @sbrb/i18n (vi default, en)
```

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop (for MinIO)

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env with your Supabase, Redis, and other credentials
```

### 3. Start local infrastructure (MinIO only)
```bash
npm run docker:up
# MinIO console: http://localhost:9001 (admin:minioadmin)
```

### 4. Run development servers
```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: Web
npm run dev:web

# Terminal 3: Worker
npm run dev:worker
```

Web: http://localhost:3000
API: http://localhost:4000
GraphQL Playground: http://localhost:4000/graphql
MinIO Console: http://localhost:9001

## Environment Variables

See `.env.example` for all variables.

Key vars:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `REDIS_HOST/PORT/PASSWORD` — Redis Cloud connection
- `JWT_SECRET` — Long random string (min 32 chars in production)
- `MINIO_*` — MinIO config (local dev only)

## NX Commands

```bash
# Build specific app
npx nx build web
npx nx build api

# Lint all
npx nx run-many --target=lint --all

# Test all
npx nx run-many --target=test --all

# Affected only (CI)
npx nx affected --target=test
```

## Docs

See `docs/` for:
- `project-overview-pdr.md` — Product requirements
- `system-architecture.md` — Architecture diagrams
- `code-standards.md` — Coding standards
- `design-guidelines.md` — Brand + UI guidelines
- `development-roadmap.md` — Phase roadmap
