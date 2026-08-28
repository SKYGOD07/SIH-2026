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
         * Three colours, taken from the silviasguotti.design reference:
         * pure black ground, pure white type, one vivid yellow signal.
         *
         * No greys in the palette and no warm neutrals. Every intermediate tone
         * is white or black at an alpha — `text-chalk/50`, `border-chalk/15` —
         * which is what keeps the page reading as stark rather than as a
         * gradient of beiges. That starkness is the whole character.
         */
        void: {
          DEFAULT: '#000000',
          soft: '#090909',
          lift: '#141414',
        },
        chalk: {
          DEFAULT: '#FFFFFF',
        },
        signal: {
          DEFAULT: '#FFC400',
          deep: '#E0AC00',
        },
        validated: { DEFAULT: '#6FCF97' },
        risk: { DEFAULT: '#FF6B5A' },

        /* shadcn bridge tokens, kept so the existing ui/ primitives still work */
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
        display: ['var(--font-display)', 'Inter Tight', 'Helvetica Neue', 'Arial', 'sans-serif'],
        /** Display serif, used for one or two words inside a headline. */
        accent: ['var(--font-accent)', 'Instrument Serif', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        /**
         * Display ramp.
         *
         * Tracking is heavily negative (-0.05em and tighter at the top of the
         * ramp) and leading sits under 1. That combination — not weight — is
         * what makes the reference headlines read as expressive: the words lock
         * into a single dense mass rather than sitting as loose letters.
         *
         * Every size clamps against `svh` as well as `vw`, so a short viewport
         * shrinks the type instead of pushing it under the navigation.
         */
        'display-xs': ['clamp(1.2rem, min(2.3vw, 3.6svh), 2.1rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-sm': ['clamp(1.8rem, min(4vw, 6.4svh), 3.6rem)', { lineHeight: '0.96', letterSpacing: '-0.04em' }],
        'display-md': ['clamp(2.4rem, min(6.4vw, 10svh), 6rem)', { lineHeight: '0.93', letterSpacing: '-0.045em' }],
        'display-lg': ['clamp(2.8rem, min(9vw, 14svh), 9rem)', { lineHeight: '0.9', letterSpacing: '-0.05em' }],
        'display-xl': ['clamp(3.2rem, min(12vw, 18svh), 12rem)', { lineHeight: '0.88', letterSpacing: '-0.055em' }],
        /** Hero: one word per line, filling the measure. */
        'hero-line': ['clamp(2.6rem, min(11vw, 14.5svh), 11rem)', { lineHeight: '0.88', letterSpacing: '-0.052em' }],
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
