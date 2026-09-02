/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#292524', 700: '#57534E', 500: '#78716C', 300: '#D6D3D1' },
        brand: { 50: '#FDF3F0', 100: '#FBE4DC', 400: '#E8927C', 500: '#D97757', 600: '#C2603F', 700: '#A14A2E' },
        mint: { 50: '#F0FDF4', 100: '#DCFCE7', 500: '#16A34A', 600: '#15803D' },
        amber: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#D97706' },
        rose: { 50: '#FEF2F2', 100: '#FEE2E2', 500: '#DC2626' },
        cloud: { 50: '#FAF9F5', 100: '#F4F2ED', 200: '#E8E5DD' },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: { card: '16px', pill: '999px' },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
        pop: '0 8px 30px rgba(15, 23, 42, 0.12)',
      },
      keyframes: {
        typingDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
      },
      animation: {
        typingDot: 'typingDot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
