import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Typography } from 'antd';
import { useMutation } from '@apollo/client';
import { useAuthStore } from '../../store/auth.store';
import { useTabs } from '../../hooks/use-tabs';
import { AppLayout } from '../../components/layout/app-layout';
import { CanvasContainer } from '../../components/canvas/canvas-container';
import { AddTabModal } from '../../components/tab/add-tab-modal';
import { EditTabModal } from '../../components/tab/edit-tab-modal';
import { AddWidgetModal } from '../../components/canvas/add-widget-modal';
import { CREATE_WIDGET_MUTATION } from '../../graphql/canvas.operations';
import { useCanvasStore } from '../../store/canvas.store';
import type { ITabDto } from '@sbrb/shared-types';

const { Text } = Typography;

export default function DashboardPage() {
  const { businessId: paramBusinessId } = useParams<{ businessId: string }>();
  const { currentBusinessId, setCurrentBusiness } = useAuthStore();

  const effectiveBusinessId = paramBusinessId || currentBusinessId || '';
  if (paramBusinessId && paramBusinessId !== currentBusinessId) {
    setCurrentBusiness(paramBusinessId);
  }

  if (!effectiveBusinessId) {
    return <Navigate to="/onboarding" replace />;
  }

  const { tabs, activeTabId, setActiveTab, createTab, updateTab, deleteTab } =
    useTabs(effectiveBusinessId);

  const [addTabOpen, setAddTabOpen] = useState(false);
  const [editTabOpen, setEditTabOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<ITabDto | null>(null);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const { activeTabId: storeActiveTabId } = useCanvasStore();
  const [createWidgetMutation] = useMutation(CREATE_WIDGET_MUTATION);

  const handleEditTab = (tab: ITabDto) => {
    setEditingTab(tab);
    setEditTabOpen(true);
  };

  const handleAddWidget = async (input: { name: string; metricName?: string; unit?: string }) => {
    if (!storeActiveTabId) return;
    await createWidgetMutation({
      variables: {
        input: {
          tabId: storeActiveTabId,
          businessId: effectiveBusinessId,
          name: input.name,
          metricName: input.metricName ?? '',
          unit: input.unit ?? '',
          position: { x: 20, y: 20, w: 800, h: 400 },
        },
      },
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
    >
      {activeTabId ? (
        <CanvasContainer
          tabId={activeTabId}
          onAddWidget={() => setAddWidgetOpen(true)}
          onEditWidget={() => { /* Phase 11 */ }}
          onDeleteWidget={() => { /* Phase 11 */ }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 14 }}>
            Chưa có tab nào. Tạo tab mới để bắt đầu.
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
    </AppLayout>
  );
}
