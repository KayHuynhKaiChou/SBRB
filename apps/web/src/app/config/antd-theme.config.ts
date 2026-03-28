import type { ThemeConfig } from 'antd';

/**
 * Ant Design v5 theme customization for SBRB
 * Brand primary: #D72A44 (Primary Red) — all UI components follow this rule
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#D72A44',
    colorError: '#D72A44',
    colorLink: '#D72A44',
    borderRadius: 8,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
    // Input height from SRS 6.3: 36px
    controlHeight: 36,
  },
  components: {
    Button: {
      // Round buttons as per SRS 6.2
      borderRadius: 50,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 12,
    },
  },
};
