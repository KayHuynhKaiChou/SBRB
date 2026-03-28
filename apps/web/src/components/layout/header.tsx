import React from 'react';
import { Layout, Button, Tooltip, Dropdown } from 'antd';
import {
  PlusOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  PictureOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ITabDto } from '@sbrb/shared-types';
import { useAuthStore } from '../../store/auth.store';
import { useCanvasStore } from '../../store/canvas.store';
import { BusinessSwitcher } from './business-switcher';

const { Header: AntHeader } = Layout;

interface IHeaderProps {
  tabs: ITabDto[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: ITabDto) => void;
  onDeleteTab: (id: string) => void;
}

export function Header({
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
  onDeleteTab,
}: IHeaderProps) {
  const { clearAuth } = useAuthStore();
  const { zoom } = useCanvasStore();

  // Sort tabs: pinned first, then by order
  const sorted = [...tabs].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.order - b.order;
  });

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => clearAuth(),
    },
  ];

  return (
    <AntHeader
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e8e8e8',
        padding: '0 12px 0 16px',
        display: 'flex',
        alignItems: 'center',
        height: 52,
        lineHeight: '52px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        zIndex: 100,
        gap: 12,
      }}
    >
      {/* Business switcher */}
      <BusinessSwitcher />

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: '#e8e8e8', flexShrink: 0 }} />

      {/* Tab pills row */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          minWidth: 0,
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
                  gap: 5,
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

        {/* Add tab button */}
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

      {/* Right side: widget type icons + zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Tooltip title="Biểu đồ">
          <Button
            type="text"
            icon={<BarChartOutlined />}
            size="small"
            style={{ color: '#888', fontSize: 15 }}
          />
        </Tooltip>
        <Tooltip title="Lưới">
          <Button
            type="text"
            icon={<AppstoreOutlined />}
            size="small"
            style={{ color: '#888', fontSize: 15 }}
          />
        </Tooltip>
        <Tooltip title="Hình ảnh">
          <Button
            type="text"
            icon={<PictureOutlined />}
            size="small"
            style={{ color: '#888', fontSize: 15 }}
          />
        </Tooltip>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: '#e8e8e8', margin: '0 4px' }} />

        {/* Zoom indicator */}
        <span
          style={{
            fontSize: 12,
            color: '#888',
            background: 'var(--kpiee-tab-inactive-bg)',
            padding: '2px 8px',
            borderRadius: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {zoom}%
        </span>
      </div>
    </AntHeader>
  );
}
