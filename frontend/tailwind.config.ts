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
        /**
         * Three tonal families, not one.
         *
         *  ink    — the near-black ground, faintly cool so it reads as depth
         *           rather than as switched-off black.
         *  abyss  — a desaturated blue-teal used only in gradients and backdrop
         *           pools. It is the complement of saffron, which is what makes
         *           the accent register as warm instead of as orange-on-grey.
         *  ivory  — the paper family for inverted sections and all type.
         *
         * Flat #000 appears nowhere: every dark surface is a gradient between
         * two of these, which is what stops the page looking like a black void.
         */
        ink: {
          DEFAULT: '#0A0B0D',
          950: '#07080A',
          900: '#0E1013',
          800: '#141619',
          700: '#1B1E22',
          600: '#24282D',
        },
        abyss: {
          DEFAULT: '#0E1B22',
          light: '#162C36',
          deep: '#091419',
          glow: '#1E4152',
        },
        graphite: {
          DEFAULT: '#33363B',
          light: '#565A61',
          dark: '#25282C',
        },
        ivory: {
          DEFAULT: '#F6F3EC',
          soft: '#EAE5D9',
          dim: '#D3CDBF',
        },
        silver: {
          DEFAULT: '#A6A49C',
          dark: '#78766F',
        },
        saffron: {
          DEFAULT: '#E8762B',
          light: '#F79A44',
          deep: '#BE5714',
          ember: '#FFB870',
        },
        validated: {
          DEFAULT: '#5F9070',
          light: '#84B294',
        },
        risk: {
          DEFAULT: '#C0524A',
        },

        /* shadcn bridge tokens, kept so the existing ui/ primitives still work */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
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
        /**
         * Display ramp bound to BOTH axes.
         *
         * The previous ramp scaled on vw alone, so a five-line block at 11.5vw
         * was taller than the viewport on any normal laptop — which is what put
         * the hero under the navigation. Every display size now clamps against
         * `svh` as well, so a short viewport shrinks the type instead of
         * overflowing it, and multi-line blocks stay inside the frame.
         */
        'display-xs': ['clamp(1.15rem, min(2.1vw, 3.2svh), 1.9rem)', { lineHeight: '1.02', letterSpacing: '-0.018em' }],
        'display-sm': ['clamp(1.6rem, min(3.4vw, 5.4svh), 3rem)', { lineHeight: '0.96', letterSpacing: '-0.026em' }],
        'display-md': ['clamp(2rem, min(5.2vw, 8.4svh), 4.75rem)', { lineHeight: '0.92', letterSpacing: '-0.032em' }],
        'display-lg': ['clamp(2.4rem, min(7vw, 11svh), 6.5rem)', { lineHeight: '0.88', letterSpacing: '-0.038em' }],
        'display-xl': ['clamp(2.8rem, min(9.5vw, 15svh), 9rem)', { lineHeight: '0.85', letterSpacing: '-0.042em' }],
        /** Hero only: five stacked lines have to fit between nav and footer rail. */
        'hero-line': ['clamp(2rem, min(7.4vw, 10.2svh), 6.75rem)', { lineHeight: '0.86', letterSpacing: '-0.04em' }],
        meta: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.18em' }],
        'meta-lg': ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.16em' }],
      },
      spacing: {
        section: 'clamp(6rem, 14vh, 12rem)',
        /** Height of the fixed navigation, so sections can reserve it. */
        nav: 'var(--nav-h)',
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
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-8px,0)' },
        },
        'sheen': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(320%)' },
        },
      },
      animation: {
        drift: 'drift 7s ease-in-out infinite',
        sheen: 'sheen 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
