# SBRB Documentation

This directory contains comprehensive documentation for the Small Business Report Board project. Start here to understand project goals, architecture, standards, and development progress.

## Quick Navigation

### For New Developers

1. **[Project Overview & PDR](./project-overview-pdr.md)** — Project goals, target users, MVP features, phase breakdown
2. **[System Architecture](./system-architecture.md)** — Tech stack, data flow diagrams, module boundaries
3. **[Code Standards](./code-standards.md)** — TypeScript conventions, NX rules, file organization

### For Design & Product

- **[Design Guidelines](./design-guidelines.md)** — Colors (#D72A44 primary), typography, component specs, accessibility
- **[Development Roadmap](./development-roadmap.md)** — Phase timeline, milestones, success metrics

### Reference Material

- **.env.example** — Configuration template
- **docker-compose.yml** — Local dev stack (PostgreSQL, Redis, MinIO)

---

## Document Overview

| Document | Purpose | Audience | Key Info |
|----------|---------|----------|----------|
| **project-overview-pdr.md** | Business goals, features, constraints | PMs, Stakeholders | MVP scope, roles, deployment |
| **system-architecture.md** | Technical design, data flows, deployment | Architects, Backend leads | NX monorepo, GraphQL+REST, security |
| **code-standards.md** | Coding conventions, file size, TypeScript | All developers | 200 LOC limit, kebab-case, modules |
| **design-guidelines.md** | Brand colors, UI components, accessibility | Frontend, Design | #D72A44, 40px buttons, WCAG AA |
| **development-roadmap.md** | Phase timeline, milestones, deliverables | PMs, Tech lead | 8 phases, Week-by-week breakdown |

---

## Key Project Details

### Technology Stack
- **Frontend:** ReactJS 18 + TypeScript + Vite + Ant Design 5 + Tailwind CSS + Zustand
- **Backend:** NestJS 10 + GraphQL + REST + TypeORM + PostgreSQL
- **Worker:** BullMQ + ExcelJS
- **Infrastructure:** Docker Compose (local), Supabase (cloud), Redis, MinIO

### Monorepo Structure
```
apps/web                  # ReactJS web app
apps/api                  # NestJS GraphQL+REST
apps/worker               # BullMQ Excel import worker
libs/shared/types         # Shared TypeScript types
libs/shared/constants     # CHART_COLORS, canvas config
libs/shared/utils         # Collision detection, snap grid
libs/ui                   # Shared React components
libs/i18n                 # Translations (vi, en)
```

### Current Status
- **Phase 1 (Scaffold):** ✅ COMPLETE (2026-03-22)
- **Phase 2A (Auth):** ✅ COMPLETE (2026-03-22) — 80+ tests, JWT+OAuth fully implemented
- **Phase 2B (Business):** ✅ COMPLETE (2026-03-22) — 78+ tests, multi-tenant with invites
- **Phase 2C (Tabs):** NEXT UP (ready to start)
- **Target:** Phase 2 complete by 2026-05-31

### Development Commands
```bash
npm install               # Install all dependencies
npm run dev:web          # Start web app on 3000
npm run dev:api          # Start API on 4000
npm run dev:worker       # Start worker
npm run docker:up        # Bring up local dev stack
npm run type-check       # TypeScript strict mode
npm run lint             # ESLint + formatting
npm run test             # Run all tests
npm run build:all        # Build all apps
```

---

## Coding Quick Reference

### File Naming
- Files: `kebab-case.ts` (self-documenting names)
- Components: `PascalCase` exports in `WidgetCard.tsx`
- Max 200 LOC per file (except tests, config, markdown)

### Import Paths (Path Aliases)
```typescript
import { WidgetPosition } from '@sbrb/shared/types';
import { SNAP_GRID } from '@sbrb/shared/constants';
import { hasCollision } from '@sbrb/shared/utils';
import { Button } from '@sbrb/ui';
```

### TypeScript
- Strict mode required
- No `any` types in app code
- Named exports (avoid defaults in libs)

### Component Standards
- React 18 functional components with hooks
- Zustand for canvas state (drag position, selected widget)
- Apollo Client for GraphQL queries
- Ant Design 5 for UI components

### Git Workflow
- Branch: `feature/`, `fix/`, `refactor/`, `docs/` prefixes
- Commit: Conventional format (`feat:`, `fix:`, `docs:`)
- No confidential data in commits (.env, secrets, API keys)

---

## Frequently Asked Questions

**Q: Where do I store shared types?**
A: `libs/shared/types/` — Import in both web and API

**Q: How do I add a new NestJS module?**
A: Run `nx generate @nx/nest:module modules/my-feature --project=api`

**Q: What's the canvas size?**
A: 3200×4800px. Widget size: 800-1600px width, 400-800px height.

**Q: How does collision detection work?**
A: AABB (Axis-Aligned Bounding Box) in `libs/shared/utils/collision-detection.ts`. Check before position save.

**Q: Can users edit widgets in real-time concurrently?**
A: Not in Phase 2 (single-user per widget). Multi-user editing planned Phase 4+ (CRDT).

**Q: How do I run tests?**
A: `nx test <project>` (e.g., `nx test shared/utils`)

---

## Getting Help

- **Architecture questions:** See System Architecture document
- **Design/color questions:** See Design Guidelines document
- **Coding standards violations:** See Code Standards document
- **Feature scope/timeline:** See Development Roadmap document

## Contributing

1. Read Code Standards before writing code
2. Follow file naming conventions (kebab-case)
3. Run `npm run type-check && npm run lint` before commit
4. Write commit message with conventional format
5. Keep files under 200 LOC (except tests)
6. Use path aliases for imports (`@sbrb/*`)

---

**Last Updated:** 2026-03-22
**Phase Status:** Phase 1 Complete, Phase 2 In Progress
**Maintainer:** Documentation Team
