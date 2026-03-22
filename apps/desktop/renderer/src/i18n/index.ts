/**
 * i18n setup for desktop renderer — same config as apps/web.
 * Locale JSON files are served from /locales/ (copied from apps/web/public/locales/).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    supportedLngs: ['vi', 'en'],
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'widget', 'datasheet', 'member'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
