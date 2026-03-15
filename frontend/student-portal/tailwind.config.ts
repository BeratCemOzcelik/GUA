import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B1A1A',
          dark: '#6B1414',
          light: '#A52A2A',
        },
        accent: {
          gold: '#D4AF37',
          navy: '#1E3A8A',
        },
      },
    },
  },
  plugins: [],
}
export default config
