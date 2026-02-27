'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, Monitor } from 'lucide-react';
import { PartyLayerKit } from '@partylayer/react';
import { useUIStore, applyTheme, resolveTheme } from '@/stores/useUIStore';
import type { ThemePreference } from '@/stores/useUIStore';

const THEME_ICON: Record<ThemePreference, typeof Sun> = { dark: Moon, light: Sun, system: Monitor };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { themePreference, cycleTheme } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme(themePreference);

    if (themePreference === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'));
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [themePreference]);

  const ThemeIcon = THEME_ICON[themePreference];

  return (
    <PartyLayerKit network={(process.env.NEXT_PUBLIC_CANTON_NETWORK as 'mainnet' | 'devnet' | 'testnet') || 'mainnet'} appName="Dualis Finance">
    <div className="relative min-h-screen bg-bg-primary flex flex-col overflow-hidden">
      {/* ── Background Layer 1: Gradient mesh ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,212,191,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 20% 60%, rgba(129,140,248,0.04) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 80% 40%, rgba(6,182,212,0.03) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(45,212,191,0.03) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── Background Layer 2: Animated floating orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Teal orb - top center */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #2DD4BF 0%, transparent 70%)',
            top: '-15%',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'authOrbFloat1 14s ease-in-out infinite',
          }}
        />
        {/* Indigo orb - bottom left */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)',
            bottom: '-10%',
            left: '-8%',
            animation: 'authOrbFloat2 18s ease-in-out infinite',
          }}
        />
        {/* Cyan orb - right */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)',
            top: '40%',
            right: '-5%',
            animation: 'authOrbFloat3 20s ease-in-out infinite',
          }}
        />
      </div>

      {/* ── Background Layer 3: Grid pattern ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 80%)',
        }}
      />

      {/* ── Background Layer 4: Noise texture ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Background Layer 5: Top radial glow ── */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(45,212,191,0.08) 0%, transparent 70%)',
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-8 backdrop-blur-sm">
        <div className="w-9" />
        <Link href="/" className="group flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <span className="font-jakarta font-bold text-xl tracking-tight">
            <span className="text-accent-teal">D</span>
            <span className="text-text-primary">UALIS</span>
          </span>
          <span className="font-jakarta font-light text-[10px] tracking-[0.2em] text-text-tertiary uppercase">
            Finance
          </span>
        </Link>
        {mounted ? (
          <button
            onClick={cycleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-default/60 hover:border-accent-teal/30 bg-bg-elevated/50 hover:bg-bg-elevated transition-all duration-200"
            aria-label={`Theme: ${themePreference}. Click to cycle.`}
          >
            <ThemeIcon className="w-4 h-4 text-text-secondary" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
        {/* Gradient line under header */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-[min(80%,600px)]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.15) 30%, rgba(129,140,248,0.15) 70%, transparent 100%)',
          }}
        />
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 pb-12 overflow-y-auto">
        <Suspense fallback={null}>{children}</Suspense>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex items-center justify-center gap-8 py-8 text-[12px] text-text-disabled">
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-accent-teal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Built on Canton Network
        </span>
        <span className="w-px h-3 bg-border-default" />
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-accent-teal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Privacy by Design
        </span>
      </footer>

      {/* ── Orb animations ── */}
      <style jsx>{`
        @keyframes authOrbFloat1 {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(15px); }
        }
        @keyframes authOrbFloat2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-12px) translateX(8px); }
          66% { transform: translateY(8px) translateX(-4px); }
        }
        @keyframes authOrbFloat3 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-18px) translateX(-10px); }
        }
      `}</style>
    </div>
    </PartyLayerKit>
  );
}
