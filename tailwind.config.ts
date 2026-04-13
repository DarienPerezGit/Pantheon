import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'space-black':  '#0A0A0C',
        'space-dark':   '#111116',
        'space-mid':    '#17171D',
        'space-line':   '#1E1E26',
        'space-line2':  '#2A2A36',
        'muted':        '#8B8B9E',
        'subtle':       '#56566A',
        'accent':       '#FF007F',
        'stellar-blue': '#00A3FF',
        'neon-green':   '#00FF88',
        'crimson':      '#FF2D55',
        'grey-signal':  '#556070',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      keyframes: {
        blink:      { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        fadeInRow:  { from: { opacity: '0', transform: 'translateY(-6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulse:      { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        blink:     'blink 1s step-end infinite',
        fadeInRow: 'fadeInRow 0.45s ease forwards',
        pulse:     'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
