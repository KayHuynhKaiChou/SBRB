# SBRB Design Guidelines

## Brand Colors

### Primary Color Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary Red | `#D72A44` | rgb(215, 42, 68) | Buttons, active states, CTAs |
| Dark Gray | `#2C3E50` | rgb(44, 62, 80) | Text, headings, dark backgrounds |
| Light Gray | `#ECF0F1` | rgb(236, 240, 241) | Backgrounds, borders, disabled states |
| White | `#FFFFFF` | rgb(255, 255, 255) | Card backgrounds, overlays |
| Success Green | `#27AE60` | rgb(39, 174, 96) | Success messages, checkmarks |
| Warning Orange | `#F39C12` | rgb(243, 156, 18) | Warnings, alerts, caution states |
| Error Red | `#E74C3C` | rgb(231, 76, 60) | Errors, destructive actions |

### Semantic Usage

```typescript
// apps/web/src/theme/colors.ts
export const COLORS = {
  primary: '#D72A44',
  secondary: '#2C3E50',
  background: '#FFFFFF',
  surface: '#ECF0F1',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#BDC3C7',
  disabled: '#ECF0F1',
};
```

## Component Design Standards

### Typography

| Element | Font | Size | Weight | Line-Height |
|---------|------|------|--------|-------------|
| Heading H1 | Inter | 32px | 700 | 1.2 |
| Heading H2 | Inter | 24px | 700 | 1.3 |
| Heading H3 | Inter | 20px | 600 | 1.4 |
| Body Text | Inter | 14px | 400 | 1.5 |
| Small Text | Inter | 12px | 400 | 1.4 |
| Button Text | Inter | 14px | 600 | 1 |
| Code/Monospace | Fira Code | 12px | 400 | 1.6 |

**Font Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Spacing & Layout

```css
/* 8px baseline spacing system */
.spacing-xs  { margin: 4px; }    /* xs: 4px */
.spacing-sm  { margin: 8px; }    /* sm: 8px (1x) */
.spacing-md  { margin: 16px; }   /* md: 16px (2x) */
.spacing-lg  { margin: 24px; }   /* lg: 24px (3x) */
.spacing-xl  { margin: 32px; }   /* xl: 32px (4x) */
.spacing-2xl { margin: 48px; }   /* 2xl: 48px (6x) */
```

### Button Styles

**Primary Button (CTA)**
- Shape: Rounded rectangle, 40px height
- Background: `#D72A44` (Primary Red)
- Text: White, 14px bold, center-aligned
- Padding: 10px 20px (inside 40px container)
- Border: None
- Hover: `#B8213D` (darken 15%)
- Active: `#9B1A35` (darken 25%)
- Disabled: Gray background `#BDC3C7`, 50% opacity, no interaction

```tsx
// Component example
<Button
  size="large"
  type="primary"
  style={{
    height: '40px',
    background: '#D72A44',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    padding: '10px 20px',
  }}
>
  Create Widget
</Button>
```

**Secondary Button**
- Background: Transparent
- Border: 1px solid `#D72A44`
- Text: `#D72A44`, 14px bold
- Hover: Light red background `#FDE8EC`

**Tertiary Button**
- Background: Transparent
- Border: None
- Text: `#D72A44`, 14px
- Hover: Gray background `#ECF0F1`
- Use for: Inline actions, cancel buttons, navigation

### Input Fields

**Standard Input Height:** 36px

```tsx
// libs/ui/components/input.tsx
export const Input: FC<InputProps> = (props) => (
  <input
    {...props}
    style={{
      height: '36px',
      padding: '8px 12px',
      border: '1px solid #BDC3C7',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      outline: 'none',
      transition: 'border 200ms ease',
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = '#D72A44';
      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(215, 42, 68, 0.1)';
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = '#BDC3C7';
      e.currentTarget.style.boxShadow = 'none';
    }}
  />
);
```

**Input States:**
- Default: Border `#BDC3C7`, background white
- Focus: Border `#D72A44`, shadow `0 0 0 2px rgba(215, 42, 68, 0.1)`
- Error: Border `#E74C3C`, red error text below
- Disabled: Background `#ECF0F1`, text `#95A5A6`, no interaction

### Modal & Overlay

**Modal Window:**
- Background: White
- Border-radius: 8px
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`
- Overlay: `rgba(0, 0, 0, 0.5)` (dim background)
- Padding: 24px (md spacing)
- Two-column layout (Settings Panel | Chart Panel)
  - Each column: 50% width, separated by 1px divider
  - Min width: 1200px (responsive reduces on tablet)

### Toast / Notification Positioning

**Fixed Position (bottom-right, z-index 9999):**

```tsx
const toastPositions = {
  success: { bottom: '24px', right: '24px', backgroundColor: '#27AE60' },
  error: { bottom: '24px', right: '24px', backgroundColor: '#E74C3C' },
  warning: { bottom: '24px', right: '24px', backgroundColor: '#F39C12' },
  info: { bottom: '24px', right: '24px', backgroundColor: '#3498DB' },
};
```

Duration: 3 seconds (auto-dismiss)

**Toast Content:**
- Icon (left) + Message (center) + Close button (right)
- Icon: 20px, aligned vertically center
- Message: White text, 14px
- Close: `×` button, transparent, 20px
- Padding: 16px
- Border-radius: 4px

### Chart Colors

**Default Chart Color Palette (Chart.js):**

```typescript
// libs/shared/constants/chart-colors.ts
export const CHART_COLORS = {
  primary: ['#D72A44', '#3498DB', '#27AE60', '#F39C12', '#9B59B6'],
  // Usage: Line chart series colors
  background: [
    'rgba(215, 42, 68, 0.1)',
    'rgba(52, 152, 219, 0.1)',
    'rgba(39, 174, 96, 0.1)',
    'rgba(243, 156, 18, 0.1)',
    'rgba(155, 89, 182, 0.1)',
  ],
  // Usage: Bar chart, area under line
  border: [
    '#D72A44',
    '#3498DB',
    '#27AE60',
    '#F39C12',
    '#9B59B6',
  ],
  // Usage: Line chart borders
};

export const CHART_CONFIG_DEFAULTS = {
  type: 'line' | 'bar' | 'pie' | 'area',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: { mode: 'index' as const },
  },
  scales: {
    y: { beginAtZero: true },
  },
};
```

## Responsive Design

### Breakpoints

| Device | Min Width | Max Width | Priority |
|--------|-----------|-----------|----------|
| Mobile | 320px | 767px | Support only for Tablet landscape later |
| Tablet | 768px | 1279px | Landscape support (Phase 3) |
| Desktop | 1280px | 2560px | **Primary target (Phase 2)** |

**Phase 2 Approach:** Desktop-first (≥ 1280px)
**Phase 3+:** Add tablet landscape & responsive adjustments

### Canvas Responsive Behavior

```typescript
// apps/web/src/stores/canvas.store.ts
const VIEWPORT_WIDTH = window.innerWidth;
const CANVAS_SCALE = VIEWPORT_WIDTH < 1280 ? 0.75 : 1.0;

// Viewport zoom: Scroll into canvas (no responsive resize)
// Widget count cap: 50 per tab (regardless of viewport)
// Widget min size: 800×400px (fixed, not responsive in Phase 2)
```

## Accessibility Standards (a11y)

**WCAG 2.1 Level AA Compliance:**

- Color contrast: Minimum 4.5:1 for text (pass with current palette)
- Interactive elements: Minimum 44×44px touch target (36px height input meets this)
- Keyboard navigation: Tab through modals, buttons, inputs
- Focus indicators: Visible 2px outline on all interactive elements
- Screen reader: Semantic HTML (`<button>`, `<label>`, `<main>`, `<nav>`)
- ARIA labels: Required on icon-only buttons, charts, custom widgets

```tsx
// ✓ GOOD: Accessible button
<button
  aria-label="Close widget settings"
  onClick={handleClose}
  style={{
    width: '40px',
    height: '40px',
    border: '2px solid transparent',
  }}
  onFocus={(e) => {
    e.currentTarget.style.outline = '2px solid #D72A44';
    e.currentTarget.style.outlineOffset = '2px';
  }}
>
  ×
</button>
```

## Dark Mode (Future Phase)

Not in Phase 2. Planned for Phase 3 (with light/dark toggle).

**Dark color scheme (placeholder for Phase 3):**

| Component | Light | Dark |
|-----------|-------|------|
| Background | `#FFFFFF` | `#1A1A1A` |
| Surface | `#ECF0F1` | `#2D2D2D` |
| Text | `#2C3E50` | `#E0E0E0` |
| Primary | `#D72A44` | `#FF4D66` (lighter shade) |

---

## New UI Components (Phase 2C+)

### IconButton (Ghost Variant - MANDATORY)

All icon-only buttons MUST use the IconButton component with ghost variant.

**Specification:**
- Button type: `type="text"` (Ant Design)
- Shape: `shape="circle"` (Ant Design)
- Size: 32px, 40px, or 48px (width & height)
- Background: BRAND_LIGHT (#F5E8EA) on hover
- Icon color: BRAND (#D72A44) default, white on hover
- Tooltip: Always include a title/tooltip for accessibility
- No text label (icon only)

**Example:**
```tsx
<IconButton
  icon={<EditOutlined />}
  tooltip="Edit widget"
  onClick={handleEdit}
  size={40}
/>
```

**When to Use:**
- Widget edit/delete buttons
- Modal action buttons
- Tab management (add, rename, delete)
- Canvas zoom controls
- Header actions

### ModalActions (Footer Component - REQUIRED FOR MODALS)

Standard footer component for all modals. Replaces hardcoded button footers.

**Specification:**
- Array of action objects: { icon, tooltip, onClick, disabled }
- Actions are rendered as IconButtons in a row
- Primary action (save/confirm) appears FIRST
- Cancel/close action appears LAST
- Flex layout, right-aligned, 8px gap between buttons
- No text labels (icons only via tooltips)

**Example:**
```tsx
const actions = [
  { icon: <SaveOutlined />, tooltip: 'Save', onClick: handleSave },
  { icon: <CloseOutlined />, tooltip: 'Close', onClick: handleClose },
];
<ModalActions actions={actions} />
```

**Order Convention:**
1. Save / Confirm (first, primary)
2. Delete / Destructive (if needed)
3. Cancel / Close (last)

### FormModal (Generic Modal Wrapper - REQUIRED)

Standard wrapper for all form modals. Ensures consistency across the app.

**Specification:**
- closable={false} (no X button in top-right)
- footer={<ModalActions actions={...} />} (use ModalActions footer)
- Two-column layout optional (Settings | Chart)
- Max width: 960px (chart modal), 600px (form modal)
- Overlay opacity: 0.5
- Border radius: 8px

**Example:**
```tsx
<FormModal
  title="Create Widget"
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleCreate}
>
  <Form layout="vertical">
    <Form.Item label="Name">
      <Input placeholder="Widget name" />
    </Form.Item>
  </Form>
</FormModal>
```

---

## i18n: No Hardcoded Text (MANDATORY - Phase 2C+)

**Golden Rule:** All user-visible text MUST use `t()` with i18n keys. No hardcoded strings in JSX.

**Namespace Organization:**
- `common` — Generic: Save, Cancel, Close, Yes, No, Loading, Error
- `auth` — Login, signup, password, verification, OAuth
- `dashboard` — Tabs, canvas, workspace, dashboard-level actions
- `widget` — Widget config, chart types, data series, colors
- `datasheet` — Import, sheets, series, upload, export
- `member` — Users, roles, invitations, permissions

**Usage Pattern:**
```typescript
import { useTranslation } from '@sbrb/i18n';

export const WidgetModal: FC = () => {
  const { t } = useTranslation('widget');

  return (
    <FormModal
      title={t('title')}
      onSubmit={handleSave}
    >
      <Form.Item label={t('fields.name')}>
        <Input placeholder={t('fields.namePlaceholder')} />
      </Form.Item>
      <Form.Item label={t('fields.chartType')}>
        <Select>
          <Select.Option value="line">{t('chartTypes.line')}</Select.Option>
          <Select.Option value="bar">{t('chartTypes.bar')}</Select.Option>
        </Select>
      </Form.Item>
    </FormModal>
  );
};
```

**Locale File Structure:**
```json
{
  "title": "Widget Settings",
  "fields": {
    "name": "Widget Name",
    "namePlaceholder": "Enter widget name",
    "chartType": "Chart Type"
  },
  "chartTypes": {
    "line": "Line Chart",
    "bar": "Bar Chart",
    "area": "Area Chart",
    "doughnut": "Doughnut Chart"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

---

## Component Library

**Primary UI Library:** Ant Design 5 (version 5.x)

- Button, Input, Modal, Select, DatePicker, Table, Form components
- WCAG AA compliant components by default
- Tailwind CSS overrides for custom styling (primary red #D72A44)
- Custom components in `libs/ui/`: IconButton, ModalActions, FormModal
- Used in both web (React 18) and future desktop (Electron) apps

---

**Document Version:** 2.3 | **Last Updated:** 2026-03-28 | **Design Lead:** UI/UX Team
