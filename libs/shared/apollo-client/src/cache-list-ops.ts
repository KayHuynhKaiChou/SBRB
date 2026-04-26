import type {
  ApolloCache,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';

/**
 * Manual cache list operations for Apollo Client — analogous to TanStack Query's
 * setQueryData but tailored for GraphQL/normalized cache.
 *
 * When BE returns the affected entity from a mutation, the FE can patch the
 * matching list query in-cache instead of refetching. Apollo's normalization
 * already keeps individual entity views fresh (by `keyFields: ['id']`); these
 * helpers handle the OTHER half — list membership (append on create, splice on
 * delete, reorder on insertAt).
 *
 * Each op describes:
 *   - which query to read/write
 *   - how to extract the list array from the query result (`read`)
 *   - how to write a new list array back into the query result shape (`write`)
 *
 * The `read`/`write` callbacks make the helpers shape-agnostic so they work
 * whether the response is a raw array (`data.widgets`) or a paginated wrapper
 * (`data.widgets.data.items`).
 */
export interface ICacheListOps<
  TQueryResult,
  TVars extends OperationVariables,
  TItem,
> {
  query: DocumentNode | TypedDocumentNode<TQueryResult, TVars>;
  variables?: TVars;
  /** Pull the list array out of the query result (return null/undefined if missing). */
  read: (data: TQueryResult) => TItem[] | null | undefined;
  /** Build a new query result with the supplied list array. */
  write: (data: TQueryResult, items: TItem[]) => TQueryResult;
}

function patch<TQueryResult, TVars extends OperationVariables, TItem>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  transform: (items: TItem[]) => TItem[],
): void {
  // Cast at boundary — Apollo v4 wraps reads in Unmasked<T> for fragment masking,
  // but our caller-facing TQueryResult is the unmasked shape they declared.
  const cached = cache.readQuery<TQueryResult, TVars>({
    query: ops.query,
    variables: ops.variables,
  }) as TQueryResult | null;
  if (!cached) return;
  const next = transform(ops.read(cached) ?? []);
  cache.writeQuery<TQueryResult, TVars>({
    query: ops.query,
    variables: ops.variables,
    data: ops.write(cached, next) as never,
  });
}

/** Append `item` to the end of the list. */
export function cacheAppend<
  TQueryResult,
  TVars extends OperationVariables,
  TItem,
>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  item: TItem,
): void {
  patch(cache, ops, (items) => [...items, item]);
}

/** Insert `item` at the front of the list. */
export function cachePrepend<
  TQueryResult,
  TVars extends OperationVariables,
  TItem,
>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  item: TItem,
): void {
  patch(cache, ops, (items) => [item, ...items]);
}

/** Insert `item` at a specific 0-based index (clamped to bounds). */
export function cacheInsertAt<
  TQueryResult,
  TVars extends OperationVariables,
  TItem,
>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  item: TItem,
  index: number,
): void {
  patch(cache, ops, (items) => {
    const next = [...items];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
    return next;
  });
}

/** Remove the first item where `predicate` returns true. */
export function cacheRemoveBy<
  TQueryResult,
  TVars extends OperationVariables,
  TItem,
>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  predicate: (item: TItem) => boolean,
): void {
  patch(cache, ops, (items) => items.filter((it) => !predicate(it)));
}

/** Convenience: remove a list entry by `id`. Item must have an `id` field. */
export function cacheRemoveById<
  TQueryResult,
  TVars extends OperationVariables,
  TItem extends { id: string },
>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  id: string,
): void {
  cacheRemoveBy(cache, ops, (it) => it.id === id);
}

/**
 * Replace an item in-place by id. Useful when BE returns the updated entity.
 * Note: when the item type has `keyFields: ['id']` and BE returns the entity,
 * Apollo auto-normalizes it — you usually only need this if the LIST itself
 * holds extra computed fields not on the normalized entity.
 */
export function cacheReplaceById<
  TQueryResult,
  TVars extends OperationVariables,
  TItem extends { id: string },
>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  next: TItem,
): void {
  patch(cache, ops, (items) =>
    items.map((it) => (it.id === next.id ? next : it)),
  );
}

/**
 * Move an item to a new index in the list (e.g. after reorder).
 * Returns silently if the item id isn't in the list.
 */
export function cacheMoveTo<
  TQueryResult,
  TVars extends OperationVariables,
  TItem extends { id: string },
>(
  cache: ApolloCache<unknown>,
  ops: ICacheListOps<TQueryResult, TVars, TItem>,
  id: string,
  toIndex: number,
): void {
  patch(cache, ops, (items) => {
    const fromIndex = items.findIndex((it) => it.id === id);
    if (fromIndex < 0) return items;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved);
    return next;
  });
}

/**
 * Evict a normalized entity from the cache and run gc — drops dangling refs
 * across all queries that referenced it. Call after a delete mutation.
 */
export function cacheEvictEntity(
  cache: ApolloCache<unknown>,
  typename: string,
  id: string,
): void {
  const cacheId = cache.identify({ __typename: typename, id });
  if (!cacheId) return;
  cache.evict({ id: cacheId });
  cache.gc();
}
