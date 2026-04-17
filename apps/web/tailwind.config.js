/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    require('path').join(__dirname, 'src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
    require('path').join(__dirname, '../../libs/ui/src/**/*.{js,ts,jsx,tsx}').replace(/\\/g, '/'),
  ],
  // Prevent Tailwind from conflicting with Ant Design
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // SBRB Brand Colors (from SRS Section 6.1)
        brand: {
          DEFAULT: '#D72A44',
          50: '#FEF2F4',
          100: '#FDE8EB',
          200: '#FAC8CE',
          300: '#F59AA3',
          400: '#EE6171',
          500: '#D72A44',
          600: '#B71E36',
          700: '#95182C',
          800: '#7B1424',
          900: '#64111E',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
