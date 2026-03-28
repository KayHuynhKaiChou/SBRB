import React from 'react';
import { Layout } from 'antd';
import type { ITabDto } from '@sbrb/shared-types';
import { Header } from './header';
import { Sidebar } from './sidebar';

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
  return (
    <Layout className="!h-screen !overflow-hidden">
      {/* Fixed 60px sidebar */}
      <Sidebar />

      {/* Main area offset by sidebar width */}
      <Layout
        style={{ marginLeft: 'var(--sidebar-width)' }}
        className="!flex !flex-col !h-screen !overflow-hidden"
      >
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
    </Layout>
  );
}
