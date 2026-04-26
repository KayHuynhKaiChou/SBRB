import { useEffect, useRef } from 'react';

/**
 * Schedule a callback every `delay` ms. Pass `null` to pause. Auto-cleans
 * on unmount or when delay flips to null. Mirrors the `usehooks-ts` API
 * since `@uidotdev/usehooks` doesn't ship one.
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => callbackRef.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
