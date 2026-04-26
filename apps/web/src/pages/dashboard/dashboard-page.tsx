import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAppMutation, useListCache } from '@sbrb/shared-apollo-client';
import type { IApiResponse, IWidgetDto } from '@sbrb/shared-types';
import { useAuthStore } from '../../store/auth.store';
import { useTabs } from '../../hooks/use-tabs';
import { AppLayout } from '../../components/layout/app-layout';
import { CanvasContainer } from '../../components/canvas/canvas-container';
import { AddTabModal } from '../../components/tab/add-tab-modal';
import { EditTabModal } from '../../components/tab/edit-tab-modal';
import { AddWidgetModal } from '../../components/canvas/add-widget-modal';
import { DataSelectorModal } from '../../components/data-selector/data-selector-modal';
import {
  CREATE_WIDGET_MUTATION,
  DELETE_WIDGET_MUTATION,
  WIDGETS_QUERY,
} from '../../graphql/canvas.operations';
import { useCanvasStore } from '../../store/canvas.store';
import { useWidgetConfig } from '../../hooks/use-widget-config';
import type { ITabDto } from '@sbrb/shared-types';

const { Text } = Typography;

interface IWidgetsQueryResult {
  widgets: IWidgetDto[];
}

interface ICreateWidgetResult {
  createWidget: IApiResponse<IWidgetDto>;
}

interface IDeleteWidgetResult {
  deleteWidget: IApiResponse<{ id: string; tabId: string }>;
}

export default function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'widget']);
  const { currentBusinessId } = useAuthStore();

  if (!currentBusinessId) {
    return <Navigate to="/onboarding" replace />;
  }

  const { tabs, activeTabId, setActiveTab, createTab, updateTab, deleteTab } =
    useTabs(currentBusinessId);

  const [addTabOpen, setAddTabOpen] = useState(false);
  const [editTabOpen, setEditTabOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<ITabDto | null>(null);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [dataSelectorOpen, setDataSelectorOpen] = useState(false);
  const [dataSelectorWidgetId, setDataSelectorWidgetId] = useState<string | null>(null);

  const { activeTabId: storeActiveTabId, zoom } = useCanvasStore();

  // Bind cache helpers for the Widgets list under the active tab.
  const widgetCache = useListCache<IWidgetsQueryResult, { tabId: string }, IWidgetDto>({
    query: WIDGETS_QUERY,
    variables: storeActiveTabId ? { tabId: storeActiveTabId } : ({} as { tabId: string }),
    read: (d) => d.widgets,
    write: (d, items) => ({ ...d, widgets: items }),
  });

  const [createWidgetMutation] = useAppMutation<ICreateWidgetResult>(CREATE_WIDGET_MUTATION);
  const [deleteWidgetMutation] = useAppMutation<IDeleteWidgetResult>(DELETE_WIDGET_MUTATION, {
    onSuccess: ({ deleteWidget }) => {
      const deleted = deleteWidget.data;
      if (!deleted) return;
      widgetCache.removeById(deleted.id);
      widgetCache.evict('Widget', deleted.id);
    },
  });
  const { updateDataLink } = useWidgetConfig();

  const handleDeleteWidget = (widgetId: string) => {
    void deleteWidgetMutation({ variables: { id: widgetId } });
  };

  const handleEditTab = (tab: ITabDto) => {
    setEditingTab(tab);
    setEditTabOpen(true);
  };

  const handleOpenDataSelector = (widgetId: string) => {
    setDataSelectorWidgetId(widgetId);
    setDataSelectorOpen(true);
  };

  const handleDataSelectorConfirm = async (
    dataSheetId: string,
    selectedSeries: string[],
    selectedPeriods: string[] | null,
  ) => {
    if (!dataSelectorWidgetId) return;
    await updateDataLink(dataSelectorWidgetId, {
      dataSheetId,
      selectedSeries,
      selectedPeriods,
    });
    setDataSelectorOpen(false);
    setDataSelectorWidgetId(null);
  };

  const handleAddWidget = async (input: {
    name: string;
    unit: string;
    dataSheetId: string | null;
    selectedSeries: string[];
  }) => {
    if (!storeActiveTabId) return;
    const result = await createWidgetMutation({
      variables: {
        input: {
          tabId: storeActiveTabId,
          businessId: currentBusinessId,
          name: input.name,
          unit: input.unit ?? '',
        },
      },
    });
    const newWidget = result.data?.createWidget?.data;
    if (!newWidget) return;

    // Append into the active tab's Widgets list — no refetch needed.
    widgetCache.append(newWidget);

    // Link data source if selected during creation. Apollo auto-normalizes the
    // returned Widget by id, so the canvas card updates without an extra refetch.
    if (input.dataSheetId && input.selectedSeries.length > 0) {
      await updateDataLink(newWidget.id, {
        dataSheetId: input.dataSheetId,
        selectedSeries: input.selectedSeries,
        selectedPeriods: null,
      });
    }

    // Scroll canvas to new widget position
    const pos = newWidget.position;
    if (pos) {
      requestAnimationFrame(() => {
        const container = document.querySelector('[data-canvas-scroll]');
        const scale = zoom / 100;
        container?.scrollTo({
          left: Math.max(0, pos.x * scale - 40),
          top: Math.max(0, pos.y * scale - 40),
          behavior: 'smooth',
        });
      });
    }
  };

  return (
    <AppLayout
      tabs={tabs}
      activeTabId={activeTabId}
      onTabSelect={setActiveTab}
      onAddTab={() => setAddTabOpen(true)}
      onEditTab={handleEditTab}
      onDeleteTab={deleteTab}
      onAddWidget={() => setAddWidgetOpen(true)}
    >
      {activeTabId ? (
        <CanvasContainer
          tabId={activeTabId}
          onAddWidget={() => setAddWidgetOpen(true)}
          onEditWidget={() => { /* Phase 11 */ }}
          onDeleteWidget={handleDeleteWidget}
          onOpenDataSelector={handleOpenDataSelector}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Text type="secondary" className="!text-sm">
            {t('no_tabs_message')}
          </Text>
        </div>
      )}

      <AddTabModal
        open={addTabOpen}
        onClose={() => setAddTabOpen(false)}
        onSubmit={createTab}
      />

      <EditTabModal
        open={editTabOpen}
        tab={editingTab}
        onClose={() => { setEditTabOpen(false); setEditingTab(null); }}
        onSubmit={updateTab}
      />

      <AddWidgetModal
        open={addWidgetOpen}
        businessId={currentBusinessId}
        onClose={() => setAddWidgetOpen(false)}
        onSubmit={handleAddWidget}
      />

      <DataSelectorModal
        open={dataSelectorOpen}
        onClose={() => { setDataSelectorOpen(false); setDataSelectorWidgetId(null); }}
        onConfirm={handleDataSelectorConfirm}
        businessId={currentBusinessId}
      />
    </AppLayout>
  );
}
