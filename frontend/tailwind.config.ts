import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary':           '#ff391f',
        'background-light':  '#f8f6f5',
        'background-dark':   '#080C10',
        'surface-dark':      '#161B22',
        'surface-border':    '#30363d',
        'accent-orange':     '#FF5722',
        'fire-red':          '#FF3B1F',
        'fire-orange':       '#FF6B2B',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': [
          'linear-gradient(to right, #30363d1a 1px, transparent 1px)',
          'linear-gradient(to bottom, #30363d1a 1px, transparent 1px)',
        ].join(', '),
      },
    },
  },
  plugins: [],
} satisfies Config
