import React, { useEffect } from 'react';
import { Layout, Select, Tooltip } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ITabDto } from '@sbrb/shared-types';
import type { ZoomLevel } from '@sbrb/shared-types';
import { IconButton } from '@sbrb/ui';
import { useCanvasStore } from '../../store/canvas.store';
import { BusinessSwitcher } from './business-switcher';
import { sortTabsByPinnedThenOrder } from '../../utils/tab-sort';

const { Header: AntHeader } = Layout;

const ZOOM_OPTIONS: ZoomLevel[] = [50, 75, 100, 125];

interface IHeaderProps {
  tabs: ITabDto[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onEditTab: (tab: ITabDto) => void;
  onDeleteTab: (id: string) => void;
  onAddWidget?: () => void;
}

export function Header({
  tabs,
  activeTabId,
  onTabSelect,
  onAddTab,
  onEditTab,
  onDeleteTab,
  onAddWidget,
}: IHeaderProps) {
  const { t } = useTranslation(['dashboard', 'common']);
  const { zoom, setZoom, snapEnabled, toggleSnap } = useCanvasStore();
  const sorted = sortTabsByPinnedThenOrder(tabs);

  // Alt key toggles snap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        toggleSnap();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSnap]);

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

        {/* Add tab button */}
        <IconButton
          icon={<PlusOutlined />}
          tooltip={t('dashboard:add_tab_tooltip')}
          size="small"
          onClick={onAddTab}
        />
      </div>

      {/* Right side: add widget + snap grid + zoom select */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <IconButton
          icon={<PlusOutlined />}
          tooltip={t('dashboard:add_widget')}
          size="small"
          onClick={onAddWidget}
        />

        <IconButton
          icon={<AppstoreOutlined />}
          tooltip={snapEnabled ? t('dashboard:snap_grid_on') : t('dashboard:snap_grid_off')}
          size="small"
          active={snapEnabled}
          onClick={toggleSnap}
        />

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: '#e8e8e8' }} />

        {/* Zoom select */}
        <Select
          value={zoom}
          onChange={(v) => setZoom(v as ZoomLevel)}
          size="small"
          variant="borderless"
          style={{ width: 80 }}
          options={ZOOM_OPTIONS.map((z) => ({ value: z, label: `${z}%` }))}
        />
      </div>
    </AntHeader>
  );
}
