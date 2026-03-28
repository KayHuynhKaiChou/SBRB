import { useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { message } from 'antd';
import { useCanvasStore } from '../store/canvas.store';
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

  const [createTabMutation] = useMutation(CREATE_TAB_MUTATION);
  const [updateTabMutation] = useMutation(UPDATE_TAB_MUTATION);
  const [deleteTabMutation] = useMutation(DELETE_TAB_MUTATION);
  const [reorderTabsMutation] = useMutation(REORDER_TABS_MUTATION);

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
    try {
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
            // Fallback if cache miss
            refetch().catch(() => null);
          }
        },
      });
    } catch (err) {
      message.error('Tạo tab thất bại');
      throw err;
    }
  };

  const updateTab = async (id: string, input: IUpdateTabInput) => {
    try {
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
    } catch (err) {
      message.error('Cập nhật tab thất bại');
      throw err;
    }
  };

  const deleteTab = async (id: string) => {
    try {
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
    } catch (err) {
      message.error('Xóa tab thất bại');
      throw err;
    }
  };

  const reorderTabs = async (orders: Array<{ id: string; order: number }>) => {
    try {
      await reorderTabsMutation({ variables: { orders } });
      await refetch();
    } catch (err) {
      message.error('Sắp xếp tab thất bại');
      throw err;
    }
  };

  return { tabs, activeTabId, setActiveTab, createTab, updateTab, deleteTab, reorderTabs };
}
