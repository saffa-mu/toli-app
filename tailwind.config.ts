import type { Config } from 'tailwindcss';

// Tokens mirror the CSS variables in src/styles/index.css.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#0F766E', 50: '#EFF8F6', 100: '#D5EEEA', 200: '#A9DCD4', 700: '#0F766E', 800: '#0B5C56', 900: '#08433F' },
        marigold: { DEFAULT: '#F59E0B', 50: '#FEF6E4', 100: '#FDE9BF', 600: '#B45309' },
        ink: { DEFAULT: '#1F2933', soft: '#4B5563', muted: '#5F6B76' },
        paper: '#FAF7F2',
        mist: '#F3F4F6',
        coral: { DEFAULT: '#E76F51', 50: '#FDF0EC', 700: '#B4432A' },
        hairline: '#E7E1D6',
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['13px', '18px'],
        sm: ['14px', '20px'],
        base: ['15px', '22px'],
        md: ['16px', '24px'],
      },
      borderRadius: { btn: '14px', card: '18px', sheet: '24px' },
      boxShadow: {
        soft: '0 1px 2px rgba(31,41,51,0.05), 0 2px 8px rgba(31,41,51,0.05)',
        lift: '0 4px 16px rgba(31,41,51,0.10)',
        phone: '0 24px 60px rgba(31,41,51,0.22)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      transitionDuration: { fast: '150ms', base: '200ms', slow: '250ms' },
    },
  },
  plugins: [],
} satisfies Config;
