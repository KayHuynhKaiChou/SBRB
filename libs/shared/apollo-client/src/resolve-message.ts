import type { LocalizedMessage, MaybeLocalizedMessage } from './types';

export type SupportedLocale = 'vi' | 'en';

export function isLocalizedMessage(value: unknown): value is LocalizedMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as LocalizedMessage).vi === 'string' &&
    typeof (value as LocalizedMessage).en === 'string'
  );
}

/**
 * Resolve a BE message that may be:
 * - a plain string (legacy / one-locale BE)
 * - { vi, en } object (new localized BE format)
 * - nullish (→ fallback)
 */
export function resolveMessage(
  value: MaybeLocalizedMessage | null | undefined,
  locale: string,
  fallback = '',
): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (isLocalizedMessage(value)) {
    const short = (locale || 'vi').slice(0, 2).toLowerCase() as SupportedLocale;
    return value[short] ?? value.vi ?? value.en ?? fallback;
  }
  return fallback;
}
