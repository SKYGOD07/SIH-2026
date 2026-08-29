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
        /**
         * The deck's accent. A hot, saturated red, taken from the reference the
         * landing page is built to.
         *
         * Deliberately not the same colour as `signal`. The two surfaces have
         * different jobs: the deck is an argument made once to a room, and wants
         * a colour that shouts; the console is a tool used every day, where the
         * accent has to coexist with a `risk` state that is itself red. One
         * accent doing both would either be too loud to work at a desk or too
         * quiet to carry a hall.
         */
        flare: {
          DEFAULT: '#BD0A0A',
          bright: '#E01414',
        },
        /** The dim state every wipe-revealed word starts in. */
        dim: { DEFAULT: '#252525' },
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
        display: ['var(--font-display)', 'Poppins', 'Helvetica Neue', 'Arial', 'sans-serif'],
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
        'display-xs': ['clamp(1.1rem, min(2.1vw, 3.3svh), 1.9rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        'display-sm': ['clamp(1.6rem, min(3.5vw, 5.6svh), 3.2rem)', { lineHeight: '0.98', letterSpacing: '-0.04em' }],
        'display-md': ['clamp(2.1rem, min(5.6vw, 8.8svh), 5.2rem)', { lineHeight: '0.95', letterSpacing: '-0.05em' }],
        'display-lg': ['clamp(2.5rem, min(7.6vw, 12svh), 7.5rem)', { lineHeight: '0.92', letterSpacing: '-0.05em' }],
        'display-xl': ['clamp(2.9rem, min(10vw, 15svh), 10rem)', { lineHeight: '0.9', letterSpacing: '-0.055em' }],
        /** Hero: one word per line, filling the measure. */
        'hero-line': ['clamp(2.4rem, min(9.2vw, 12.5svh), 9rem)', { lineHeight: '0.9', letterSpacing: '-0.05em' }],
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
