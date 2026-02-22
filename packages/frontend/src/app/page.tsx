'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Handshake,
  Building2,
  Code,
  Globe,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AreaChart } from '@/components/charts/AreaChart';
import { useCountUp } from '@/hooks/useCountUp';

// ---------------------------------------------------------------------------
// useInView — Intersection Observer hook for scroll animations
// ---------------------------------------------------------------------------

function useInView(
  ref: React.RefObject<HTMLElement | null>,
  options?: { threshold?: number },
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold: options?.threshold ?? 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options?.threshold]);

  return inView;
}

// ---------------------------------------------------------------------------
// Animated stat — counts up when visible
// ---------------------------------------------------------------------------

interface AnimatedStatProps {
  readonly end: number;
  readonly label: string;
  readonly prefix?: string;
  readonly decimals?: number;
  readonly duration?: number;
}

function AnimatedStat({ end, label, prefix, decimals = 0, duration = 2000 }: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useInView(ref, { threshold: 0.3 });
  const { formattedValue } = useCountUp({ end, decimals, duration, enabled: visible });

  return (
    <div ref={ref} className="flex flex-col items-center md:items-start">
      <span className="font-mono text-3xl font-bold text-text-primary md:text-4xl tabular-nums">
        {prefix}
        {formattedValue}
      </span>
      <span className="mt-1 text-sm text-text-tertiary">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature card data
// ---------------------------------------------------------------------------

interface FeatureItem {
  readonly icon: React.ElementType;
  readonly title: string;
  readonly description: string;
}

const FEATURES: readonly FeatureItem[] = [
  {
    icon: Shield,
    title: 'Privacy-First Lending',
    description:
      'Sub-transaction privacy via Canton Network. Your positions, your business.',
  },
  {
    icon: Handshake,
    title: 'Securities Lending',
    description:
      'First tokenized securities lending protocol. Borrow and lend institutional securities on-chain.',
  },
  {
    icon: Building2,
    title: 'RWA Collateral',
    description:
      'Use TIFA receivables as collateral. Bridge real-world assets to DeFi yields.',
  },
] as const;

// ---------------------------------------------------------------------------
// How It Works step data
// ---------------------------------------------------------------------------

interface StepItem {
  readonly number: number;
  readonly title: string;
  readonly description: string;
}

const STEPS: readonly StepItem[] = [
  {
    number: 1,
    title: 'Connect Wallet',
    description: 'Link your Canton-compatible wallet in seconds',
  },
  {
    number: 2,
    title: 'Deposit Assets',
    description: 'Supply crypto, treasuries, or RWA-backed tokens',
  },
  {
    number: 3,
    title: 'Earn or Borrow',
    description: 'Earn yield on deposits or access institutional credit lines',
  },
  {
    number: 4,
    title: 'Manage Positions',
    description: 'Monitor health factors, manage collateral, optimize returns',
  },
] as const;

// ---------------------------------------------------------------------------
// Partner logos
// ---------------------------------------------------------------------------

const PARTNERS: readonly string[] = [
  'Canton',
  'Goldman Sachs',
  'DTCC',
  'Broadridge',
  'Chainlink',
  'EquiLend',
] as const;

// ---------------------------------------------------------------------------
// Protocol chart mock data
// ---------------------------------------------------------------------------

const TVL_DATA: ReadonlyArray<{ month: string; tvl: number }> = [
  { month: 'Jan', tvl: 800_000_000 },
  { month: 'Feb', tvl: 1_100_000_000 },
  { month: 'Mar', tvl: 1_400_000_000 },
  { month: 'Apr', tvl: 1_600_000_000 },
  { month: 'May', tvl: 2_000_000_000 },
  { month: 'Jun', tvl: 2_400_000_000 },
] as const;

interface MarketRow {
  readonly pool: string;
  readonly apy: string;
}

const TOP_MARKETS: readonly MarketRow[] = [
  { pool: 'USDC', apy: '8.24%' },
  { pool: 'T-BILL', apy: '5.12%' },
  { pool: 'wBTC', apy: '2.34%' },
  { pool: 'ETH', apy: '3.56%' },
  { pool: 'SPY', apy: '4.45%' },
] as const;

// ---------------------------------------------------------------------------
// Security badges
// ---------------------------------------------------------------------------

interface SecurityBadge {
  readonly icon: React.ElementType;
  readonly label: string;
}

const SECURITY_BADGES: readonly SecurityBadge[] = [
  { icon: Shield, label: 'Audited by CertiK' },
  { icon: Code, label: 'Powered by Daml' },
  { icon: Globe, label: 'Canton Network' },
  { icon: CheckCircle, label: 'Formal Verification' },
] as const;

// ---------------------------------------------------------------------------
// Footer link data
// ---------------------------------------------------------------------------

interface FooterColumn {
  readonly heading: string;
  readonly links: readonly string[];
}

const FOOTER_COLUMNS: readonly FooterColumn[] = [
  { heading: 'Protocol', links: ['Markets', 'Documentation', 'GitHub'] },
  { heading: 'Community', links: ['Discord', 'Twitter', 'Blog'] },
  { heading: 'Company', links: ['About', 'Careers', 'Contact'] },
  { heading: 'Legal', links: ['Terms', 'Privacy', 'Disclaimers'] },
] as const;

// ---------------------------------------------------------------------------
// Section: Feature Card (with fade-in animation)
// ---------------------------------------------------------------------------

function FeatureCard({ feature, delay }: { readonly feature: FeatureItem; readonly delay: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { threshold: 0.15 });
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border-default bg-surface-card p-8 transition-all duration-700 hover:border-accent-teal/30',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Icon className="h-10 w-10 text-accent-teal" />
      <h3 className="mt-4 text-xl font-semibold text-text-primary">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{feature.description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Animated Section wrapper
// ---------------------------------------------------------------------------

function AnimatedSection({
  children,
  className,
  threshold,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly threshold?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { threshold: threshold ?? 0.1 });

  return (
    <section
      ref={ref}
      className={cn(
        'transition-all duration-700',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className,
      )}
    >
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Navigation Bar                                                  */}
      {/* ----------------------------------------------------------------- */}
      <nav
        className={cn(
          'fixed top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-border-default bg-bg-primary/80 backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-accent-teal">D</span>
            <span className="text-sm font-semibold tracking-widest text-text-primary">
              DUALIS FINANCE
            </span>
          </Link>

          {/* Center links — hidden on mobile */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/markets"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Markets
            </Link>
            <a
              href="#"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              About
            </a>
          </div>

          {/* CTA */}
          <Link href="/overview">
            <Button variant="primary" size="sm" iconRight={<ArrowRight className="h-4 w-4" />}>
              Launch App
            </Button>
          </Link>
        </div>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Hero Section                                                    */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -left-1/4 -top-1/2 h-[150%] w-[150%] animate-pulse rounded-full"
            style={{
              background:
                'radial-gradient(circle, var(--accent-teal, #00D4AA) 0%, transparent 70%)',
              opacity: 0.07,
              animationDuration: '6s',
            }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 h-[100%] w-[100%] animate-pulse rounded-full"
            style={{
              background:
                'radial-gradient(circle, var(--accent-indigo, #6366F1) 0%, transparent 70%)',
              opacity: 0.07,
              animationDuration: '8s',
              animationDelay: '2s',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 md:px-8">
          <h1 className="text-5xl font-bold leading-tight text-text-primary md:text-7xl">
            The Institutional
            <br />
            Lending Protocol
          </h1>
          <p className="mt-4 text-2xl font-semibold text-accent-teal md:text-4xl">
            for Canton Network
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            Privacy-preserving lending, securities lending, and RWA collateralization — built for
            the world&apos;s largest financial institutions.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/overview">
              <Button variant="primary" size="lg">
                Launch App
              </Button>
            </Link>
            <a href="#">
              <Button
                variant="ghost"
                size="lg"
                iconRight={<ArrowRight className="h-5 w-5" />}
              >
                Read Documentation
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-8 md:gap-16">
            <AnimatedStat end={2.4} label="Total Value Locked" prefix="$" decimals={1} />
            <AnimatedStat end={1.8} label="Total Borrowed" prefix="$" decimals={1} />
            <AnimatedStat end={3200} label="Active Users" decimals={0} />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Partners Bar                                                    */}
      {/* ----------------------------------------------------------------- */}
      <AnimatedSection className="py-16">
        <p className="mb-8 text-center text-sm uppercase tracking-wider text-text-tertiary">
          Trusted by the Canton Network ecosystem
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {PARTNERS.map((name) => (
            <span
              key={name}
              className="text-lg font-semibold text-text-disabled transition-colors hover:text-text-secondary"
            >
              {name}
            </span>
          ))}
        </div>
      </AnimatedSection>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Features Grid                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold text-text-primary">
          Built for Institutional Finance
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} delay={i * 150} />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 5. How It Works                                                    */}
      {/* ----------------------------------------------------------------- */}
      <AnimatedSection className="mx-4 rounded-2xl bg-bg-secondary px-8 py-16 md:mx-8">
        <h2 className="mb-16 text-center text-3xl font-bold text-text-primary">How It Works</h2>
        <div className="mx-auto max-w-5xl">
          {/* Connector line on desktop */}
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Horizontal connector — visible on md+ */}
            <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-6 hidden border-t border-dashed border-border-default md:block" />

            {STEPS.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-teal text-lg font-bold text-bg-primary">
                  {step.number}
                </div>
                <h3 className="mt-4 font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Protocol Stats Section                                          */}
      {/* ----------------------------------------------------------------- */}
      <AnimatedSection className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold text-text-primary">
          Live Protocol Metrics
        </h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* TVL Chart */}
          <Card className="lg:col-span-3" padding="md">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              Total Value Locked (6M)
            </h3>
            <AreaChart
              data={TVL_DATA as unknown as Array<Record<string, unknown>>}
              xKey="month"
              yKey="tvl"
              height={300}
            />
          </Card>

          {/* Top Markets */}
          <Card className="lg:col-span-2" padding="md">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Top Markets</h3>
            <div className="space-y-0">
              {TOP_MARKETS.map((market, i) => (
                <div
                  key={market.pool}
                  className={cn(
                    'flex items-center justify-between px-2 py-3',
                    i < TOP_MARKETS.length - 1 && 'border-b border-border-default',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary text-xs font-bold text-text-secondary">
                      {market.pool.slice(0, 2)}
                    </span>
                    <span className="font-medium text-text-primary">{market.pool}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-positive">
                    {market.apy}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </AnimatedSection>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Security Section                                                */}
      {/* ----------------------------------------------------------------- */}
      <AnimatedSection className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <h2 className="mb-4 text-center text-3xl font-bold text-text-primary">
          Battle-Tested Infrastructure
        </h2>
        <p className="mb-12 text-center text-text-secondary">
          Built on the most trusted foundations in financial technology
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {SECURITY_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex items-center gap-3 rounded-lg border border-border-default px-6 py-3"
              >
                <Icon className="h-5 w-5 text-accent-teal" />
                <span className="text-sm font-medium text-text-primary">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </AnimatedSection>

      {/* ----------------------------------------------------------------- */}
      {/* 8. Final CTA                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-24 text-center">
        <h2 className="mb-6 text-3xl font-bold text-text-primary md:text-4xl">
          Start earning institutional-grade yields
        </h2>
        <Link href="/overview">
          <Button
            variant="primary"
            size="xl"
            iconRight={<ArrowRight className="h-5 w-5" />}
            className="shadow-[0_0_30px_rgba(0,212,170,0.3)]"
          >
            Launch App
          </Button>
        </Link>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 9. Footer                                                          */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-border-default py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4 text-sm font-semibold text-text-primary">{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-tertiary transition-colors hover:text-text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-text-disabled">
          &copy; 2026 Cayvox Labs. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
