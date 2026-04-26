import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useCanvasStore } from '../store/canvas.store';
import { useAppMutation, useListCache } from '@sbrb/shared-apollo-client';
import type { IApiResponse, ITabDto } from '@sbrb/shared-types';
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

interface ITabsQueryResult {
  tabs: ITabDto[];
}

interface ICreateTabResult {
  createTab: IApiResponse<ITabDto>;
}

interface IUpdateTabResult {
  updateTab: IApiResponse<ITabDto>;
}

interface IDeleteTabResult {
  deleteTab: IApiResponse<{ id: string; businessId: string }>;
}

export function useTabs(businessId: string) {
  const { tabs, activeTabId, setTabs, setActiveTab } = useCanvasStore();

  const { data, refetch } = useQuery<ITabsQueryResult>(TABS_QUERY, {
    variables: { businessId },
    skip: !businessId,
    fetchPolicy: 'cache-and-network',
  });

  // Bind list-cache helpers for the Tabs query under this business.
  const tabCache = useListCache<ITabsQueryResult, { businessId: string }, ITabDto>({
    query: TABS_QUERY,
    variables: { businessId },
    read: (d) => d.tabs,
    write: (d, items) => ({ ...d, tabs: items }),
  });

  const [createTabMutation] = useAppMutation<ICreateTabResult>(CREATE_TAB_MUTATION);
  const [updateTabMutation] = useAppMutation<IUpdateTabResult>(UPDATE_TAB_MUTATION);
  const [deleteTabMutation] = useAppMutation<IDeleteTabResult>(DELETE_TAB_MUTATION, {
    onSuccess: ({ deleteTab }) => {
      const deleted = deleteTab.data;
      if (!deleted) return;
      tabCache.removeById(deleted.id);
      tabCache.evict('Tab', deleted.id);
    },
  });
  const [reorderTabsMutation] = useAppMutation(REORDER_TABS_MUTATION);

  useEffect(() => {
    if (data?.tabs) {
      setTabs(data.tabs);
      if (!activeTabId && data.tabs.length > 0) {
        const pinned = data.tabs.find((t) => t.isPinned);
        setActiveTab(pinned ? pinned.id : data.tabs[0].id);
      }
    }
  }, [data, activeTabId, setTabs, setActiveTab]);

  const createTab = async (input: Omit<ICreateTabInput, 'businessId'>) => {
    const result = await createTabMutation({
      variables: { input: { ...input, businessId } },
    });
    const newTab = result.data?.createTab?.data;
    if (newTab) tabCache.append(newTab);
  };

  const updateTab = async (id: string, input: IUpdateTabInput) => {
    // BE returns the updated Tab; Apollo's keyFields:['id'] on Tab auto-normalizes,
    // so the canvas tab list refreshes without a manual cache write.
    await updateTabMutation({ variables: { id, input } });
  };

  const deleteTab = async (id: string) => {
    await deleteTabMutation({ variables: { id } });
    if (activeTabId === id) setActiveTab(null);
  };

  const reorderTabs = async (orders: Array<{ id: string; order: number }>) => {
    await reorderTabsMutation({ variables: { orders } });
    // Reorder rewrites positions across many rows — refetch is simpler than
    // patching local order in cache.
    await refetch();
  };

  return { tabs, activeTabId, setActiveTab, createTab, updateTab, deleteTab, reorderTabs };
}
