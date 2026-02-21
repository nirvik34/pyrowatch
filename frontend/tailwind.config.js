
export default {
  content: ['./index.html', './src*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fire:    { DEFAULT: '#C0392B', light: '#FADBD8', dark: '#922B21' },
        ember:   { DEFAULT: '#E67E22', light: '#FDEBD0' },
        risk: {
          low:      '#27AE60',
          moderate: '#F39C12',
          high:     '#E67E22',
          extreme:  '#C0392B',
        },
        alert: {
          watch:     '#F1C40F',
          warning:   '#E67E22',
          emergency: '#C0392B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}