# SBRB Code Standards & Best Practices

## File Organization & Naming

### Naming Convention

- **File names:** kebab-case (e.g., `widget-position-validator.ts`)
- **Folder names:** kebab-case (e.g., `shared/utils/collision-detection/`)
- **Exports:** Named exports (avoid default exports in libraries)
- **Type files:** `*.ts` for code, `*.d.ts` for type-only declarations
- **React components:** PascalCase component files if exporting component (e.g., `WidgetCard.tsx`)

**Rationale:** LLM tools (grep, search) need descriptive names to infer file purpose without reading content.

### File Size Limits

| File Type | Max LOC | Guidance |
|-----------|---------|----------|
| Logic/Service | 200 | Split at function count or responsibility |
| React Component | 150 | Extract hooks, sub-components, styled elements |
| API Resolver | 100 | Move validation to DTO, business logic to service |
| Test File | 300 | OK to be larger; use describe blocks for organization |
| Config File | No limit | OK as-is (JSON, YAML, .env) |
| Markdown | No limit | OK for docs |

**Modularization Example (BAD → GOOD):**

```typescript
// BAD: 350 LOC widget.service.ts (everything)
class WidgetService {
  create() { ... }
  update() { ... }
  validateCollision() { ... 50 lines }
  snapToGrid() { ... 30 lines }
  getChartData() { ... 80 lines }
}

// GOOD: Split by concern
// widget.service.ts (80 LOC) — CRUD only
// widget-validator.service.ts (50 LOC) — Collision, snap
// widget-chart.service.ts (60 LOC) — Data aggregation
```

## TypeScript Standards

### Strict Mode (Enforced)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### Types & Interfaces

```typescript
// ✓ GOOD: Named exports, clear purposes
// libs/shared/types/widget.dto.ts
export interface WidgetPosition {
  x: number;      // Pixel coordinate, must be >= 0
  y: number;
  w: number;      // Width, height; min 800, max 1600
  h: number;
}

export class UpdateWidgetDto {
  @IsNumber() x: number;
  @IsNumber() y: number;
  @IsNumber() w: number;
  @IsNumber() h: number;
}

// ✓ GOOD: JSDoc for complex logic
/**
 * Detects if two widget bounding boxes overlap (collision).
 * @param a Widget A's bounding box
 * @param b Widget B's bounding box
 * @returns true if bounding boxes intersect (inclusive border)
 */
export function hasCollision(a: BBox, b: BBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ✗ BAD: Any types, unclear purpose
function validate(data: any): any { }
```

### Code Style

```typescript
// Indentation: 2 spaces (not tabs)
// Line length: 100 chars (hard limit 120)

// ✓ Arrow functions preferred
const sum = (a: number, b: number) => a + b;

// ✓ Async/await over .then() chains
async function fetchWidget(id: string) {
  const response = await api.get(`/widgets/${id}`);
  return response.data;
}

// ✓ Early returns, avoid deep nesting
if (!user) return null;
if (!user.roles.includes('owner')) throw new ForbiddenException();
// Main logic here (not nested 3 levels deep)

// ✓ Destructure parameters where possible
function updateWidget({ id, x, y, w, h }: UpdateWidgetDto) { }

// ✗ Avoid: Very long lines, nested conditions
if (user && user.roles && user.roles.length > 0 && user.roles.some(r => r === 'owner')) { }
```

## NX Monorepo Rules

### Import Paths (Path Aliases)

```typescript
// ✓ GOOD: Use path aliases
import { WidgetPosition } from '@sbrb/shared/types';
import { SNAP_GRID } from '@sbrb/shared/constants';
import { hasCollision } from '@sbrb/shared/utils';
import { Button } from '@sbrb/ui';

// ✗ BAD: Relative imports across packages
import { WidgetPosition } from '../../../libs/shared/types/widget.dto';
```

### Dependency Boundaries (NX)

```
✓ ALLOWED imports:
┌─────────────────────────────┐
│  apps/web                   │
│  ├─ libs/shared/types       │ (types only, no runtime)
│  ├─ libs/shared/constants   │ (constants)
│  ├─ libs/shared/utils       │ (pure functions)
│  ├─ libs/ui                 │ (React components)
│  └─ libs/i18n               │ (translations)
└─────────────────────────────┘

┌─────────────────────────────┐
│  apps/api                   │
│  ├─ libs/shared/types       │
│  ├─ libs/shared/constants   │
│  ├─ libs/shared/utils       │
│  └─ @nestjs/*, TypeORM      │
└─────────────────────────────┘

✗ FORBIDDEN imports:
- apps/web ← apps/api (API must not depend on React)
- apps/api ← apps/web (Web must not depend on NestJS)
- libs/ui ← apps/api (Backend must not use React UI)
```

Enforce with `nx.json`:

```json
{
  "projects": {
    "web": {
      "tags": ["scope:frontend", "type:app"]
    },
    "api": {
      "tags": ["scope:backend", "type:app"]
    },
    "shared/types": {
      "tags": ["scope:shared", "type:lib"]
    }
  },
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "libs"
  }
}
```

## React Best Practices

### Component Structure

```typescript
// ✓ GOOD: Clear component organization
// apps/web/src/components/widget-card.tsx

import { FC, memo } from 'react';
import { WidgetPosition } from '@sbrb/shared/types';
import { Button } from '@sbrb/ui';

interface WidgetCardProps {
  id: string;
  position: WidgetPosition;
  onEdit: (id: string) => void;
}

export const WidgetCard: FC<WidgetCardProps> = memo(({ id, position, onEdit }) => {
  return (
    <div style={{ left: position.x, top: position.y, width: position.w }}>
      <h3>{id}</h3>
      <Button onClick={() => onEdit(id)}>Edit</Button>
    </div>
  );
});

WidgetCard.displayName = 'WidgetCard';
```

### Hooks & State Management

```typescript
// ✓ GOOD: Zustand store for canvas state
// libs/ui/stores/canvas.store.ts
import { create } from 'zustand';

interface CanvasState {
  widgets: Widget[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  moveWidget: (id: string, x: number, y: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  widgets: [],
  selected: null,
  setSelected: (id) => set({ selected: id }),
  moveWidget: (id, x, y) => set((state) => ({
    widgets: state.widgets.map((w) => w.id === id ? { ...w, x, y } : w),
  })),
}));

// ✓ GOOD: Custom hooks for side effects
const useFetchWidget = (id: string) => {
  const [data, setData] = useState<Widget | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apollo.query({ query: GET_WIDGET, variables: { id } });
        setData(res.data.widget);
      } catch (e) {
        setError(e as Error);
      }
    };
    fetchData();
  }, [id]);

  return { data, error };
};
```

## NestJS Backend Standards

### Module Structure

```
apps/api/src/modules/widget/
├── widget.module.ts           # Module definition
├── widget.controller.ts        # REST endpoints (if needed)
├── widget.resolver.ts          # GraphQL resolvers
├── widget.service.ts           # Business logic
├── dto/
│   ├── create-widget.input.ts
│   └── update-widget.input.ts
├── entities/
│   └── widget.entity.ts        # TypeORM entity
├── guards/
│   └── widget-access.guard.ts
└── widget.spec.ts              # Jest tests
```

### Service Layer

```typescript
// ✓ GOOD: Single responsibility, validation in DTO
import { Injectable } from '@nestjs/common';
import { UpdateWidgetDto } from './dto/update-widget.input';
import { WidgetRepository } from './widget.repository';
import { CollisionService } from '@sbrb/shared/utils';

@Injectable()
export class WidgetService {
  constructor(
    private readonly widgetRepository: WidgetRepository,
    private readonly collisionService: CollisionService,
  ) {}

  async updatePosition(id: string, input: UpdateWidgetDto) {
    // Validation is in DTO (class-validator)
    // Collision check (shared utils)
    const existing = await this.widgetRepository.findAll(input.tabId);
    const hasConflict = existing.some((w) =>
      this.collisionService.hasCollision(w.bbox, input.bbox),
    );
    if (hasConflict) throw new ConflictException('Widget collision');

    return this.widgetRepository.update(id, input);
  }
}
```

### GraphQL Resolvers

```typescript
// ✓ GOOD: Minimal resolver, delegate to service
@Resolver(() => WidgetType)
export class WidgetResolver {
  constructor(private readonly widgetService: WidgetService) {}

  @Query(() => [WidgetType])
  @UseGuards(JwtAuthGuard)
  async widgets(@Args('tabId') tabId: string, @CurrentUser() user: UserPayload) {
    return this.widgetService.findByTab(tabId, user.businessId);
  }

  @Mutation(() => WidgetType)
  @UseGuards(JwtAuthGuard)
  async updateWidget(
    @Args('id') id: string,
    @Args('input') input: UpdateWidgetInput,
    @CurrentUser() user: UserPayload,
  ) {
    return this.widgetService.updatePosition(id, input, user);
  }
}
```

## Error Handling

```typescript
// ✓ GOOD: Typed error handling, clear messages
export class WidgetNotFoundError extends Error {
  constructor(widgetId: string) {
    super(`Widget ${widgetId} not found`);
    this.name = 'WidgetNotFoundError';
  }
}

export class CollisionError extends Error {
  constructor(public readonly conflictingWidgetIds: string[]) {
    super(`Collision detected with widgets: ${conflictingWidgetIds.join(', ')}`);
    this.name = 'CollisionError';
  }
}

// Try-catch in services, convert to HTTP exceptions in resolvers
try {
  await this.widgetService.updatePosition(id, input);
} catch (e) {
  if (e instanceof WidgetNotFoundError) {
    throw new NotFoundException(e.message);
  }
  if (e instanceof CollisionError) {
    throw new ConflictException(e.message);
  }
  throw e; // Re-throw unknown errors
}
```

## Testing Standards

### Unit Test Example

```typescript
// widget.service.spec.ts
describe('WidgetService', () => {
  let service: WidgetService;
  let repository: MockRepository;

  beforeEach(() => {
    repository = { update: jest.fn() };
    service = new WidgetService(repository, new CollisionService());
  });

  it('should update widget position if no collision', async () => {
    repository.findAll.mockResolvedValue([]);
    const result = await service.updatePosition('w1', { x: 100, y: 200, w: 400, h: 300 });
    expect(repository.update).toHaveBeenCalled();
    expect(result.x).toBe(100);
  });

  it('should throw ConflictException if collision detected', async () => {
    repository.findAll.mockResolvedValue([{ x: 50, y: 50, w: 200, h: 200 }]);
    await expect(service.updatePosition('w1', { x: 100, y: 100, w: 200, h: 200 }))
      .rejects.toThrow(ConflictException);
  });
});
```

## Git & Commit Standards

### Branch Naming

```
feature/widget-drag-drop     # New feature
fix/collision-detection-bug  # Bug fix
refactor/split-widget-service # Code cleanup
test/add-canvas-unit-tests   # Tests only
docs/update-architecture     # Documentation only
```

### Commit Message Format (Conventional)

```
feat: add widget collision detection algorithm
- Implement AABB (Axis-Aligned Bounding Box) detection
- Add tests for edge cases (touching borders, contained)
- Update shared/utils/collision.ts module

fix: resolve widget position flicker on drag stop
- Apply position revert logic correctly in Zustand store
- Prevent multiple re-renders during collision check

docs: update architecture diagram for Phase 2
```

## Pre-Commit Checklist

- [ ] No TypeScript errors: `nx run-many --target=type-check`
- [ ] ESLint clean: `nx run-many --target=lint`
- [ ] Tests pass: `nx test <module>`
- [ ] No `console.log()` statements (use structured logging)
- [ ] No `.ts` or `.tsx` files over 200 LOC (except tests)
- [ ] All imports use path aliases (`@sbrb/*`)
- [ ] No `any` types in app code

---

**Document Version:** 2.2 | **Last Updated:** 2026-03-22 | **Maintainer:** Dev Team
