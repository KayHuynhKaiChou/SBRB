import React from 'react';
import { IconButton } from '@sbrb/ui';

interface IModalAction {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

interface IModalActionsProps {
  actions: IModalAction[];
}

/**
 * Standardized modal footer with IconButton row.
 * Convention: primary action first (save/confirm), secondary last (close/cancel).
 */
export function ModalActions({ actions }: IModalActionsProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      {actions.map((action, i) => (
        <IconButton
          key={i}
          icon={action.icon}
          tooltip={action.tooltip}
          size="small"
          onClick={action.onClick}
          disabled={action.disabled}
        />
      ))}
    </div>
  );
}
