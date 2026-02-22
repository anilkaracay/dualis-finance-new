import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Backgrounds — auto-switch via CSS variables
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-hover': 'var(--color-bg-hover)',
        'bg-active': 'var(--color-bg-active)',
        'bg-elevated': 'var(--color-bg-elevated)',

        // Surfaces
        'surface-card': 'var(--color-surface-card)',
        'surface-input': 'var(--color-surface-input)',
        'surface-modal': 'var(--color-surface-modal)',
        'surface-selected': 'var(--color-surface-selected)',

        // Borders
        'border-default': 'var(--color-border-default)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-hover': 'var(--color-border-hover)',
        'border-medium': 'var(--color-border-medium)',
        'border-strong': 'var(--color-border-strong)',
        'border-focus': 'var(--color-border-focus)',
        'border-error': 'var(--color-border-error)',

        // Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-disabled': 'var(--color-text-disabled)',
        'text-inverse': 'var(--color-text-inverse)',

        // Accent
        'accent-teal': 'var(--color-accent-teal)',
        'accent-teal-hover': 'var(--color-accent-teal-hover)',
        'accent-teal-muted': 'var(--color-accent-teal-muted)',
        'accent-teal-glow': 'var(--color-accent-teal-glow)',
        'accent-teal-subtle': 'var(--color-accent-teal-subtle)',
        'accent-indigo': 'var(--color-accent-indigo)',
        'accent-indigo-hover': 'var(--color-accent-indigo-hover)',
        'accent-indigo-muted': 'var(--color-accent-indigo-muted)',
        'accent-gold': 'var(--color-accent-gold)',
        'accent-blue': 'var(--color-accent-blue)',

        // Semantic
        positive: 'var(--color-positive)',
        'positive-muted': 'var(--color-positive-muted)',
        negative: 'var(--color-negative)',
        'negative-muted': 'var(--color-negative-muted)',
        warning: 'var(--color-warning)',
        'warning-muted': 'var(--color-warning-muted)',
        info: 'var(--color-info)',
        'info-muted': 'var(--color-info-muted)',

        // Tiers
        'tier-diamond': 'var(--color-tier-diamond)',
        'tier-gold': 'var(--color-tier-gold)',
        'tier-silver': 'var(--color-tier-silver)',
        'tier-bronze': 'var(--color-tier-bronze)',
        'tier-unrated': 'var(--color-tier-unrated)',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
        jakarta: ['var(--font-jakarta)', 'Plus Jakarta Sans', '-apple-system', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.4' }],
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.4' }],
        xl: ['1.25rem', { lineHeight: '1.3' }],
        '2xl': ['1.5rem', { lineHeight: '1.2' }],
        '3xl': ['1.75rem', { lineHeight: '1.2' }],
        '4xl': ['2.25rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.05' }],
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
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        elevated: 'var(--shadow-elevated)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: '0 20px 25px rgba(0,0,0,0.35), 0 8px 10px rgba(0,0,0,0.15)',
        glow: 'var(--shadow-glow)',
        'glow-teal': '0 0 20px rgba(45,212,191,0.20), 0 0 60px rgba(45,212,191,0.05)',
        'glow-teal-sm': '0 0 10px rgba(45,212,191,0.15)',
        'glow-danger': '0 0 20px rgba(248,113,113,0.25)',
        'glow-gold': '0 0 20px rgba(251,191,36,0.20)',
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
