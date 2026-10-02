import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080B12',
        bg2: '#0D111A',
        panel: '#101725',
        accent: 'var(--accent)',
        accent2: '#22D3EE',
        soft: '#A78BFA',
        text: '#F8FAFC',
        muted: '#94A3B8',
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#FB7185',
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        panel: '16px',
      },
    },
  },
} satisfies Config