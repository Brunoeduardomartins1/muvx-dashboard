import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#08F887',
          dark: '#059660',
          dim: '#06D474',
        },
        dark: {
          DEFAULT: '#0A0C10',
          card: '#18181B',
        },
        surface: '#FFFFFF',
        background: '#FAFAFA',
        border: '#E5E7EB',
        text: {
          DEFAULT: '#111827',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        status: {
          online: '#08F887',
          processing: '#F59E0B',
          error: '#EF4444',
          inactive: '#9CA3AF',
        },
      },
      fontFamily: {
        grotesk: ['var(--font-space-grotesk)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '100px',
      },
      boxShadow: {
        'green-sm': '0 4px 16px rgba(8, 248, 135, 0.12)',
        'green-md': '0 8px 32px rgba(8, 248, 135, 0.16)',
      },
    },
  },
  plugins: [],
}

export default config
