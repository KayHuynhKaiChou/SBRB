import React from 'react';
import { Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ITabDto } from '@sbrb/shared-types';
import { IconButton } from '@sbrb/ui';
import { sortTabsByPinnedThenOrder } from '../../utils/tab-sort';

interface ITabBarProps {
  tabs: ITabDto[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: ITabDto) => void;
}

/** Horizontal pill-style tab bar for use inside the header */
export function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
}: ITabBarProps) {
  const { t } = useTranslation('dashboard');
  const sorted = sortTabsByPinnedThenOrder(tabs);

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
                background: isActive ? 'var(--sbrb-accent-coral)' : 'var(--sbrb-tab-inactive-bg)',
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
      <IconButton
        icon={<PlusOutlined />}
        tooltip={t('add_tab_tooltip')}
        size="small"
        onClick={onAddTab}
      />
    </div>
  );
}
