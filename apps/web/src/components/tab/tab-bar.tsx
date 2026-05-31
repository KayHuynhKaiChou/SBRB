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
    <div className="flex flex-row items-center gap-1 overflow-x-auto overflow-y-visible [scrollbar-width:none] py-1 pr-2">
      {sorted.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <Tooltip key={tab.id} title={tab.name} mouseEnterDelay={0.8}>
            <button
              onClick={() => onTabSelect(tab.id)}
              onDoubleClick={() => onEditTab(tab)}
              style={{
                background: isActive ? 'var(--sbrb-accent-coral)' : 'var(--sbrb-tab-inactive-bg)',
                color: isActive ? '#ffffff' : '#555',
                fontWeight: isActive ? 600 : 400,
              }}
              className="inline-flex items-center px-3 py-1 rounded-[20px] border-none cursor-pointer text-xs transition-[background,color] duration-150 whitespace-nowrap shrink-0 leading-[1.4]"
            >
              {tab.name}
            </button>
          </Tooltip>
        );
      })}

      {/* Add tab — sized to match the tab pill height */}
      <IconButton
        icon={<PlusOutlined />}
        tooltip={t('add_tab_tooltip')}
        size="small"
        style={{ width: 26, height: 26, minWidth: 26, fontSize: 13 }}
        onClick={onAddTab}
      />
    </div>
  );
}
