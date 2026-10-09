const lightswindPlugin = require('lightswind/plugin');

module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './node_modules/lightswind/dist/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecf8ef',
          100: '#d4edda',
          200: '#b3dfbd',
          300: '#85cb94',
          400: '#57b770',
          500: '#3D8C4F',
          600: '#2e6c3b',
          700: '#265832',
          800: '#1e4428',
          900: '#16311d',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f9fbfa',
          elevated: '#ffffff',
        },
        ink: {
          DEFAULT: '#111827',
          soft: '#4b5563',
          muted: '#9ca3af',
        },
        line: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        card: '0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        raised: '0 8px 30px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        glow: '0 0 0 3px rgba(61,140,79,0.12)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [lightswindPlugin({ effect3d: false })],
  corePlugins: {
    preflight: false,
  },
};
