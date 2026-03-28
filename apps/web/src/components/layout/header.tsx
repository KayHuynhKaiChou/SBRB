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
    <AntHeader className="!bg-white !border-b !border-[#e8e8e8] !px-3 !pl-4 !flex !items-center !h-[52px] !leading-[52px] !shadow-[0_1px_4px_rgba(0,0,0,0.06)] !z-[100] !gap-3">
      {/* Business switcher */}
      <BusinessSwitcher />

      {/* Divider */}
      <div className="w-px h-6 bg-[#e8e8e8] shrink-0" />

      {/* Tab pills row */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] min-w-0">
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
                className="inline-flex items-center gap-[5px] px-3 py-1 rounded-[20px] border-none cursor-pointer text-xs transition-[background,color] duration-150 whitespace-nowrap shrink-0 leading-[1.4]"
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
      <div className="flex items-center gap-1.5 shrink-0">
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
        <div className="w-px h-[18px] bg-[#e8e8e8]" />

        {/* Zoom select */}
        <Select
          value={zoom}
          onChange={(v) => setZoom(v as ZoomLevel)}
          size="small"
          variant="borderless"
          className="!w-20"
          options={ZOOM_OPTIONS.map((z) => ({ value: z, label: `${z}%` }))}
        />
      </div>
    </AntHeader>
  );
}
