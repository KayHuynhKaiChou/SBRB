import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Supported languages (SRS: vi default, en secondary)
    supportedLngs: ['vi', 'en'],
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'widget', 'datasheet', 'member', 'department', 'profile', 'admin'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    debug: import.meta.env.DEV,
  });

export default i18n;
