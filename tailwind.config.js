/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A',
        cloud: '#F8FAFC',
        accent: '#2563EB',
        'accent-dark': '#1D4ED8',
        success: '#10B981',
        gold: '#F59E0B',
        'gold-dark': '#D97706',
        danger: '#EF4444',
        muted: '#64748B',
        'text-secondary': '#94A3B8',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        overlayIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        fadeIn: 'fadeIn 0.4s ease forwards',
        slideDown: 'slideDown 0.4s ease forwards',
        scaleUp: 'scaleUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        overlayIn: 'overlayIn 0.25s ease forwards',
      },
    },
  },
  plugins: [],
};
