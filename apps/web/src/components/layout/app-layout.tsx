import React from 'react';
import { Layout } from 'antd';
import type { ITabDto } from '@sbrb/shared-types';
import { Header } from './header';

const { Content } = Layout;

interface IAppLayoutProps {
  children: React.ReactNode;
  tabs: ITabDto[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: ITabDto) => void;
  onDeleteTab: (id: string) => void;
  onAddWidget?: () => void;
}

export function AppLayout({
  children,
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
  onDeleteTab,
  onAddWidget,
}: IAppLayoutProps) {
  // Sidebar + 60px offset are provided by the shared BusinessLayout; this only renders
  // the dashboard's Header (tabs) + canvas Content, filling the layout's content area.
  return (
    <Layout className="!flex !flex-col !h-full !overflow-hidden">
      <Header
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={onTabSelect}
        onAddTab={onAddTab}
        onEditTab={onEditTab}
        onDeleteTab={onDeleteTab}
        onAddWidget={onAddWidget}
      />
      <Content
        style={{ background: 'var(--canvas-bg)' }}
        className="!flex-1 !overflow-hidden !flex !flex-col"
      >
        {children}
      </Content>
    </Layout>
  );
}
