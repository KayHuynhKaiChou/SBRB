// i18n locale files live at:
// libs/i18n/src/locales/vi/*.json  (Vietnamese — default)
// libs/i18n/src/locales/en/*.json  (English)
//
// i18next config in apps/web/src/i18n/index.ts loads from /public/locales/
// These source files get copied to apps/web/public/locales/ during build

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'vi';

export const I18N_NAMESPACES = [
  'common',
  'auth',
  'dashboard',
  'widget',
  'datasheet',
  'member',
] as const;
export type I18nNamespace = typeof I18N_NAMESPACES[number];
