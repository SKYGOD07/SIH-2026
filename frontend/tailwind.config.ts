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
         * Light-primary palette.
         *
         * The reference work (noomoagency.com, valentime.noomoagency.com) is
         * calm, warm and pale — enormous dark type on a soft ground, with a few
         * large matte forms. The first pass was near-black and busy, which is
         * why it read as debris rather than as a considered object.
         *
         *  bone     — the page ground. Warm off-white, never pure #FFF.
         *  ink      — type. Warm near-black, never pure #000.
         *  saffron  — the single accent, deepened so it holds contrast on bone.
         *  abyss    — reserved for the few dark punctuation sections that carry
         *             the heaviest 3D moments. Dark is now the exception.
         */
        bone: {
          DEFAULT: '#EDE7DD',
          soft: '#F4F1EA',
          light: '#F8F6F1',
          deep: '#E0D8CB',
          shadow: '#D2C8B8',
        },
        ink: {
          DEFAULT: '#17161A',
          soft: '#26242A',
          muted: '#45433D',
        },
        stone: {
          DEFAULT: '#8A8780',
          light: '#A8A49B',
          dark: '#63615B',
        },
        saffron: {
          DEFAULT: '#D2590F',
          light: '#E8762B',
          deep: '#A8430A',
          wash: '#F2D9C4',
        },
        validated: {
          DEFAULT: '#4E7A5C',
          light: '#6B9678',
        },
        risk: {
          DEFAULT: '#A83E32',
        },
        /* Dark punctuation sections */
        abyss: {
          DEFAULT: '#14161A',
          deep: '#0D0F12',
          light: '#1E2228',
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
         * Display ramp. Larger and lighter than the first pass — the reference
         * sets type edge to edge at a light weight, and lets whitespace and
         * scale carry the composition rather than colour or effects.
         *
         * Every size clamps against `svh` as well as `vw`, so a short viewport
         * shrinks the type instead of pushing it under the fixed navigation.
         */
        'display-xs': ['clamp(1.15rem, min(2.2vw, 3.4svh), 2rem)', { lineHeight: '1.04', letterSpacing: '-0.015em' }],
        'display-sm': ['clamp(1.7rem, min(3.8vw, 6svh), 3.4rem)', { lineHeight: '0.98', letterSpacing: '-0.022em' }],
        'display-md': ['clamp(2.2rem, min(6vw, 9.5svh), 5.5rem)', { lineHeight: '0.93', letterSpacing: '-0.028em' }],
        'display-lg': ['clamp(2.6rem, min(8.4vw, 13svh), 8rem)', { lineHeight: '0.9', letterSpacing: '-0.034em' }],
        'display-xl': ['clamp(3rem, min(11vw, 17svh), 11rem)', { lineHeight: '0.87', letterSpacing: '-0.038em' }],
        /** Hero: one word per line, filling the measure. */
        'hero-line': ['clamp(2.4rem, min(10.5vw, 13.5svh), 10rem)', { lineHeight: '0.87', letterSpacing: '-0.036em' }],
        meta: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.16em' }],
        'meta-lg': ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.14em' }],
      },
      spacing: {
        section: 'clamp(6rem, 14vh, 12rem)',
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
      },
      animation: {
        drift: 'drift 7s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
