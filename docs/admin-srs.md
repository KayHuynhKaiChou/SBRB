# SRS — Platform Admin Role

**Version:** 1.0
**Date:** 2026-04-28
**Status:** Approved (brainstorm), pending implementation
**Owner:** SBRB core team

---

## 1. Mục đích

Bổ sung **Platform Admin** — role cấp hệ thống tách biệt khỏi 4 business roles hiện hữu (Owner / Manager / Staff / Viewer). Admin quản lý toàn bộ businesses + users của platform SBRB; có thể inactive 1 business để chặn truy cập của tất cả member thuộc business đó.

## 2. Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| **Platform role** | Role cấp toàn cục, lưu ở `users.platform_role`. Hiện chỉ có giá trị `'admin'` hoặc `null`. |
| **Business role** | Role per-business hiện có (Owner/Manager/Staff/Viewer). Lưu ở `business_members.role`. |
| **Active business** | `businesses.status = 'active'`. |
| **Inactive business** | `businesses.status = 'inactive'`. Bị admin tạm khóa. Reversible. |
| **Closed page** | Trang FE hiển thị khi user truy cập business đang inactive. |

## 3. Phạm vi

### In scope (v1)
- Single platform role: `admin`. **Chỉ duy nhất 1 admin** trong hệ thống — seed manual qua SQL.
- Admin features: list/inactivate/reactivate businesses (metadata only), list/disable/enable users, view audit log, dashboard metrics.
- Block-per-business khi inactive (user multi-biz chỉ bị chặn ở biz inactive).

### Out of scope (v1, defer cho v2)
- **Multi-admin** — promote/demote user thành admin qua UI. v1 chỉ 1 admin seed cứng.
- Multi-tier platform roles (`support`, `billing`...).
- Hard-archive / scheduled-delete business.
- Impersonate-as-owner.
- Read-only access vào datasheet/widget của business.
- System settings UI (maintenance banner, feature flags...).

## 4. Stakeholders & user stories

### US-1 — Seed admin đầu tiên
**As a** dev/devops, **I want** seed manual admin đầu tiên qua SQL `UPDATE users SET platform_role='admin' WHERE email=...`, **so that** không cần code seeder phức tạp.

### US-2 — Admin xem list business
**As an** admin, **I want** xem table tất cả businesses với cột {tên, owner email, member count, status, created_at, inactivated_at, reason}, **so that** monitor toàn platform.

### US-3 — Admin inactive business
**As an** admin, **I want** inactive 1 business kèm lý do, **so that** member của business đó không vào dùng app được nữa.

### US-4 — Admin reactivate business
**As an** admin, **I want** reactivate business đã inactive, **so that** restore quyền truy cập khi vấn đề được giải quyết.

### US-5 — User bị chặn khi business inactive
**As a** member của business inactive, **I want** thấy trang "Doanh nghiệp này đang đóng" với lý do + nút logout/switch, **so that** hiểu lý do và xử lý tiếp.

### US-6 — User multi-biz vẫn dùng được biz active
**As a** user là member của biz A (inactive) + biz B (active), **I want** login vào B bình thường, chỉ bị chặn khi switch sang A, **so that** không mất truy cập biz hợp lệ.

### US-8 — Admin disable user
**As an** admin, **I want** disable account user (suspend toàn cục), **so that** chặn user vi phạm khỏi mọi business.

### US-9 — Admin xem audit log
**As an** admin, **I want** xem timeline action toàn hệ thống (login, create biz, inactivate biz, promote admin...), **so that** trace incident.

### US-10 — Admin xem metrics
**As an** admin, **I want** dashboard {total biz, active biz, inactive biz, total user, new biz 30d, new user 30d}, **so that** nắm overview platform.

## 5. Yêu cầu chức năng

### FR-1 Data model

#### 5.1 User entity (sửa)
File: [apps/api/src/modules/auth/entities/user.entity.ts](apps/api/src/modules/auth/entities/user.entity.ts)
```ts
@Column({ name: 'platform_role', type: 'varchar', length: 20, nullable: true })
@Index()
platformRole: 'admin' | null;
```
- Default `null`.
- Index để filter admin nhanh trong query.
- KHÔNG dùng enum DB (giữ string varchar cho linh hoạt khi mở rộng v2).

#### 5.2 Business entity (sửa)
File: [apps/api/src/modules/business/entities/business.entity.ts](apps/api/src/modules/business/entities/business.entity.ts)
```ts
@Column({ type: 'varchar', length: 20, default: 'active' })
status: 'active' | 'inactive';

@Column({ name: 'inactivated_at', type: 'timestamptz', nullable: true })
inactivatedAt: Date | null;

@Column({ name: 'inactivated_by', type: 'uuid', nullable: true })
inactivatedBy: string | null;  // FK users.id (admin who did it)

@Column({ name: 'inactive_reason', type: 'text', nullable: true })
inactiveReason: string | null;
```

#### 5.3 User entity (sửa thêm)
```ts
@Column({ name: 'is_disabled', type: 'boolean', default: false })
isDisabled: boolean;

@Column({ name: 'disabled_at', type: 'timestamptz', nullable: true })
disabledAt: Date | null;
```
- `isDisabled = true` → bị admin disable, không login được.

#### 5.4 Migrations
- `1777500000000-AddUserPlatformRole.ts` — add column `platform_role`, index.
- `1777500001000-AddBusinessStatus.ts` — add `status` (default 'active'), `inactivated_at`, `inactivated_by`, `inactive_reason`.
- `1777500002000-AddUserDisabled.ts` — add `is_disabled`, `disabled_at`.

### FR-2 Auth flow

#### 5.5 Login response → routing decision (FE)
Sau login success, FE đọc `user.platformRole`:
- `'admin'` → `navigate('/admin')`. Skip onboarding, không check `currentBusinessId`.
- `null` (user thường) → giữ flow cũ: `currentBusinessId ? '/dashboard' : '/onboarding'`.

#### 5.6 Disable user check (BE)
Auth service kiểm tra `user.isDisabled` trong `validateLogin()`:
- `true` → return 401 `{ message: 'Account disabled' }`.

#### 5.7 Inactive business gate + Admin route isolation (FE)
Component `<ProtectedRoute>` (wrap routes business-scoped: `/dashboard`, `/data-sheets`, `/departments`, `/profile`...):
1. Render children chỉ khi:
   - User đã login.
   - `user.platformRole === 'admin'` → **redirect về `/admin`** (admin KHÔNG vào được business routes, kể cả `/profile`).
   - Else: `currentBusinessId` exists. Nếu null → redirect `/onboarding`.
2. Trong layout business: query `business(currentBusinessId)`.
   - Nếu `status === 'inactive'` → render `<BusinessInactivePage>` thay children.

Component `<AdminRoute>` (wrap routes `/admin/*`):
- `user.platformRole === 'admin'` → render children.
- Else → redirect `/dashboard` hoặc `/auth/login`.

#### 5.8 BusinessInactivePage (FE component mới)
File: `apps/web/src/pages/business-inactive-page.tsx`
- Hiển thị: tên business, lý do (`inactiveReason`), thời gian inactivate, banner "Liên hệ admin".
- Actions:
  - Nút **Switch business** (nếu user là member của business khác active) → modal switcher.
  - Nút **Logout**.

### FR-3 Admin GraphQL API

File schema: regenerate `apps/api/src/schema.gql`.

#### 5.9 Queries
```graphql
type AdminBusinessRow {
  id: ID!
  name: String!
  industry: String!
  ownerEmail: String!
  memberCount: Int!
  status: String!  # 'active' | 'inactive'
  inactivatedAt: DateTime
  inactiveReason: String
  createdAt: DateTime!
}

type AdminBusinessListResult {
  rows: [AdminBusinessRow!]!
  total: Int!
}

type AdminUserRow {
  id: ID!
  email: String!
  fullName: String!
  platformRole: String  # 'admin' | null
  isDisabled: Boolean!
  businessCount: Int!
  lastLoginAt: DateTime
  createdAt: DateTime!
}

type AdminUserListResult {
  rows: [AdminUserRow!]!
  total: Int!
}

type AdminUserBusinessMembership {
  businessId: ID!
  businessName: String!
  role: String!  # owner | manager | staff | viewer
  joinedAt: DateTime!
}

type AdminUserDetail {
  id: ID!
  email: String!
  fullName: String!
  phone: String
  avatarUrl: String
  language: String!
  bio: String
  emailVerified: Boolean!
  isDisabled: Boolean!
  platformRole: String  # 'admin' | null
  createdAt: DateTime!
  lastLoginAt: DateTime
  memberships: [AdminUserBusinessMembership!]!
}

type AdminMetrics {
  totalBusinesses: Int!
  activeBusinesses: Int!
  inactiveBusinesses: Int!
  totalUsers: Int!
  newBusinessesLast30d: Int!
  newUsersLast30d: Int!
}

extend type Query {
  adminBusinesses(filter: AdminBusinessFilter, page: PageInput): AdminBusinessListResult!
  adminUsers(filter: AdminUserFilter, page: PageInput): AdminUserListResult!
  adminUserDetail(id: ID!): AdminUserDetail!
  adminMetrics: AdminMetrics!
  adminAuditLog(filter: AuditLogFilter, page: PageInput): AuditLogListResult!
}
```

#### 5.10 Mutations
```graphql
extend type Mutation {
  inactivateBusiness(id: ID!, reason: String!): AdminBusinessRow!
  reactivateBusiness(id: ID!): AdminBusinessRow!
  disableUser(id: ID!): AdminUserRow!
  enableUser(id: ID!): AdminUserRow!
}
```

#### 5.11 Authorization
- Mọi resolver admin: `@UseGuards(JwtAuthGuard, PlatformAdminGuard)`.
- `PlatformAdminGuard` check `request.user.platformRole === 'admin'`. Else 403.
- Admin KHÔNG thể `disableUser` chính mình (chống self-lockout). Trả 400 `{ message: 'Cannot disable yourself' }`.

### FR-4 FE — admin pages

#### 5.12 Routes mới (apps/web/src/app/app.tsx)
```
/admin                 → AdminDashboardPage   (metrics)
/admin/businesses      → AdminBusinessesPage  (table)
/admin/users           → AdminUsersPage       (table)
/admin/audit           → AdminAuditLogPage    (table)
```
Tất cả wrap trong `<AdminRoute>` (check `user.platformRole === 'admin'` else redirect `/auth/login`).

**Admin KHÔNG có profile page CHO CHÍNH MÌNH** — không có gì để edit (không thuộc business, không có department, role cố định). Sidebar bottom chỉ avatar + email + Logout.

**Admin truy cập `/profile`** → `<ProtectedRoute>` redirect về `/admin` (admin không vào được route business-scoped, kể cả profile).

**Admin VẪN xem được detail profile của user thường** (read-only) — qua AdminUsersPage click row → drawer (xem 5.15). KHÔNG mở route `/profile/:userId` — chỉ drawer trong page admin.

#### 5.13 AdminSidebar (FE component mới)
File: `apps/web/src/components/layout/admin-sidebar.tsx`
- Pattern giống `Sidebar` hiện có.
- Items: Dashboard / Businesses / Users / Audit. Bottom: avatar + initial của admin (tooltip = email) + nút **Logout**. KHÔNG có link tới profile page.
- `Sidebar` (orchestrator) dispatch theo `user.platformRole`:
  ```tsx
  return user?.platformRole === 'admin' ? <AdminSidebar /> : <BusinessSidebar />;
  ```

#### 5.14 AdminBusinessesPage
- Table cột: Name | Owner Email | Members | Status (tag) | Created | Actions.
- Filter: search by name/owner, filter status.
- Sort: name, createdAt, memberCount.
- Pagination: 20/page.
- Actions per row:
  - Status active → IconButton **Inactivate** (mở modal hỏi reason).
  - Status inactive → IconButton **Reactivate** (Popconfirm).
- Modal Inactivate: `Form.Item` cho reason (TextArea, required, max 500). Submit → mutation + toast.

#### 5.15 AdminUsersPage
- Table cột: Email | Full Name | Platform Role (tag) | Disabled | Businesses | Last Login | Actions.
- Filter: search email, filter isDisabled.
- Actions: Disable/Enable. (KHÔNG có Promote/Demote — v1 chỉ 1 admin)
- Disable nút Disable nếu là chính admin đang login (chống self-lockout).
- Click row → mở `<UserDetailDrawer>` hiển thị **read-only**:
  - Personal: email, fullName, phone, language, bio, avatar, createdAt, lastLoginAt, isDisabled.
  - Memberships: list businesses user đang thuộc + role mỗi biz.
  - KHÔNG cho edit field nào — admin chỉ view + dùng button Disable/Enable từ drawer.
- Query mới `adminUserDetail(id: ID!): AdminUserDetail` (lazy load khi mở drawer).

#### 5.16 AdminAuditLogPage
- Reuse module audit hiện có nếu đã có; nếu chưa có audit table thì spec ở v1 tạm rỗng (placeholder), audit chính thức làm sau.
- Filter: actor email, action type, date range.
- Cột: Timestamp | Actor | Action | Target | Details.

#### 5.17 AdminDashboardPage
- 6 stat cards: total biz / active biz / inactive biz / total user / new biz 30d / new user 30d.
- 1 line chart 30d: new businesses + new users daily.
- Reuse component card pattern hiện có.

### FR-5 Inactivation side effects

#### 5.18 BE behavior khi inactivate
1. Update `businesses.status='inactive'`, `inactivated_at=now()`, `inactivated_by=adminUserId`, `inactive_reason=text`.
2. **KHÔNG** force logout — user vẫn giữ session, gate ở route level (xem 5.7).
3. Ghi audit log entry `{ action: 'business.inactivate', actor, target: businessId, meta: { reason } }`.
4. (Optional v2) Send email notify owner + members.

#### 5.19 FE behavior khi user đang ở trong biz lúc nó bị inactivate
- User đang ở `/dashboard`, admin inactivate biz đó.
- Lần navigate kế tiếp: route guard query `business(id)` → `status==='inactive'` → render `<BusinessInactivePage>`.
- WebSocket realtime push (out of scope v1) — v1 chấp nhận user thấy thay đổi sau next route change/refresh.

### FR-6 i18n

Thêm namespace mới `admin.json` (en + vi) trong `libs/i18n/src/locales/`:
- `admin:title`, `admin:nav_dashboard`, `admin:nav_businesses`, `admin:nav_users`, `admin:nav_audit`.
- `admin:business_inactivate_title`, `admin:business_inactivate_reason_label`, `admin:business_inactivate_confirm`.
- `admin:user_disable_confirm`, `admin:user_promote_confirm`, `admin:user_cannot_demote_last`.
- `admin:business_inactive_page_title` ("Doanh nghiệp này đang đóng"), `admin:business_inactive_page_desc`, `admin:business_inactive_switch`, `admin:business_inactive_logout`.

## 6. Yêu cầu phi chức năng

| Mã | Yêu cầu |
|---|---|
| NFR-1 | Tất cả admin queries phải paginate (default 20, max 100) — tránh load full table. |
| NFR-2 | `PlatformAdminGuard` check ở mọi resolver admin — KHÔNG rely vào FE để hide route. |
| NFR-3 | Audit log ghi mọi mutation admin (inactivate, reactivate, disable, enable, promote, demote). |
| NFR-4 | UI: pattern Form.Item shouldUpdate + getFieldValue cho readonly fields (đồng bộ với pattern hiện có). |
| NFR-5 | i18n: KHÔNG hardcode text. Mọi string dùng `t('admin:...')`. |
| NFR-6 | Test coverage: tối thiểu 80% cho `PlatformAdminGuard`, `inactivateBusiness` resolver, `<BusinessInactivePage>` route guard, `<AdminBusinessesPage>` mutation flow. |
| NFR-7 | Migrations idempotent — `IF NOT EXISTS` cho add column, default `'active'` cho row hiện có (không break data cũ). |

## 7. Permissions matrix

| Hành động | Admin | Owner | Manager | Staff/Viewer |
|---|---|---|---|---|
| Login khi `isDisabled=true` | ❌ | ❌ | ❌ | ❌ |
| Vào /admin | ✅ | ❌ | ❌ | ❌ |
| Vào dashboard biz active | (skip) | ✅ | ✅ | ✅ |
| Vào dashboard biz inactive | (skip — admin xem qua /admin/businesses) | ❌ (closed page) | ❌ | ❌ |
| Inactivate biz | ✅ | ❌ | ❌ | ❌ |
| Reactivate biz | ✅ | ❌ | ❌ | ❌ |
| Disable user | ✅ (trừ chính mình) | ❌ | ❌ | ❌ |
| Edit business profile (name, logo...) | ❌ | ✅ | ❌ | ❌ |

## 8. Database migration plan

### Order
1. `AddUserPlatformRole` (additive, default null) — không break user hiện tại.
2. `AddBusinessStatus` (additive, default 'active') — không break biz hiện tại.
3. `AddUserDisabled` (additive, default false) — không break user hiện tại.

### Rollback
Mỗi migration có `down()` drop column. An toàn rollback nếu cần.

### Seed admin (manual, ghi vào `docs/QUICK-START.md`)
```sql
UPDATE users SET platform_role = 'admin' WHERE email = '<your-email>';
```
Hệ thống chỉ có duy nhất 1 admin trong v1. Nếu cần đổi admin → SQL update tương tự.

## 9. Acceptance criteria

| ID | Criteria | Method |
|---|---|---|
| AC-1 | User có `platformRole='admin'` login → redirect `/admin`. User thường giữ flow cũ. | E2E |
| AC-2 | Admin gọi `adminBusinesses` → trả tất cả biz kèm metadata. User thường gọi → 403. | API test |
| AC-3 | Admin click Inactivate → modal hiện → submit reason → mutation success → row trong table chuyển status `Inactive`. | E2E |
| AC-4 | User là member của biz `inactive` truy cập `/dashboard` → render `<BusinessInactivePage>` (không phải dashboard). | E2E |
| AC-5 | User multi-biz (1 biz inactive, 1 biz active) login → vào active biz bình thường. Switch sang inactive biz → closed page. | E2E |
| AC-6 | Admin disable chính mình → mutation trả 400 "Cannot disable yourself". | API test |
| AC-7 | Disabled user login → 401 "Account disabled". | API test |
| AC-8 | Mutation `promoteUserToAdmin` không tồn tại trong schema (out of scope v1). | Schema introspection |
| AC-9 | Migrations chạy trên DB có sẵn data → tất cả biz có `status='active'`, tất cả user có `platform_role=null`, `is_disabled=false`. | Migration test |
| AC-10 | Audit log có entry cho mỗi mutation admin (inactivate, promote, disable...). | Integration test |

## 10. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Admin lỡ tay inactivate biz lớn | Cao (data inaccessible) | Modal confirm + bắt nhập tên biz để xác nhận (giống delete pattern). Reactivate easy. |
| Admin self-disable | Cao (lock-out) | Guard BE chặn admin disable chính mình. UI disable nút Disable trên row của chính admin. |
| FE quên check status → user vẫn dùng được biz inactive | Trung | Centralized `<BusinessGuard>` ở layout, không scatter check ở từng page. Test E2E AC-4. |
| Privilege escalation qua manipulate JWT | Cao | `PlatformAdminGuard` đọc `platformRole` từ JWT payload (server-signed). KHÔNG trust FE state. |
| User bị disable nhưng JWT cũ vẫn valid | Trung | Sau `disableUser`, revoke tất cả refresh tokens + sessions của user đó. Access token JWT có lag tối đa = JWT expiry (30m). |
| Audit log table chưa có | Thấp | Check codebase trước impl; nếu chưa có, spec audit ở phase riêng. |

### Threat model — Inactive business v1 limitation

Inactive business gating is FE-only in v1 (`BusinessGuard` renders closed page). A member with browser devtools can still call business-scoped GraphQL mutations (e.g., `createWidget`, `updateDataSheet`) directly, since the BE doesn't check `business.status` in those resolvers.

**Mitigation v2:** Add a `BusinessActiveGuard` BE-side that loads the business and rejects mutations if `status = 'inactive'`. Apply to all mutations under business-scoped resolvers.

**v1 acceptable because:** users without devtools knowledge are blocked correctly; inactivation is rare and reversible; no permanent data loss possible (`status` is just a flag that can be reset by admin). The guard fires on next route navigation for regular browser sessions.

## 11. JWT & session impact

- JWT payload thêm `platformRole` (set 1 lần lúc login dựa vào DB).
- Khi `disableUser` → revoke tất cả refresh tokens + active sessions của user đó qua `RefreshTokenService.revokeAllForUser(userId)`.
- Access token JWT của user bị disable có lag tối đa = JWT expiry (30m) — chấp nhận được vì sau đó refresh sẽ fail.

## 12. Test strategy

### Unit
- `PlatformAdminGuard` — mock JWT payload variants (admin / null / missing).
- `BusinessService.inactivate` / `.reactivate` — happy path + invalid id + double-inactivate.
- `UserService.promote` / `.demote` — happy path + last-admin-guard.

### Integration
- Login flow với `isDisabled=true` → 401.
- `adminBusinesses` query — pagination, filter, RBAC.
- `inactivateBusiness` mutation → DB updated + audit logged.

### E2E (Playwright nếu có, hoặc browser test thủ công cho v1)
- AC-1 đến AC-10 ở mục 9.

## 13. Implementation phases (gợi ý, để file plan riêng)

1. **Phase 1 — Data + Auth foundation:** migrations, entity/DTO, JWT payload, login flow, `PlatformAdminGuard`. Manual SQL seed admin.
2. **Phase 2 — Admin business mgmt:** `adminBusinesses` query, `inactivateBusiness`/`reactivateBusiness` mutation, FE `<AdminBusinessesPage>` + sidebar dispatch.
3. **Phase 3 — Inactive gate (FE):** `<BusinessGuard>` ở layout, `<BusinessInactivePage>`, switch business action.
4. **Phase 4 — User mgmt:** `adminUsers` query, disable/enable/promote/demote mutations, FE `<AdminUsersPage>`.
5. **Phase 5 — Dashboard + Audit:** `adminMetrics`, audit log integration, FE pages.
6. **Phase 6 — i18n + tests + docs sync.**

## 14. Resolved decisions

- [x] **Audit log:** Check module `audit/` lúc implement. Reuse nếu schema đủ; thêm migration nếu thiếu cột.
- [x] **Notification email khi inactivate:** **Defer v2.** v1 không gửi email; member biết qua trang closed lúc vào app.
- [x] **Inactive biz trong `myBusinesses`:** **Show.** Trả cả biz inactive với flag `status`. FE render badge "Đang đóng" cho biz inactive trong dropdown switcher; click → trang closed page.
- [x] **Rate limit admin mutations:** **Không cần.** Tin admin, không giới hạn.

## 15. References

- Existing roles: [libs/shared/constants/src/role.constants.ts](../libs/shared/constants/src/role.constants.ts)
- User entity: [apps/api/src/modules/auth/entities/user.entity.ts](../apps/api/src/modules/auth/entities/user.entity.ts)
- Business entity: [apps/api/src/modules/business/entities/business.entity.ts](../apps/api/src/modules/business/entities/business.entity.ts)
- Sidebar: [apps/web/src/components/layout/sidebar.tsx](../apps/web/src/components/layout/sidebar.tsx)
- Auth flow: [apps/api/src/modules/auth/](../apps/api/src/modules/auth/)
