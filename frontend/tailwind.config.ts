import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Landing page typefaces.
        grotesk: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#3B25D8',
          dark: '#2E1CB0',
          tint: '#F2F1FC',
        },
        ink: '#111827',
        canvas: '#F7F8FA',
        // Shared editorial palette (landing + app).
        paper: '#FBFAF7',
        graphite: { DEFAULT: '#16171B', soft: '#33353B' },
        surface: '#FFFFFF',
        line: '#E8E6E0',
        muted: '#52565D',
        faint: '#9AA0A6',
      },
    },
  },
  plugins: [],
} satisfies Config;
