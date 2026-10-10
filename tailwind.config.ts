import type { Config } from 'tailwindcss'
import { palette } from './src/lib/ui/palette'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: palette.bg,
        bg2: palette.bg2,
        panel: palette.panel,
        accent: 'var(--accent)',
        accent2: palette.accent2,
        soft: 'var(--accent)',
        text: palette.text,
        muted: palette.muted,
        success: palette.success,
        warning: palette.warning,
        danger: palette.danger,
        rose: palette.rose,
        sage: palette.sage,
        apricot: palette.apricot,
        mode: 'var(--mode-accent)',
        border: 'rgba(232, 223, 208, 0.09)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
      },
      borderRadius: {
        panel: '16px',
      },
    },
  },
} satisfies Config