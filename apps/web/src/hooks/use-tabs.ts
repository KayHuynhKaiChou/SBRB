import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useCanvasStore } from '../store/canvas.store';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import {
  TABS_QUERY,
  CREATE_TAB_MUTATION,
  UPDATE_TAB_MUTATION,
  DELETE_TAB_MUTATION,
  REORDER_TABS_MUTATION,
} from '../graphql/canvas.operations';

export interface ICreateTabInput {
  businessId: string;
  name: string;
  iconColor?: string;
  iconName?: string;
  isPinned?: boolean;
}

export interface IUpdateTabInput {
  name?: string;
  iconColor?: string;
  iconName?: string;
  isPinned?: boolean;
  isProtected?: boolean;
}

export function useTabs(businessId: string) {
  const { tabs, activeTabId, setTabs, setActiveTab } = useCanvasStore();

  const { data, refetch } = useQuery(TABS_QUERY, {
    variables: { businessId },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });

  const [createTabMutation] = useAppMutation(CREATE_TAB_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: { vi: 'Tạo tab thất bại', en: 'Failed to create tab' },
  });
  const [updateTabMutation] = useAppMutation(UPDATE_TAB_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: { vi: 'Cập nhật tab thất bại', en: 'Failed to update tab' },
  });
  const [deleteTabMutation] = useAppMutation(DELETE_TAB_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: { vi: 'Xóa tab thất bại', en: 'Failed to delete tab' },
  });
  const [reorderTabsMutation] = useAppMutation(REORDER_TABS_MUTATION, {
    notifyOnSuccess: false,
    fallbackError: { vi: 'Sắp xếp tab thất bại', en: 'Failed to reorder tabs' },
  });

  useEffect(() => {
    if (data?.tabs) {
      setTabs(data.tabs);
      if (!activeTabId && data.tabs.length > 0) {
        const pinned = data.tabs.find((t: { isPinned: boolean }) => t.isPinned);
        setActiveTab(pinned ? pinned.id : data.tabs[0].id);
      }
    }
  }, [data, activeTabId, setTabs, setActiveTab]);

  const createTab = async (input: Omit<ICreateTabInput, 'businessId'>) => {
    await createTabMutation({
      variables: { input: { ...input, businessId } },
      update: (cache, { data: mutationData }) => {
        const newTab = mutationData?.createTab;
        if (!newTab) return;
        const existing = cache.readQuery<{ tabs: unknown[] }>({
          query: TABS_QUERY,
          variables: { businessId },
        });
        if (existing) {
          cache.writeQuery({
            query: TABS_QUERY,
            variables: { businessId },
            data: { tabs: [...existing.tabs, newTab] },
          });
        } else {
          refetch().catch(() => null);
        }
      },
    });
  };

  const updateTab = async (id: string, input: IUpdateTabInput) => {
    await updateTabMutation({
      variables: { id, input },
      update: (cache, { data: mutationData }) => {
        const updatedTab = mutationData?.updateTab;
        if (!updatedTab) return;
        const existing = cache.readQuery<{ tabs: Array<{ id: string }> }>({
          query: TABS_QUERY,
          variables: { businessId },
        });
        if (existing) {
          cache.writeQuery({
            query: TABS_QUERY,
            variables: { businessId },
            data: {
              tabs: existing.tabs.map((t) => (t.id === id ? { ...t, ...updatedTab } : t)),
            },
          });
        } else {
          refetch().catch(() => null);
        }
      },
    });
  };

  const deleteTab = async (id: string) => {
    await deleteTabMutation({
      variables: { id },
      update: (cache) => {
        const existing = cache.readQuery<{ tabs: Array<{ id: string }> }>({
          query: TABS_QUERY,
          variables: { businessId },
        });
        if (existing) {
          cache.writeQuery({
            query: TABS_QUERY,
            variables: { businessId },
            data: { tabs: existing.tabs.filter((t) => t.id !== id) },
          });
        } else {
          refetch().catch(() => null);
        }
      },
    });
    if (activeTabId === id) setActiveTab(null);
  };

  const reorderTabs = async (orders: Array<{ id: string; order: number }>) => {
    await reorderTabsMutation({ variables: { orders } });
    await refetch();
  };

  return { tabs, activeTabId, setActiveTab, createTab, updateTab, deleteTab, reorderTabs };
}
