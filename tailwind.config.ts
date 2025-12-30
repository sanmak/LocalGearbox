/*
 * Copyright (c) 2025 LocalGearbox. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for details.
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', 'class'],
  theme: {
    extend: {
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      colors: {
        background: 'hsl(var(--background))',
        surface: {
          DEFAULT: 'rgb(var(--color-surface))',
          secondary: 'rgb(var(--color-surface-secondary))',
          tertiary: 'rgb(var(--color-surface-tertiary))',
        },
        border: 'hsl(var(--border))',
        text: {
          primary: 'rgb(var(--color-text-primary))',
          secondary: 'rgb(var(--color-text-secondary))',
          tertiary: 'rgb(var(--color-text-tertiary))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          hover: 'rgb(var(--color-accent-hover))',
          subtle: 'rgb(var(--color-accent-subtle))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          hover: 'rgb(var(--color-secondary-hover))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success))',
          subtle: 'rgb(var(--color-success-subtle))',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning))',
          subtle: 'rgb(var(--color-warning-subtle))',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error))',
          subtle: 'rgb(var(--color-error-subtle))',
        },
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
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
      },
      fontSize: {
        xs: [
          '0.75rem',
          {
            lineHeight: '1.5',
          },
        ],
        sm: [
          '0.875rem',
          {
            lineHeight: '1.5',
          },
        ],
        base: [
          '1rem',
          {
            lineHeight: '1.5',
          },
        ],
        lg: [
          '1.125rem',
          {
            lineHeight: '1.5',
          },
        ],
        xl: [
          '1.25rem',
          {
            lineHeight: '1.5',
          },
        ],
        '2xl': [
          '1.5rem',
          {
            lineHeight: '1.4',
          },
        ],
        '3xl': [
          '1.875rem',
          {
            lineHeight: '1.3',
          },
        ],
        '4xl': [
          '2.25rem',
          {
            lineHeight: '1.2',
          },
        ],
        '5xl': [
          '3rem',
          {
            lineHeight: '1.1',
          },
        ],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-down': 'slideDown 200ms ease-in-out',
        'scale-in': 'scaleIn 150ms ease-in-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        slideDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-4px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
