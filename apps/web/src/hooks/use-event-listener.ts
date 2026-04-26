import { useEffect, useRef } from 'react';

/**
 * Subscribe to a DOM event with auto-cleanup. Mirrors the public
 * `usehooks-ts` API since `@uidotdev/usehooks` doesn't ship one.
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  target: Window | Document | HTMLElement | null = typeof window === 'undefined' ? null : window,
): void {
  const handlerRef = useRef(handler);
  // Keep the latest handler without re-subscribing on every render.
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target?.addEventListener) return;
    const listener = (event: Event) => handlerRef.current(event as WindowEventMap[K]);
    target.addEventListener(eventName, listener);
    return () => target.removeEventListener(eventName, listener);
  }, [eventName, target]);
}
