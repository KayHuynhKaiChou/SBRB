import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Typography, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation, useApolloClient } from '@apollo/client';
import { useAuthStore } from '../../store/auth.store';
import { useTabs } from '../../hooks/use-tabs';
import { AppLayout } from '../../components/layout/app-layout';
import { CanvasContainer } from '../../components/canvas/canvas-container';
import { AddTabModal } from '../../components/tab/add-tab-modal';
import { EditTabModal } from '../../components/tab/edit-tab-modal';
import { AddWidgetModal } from '../../components/canvas/add-widget-modal';
import { DataSelectorModal } from '../../components/data-selector/data-selector-modal';
import { CREATE_WIDGET_MUTATION, WIDGETS_QUERY } from '../../graphql/canvas.operations';
import { useCanvasStore } from '../../store/canvas.store';
import { useWidgetConfig } from '../../hooks/use-widget-config';
import type { ITabDto } from '@sbrb/shared-types';

const { Text } = Typography;

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
  const apolloClient = useApolloClient();
  const [createWidgetMutation] = useMutation(CREATE_WIDGET_MUTATION);
  const { updateDataLink } = useWidgetConfig();

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
    // Link data source if selected during creation
    const widgetId = result.data?.createWidget?.id;
    if (widgetId && input.dataSheetId && input.selectedSeries.length > 0) {
      await updateDataLink(widgetId, {
        dataSheetId: input.dataSheetId,
        selectedSeries: input.selectedSeries,
        selectedPeriods: null,
      });
    }
    // Single refetch after all mutations complete — widget appears with data ready
    await apolloClient.refetchQueries({ include: ['Widgets'] });

    // Scroll canvas to new widget position + toast
    const pos = result.data?.createWidget?.position;
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
    message.success(t('widget:create_success'));
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
          onDeleteWidget={() => { /* Phase 11 */ }}
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
