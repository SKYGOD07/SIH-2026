import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* --- MahaInnovate restrained palette --- */
        ink: {
          DEFAULT: '#0A0A09',
          900: '#0E0E0C',
          800: '#141412',
          700: '#1C1C19',
          600: '#26251F',
        },
        graphite: {
          DEFAULT: '#3A3934',
          light: '#57564F',
          dark: '#2A2926',
        },
        ivory: {
          DEFAULT: '#F5F2EC',
          soft: '#EAE6DD',
          dim: '#D6D1C6',
        },
        silver: {
          DEFAULT: '#A9A69C',
          dark: '#7C7A72',
        },
        saffron: {
          DEFAULT: '#E4762A',
          light: '#F2933F',
          deep: '#C25C18',
          wash: 'rgba(228,118,42,0.12)',
        },
        validated: {
          DEFAULT: '#5E8B6A',
          light: '#7BA487',
        },
        risk: {
          DEFAULT: '#B4483C',
        },
        /* shadcn bridge tokens (kept for existing ui/ components) */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        /* editorial display ramp — clamped, viewport-fluid */
        'display-xs': ['clamp(1.75rem, 3.2vw, 2.75rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(2.25rem, 5vw, 4rem)', { lineHeight: '0.94', letterSpacing: '-0.028em' }],
        'display-md': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.9', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(3.5rem, 11.5vw, 11rem)', { lineHeight: '0.86', letterSpacing: '-0.04em' }],
        'display-xl': ['clamp(4rem, 15vw, 16rem)', { lineHeight: '0.82', letterSpacing: '-0.045em' }],
        'meta': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.18em' }],
        'meta-lg': ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.16em' }],
      },
      spacing: {
        section: 'clamp(6rem, 14vh, 12rem)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'drift': {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-8px,0)' },
        },
      },
      animation: {
        drift: 'drift 7s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
