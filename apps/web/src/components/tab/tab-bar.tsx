import React from 'react';
import { Button, Tooltip, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ITabDto } from '@sbrb/shared-types';
import { TabItem } from './tab-item';

const { Text } = Typography;

interface ITabBarProps {
  tabs: ITabDto[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: ITabDto) => void;
  onDeleteTab: (id: string) => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
  onDeleteTab,
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
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 12px 8px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
          Tabs
        </Text>
        <Tooltip title="Thêm tab mới">
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={onAddTab}
            style={{ padding: '0 4px' }}
          />
        </Tooltip>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '16px 12px', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chưa có tab nào
            </Text>
          </div>
        ) : (
          sorted.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={() => onTabSelect(tab.id)}
              onEdit={() => onEditTab(tab)}
              onDelete={() => onDeleteTab(tab.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
