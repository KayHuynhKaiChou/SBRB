import type { ThemeConfig } from 'antd';

/**
 * Ant Design v5 theme — mirrors apps/web theme exactly.
 * Keep in sync with apps/web/src/app/config/antd-theme.config.ts
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#D72A44',
    colorError: '#D72A44',
    colorLink: '#D72A44',
    borderRadius: 8,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
    controlHeight: 36,
  },
  components: {
    Button: { borderRadius: 50 },
    Input: { borderRadius: 8 },
    Select: { borderRadius: 8 },
    Modal: { borderRadius: 12 },
  },
};
