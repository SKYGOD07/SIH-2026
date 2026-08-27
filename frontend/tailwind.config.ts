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
        // Official SetuBharat Colors
        navy: {
          950: '#071527',
          900: '#0B1F3A', // Primary Deep Navy
          800: '#0E284A',
          700: '#143560',
          600: '#1C4376',
          100: '#E2EAF4',
          50: '#F0F4F9',
        },
        govblue: {
          900: '#10398A',
          800: '#1347B0',
          700: '#1451D1',
          600: '#155EEF', // Secondary Government Blue
          500: '#2B70F7',
          400: '#538CF9',
          100: '#DDE8FD',
          50: '#EFF4FE',
        },
        emerald: {
          900: '#034E35',
          800: '#056041',
          700: '#087A53',
          600: '#0E9F6E', // Verification / Success
          500: '#10B981',
          100: '#D1FAE5',
          50: '#ECFDF5',
        },
        amber: {
          900: '#78350F',
          800: '#92400E',
          700: '#B45309',
          600: '#D97706', // Pending / Warning
          500: '#F59E0B', // Saffron Indian Accent
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        red: {
          900: '#7F1D1D',
          800: '#991B1B',
          700: '#B91C1C',
          600: '#DC2626', // Error / Rejected
          500: '#EF4444',
          100: '#FEE2E2',
          50: '#FEF2F2',
        },
        slate: {
          950: '#0B1120',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: '#0B1F3A',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#155EEF',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#475569',
        },
        accent: {
          DEFAULT: '#EFF6FF',
          foreground: '#155EEF',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: '#155EEF',
      },
      borderRadius: {
        '2xl': '1rem',
        xl: '0.75rem',
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(11, 31, 58, 0.06), 0 1px 2px -1px rgba(11, 31, 58, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(11, 31, 58, 0.08), 0 8px 10px -6px rgba(11, 31, 58, 0.04)',
        gov: '0 4px 14px 0 rgba(11, 31, 58, 0.1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
