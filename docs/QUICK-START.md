# SBRB Quick Start & Cheat Sheet

**For new developers — save time with these essentials.**

---

## 30-Second Primer

**What:** Free-form canvas dashboard builder for small businesses.

**How:** Drag widgets onto 3200×4800px canvas, configure charts, import Excel data.

**Tech:** React 18 + NestJS 10 + PostgreSQL + Redis, NX monorepo, TypeScript strict.

**Status:** Phase 1 ✅ COMPLETE | Phase 2A (Auth) ✅ COMPLETE | Phase 2B (Business) ✅ COMPLETE | Phase 2C (Tabs) NEXT

---

## Essential Paths & Commands

### Project Structure
```bash
apps/web/          # React frontend (port 3000)
apps/api/          # NestJS backend (port 4000)
apps/worker/       # BullMQ job processor
libs/shared/*      # Types, constants, utils (shared by all)
libs/ui/           # React components
libs/i18n/         # Translations (vi, en)
```

### Start Development
```bash
npm install                    # Install deps
npm run docker:up             # Start PostgreSQL, Redis, MinIO
npm run dev:web               # Frontend on :3000
npm run dev:api               # Backend on :4000
npm run dev:worker            # Worker listener
```

### Quality Checks
```bash
npm run type-check            # TypeScript strict check
npm run lint                  # ESLint + Prettier
nx test <module>              # Run tests (e.g., nx test shared/utils)
npm run test                  # All tests
```

### Build & Deploy
```bash
npm run build:all             # Build all apps
docker compose up -d          # Local prod-like stack
```

---

## Coding Rules (Critical)

### File Organization
```
✓ kebab-case filenames (widget-position-validator.ts)
✓ Max 200 LOC per file (modularize if longer)
✓ Named exports (avoid defaults in libs)
✓ TSDoc for complex functions (/** ... */)
```

### Imports
```typescript
// ✓ GOOD: Path aliases
import { WidgetPosition } from '@sbrb/shared/types';
import { SNAP_GRID } from '@sbrb/shared/constants';
import { hasCollision } from '@sbrb/shared/utils';
import { Button } from '@sbrb/ui';

// ✗ BAD: Relative paths across packages
import { Widget } from '../../../libs/...';
```

### TypeScript
```typescript
// ✓ Strict mode required
const validate = (data: WidgetPosition): boolean => { ... };

// ✗ No any types
const process = (data: any): any => { };
```

### Module Boundaries
```
Web app ─┬─→ Shared types ✓
         ├─→ Shared utils ✓
         ├─→ UI components ✓
         └─→ API code ✗ (forbidden)

Backend ─┬─→ Shared types ✓
         ├─→ Shared utils ✓
         └─→ React code ✗ (forbidden)
```

---

## Git Workflow

### Branch Names
```bash
feature/widget-drag-drop       # New feature
fix/collision-detection-bug    # Bug fix
refactor/split-services        # Code cleanup
docs/update-architecture       # Docs only
```

### Commit Format (Conventional)
```bash
git commit -m "feat: add collision detection
- Implement AABB algorithm
- Add unit tests
- Update shared/utils"

git commit -m "fix: resolve widget flicker on drag
- Fix Zustand position update race condition"
```

### Checks Before Push
```bash
npm run type-check             # Must pass
npm run lint                   # Must pass
nx test <module>               # Must pass
# No console.log(), no secrets in .env
```

---

## Canvas Basics

### Size & Layout
- Canvas: 3200×4800px
- Widget min: 800×400px
- Widget max: 1600×800px
- Max 50 widgets per tab
- Snap grid: 20px (configurable)

### Collision Detection
```typescript
import { hasCollision } from '@sbrb/shared/utils';

const overlap = hasCollision(widgetA, widgetB);
// Returns true if bounding boxes intersect
```

### Widget State (Zustand)
```typescript
import { useCanvasStore } from '@stores/canvas.store';

const { widgets, selected, moveWidget } = useCanvasStore();
moveWidget(widgetId, newX, newY);
```

---

## Data Flow (Key Patterns)

### Drag Widget → Save Position
```
User drag (react-rnd)
  → Zustand store update (realtime)
  → Collision check (shared utils)
  → REST PATCH /widgets/:id/position (debounce 300ms)
  → NestJS guard validation
  → TypeORM update
  → Success → Apollo refetch
```

### Click Widget → Show Chart
```
Click widget
  → Modal opens
  → GraphQL query: widget + dataSeries
  → Chart Panel renders via Chart.js
  → User changes settings
  → Apollo mutation + cache update
  → Chart re-renders live
```

### Upload Excel → Import Data
```
POST /files/import (Multer)
  → S3 (MinIO)
  → BullMQ job enqueued
  → Worker: ExcelJS parse → validate → DB insert
  → Redis pub/sub: "import:complete"
  → Frontend: GraphQL Subscription fires
  → Toast + refetch dashboard
```

---

## Authentication

### Login Flow
```
Email + password → Passport local strategy
  → Hash check (bcrypt)
  → Create JWT (15m access, 30d refresh)
  → Return accessToken + refreshToken (HttpOnly cookie)
  → Apollo Client stores accessToken in memory
  → Refresh cookie auto-sent on requests
```

### Protected Routes
```typescript
// Frontend
@UseGuards(JwtAuthGuard)
async updateWidget(...) { }

// Backend: Apollo interceptor handles refresh
```

---

## Design System

### Colors
| Name | Hex | Use |
|------|-----|-----|
| Primary | #D72A44 | Buttons, CTAs, active |
| Text | #2C3E50 | Headings, body text |
| Success | #27AE60 | Success messages |
| Error | #E74C3C | Errors, destructive |
| Border | #BDC3C7 | Input borders, dividers |

### Components
- Button: 40px height, rounded corners
- Input: 36px height, 2px focus outline
- Modal: 2-column (Settings | Chart), 1200px min
- Toast: bottom-right, 3s auto-dismiss

---

## Common Tasks

### Create New React Component
```bash
# Create component
mkdir apps/web/src/components/my-feature
# Edit: my-feature.tsx

// ✓ Use path alias
import { Button } from '@sbrb/ui';
import { WidgetPosition } from '@sbrb/shared/types';
```

### Create New NestJS Module
```bash
nx generate @nx/nest:module modules/my-feature --project=api

# Result:
# apps/api/src/modules/my-feature/my-feature.module.ts
# apps/api/src/modules/my-feature/my-feature.service.ts
# apps/api/src/modules/my-feature/my-feature.resolver.ts
```

### Add Shared Utility Function
```bash
# Create:
# libs/shared/utils/my-helper.ts
# libs/shared/utils/my-helper.spec.ts (100% coverage required)

export function myHelper(data: any): boolean {
  // Implementation
}
```

### Write Tests
```bash
# Jest
nx test shared/utils          # One module
npm run test                  # All modules

// In *.spec.ts:
describe('hasCollision', () => {
  it('should detect overlap', () => {
    const result = hasCollision(a, b);
    expect(result).toBe(true);
  });
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module '@sbrb/...'` | Check path alias in tsconfig.base.json |
| Type error on imported type | Verify import path, ensure type not value |
| NX boundary violation warning | Check which app/lib you're in, review docs/code-standards.md |
| CollisionError on widget save | Debug: Check canvas bounds, widget size, existing widgets |
| Excel import hangs | Check file size (<10MB), format (matrix: rows=series, cols=periods) |
| Apollo cache not updating | Use refetchQueries or update manually |
| Widget flickers on drag | Check Zustand optimistic update, collision check debounce |
| Test fails in CI but passes local | Clear node_modules, reinstall, check env vars |

---

## Documentation Map

| Topic | File |
|-------|------|
| Setup & commands | README.md |
| Project goals | project-overview-pdr.md |
| Tech stack & data flow | system-architecture.md |
| Coding standards | code-standards.md |
| Design system | design-guidelines.md |
| Phase timeline | development-roadmap.md |
| Code structure | codebase-summary.md |
| This guide | QUICK-START.md |

---

## Phase 2 Status & Milestones

```
✅ Mar 22 — Phase 2A COMPLETE: Auth (JWT, OAuth, email verify) — 80+ tests
✅ Mar 22 — Phase 2B COMPLETE: Business & multi-tenancy — 78+ tests
→  May 3  — Phase 2C: Tab management (NEXT UP)
→  May 17 — Phase 2D: Canvas & widget DnD ← Critical
→  May 31 — Phase 2E: Excel import → PHASE 2 COMPLETE
```

### Test Results Summary
- **Auth module:** 80+ tests ✅ all passing
- **Business module:** 78+ tests ✅ all passing (28 dev-1 + 29 dev-2 + 21 dev-3)
- **Entities:** 44+ tests ✅ all passing
- **TOTAL:** 202 tests, 0 failures

---

## Key Contacts & Escalations

- **Tech Lead:** Architecture questions, Phase planning
- **Frontend Lead:** UI/UX, React patterns
- **Backend Lead:** NestJS, database, API design
- **Documentation:** This guide, CLAUDE.md, docs/

---

---

## What's Implemented Now (Phase 2A-2B)

✅ **User Authentication**
- Email/password signup with verification
- Google OAuth login
- Password reset via email
- JWT tokens (15m access, 30d refresh HttpOnly)
- Rate limiting on auth endpoints

✅ **Multi-Tenant Business Management**
- Create business (Owner)
- Invite users via email code
- Role-based access (Owner, Manager, Staff, Viewer)
- Member management (add/remove/role update)
- Row-level security by businessId

✅ **Testing & Quality**
- 202 tests, all passing, 0 failures
- Auth: 80+ tests
- Business: 78+ tests
- Entities: 44+ tests

🔲 **Not Yet Implemented (Phase 2C+)**
- Tab management (NEXT UP)
- Widget drag+drop & canvas (Phase 2D)
- Excel import & data sheets (Phase 2E)
- Notifications & audit logs (Phase 4)
- Desktop/Electron (Phase 5)

---

**Last Updated:** 2026-03-22 | **Save this file for quick reference!**
