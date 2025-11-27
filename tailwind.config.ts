

import type {Config} from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gold: {
            DEFAULT: '#F59E0B',
            600: '#D97706', // amber-600
            500: '#F59E0B', // amber-500
            400: '#FBBF24', // amber-400
            300: '#FCD34D', // amber-300
            glow: 'rgba(245, 158, 11, 0.15)'
        },
         yellow: {
            700: '#B45309' // amber-700
        },
        emerald: { 500: '#10B981', 400: '#34D399', glow: 'rgba(16, 185, 129, 0.3)' },
        rose: { 500: '#F43F5E', 400: '#FB7185', glow: 'rgba(244, 63, 94, 0.3)' },
        blue: { 500: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
        obsidian: '#050505',
        charcoal: '#0F0F0F',
        platinum: '#F3F4F6',
      },
      borderRadius: {
        xl: "12px",
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        blink: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0' },
        },
        shimmer: {
            '0%': { backgroundPosition: '-1000px 0' },
            '100%': { backgroundPosition: '1000px 0' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'scroll-vertical': {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-50%)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 8s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'scroll-vertical': 'scroll-vertical 40s linear infinite',
      },
       backgroundImage: {
          'holographic': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0) 100%)',
          'noise': "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%221%22/%3E%3C/svg%3E')",
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/container-queries'),
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.pause': {
          'animation-play-state': 'paused',
        },
      })
    }
  ],
};

export default config;
