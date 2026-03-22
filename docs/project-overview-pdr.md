# SBRB Project Overview & Product Development Requirements

## Project Summary

**Name:** SBRB — Small Business Report Board

**Version:** 2.2 (Free-form Canvas Edition)

**Status:** Phase 1 Scaffold Complete, Phase 2 Development Initiated

**Description:** Free-form canvas dashboard builder for SMEs. Enables businesses to create pixel-based dashboards with draggable widgets showing data visualizations (charts, tables, KPIs). No grid constraints—widgets placed at absolute coordinates (x, y) with collision detection.

## Business Goals

- Provide cost-free dashboard solution for SME decision-makers
- Enable non-technical users to visualize business data without code
- Support multi-user collaboration with role-based access control
- Maintain domain-agnostic design (retail, manufacturing, finance, etc.)
- Establish foundation for desktop (Electron) and mobile variants

## Target Users

1. **Business Owner/Manager** — Creates dashboards, imports data, manages team access
2. **Staff/Analyst** — Inputs data, views dashboards, manages widgets (limited)
3. **Viewer** — Read-only access to assigned dashboards
4. **SMEs** — Small-medium enterprises with 5-50 employees, basic IT literacy

## Core Features (MVP Phase 2)

| Feature | Scope | Priority |
|---------|-------|----------|
| Free-form Canvas | 3200×4800px, pixel-based widget placement | P0 |
| Widget DnD+Resize | react-rnd with collision detection, snap grid | P0 |
| Chart Types | Line, Bar, Pie, Area (via Chart.js) | P0 |
| Excel Import | Matrix format (rows=series, cols=periods) | P0 |
| Data Selector | Modal to pick series from imported sheets | P0 |
| Multi-Tenant | Business → Tab → Widget hierarchy | P0 |
| Auth (JWT+OAuth) | Email + Google OAuth, HttpOnly refresh token | P0 |
| Role-Based Access | Owner, Manager, Staff, Viewer with guards | P0 |
| i18n | Vietnamese (vi), English (en) | P0 |
| Export | Download dashboard as PNG/PDF (Phase 3) | P2 |

## Non-Functional Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| Performance | TTI < 2s, FCP < 1s | Vite HMR, code-split modals |
| Scalability | 1000 concurrent users, 500 widgets/tab max | Redis cache, PostgreSQL JSONB |
| Uptime | 99.5% | Supabase SLA + health checks |
| Security | OWASP Top 10, no XSS/CSRF/SQL injection | Input validation, CORS, CSP headers |
| Browser Support | Chrome 90+, Firefox 88+, Safari 14+ | Desktop-first, tablet landscape |
| Mobile | Tablet landscape support, web-responsive | Desktop optimization priority |

## Technical Constraints

- **Monorepo:** NX 22+ for code sharing (types, utils, components)
- **No column grids:** Canvas pixel-based only (constraint vs. Bootstrap Grid)
- **Collision detection:** Client-side realtime, server-side validation
- **Widget limits:** 50 per tab, 800-1600px width, 400-800px height
- **Canvas size:** 3200×4800px (configurable)
- **File size:** Max 10MB Excel imports (Multer limit)
- **TypeScript:** Required in all app/lib code (strict mode)

## Platform Deployment

| Platform | Deployment | Status |
|----------|-----------|--------|
| Web | Vercel / AWS CloudFront | Phase 2 |
| API | AWS ECS / Heroku / Railway | Phase 2 |
| Worker | AWS Lambda / Heroku dyno | Phase 2 |
| Desktop (Electron) | GitHub Releases (.exe/.dmg/.AppImage) | Phase 5 |

## Success Metrics

- Users can create functional dashboard in < 5 minutes (onboarding → import → widget → chart)
- Zero collision bugs (100% widget placement validation)
- Import completes < 10s for typical 100-series Excel (BullMQ job < 8s)
- Dashboard page load TTI < 2s with 20 widgets
- 95% test coverage on shared utils, 80% on modules
- User adoption: 50+ active SME tenants in Year 1

## Phase Breakdown

| Phase | Scope | Duration | Milestone |
|-------|-------|----------|-----------|
| 1 | NX scaffold, project setup, CI/CD skeleton | COMPLETE | Repo ready, Docker Compose works |
| 2 | Auth, Business, Tab, Widget CRUD, Canvas MVP | 8 weeks | Demo: drag widget, import, chart |
| 3 | Export (PNG/PDF), Analytics, Datasheet editor | 6 weeks | Full feature parity web ↔ desktop |
| 4 | Notifications, Audit log, Invite flow (email) | 4 weeks | Enterprise-ready permissions |
| 5 | Electron desktop, offline sync, local SQLite | 10 weeks | Ship .exe and .dmg releases |

## Dependencies & Integrations

**External Services:**
- Supabase (PostgreSQL, Auth optional)
- Redis Cloud (cache, pub/sub)
- MinIO S3 (file storage, local dev)
- SendGrid (email invites)
- Sentry (error monitoring)
- Google OAuth (social login)

**Internal Modules:**
- `libs/shared/types` — TypeScript DTOs (WidgetPosition, DataSeriesDto)
- `libs/shared/constants` — CHART_COLORS, SNAP_GRID, MIN_WIDGET_SIZE
- `libs/shared/utils` — Collision detection, snap calculations
- `libs/ui` — Shared React components (Button, Modal, Tooltip)
- `libs/i18n` — i18next translations (vi, en)

## Known Constraints & Future Considerations

1. **Offline desktop (Phase 5):** Requires SQLite sync layer, adds complexity
2. **Mobile support:** Deferred; tablet landscape only in Phase 2
3. **Real-time collaboration:** Not in MVP; single-user edit per widget initially
4. **AI-driven charts:** Deferred; foundation in Phase 2
5. **Custom chart types:** Only Chart.js types in Phase 2; plugin API Phase 4+

---

**Document Version:** 2.2 | **Last Updated:** 2026-03-22 | **Author:** Documentation Team
