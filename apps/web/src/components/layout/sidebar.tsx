import React from 'react';
import { Layout } from 'antd';
import type { ITabDto } from '@sbrb/shared-types';
import { TabBar } from '../tab/tab-bar';

const { Sider } = Layout;

interface ISidebarProps {
  tabs: ITabDto[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: ITabDto) => void;
  onDeleteTab: (id: string) => void;
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export function Sidebar({
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
  onDeleteTab,
  collapsed,
  onCollapse,
}: ISidebarProps) {
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={220}
      collapsedWidth={56}
      style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      trigger={null}
    >
      {!collapsed && (
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={onTabSelect}
          onAddTab={onAddTab}
          onEditTab={onEditTab}
          onDeleteTab={onDeleteTab}
        />
      )}
    </Sider>
  );
}
