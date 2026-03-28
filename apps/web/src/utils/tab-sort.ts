import type { ITabDto } from '@sbrb/shared-types';

/** Sort tabs: pinned first, then by order ascending */
export function sortTabsByPinnedThenOrder(tabs: ITabDto[]): ITabDto[] {
  return [...tabs].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.order - b.order;
  });
}
