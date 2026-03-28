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
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Fixed 60px sidebar */}
      <Sidebar />

      {/* Main area offset by sidebar width */}
      <Layout
        style={{
          marginLeft: 'var(--sidebar-width)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
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
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--canvas-bg)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
