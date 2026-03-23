import React, { useState } from 'react';
import { Layout } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
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
}

export function AppLayout({
  children,
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
  onDeleteTab,
}: IAppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header />
      <Layout>
        <Sidebar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={onTabSelect}
          onAddTab={onAddTab}
          onEditTab={onEditTab}
          onDeleteTab={onDeleteTab}
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
        <Layout>
          {/* Collapse toggle */}
          <div
            style={{
              position: 'absolute',
              left: collapsed ? 56 : 220,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: '0 4px 4px 0',
              padding: '4px 2px',
              cursor: 'pointer',
              transition: 'left 0.2s',
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <MenuUnfoldOutlined style={{ fontSize: 12 }} />
            ) : (
              <MenuFoldOutlined style={{ fontSize: 12 }} />
            )}
          </div>
          <Content style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
