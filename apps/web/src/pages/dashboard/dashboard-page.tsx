import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
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
  const { t } = useTranslation('dashboard');
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

  const { activeTabId: storeActiveTabId } = useCanvasStore();
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

  const handleAddWidget = async (input: { name: string; metricName?: string; unit?: string }) => {
    if (!storeActiveTabId) return;
    await createWidgetMutation({
      variables: {
        input: {
          tabId: storeActiveTabId,
          businessId: currentBusinessId,
          name: input.name,
          metricName: input.metricName ?? '',
          unit: input.unit ?? '',
          position: { x: 20, y: 20, w: 800, h: 400 },
        },
      },
      refetchQueries: [{ query: WIDGETS_QUERY, variables: { tabId: storeActiveTabId } }],
    });
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
