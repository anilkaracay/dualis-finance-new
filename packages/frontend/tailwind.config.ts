import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Backgrounds — layered depth
        'bg-primary': '#06080F',
        'bg-secondary': '#0C1019',
        'bg-tertiary': '#141922',
        'bg-hover': '#1A2030',
        'bg-active': '#242D3D',

        // Surfaces
        'surface-card': '#0E1420',
        'surface-input': '#080C14',
        'surface-modal': '#111827',
        'surface-selected': 'rgba(0,230,184,0.06)',

        // Borders — ultra-subtle
        'border-default': 'rgba(255,255,255,0.06)',
        'border-subtle': 'rgba(255,255,255,0.03)',
        'border-hover': 'rgba(255,255,255,0.10)',
        'border-focus': '#00E6B8',
        'border-error': '#FF4C6A',

        // Text — refined hierarchy
        'text-primary': '#F0F2F5',
        'text-secondary': '#8A94A6',
        'text-tertiary': '#5A6478',
        'text-disabled': '#3D4556',
        'text-inverse': '#06080F',

        // Accent — luminous
        'accent-teal': '#00E6B8',
        'accent-teal-hover': '#00FFD0',
        'accent-teal-muted': 'rgba(0,230,184,0.12)',
        'accent-teal-glow': 'rgba(0,230,184,0.15)',
        'accent-indigo': '#7C6FF7',
        'accent-indigo-hover': '#9B8FFF',
        'accent-indigo-muted': 'rgba(124,111,247,0.12)',
        'accent-gold': '#FFB020',
        'accent-blue': '#4C9AFF',

        // Semantic — more nuanced
        positive: '#00D68F',
        'positive-muted': 'rgba(0,214,143,0.08)',
        negative: '#FF4C6A',
        'negative-muted': 'rgba(255,76,106,0.08)',
        warning: '#FFB020',
        'warning-muted': 'rgba(255,176,32,0.08)',
        info: '#4C9AFF',
        'info-muted': 'rgba(76,154,255,0.08)',

        // Tiers — refined
        'tier-diamond': '#A8E8FF',
        'tier-gold': '#FFB020',
        'tier-silver': '#B8C4D4',
        'tier-bronze': '#D4956A',
        'tier-unrated': '#5A6478',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.4' }],
        xs: ['0.694rem', { lineHeight: '1.5' }],
        sm: ['0.833rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.4' }],
        xl: ['1.25rem', { lineHeight: '1.3' }],
        '2xl': ['1.563rem', { lineHeight: '1.2' }],
        '3xl': ['1.953rem', { lineHeight: '1.2' }],
        '4xl': ['2.441rem', { lineHeight: '1.1' }],
        '5xl': ['3.052rem', { lineHeight: '1.1' }],
        '6xl': ['3.815rem', { lineHeight: '1.05' }],
      },
      letterSpacing: {
        'tighter': '-0.03em',
        'tight': '-0.02em',
        'snug': '-0.01em',
        'normal': '0',
        'wide': '0.04em',
        'wider': '0.06em',
        'widest': '0.08em',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
        md: '0 4px 6px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.12)',
        lg: '0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.15)',
        xl: '0 20px 25px rgba(0,0,0,0.35), 0 8px 10px rgba(0,0,0,0.15)',
        'glow-teal': '0 0 20px rgba(0,230,184,0.20), 0 0 60px rgba(0,230,184,0.05)',
        'glow-teal-sm': '0 0 10px rgba(0,230,184,0.15)',
        'glow-danger': '0 0 20px rgba(255,76,106,0.25)',
        'glow-gold': '0 0 20px rgba(255,176,32,0.20)',
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
        'pulse-danger': 'pulse-danger 2s ease-in-out infinite',
        'pulse-number': 'pulse-number 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'draw-line': 'drawLine 0.4s ease-out',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.4,0,0.2,1)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'grid-shift': 'gridShift 20s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-danger': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'pulse-number': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        drawLine: {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,230,184,0.10)' },
          '50%': { boxShadow: '0 0 40px rgba(0,230,184,0.20)' },
        },
        gridShift: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '60px 60px' },
        },
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
