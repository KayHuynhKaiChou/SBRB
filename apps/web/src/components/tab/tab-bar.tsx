import React from 'react';
import { Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ITabDto } from '@sbrb/shared-types';

interface ITabBarProps {
  tabs: ITabDto[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: ITabDto) => void;
  onDeleteTab: (id: string) => void;
}

/** Horizontal pill-style tab bar for use inside the header */
export function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
}: ITabBarProps) {
  // Pinned tabs first, then by order
  const sorted = [...tabs].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.order - b.order;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {sorted.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <Tooltip key={tab.id} title={tab.name} mouseEnterDelay={0.8}>
            <button
              onClick={() => onTabSelect(tab.id)}
              onDoubleClick={() => onEditTab(tab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 12px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'var(--kpiee-accent-coral)' : 'var(--kpiee-tab-inactive-bg)',
                color: isActive ? '#ffffff' : '#555',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1.4,
              }}
            >
              {tab.name}
            </button>
          </Tooltip>
        );
      })}

      {/* Add tab */}
      <Tooltip title="Thêm tab mới">
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAddTab}
          style={{
            width: 28,
            height: 28,
            borderRadius: 20,
            background: 'var(--kpiee-tab-inactive-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#888',
          }}
        />
      </Tooltip>
    </div>
  );
}
