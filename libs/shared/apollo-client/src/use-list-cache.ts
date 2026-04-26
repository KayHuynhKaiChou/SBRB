import { useMemo } from 'react';
import { useApolloClient, type OperationVariables } from '@apollo/client';
import {
  cacheAppend,
  cacheEvictEntity,
  cacheInsertAt,
  cacheMoveTo,
  cachePrepend,
  cacheRemoveBy,
  cacheRemoveById,
  cacheReplaceById,
  type ICacheListOps,
} from './cache-list-ops';

/**
 * Hook-bound version of the cache-list-ops helpers. Pre-binds the query +
 * variables + read/write paths and resolves the active ApolloClient cache for you.
 *
 * Typical usage from a mutation hook:
 *
 *   const widgetCache = useListCache<WidgetsQuery, { tabId: string }, IWidgetDto>({
 *     query: WIDGETS_QUERY,
 *     variables: { tabId },
 *     read: (d) => d.widgets,
 *     write: (d, items) => ({ ...d, widgets: items }),
 *   });
 *
 *   const [deleteWidget] = useAppMutation(DELETE_WIDGET, {
 *     onSuccess: ({ deleteWidget: res }) => {
 *       if (res.data) {
 *         widgetCache.removeById(res.data.id);
 *         widgetCache.evict('WidgetType', res.data.id);
 *       }
 *     },
 *   });
 *
 * Heavy callers can still drop down to the raw helpers in `cache-list-ops.ts`
 * when they need to operate on a different cache instance (e.g. inside the
 * mutation `update` callback).
 */
export interface IUseListCacheReturn<TItem> {
  append: (item: TItem) => void;
  prepend: (item: TItem) => void;
  insertAt: (item: TItem, index: number) => void;
  removeBy: (predicate: (item: TItem) => boolean) => void;
  removeById: (id: string) => void;
  replaceById: (item: TItem & { id: string }) => void;
  moveTo: (id: string, toIndex: number) => void;
  /** Drop a normalized entity from the cache + run gc. Pass __typename + id. */
  evict: (typename: string, id: string) => void;
}

export function useListCache<
  TQueryResult,
  TVars extends OperationVariables,
  TItem,
>(ops: ICacheListOps<TQueryResult, TVars, TItem>): IUseListCacheReturn<TItem> {
  const client = useApolloClient();

  // Memo by reference — caller is responsible for stable variables/read/write
  // identity (e.g. wrap in useMemo or define at module scope).
  return useMemo<IUseListCacheReturn<TItem>>(
    () => ({
      append: (item) => cacheAppend(client.cache, ops, item),
      prepend: (item) => cachePrepend(client.cache, ops, item),
      insertAt: (item, index) => cacheInsertAt(client.cache, ops, item, index),
      removeBy: (predicate) => cacheRemoveBy(client.cache, ops, predicate),
      removeById: (id) =>
        cacheRemoveById(
          client.cache,
          ops as ICacheListOps<TQueryResult, TVars, TItem & { id: string }>,
          id,
        ),
      replaceById: (item) =>
        cacheReplaceById(
          client.cache,
          ops as ICacheListOps<TQueryResult, TVars, TItem & { id: string }>,
          item,
        ),
      moveTo: (id, toIndex) =>
        cacheMoveTo(
          client.cache,
          ops as ICacheListOps<TQueryResult, TVars, TItem & { id: string }>,
          id,
          toIndex,
        ),
      evict: (typename, id) => cacheEvictEntity(client.cache, typename, id),
    }),
    [client, ops],
  );
}
