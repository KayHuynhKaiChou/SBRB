# SBRB Quick Start & Cheat Sheet

**For new developers — save time with these essentials.**

---

## 30-Second Primer

**What:** Free-form canvas dashboard builder for small businesses.

**How:** Drag widgets onto 3200×4800px canvas, configure charts, import Excel data.

**Tech:** React 18 + NestJS 10 + PostgreSQL + Redis, NX monorepo, TypeScript strict.

**Status:** Phase 1 ✅ COMPLETE | Phase 2A-2E ✅ COMPLETE | Phase 3 (Charts & Export) NEXT

---

## Essential Paths & Commands

### Project Structure
```bash
apps/web/          # React frontend (port 3000)
apps/api/          # NestJS backend (port 4000) — handles Excel parsing in-process
libs/shared/*      # Types, constants, utils (shared by all)
libs/ui/           # React components
libs/i18n/         # Translations (vi, en)
```

### Start Development
```bash
npm install                    # Install deps
npm run docker:up             # Start MinIO (PostgreSQL=Supabase, Redis=cloud)
npm run dev:web               # Frontend on :3000
npm run dev:api               # Backend on :4000
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

### UI Components (Phase 2C+)
```typescript
// ✓ ICON-ONLY BUTTONS: Use IconButton
<IconButton icon={<EditOutlined />} tooltip="Edit" onClick={handleEdit} />

// ✗ BAD: Raw buttons for icons
<Button icon={<EditOutlined />} />

// ✓ MODAL FOOTERS: Use ModalActions
const actions = [
  { icon: <SaveOutlined />, tooltip: 'Save', onClick: handleSave },
  { icon: <CloseOutlined />, tooltip: 'Close', onClick: handleClose },
];
<ModalActions actions={actions} />

// ✗ BAD: Hardcoded buttons in modals
<footer><Button>Save</Button><Button>Close</Button></footer>

// ✓ ALL TEXT: Use i18n t()
const { t } = useTranslation('widget');
<h3>{t('title')}</h3>

// ✗ BAD: Hardcoded text
<h3>Widget Settings</h3>
```

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
✅ Mar 28 — Phase 2C COMPLETE: Tab management (colors, icons, pinning)
✅ Mar 28 — Phase 2D COMPLETE: Canvas & widget DnD (snap grid, collision)
✅ Mar 28 — Phase 2E COMPLETE: Excel import (BullMQ worker)
→  Jul 15 — Phase 3: Chart display & export (NEXT UP)
```

### Test Results Summary
- **Auth module:** 80+ tests ✅ all passing
- **Business module:** 78+ tests ✅ all passing
- **Tab module:** 15+ tests ✅ all passing
- **Widget module:** 20+ tests ✅ all passing
- **DataSheet module:** 15+ tests ✅ all passing
- **Other:** 29+ tests ✅ all passing
- **TOTAL:** 237 tests, 32 suites, 0 failures

---

## Key Contacts & Escalations

- **Tech Lead:** Architecture questions, Phase planning
- **Frontend Lead:** UI/UX, React patterns
- **Backend Lead:** NestJS, database, API design
- **Documentation:** This guide, CLAUDE.md, docs/

---

---

## What's Implemented Now (Phase 2A-2E)

✅ **User Authentication**
- Email/password signup with verification
- Google OAuth login
- Password reset via email
- JWT tokens (15m access, 30d refresh HttpOnly)
- Rate limiting on auth endpoints (Redis-backed)

✅ **Multi-Tenant Business Management**
- Create business (Owner)
- Invite users via email code
- Role-based access (Owner, Manager, Staff, Viewer)
- Member management (add/remove/role update)
- Row-level security by businessId

✅ **Tab Management (NEW Phase 2C)**
- Create/rename/delete tabs
- Reorder tabs (drag handles)
- Duplicate tab with widgets
- Tab colors, icons, pinning

✅ **Canvas & Widget Drag+Drop (NEW Phase 2D)**
- 3200×4800px free-form canvas
- Widget drag/resize with react-rnd
- Snap to 20px grid
- Collision detection (AABB algorithm)
- Zoom controls (50-125%)
- Widget chart preview

✅ **Data Import & Excel (NEW Phase 2E)**
- Upload Excel files (10MB limit)
- Parse matrix format (rows=series, cols=periods)
- BullMQ background processing
- DataSheet + DataSeries + DataValues storage
- Data Selector modal
- GraphQL Subscriptions for progress

✅ **New UI Patterns (Phase 2C+)**
- IconButton (ghost variant, all icon-only buttons)
- ModalActions (DRY footer, save/cancel buttons)
- FormModal (generic modal wrapper)

✅ **Internationalization**
- Vietnamese (vi) default, English (en)
- i18n namespaces: common, auth, dashboard, widget, datasheet, member
- No hardcoded text in UI

✅ **Testing & Quality**
- 237 tests, 32 test suites, all passing, 0 failures
- Auth: 80+ tests
- Business: 78+ tests
- Tab: 15+ tests
- Widget: 20+ tests
- DataSheet: 15+ tests
- Other: 29+ tests

🔲 **Not Yet Implemented (Phase 3+)**
- Chart display (Chart.js rendering)
- Export dashboard as PNG/PDF
- Notifications & audit logs (Phase 4)
- Desktop/Electron (Phase 5)

---

**Last Updated:** 2026-03-28 | **Save this file for quick reference!**

---

## Seed First Admin

After running migrations on dev/prod DB, promote the first platform admin via SQL (run once, operator action):

```sql
-- Promote first admin (run once after migrations)
UPDATE users SET platform_role = 'admin' WHERE email = 'admin@gmail.com';
```

Verify:
```sql
SELECT id, email, platform_role FROM users WHERE platform_role IS NOT NULL;
```

Only one admin is supported in v1. To swap admin: run an equivalent `UPDATE` for the new email, then `SET platform_role = NULL` for the old one.
