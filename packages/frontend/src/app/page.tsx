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
  ChevronDown,
  Factory,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
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
  readonly suffix?: string;
  readonly decimals?: number;
  readonly duration?: number;
}

function AnimatedStat({
  end,
  label,
  prefix,
  suffix,
  decimals = 0,
  duration = 2000,
}: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useInView(ref, { threshold: 0.3 });
  const { formattedValue } = useCountUp({ end, decimals, duration, enabled: visible });

  return (
    <div ref={ref} className="flex flex-col items-center md:items-start">
      <span className="text-kpi text-2xl md:text-3xl">
        {prefix}
        {formattedValue}
        {suffix}
      </span>
      <span className="text-label mt-1.5">{label}</span>
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
    icon: ShieldCheck,
    title: 'Composite Credit Scoring',
    description:
      'Three-layer ZK-powered credit scoring — on-chain history, off-chain attestations, and ecosystem participation.',
  },
  {
    icon: Factory,
    title: 'Productive Lending',
    description:
      'Finance real-world infrastructure projects. IoT-verified cashflows, ESG ratings, and hybrid collateral.',
  },
  {
    icon: Handshake,
    title: 'Advanced Securities Lending',
    description:
      'Fractional offers, dynamic fee curves, bilateral netting, and automated corporate action processing.',
  },
  {
    icon: Building2,
    title: 'Institutional Track',
    description:
      'Full KYB onboarding, compliance controls, API key management, and bulk operations for institutions.',
  },
  {
    icon: Fingerprint,
    title: 'Privacy Toggle',
    description:
      'Granular privacy controls with selective disclosure rules, audit logging, and Canton sub-transaction privacy.',
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
// ScrollSection — fades in when entering viewport
// ---------------------------------------------------------------------------

function ScrollSection({
  children,
  className,
  delay = 0,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { threshold: 0.08 });

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(
        'transition-all duration-700 ease-out',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
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
            <span className="text-label tracking-widest">DUALIS</span>
          </Link>

          {/* Center links — hidden on mobile */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/markets"
              className="text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              Markets
            </Link>
            <a
              href="#"
              className="text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-xs text-text-secondary transition-colors hover:text-text-primary"
            >
              About
            </a>
          </div>

          {/* CTA */}
          <Link href="/overview">
            <Button variant="primary" size="sm" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Launch App
            </Button>
          </Link>
        </div>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Hero Section                                                    */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* Grid mesh background */}
        <div className="absolute inset-0 -z-10 bg-grid-mesh animate-grid-shift" />

        {/* Subtle gradient orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -left-1/4 -top-1/2 h-[150%] w-[150%] animate-pulse rounded-full"
            style={{
              background:
                'radial-gradient(circle, var(--color-accent-teal) 0%, transparent 70%)',
              opacity: 0.04,
              animationDuration: '6s',
            }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 h-[100%] w-[100%] animate-pulse rounded-full"
            style={{
              background:
                'radial-gradient(circle, var(--color-accent-indigo) 0%, transparent 70%)',
              opacity: 0.04,
              animationDuration: '8s',
              animationDelay: '2s',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 md:px-8">
          {/* Heading — staggered fade-in */}
          <h1 className="animate-fade-in-up animate-fill-both stagger-1 text-4xl font-semibold tracking-tight text-text-primary md:text-6xl">
            The Institutional
            <br />
            Lending Protocol
          </h1>
          <p className="animate-fade-in-up animate-fill-both stagger-2 mt-3 text-xl font-semibold text-accent-teal md:text-3xl">
            for Canton Network
          </p>
          <p className="animate-fade-in-up animate-fill-both stagger-3 mt-5 max-w-xl text-sm leading-relaxed text-text-tertiary">
            Privacy-preserving lending, securities lending, and RWA collateralization — built for
            the world&apos;s largest financial institutions.
          </p>

          {/* CTA Buttons — staggered */}
          <div className="animate-fade-in-up animate-fill-both stagger-4 mt-10 flex flex-wrap gap-4">
            <Link href="/overview">
              <Button variant="primary" size="lg" className="shadow-glow-teal-sm">
                Launch App
              </Button>
            </Link>
            <a href="#">
              <Button
                variant="ghost"
                size="lg"
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Read Documentation
              </Button>
            </a>
          </div>

          {/* Stats — staggered */}
          <div className="animate-fade-in-up animate-fill-both stagger-5 mt-16 flex flex-wrap gap-10 md:gap-16">
            <AnimatedStat end={2.4} label="Total Value Locked" prefix="$" suffix="B" decimals={1} />
            <AnimatedStat end={1.8} label="Total Borrowed" prefix="$" suffix="B" decimals={1} />
            <AnimatedStat end={3.2} label="Active Users" suffix="K" decimals={1} />
            <AnimatedStat end={142} label="Productive Projects" />
            <AnimatedStat end={5} label="Innovations" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="h-5 w-5 text-text-disabled animate-bounce-subtle" />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Partners Bar                                                    */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-14">
        <p className="text-label mb-8 text-center">
          Trusted by the Canton Network ecosystem
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {PARTNERS.map((name) => (
            <span
              key={name}
              className="text-sm font-medium text-text-primary opacity-40 transition-opacity duration-300 hover:opacity-70"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Features Grid                                                   */}
      {/* ----------------------------------------------------------------- */}
      <ScrollSection className="mx-auto max-w-5xl px-4 py-20 md:px-8">
        <h2 className="text-heading mb-14 text-center text-2xl">
          What Makes Dualis Different
        </h2>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:grid-cols-5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <Icon className="h-5 w-5 text-accent-teal" />
                <h3 className="mt-3 text-sm font-medium text-text-primary">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollSection>

      {/* ----------------------------------------------------------------- */}
      {/* 5. How It Works                                                    */}
      {/* ----------------------------------------------------------------- */}
      <ScrollSection className="mx-auto max-w-5xl px-4 py-20 md:px-8">
        <h2 className="text-heading mb-16 text-center text-2xl">How It Works</h2>
        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Horizontal dashed connector — desktop */}
          <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-4 hidden border-t border-dashed border-border-default md:block" />

          {/* Vertical dashed connector — mobile */}
          <div className="pointer-events-none absolute bottom-4 left-4 top-4 border-l border-dashed border-border-default md:hidden" />

          {STEPS.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center md:items-center">
              {/* Step circle */}
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-accent-teal/10 text-xs font-semibold text-accent-teal">
                {step.number}
              </div>
              <h3 className="mt-3 text-sm font-medium text-text-primary">{step.title}</h3>
              <p className="mt-1 text-xs text-text-secondary">{step.description}</p>
            </div>
          ))}
        </div>
      </ScrollSection>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Protocol Stats Section                                          */}
      {/* ----------------------------------------------------------------- */}
      <ScrollSection className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <p className="text-label mb-3 text-center">Protocol Data</p>
        <h2 className="text-heading mb-12 text-center text-2xl">
          Live Protocol Metrics
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* TVL Chart */}
          <div className="rounded-lg border border-border-default bg-surface-card p-5 lg:col-span-3">
            <h3 className="text-label mb-4">Total Value Locked (6M)</h3>
            <AreaChart
              data={TVL_DATA as unknown as Array<Record<string, unknown>>}
              xKey="month"
              yKey="tvl"
              height={280}
            />
          </div>

          {/* Top Markets */}
          <div className="lg:col-span-2">
            <h3 className="text-label mb-4">Top Markets</h3>
            <div className="space-y-0">
              {TOP_MARKETS.map((market, i) => (
                <div
                  key={market.pool}
                  className={cn(
                    'flex items-center justify-between py-2.5',
                    i < TOP_MARKETS.length - 1 && 'border-b border-border-subtle',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-tertiary text-2xs font-medium text-text-secondary">
                      {market.pool.slice(0, 2)}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{market.pool}</span>
                  </div>
                  <span className="text-kpi text-sm text-positive">
                    {market.apy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Security Section                                                */}
      {/* ----------------------------------------------------------------- */}
      <ScrollSection className="mx-auto max-w-5xl px-4 py-20 md:px-8">
        <h2 className="text-heading mb-3 text-center text-2xl">
          Battle-Tested Infrastructure
        </h2>
        <p className="mb-10 text-center text-xs text-text-secondary">
          Built on the most trusted foundations in financial technology
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {SECURITY_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.label}
                className="flex items-center gap-2 rounded-full border border-border-default px-4 py-2"
              >
                <Icon className="h-4 w-4 text-accent-teal" />
                <span className="text-xs font-medium text-text-primary">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </ScrollSection>

      {/* ----------------------------------------------------------------- */}
      {/* 8. Final CTA                                                       */}
      {/* ----------------------------------------------------------------- */}
      <ScrollSection className="py-24 text-center">
        <h2 className="text-heading mb-6 text-2xl md:text-3xl">
          Start earning institutional-grade yields
        </h2>
        <Link href="/overview">
          <Button
            variant="primary"
            size="lg"
            iconRight={<ArrowRight className="h-4 w-4" />}
            className="shadow-glow-teal-sm"
          >
            Launch App
          </Button>
        </Link>
      </ScrollSection>

      {/* ----------------------------------------------------------------- */}
      {/* 9. Footer                                                          */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-border-subtle py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-label mb-4">{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs text-text-tertiary transition-colors hover:text-text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-2xs text-text-disabled">
          &copy; 2026 Cayvox Labs. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
