# SBRB UI Component Patterns

> Companion reference to [code-standards.md](./code-standards.md). Reusable UI building blocks (IconButton, ModalActions, FormModal) introduced in Phase 2C+. All icon-only buttons and modals MUST follow these patterns.

## IconButton (Ghost Variant)

```typescript
// libs/ui/components/IconButton.tsx
import { Button } from 'antd';

interface IconButtonProps {
  icon: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: 32 | 40 | 48;  // pixels
}

export const IconButton: FC<IconButtonProps> = ({
  icon,
  tooltip,
  onClick,
  disabled,
  size = 40,
}) => (
  <Button
    type="text"
    shape="circle"
    icon={icon}
    title={tooltip}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: size,
      height: size,
      backgroundColor: '#F5E8EA',  // BRAND_LIGHT
      color: '#D72A44',             // BRAND
    }}
  />
);

// ✓ GOOD: All icon-only buttons use IconButton
<IconButton icon={<EditOutlined />} tooltip="Edit widget" onClick={handleEdit} />

// ✗ BAD: Avoid raw buttons for icons
<Button icon={<EditOutlined />} />
```

**Rules:**
- All icon-only buttons MUST use IconButton
- Ghost variant: type="text", shape="circle"
- Background: BRAND_LIGHT (#F5E8EA) on hover
- Icon color: BRAND (#D72A44)
- Sizes: 32px (small), 40px (default), 48px (large)

## ModalActions (DRY Footer)

```typescript
// libs/ui/components/ModalActions.tsx
interface ModalActionItem {
  icon?: React.ReactNode;
  tooltip?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'default';
}

interface ModalActionsProps {
  actions: ModalActionItem[];  // save/confirm first, close/cancel last
}

export const ModalActions: FC<ModalActionsProps> = ({ actions }) => (
  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
    {actions.map((action, i) => (
      <IconButton
        key={i}
        icon={action.icon}
        tooltip={action.tooltip}
        onClick={action.onClick}
        disabled={action.disabled}
      />
    ))}
  </div>
);

// ✓ GOOD: DRY footer using ModalActions
const actions: ModalActionItem[] = [
  { icon: <SaveOutlined />, tooltip: 'Save', onClick: handleSave },
  { icon: <CloseOutlined />, tooltip: 'Close', onClick: handleClose },
];
<ModalActions actions={actions} />

// ✗ BAD: Duplicate action buttons in every modal
<footer>
  <button onClick={handleSave}>Save</button>
  <button onClick={handleClose}>Close</button>
</footer>
```

**Rules:**
- Primary action (save/confirm) appears first
- Cancel/close action appears last
- Use IconButton internally for consistency
- Array of actions passed as props (no JSX in modal)

## FormModal (Generic Wrapper)

```typescript
// libs/ui/components/FormModal.tsx
interface FormModalProps {
  title: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  children: React.ReactNode;  // Form inputs
}

export const FormModal: FC<FormModalProps> = ({
  title,
  visible,
  onClose,
  onSubmit,
  children,
}) => (
  <Modal
    title={title}
    open={visible}
    onCancel={onClose}
    closable={false}  // ← Required: no X button, use ModalActions
    footer={
      <ModalActions actions={[
        { icon: <SaveOutlined />, tooltip: 'Save', onClick: onSubmit },
        { icon: <CloseOutlined />, tooltip: 'Close', onClick: onClose },
      ]} />
    }
  >
    {children}
  </Modal>
);

// ✓ GOOD: Reusable form modal
<FormModal
  title="Edit Widget"
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSave}
>
  <Form layout="vertical">
    <Form.Item label="Widget Name">
      <Input />
    </Form.Item>
  </Form>
</FormModal>

// ✗ BAD: Hardcoded modal with button footer
<Modal title="Edit Widget" visible={isOpen}>
  <Form>...</Form>
  <footer>
    <Button onClick={handleSave}>Save</Button>
    <Button onClick={onClose}>Cancel</Button>
  </footer>
</Modal>
```

**Rules:**
- closable={false} (no X button in top-right)
- Use ModalActions for footer
- Generic wrapper for all modals
- No hardcoded button logic per modal
