# DUALIS FINANCE — Complete Production Implementation Specification

**Version:** 2.0.0
**Status:** Production-Ready Blueprint
**Author:** Cayvox Labs
**Last Updated:** February 2026
**Companion to:** Dualis Finance Technical Specification v1.0.0

> This document fills every gap in v1.0.0 — covering Frontend Design System & UI/UX, Backend Implementation, Database Schema, Monitoring & Observability, Performance Engineering, and Dependency Management. Together with v1.0.0, these two documents form the **complete** Dualis Finance production blueprint.

---

## Table of Contents

1. [Frontend Design System & UI/UX](#1-frontend-design-system--uiux)
2. [Component Architecture](#2-component-architecture)
3. [Page Specifications](#3-page-specifications)
4. [Animation & Interaction Design](#4-animation--interaction-design)
5. [Backend Implementation](#5-backend-implementation)
6. [Middleware & Security Layer](#6-middleware--security-layer)
7. [Canton JSON API v2 Integration](#7-canton-json-api-v2-integration)
8. [Database Schema (Off-Chain)](#8-database-schema-off-chain)
9. [Caching Architecture](#9-caching-architecture)
10. [WebSocket Implementation](#10-websocket-implementation)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Performance Engineering](#12-performance-engineering)
13. [Error Handling & Recovery](#13-error-handling--recovery)
14. [Dependency Manifest](#14-dependency-manifest)
15. [Environment Configuration](#15-environment-configuration)
16. [Accessibility & Internationalization](#16-accessibility--internationalization)

---

## 1. Frontend Design System & UI/UX

### 1.1 Design Philosophy — "Institutional Elegance"

Dualis targets a visual identity that signals **$100B+ protocol confidence** — not "crypto-native" neon gradients but **Bloomberg Terminal precision meets Stripe clarity**. The design language borrows from:

| Inspiration | What We Take | What We Avoid |
|-------------|-------------|---------------|
| Bloomberg Terminal | Information density, real-time data grids, keyboard shortcuts | Cluttered 90s aesthetics |
| Stripe Dashboard | Clean typography, whitespace, micro-interactions | Over-simplification for complex finance |
| Aave V3 | Health factor visualization, pool cards | Generic DeFi dark-mode templates |
| Morpho Blue | Minimalist vault UI, clean data tables | Lack of personality / branding |
| Linear | Command palette, keyboard-first UX, transitions | Developer-only appeal |
| Ethena Labs | Landing page gravitas, brand storytelling | Style-over-substance |

**Core Aesthetic Rules:**

1. **Dark mode primary, light mode secondary** — Dark (#0A0E17) with luminous accent (#00D4AA teal + #6366F1 indigo)
2. **No gradients on data** — Gradients only on brand elements (hero, CTAs). Data is always flat, high-contrast
3. **Typography-driven hierarchy** — Inter for UI, JetBrains Mono for numbers/data, with aggressive size scaling
4. **Motion as meaning** — Every animation communicates state (loading, success, danger), never decorative
5. **Information density over scrolling** — Inspired by Bloomberg: one viewport should answer "how is my portfolio?"

### 1.2 Color System

```
// Design Tokens — CSS Custom Properties

// === BASE PALETTE ===
--color-bg-primary:         #0A0E17;     // Main background
--color-bg-secondary:       #111827;     // Card/panel background
--color-bg-tertiary:        #1F2937;     // Elevated surfaces
--color-bg-hover:           #283041;     // Hover state
--color-bg-active:          #374151;     // Active/pressed state
--color-bg-overlay:         rgba(0,0,0,0.60);  // Modal overlay

// === SURFACES ===
--color-surface-card:       #151B28;     // Card background
--color-surface-input:      #0D1321;     // Input field bg
--color-surface-selected:   rgba(0,212,170,0.08);  // Selected row

// === BORDERS ===
--color-border-default:     #1E293B;     // Default border
--color-border-subtle:      #162032;     // Subtle dividers
--color-border-focus:       #00D4AA;     // Focus ring
--color-border-error:       #EF4444;     // Error state

// === TEXT ===
--color-text-primary:       #F9FAFB;     // Primary text (headings, values)
--color-text-secondary:     #9CA3AF;     // Secondary text (labels, descriptions)
--color-text-tertiary:      #6B7280;     // Tertiary (timestamps, meta)
--color-text-disabled:      #4B5563;     // Disabled state
--color-text-inverse:       #0A0E17;     // Text on light backgrounds

// === BRAND / ACCENT ===
--color-accent-teal:        #00D4AA;     // Primary accent — Dualis signature teal
--color-accent-teal-hover:  #00F0C0;     // Teal hover
--color-accent-teal-muted:  rgba(0,212,170,0.15);  // Teal background tint
--color-accent-indigo:      #6366F1;     // Secondary accent — purple/indigo
--color-accent-indigo-muted:rgba(99,102,241,0.15);

// === SEMANTIC ===
--color-positive:           #10B981;     // Profit, healthy, success
--color-positive-muted:     rgba(16,185,129,0.15);
--color-negative:           #EF4444;     // Loss, danger, liquidation
--color-negative-muted:     rgba(239,68,68,0.12);
--color-warning:            #F59E0B;     // Caution, margin call
--color-warning-muted:      rgba(245,158,11,0.12);
--color-info:               #3B82F6;     // Informational
--color-info-muted:         rgba(59,130,246,0.12);

// === CREDIT TIERS (unique to Dualis) ===
--color-tier-diamond:       #B9F2FF;     // Diamond — icy white-blue
--color-tier-gold:          #FFD700;     // Gold
--color-tier-silver:        #C0C0C0;     // Silver
--color-tier-bronze:        #CD7F32;     // Bronze
--color-tier-unrated:       #6B7280;     // Unrated — gray

// === LIGHT MODE OVERRIDES ===
[data-theme="light"] {
  --color-bg-primary:       #FFFFFF;
  --color-bg-secondary:     #F9FAFB;
  --color-bg-tertiary:      #F3F4F6;
  --color-surface-card:     #FFFFFF;
  --color-surface-input:    #F9FAFB;
  --color-text-primary:     #111827;
  --color-text-secondary:   #6B7280;
  --color-border-default:   #E5E7EB;
}
```

### 1.3 Typography System

```
// === FONT STACKS ===
--font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:    'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
--font-display: 'Inter', sans-serif;  // Same family, Display optical size

// === TYPE SCALE (Major Third — 1.250 ratio) ===
// All sizes in rem, base 16px

--text-xs:     0.694rem;    // 11.1px  — timestamps, meta
--text-sm:     0.833rem;    // 13.3px  — labels, captions
--text-base:   1.000rem;    // 16px    — body text
--text-lg:     1.125rem;    // 18px    — emphasized body
--text-xl:     1.250rem;    // 20px    — card titles
--text-2xl:    1.563rem;    // 25px    — section headers
--text-3xl:    1.953rem;    // 31.3px  — page titles
--text-4xl:    2.441rem;    // 39px    — hero numbers
--text-5xl:    3.052rem;    // 48.8px  — dashboard KPIs

// === FONT WEIGHTS ===
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;

// === LINE HEIGHTS ===
--leading-tight:  1.20;     // Headings, KPIs
--leading-normal: 1.50;     // Body text
--leading-relaxed:1.75;     // Long-form reading

// === LETTER SPACING ===
--tracking-tight:  -0.025em;  // Large headings
--tracking-normal:  0.000em;  // Body
--tracking-wide:    0.050em;  // All-caps labels
--tracking-wider:   0.100em;  // Tiny all-caps

// === NUMERIC DISPLAY ===
// ALL financial numbers use:
//   font-family: var(--font-mono)
//   font-variant-numeric: tabular-nums
//   font-feature-settings: "tnum" 1, "zero" 1   (slashed zero)
//
// This ensures columns align perfectly in tables and KPI grids.
```

**Typography Usage Rules:**

| Element | Font | Size | Weight | Color | Tracking |
|---------|------|------|--------|-------|----------|
| Dashboard KPI value | Mono | 5xl | Bold | Primary | Tight |
| Dashboard KPI label | Sans | sm | Medium | Secondary | Wide |
| Page title | Sans | 3xl | Bold | Primary | Tight |
| Section header | Sans | 2xl | Semibold | Primary | Normal |
| Card title | Sans | xl | Semibold | Primary | Normal |
| Body text | Sans | base | Normal | Secondary | Normal |
| Table header | Sans | sm | Semibold | Tertiary | Wider (uppercase) |
| Table cell (text) | Sans | sm | Normal | Primary | Normal |
| Table cell (number) | Mono | sm | Medium | Primary | Normal |
| Input label | Sans | sm | Medium | Secondary | Normal |
| Button text | Sans | sm | Semibold | Inverse/Primary | Wide |
| Toast message | Sans | sm | Medium | Primary | Normal |
| Code/address | Mono | xs | Normal | Tertiary | Normal |

### 1.4 Spacing System

```
// 4px base unit, exponential scale
--space-0:   0px;
--space-0.5: 2px;
--space-1:   4px;
--space-1.5: 6px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
--space-20:  80px;
--space-24:  96px;

// Layout-specific
--page-gutter:       24px;    // Side padding on main content
--card-padding:      24px;    // Internal card padding
--card-gap:          16px;    // Gap between cards in grid
--section-gap:       48px;    // Gap between page sections
--sidebar-width:     260px;   // Left navigation width
--topbar-height:     64px;    // Top navigation height
--content-max-width: 1440px;  // Max content width
```

### 1.5 Border Radius & Elevation

```
// === RADIUS ===
--radius-sm:   6px;      // Inputs, small buttons
--radius-md:   8px;      // Cards, dropdowns
--radius-lg:   12px;     // Modals, large panels
--radius-xl:   16px;     // Hero cards, feature blocks
--radius-full: 9999px;   // Pills, avatars, badges

// === ELEVATION (via box-shadow, NOT background opacity) ===
--shadow-sm:    0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15);
--shadow-md:    0 4px 6px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.12);
--shadow-lg:    0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.15);
--shadow-xl:    0 20px 25px rgba(0,0,0,0.35), 0 8px 10px rgba(0,0,0,0.15);
--shadow-glow-teal:   0 0 20px rgba(0,212,170,0.25);    // Accent glow
--shadow-glow-danger: 0 0 20px rgba(239,68,68,0.25);    // Danger glow

// === GLASS MORPHISM (used sparingly — modals, command palette) ===
--glass-bg:      rgba(17,24,39,0.80);
--glass-blur:    backdrop-filter: blur(16px) saturate(180%);
--glass-border:  1px solid rgba(255,255,255,0.08);
```

### 1.6 Iconography

```
// Icon library: Lucide React (consistent with Linear/Vercel aesthetic)
// Size scale:
--icon-xs:   14px;     // Inline with small text
--icon-sm:   16px;     // Table actions, input icons
--icon-md:   20px;     // Navigation, buttons
--icon-lg:   24px;     // Section headers, empty states
--icon-xl:   32px;     // Feature blocks
--icon-2xl:  48px;     // Empty state illustrations

// Custom Dualis icons (SVG sprite):
// - dualis-logo (logomark + wordmark variants)
// - credit-tier-diamond, credit-tier-gold, etc.
// - sec-lending-handshake
// - health-factor-heart
// - canton-network-badge
// - partylayer-connect
```

### 1.7 Grid System

```
// === RESPONSIVE BREAKPOINTS ===
--breakpoint-sm:   640px;     // Mobile landscape
--breakpoint-md:   768px;     // Tablet portrait
--breakpoint-lg:   1024px;    // Tablet landscape / small desktop
--breakpoint-xl:   1280px;    // Desktop
--breakpoint-2xl:  1536px;    // Wide desktop

// === LAYOUT GRID ===
// 12-column grid within max-width container
// Gutter: 16px (sm), 24px (lg+)
//
// Dashboard uses a custom grid:
//   - Sidebar: fixed 260px
//   - Main: fluid, 12-col internal grid
//   - Right panel: optional 320px (position details)

// === DASHBOARD GRID AREAS ===
.dashboard-grid {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: var(--topbar-height) 1fr;
  grid-template-areas:
    "sidebar topbar"
    "sidebar main";
  height: 100vh;
  overflow: hidden;  // Sidebar and main scroll independently
}

// With right panel open:
.dashboard-grid--panel-open {
  grid-template-columns: var(--sidebar-width) 1fr 360px;
  grid-template-areas:
    "sidebar topbar   topbar"
    "sidebar main     panel";
}
```

---

## 2. Component Architecture

### 2.1 Component Hierarchy

```
app/frontend/
├── public/
│   ├── fonts/
│   │   ├── Inter-Variable.woff2
│   │   └── JetBrainsMono-Variable.woff2
│   ├── icons/
│   │   └── dualis-sprite.svg
│   └── og-image.png
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── layout.tsx                # Root layout (providers, fonts, theme)
│   │   ├── page.tsx                  # Landing page (marketing)
│   │   ├── (dashboard)/              # Authenticated dashboard group
│   │   │   ├── layout.tsx            # Dashboard shell (sidebar + topbar)
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── markets/
│   │   │   │   ├── page.tsx          # All lending markets
│   │   │   │   └── [poolId]/
│   │   │   │       └── page.tsx      # Individual pool detail
│   │   │   ├── borrow/
│   │   │   │   ├── page.tsx          # Borrow flow
│   │   │   │   └── [positionId]/
│   │   │   │       └── page.tsx      # Position detail
│   │   │   ├── sec-lending/
│   │   │   │   ├── page.tsx          # Sec lending marketplace
│   │   │   │   ├── offers/
│   │   │   │   │   └── new/page.tsx  # Create offer
│   │   │   │   └── deals/
│   │   │   │       └── [dealId]/page.tsx
│   │   │   ├── credit/
│   │   │   │   └── page.tsx          # Credit score dashboard
│   │   │   ├── governance/
│   │   │   │   ├── page.tsx          # Proposals list
│   │   │   │   └── [proposalId]/page.tsx
│   │   │   ├── portfolio/
│   │   │   │   └── page.tsx          # Full portfolio view
│   │   │   ├── staking/
│   │   │   │   └── page.tsx          # DUAL staking
│   │   │   └── settings/
│   │   │       └── page.tsx          # User preferences
│   │   └── (auth)/                   # Unauthenticated pages
│   │       ├── connect/page.tsx      # Wallet connection
│   │       └── onboarding/page.tsx   # KYC flow (institutional)
│   │
│   ├── components/
│   │   ├── ui/                       # Primitives (design system atoms)
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── Toggle.tsx
│   │   │
│   │   ├── data-display/             # Financial data components
│   │   │   ├── KPICard.tsx           # Big number with label + trend
│   │   │   ├── HealthFactorGauge.tsx # Radial gauge (1.0 threshold)
│   │   │   ├── APYDisplay.tsx        # Formatted APY with source
│   │   │   ├── AssetIcon.tsx         # Token icon resolver
│   │   │   ├── CreditTierBadge.tsx   # Diamond/Gold/Silver/Bronze pill
│   │   │   ├── PriceChange.tsx       # +3.2% / -1.5% with color
│   │   │   ├── CountUp.tsx           # Animated number counter
│   │   │   ├── SparklineChart.tsx    # Inline mini chart (7-day trend)
│   │   │   ├── UtilizationBar.tsx    # Pool utilization visual
│   │   │   ├── LiquidationRisk.tsx   # Multi-tier risk indicator
│   │   │   └── TokenAmount.tsx       # Formatted token + USD value
│   │   │
│   │   ├── charts/                   # Chart components (Recharts + D3)
│   │   │   ├── AreaChart.tsx         # TVL, supply/borrow over time
│   │   │   ├── InterestRateChart.tsx # Rate curve visualization
│   │   │   ├── DonutChart.tsx        # Portfolio composition
│   │   │   ├── CandlestickChart.tsx  # Price history
│   │   │   ├── HeatmapChart.tsx      # Correlation matrix
│   │   │   ├── HistogramChart.tsx    # Liquidation distribution
│   │   │   └── ChartTooltip.tsx      # Shared tooltip component
│   │   │
│   │   ├── layout/                   # Structural components
│   │   │   ├── Sidebar.tsx           # Left navigation
│   │   │   ├── Topbar.tsx            # Top bar (search, wallet, alerts)
│   │   │   ├── CommandPalette.tsx    # ⌘K global command palette
│   │   │   ├── NotificationPanel.tsx # Right-slide notification tray
│   │   │   ├── RightPanel.tsx        # Contextual detail panel
│   │   │   └── MobileNav.tsx         # Bottom tab bar (mobile)
│   │   │
│   │   ├── wallet/                   # PartyLayer integration
│   │   │   ├── ConnectButton.tsx     # Multi-wallet connect
│   │   │   ├── WalletDropdown.tsx    # Connected wallet menu
│   │   │   ├── WalletAvatar.tsx      # Jazzicon/Gradient avatar
│   │   │   ├── PartyIdDisplay.tsx    # Truncated party ID
│   │   │   └── TransactionToast.tsx  # Tx confirmation toast
│   │   │
│   │   ├── lending/                  # Lending-specific composites
│   │   │   ├── MarketCard.tsx        # Pool summary card
│   │   │   ├── MarketTable.tsx       # Full markets table
│   │   │   ├── DepositModal.tsx      # Deposit flow modal
│   │   │   ├── WithdrawModal.tsx     # Withdraw flow modal
│   │   │   ├── BorrowModal.tsx       # Borrow flow modal
│   │   │   ├── RepayModal.tsx        # Repay flow modal
│   │   │   ├── CollateralManager.tsx # Add/remove collateral
│   │   │   ├── PositionCard.tsx      # Active position summary
│   │   │   ├── HealthFactorSimulator.tsx  # "What if" slider
│   │   │   └── FlashLoanBuilder.tsx  # Flash loan configuration
│   │   │
│   │   ├── sec-lending/              # Securities lending composites
│   │   │   ├── OfferCard.tsx         # Available offer card
│   │   │   ├── OfferTable.tsx        # Offer marketplace table
│   │   │   ├── CreateOfferForm.tsx   # Multi-step offer creation
│   │   │   ├── DealTimeline.tsx      # Deal lifecycle visualization
│   │   │   ├── MarkToMarketPanel.tsx # MTM status panel
│   │   │   ├── RecallNotice.tsx      # Recall action component
│   │   │   └── CorporateActionBanner.tsx
│   │   │
│   │   ├── credit/                   # Credit scoring composites
│   │   │   ├── CreditScoreRing.tsx   # Animated score ring (0-1000)
│   │   │   ├── ScoreBreakdown.tsx    # Component-level breakdown
│   │   │   ├── TierProgressBar.tsx   # Progress to next tier
│   │   │   ├── CreditHistory.tsx     # Historical score chart
│   │   │   └── BenefitsComparison.tsx# Tier benefits comparison
│   │   │
│   │   ├── governance/               # Governance composites
│   │   │   ├── ProposalCard.tsx
│   │   │   ├── VotePanel.tsx
│   │   │   ├── VotingPowerBar.tsx
│   │   │   └── ProposalTimeline.tsx
│   │   │
│   │   └── shared/                   # Cross-cutting components
│   │       ├── TransactionReview.tsx  # Pre-sign review modal
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingScreen.tsx
│   │       └── ConfettiExplosion.tsx  # Success celebration
│   │
│   ├── hooks/
│   │   ├── usePartyLayer.ts          # PartyLayer SDK integration
│   │   ├── useLedgerAPI.ts           # Canton JSON API v2 client
│   │   ├── usePriceFeed.ts           # Real-time oracle prices
│   │   ├── useHealthFactor.ts        # Position health computation
│   │   ├── usePoolData.ts            # Lending pool aggregated data
│   │   ├── useSecLending.ts          # Sec lending state
│   │   ├── useCreditScore.ts         # Credit profile data
│   │   ├── useWebSocket.ts           # WS connection manager
│   │   ├── useKeyboardShortcuts.ts   # Global hotkeys
│   │   ├── useTheme.ts               # Theme toggle (dark/light)
│   │   ├── useMediaQuery.ts          # Responsive breakpoints
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useCountUp.ts             # Animated number hook
│   │
│   ├── lib/
│   │   ├── canton/
│   │   │   ├── client.ts             # Canton JSON API v2 client
│   │   │   ├── commands.ts           # Daml command builders
│   │   │   ├── contracts.ts          # Contract type definitions
│   │   │   ├── events.ts             # Transaction event handlers
│   │   │   └── party.ts              # Party management
│   │   ├── api/
│   │   │   ├── fetcher.ts            # SWR/React Query fetcher
│   │   │   ├── endpoints.ts          # API endpoint constants
│   │   │   └── types.ts              # API response types
│   │   ├── utils/
│   │   │   ├── format.ts             # Number/date/address formatting
│   │   │   ├── math.ts               # Financial math (APY, HF, etc.)
│   │   │   ├── cn.ts                 # Tailwind class merger (clsx + twMerge)
│   │   │   └── constants.ts          # App-wide constants
│   │   └── analytics/
│   │       ├── posthog.ts            # Analytics client
│   │       └── events.ts             # Event definitions
│   │
│   ├── stores/                       # Zustand state management
│   │   ├── useWalletStore.ts         # Wallet connection state
│   │   ├── useProtocolStore.ts       # Protocol config + pools
│   │   ├── usePositionStore.ts       # User positions
│   │   ├── usePriceStore.ts          # Price feed cache
│   │   ├── useNotificationStore.ts   # Notification queue
│   │   └── useUIStore.ts             # UI state (sidebar, panels)
│   │
│   ├── styles/
│   │   ├── globals.css               # CSS variables, reset, base
│   │   ├── tokens.css                # Design token declarations
│   │   └── animations.css            # Keyframe definitions
│   │
│   └── types/
│       ├── protocol.ts               # Daml contract mirror types
│       ├── api.ts                     # API request/response types
│       └── ui.ts                      # UI-specific types
│
├── tailwind.config.ts                # Tailwind config with design tokens
├── next.config.ts                    # Next.js config
├── tsconfig.json
└── package.json
```

### 2.2 Core UI Primitives — Detailed Specifications

#### Button

```typescript
// components/ui/Button.tsx

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;         // Shows spinner, disables click
  disabled?: boolean;
  icon?: React.ReactNode;    // Left icon
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Visual specs:
// Primary:   bg: accent-teal, text: bg-primary, hover: accent-teal-hover, shadow-glow-teal
// Secondary: bg: transparent, border: border-default, text: text-primary, hover: bg-hover
// Ghost:     bg: transparent, text: text-secondary, hover: bg-hover
// Danger:    bg: negative, text: white, hover: darken(negative, 10%)
// Success:   bg: positive, text: white

// Sizes (height / padding-x / font-size / radius):
// sm:  32px / 12px / text-sm  / radius-sm
// md:  40px / 16px / text-sm  / radius-sm
// lg:  48px / 24px / text-base/ radius-md
// xl:  56px / 32px / text-lg  / radius-md

// Loading state: text opacity 0, absolute-centered Spinner component
// Focus: 2px offset ring in accent-teal, radius matches button
// Transition: all 150ms ease-out
```

#### Card

```typescript
// components/ui/Card.tsx

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;       // Slight lift on hover
  clickable?: boolean;       // Cursor pointer + hover bg
  children: React.ReactNode;
}

// default:   bg: surface-card, border: border-default, radius-md
// elevated:  bg: surface-card, shadow-md, no border
// outlined:  bg: transparent, border: border-default
// glass:     bg: glass-bg, glass-blur, glass-border
//
// hoverable: translateY(-2px) + shadow-lg on hover
// clickable: bg-hover on hover, cursor-pointer
```

#### KPICard (Dualis-specific hero component)

```typescript
// components/data-display/KPICard.tsx

interface KPICardProps {
  label: string;                    // e.g., "Total Value Locked"
  value: string | number;           // e.g., "$1,234,567"
  previousValue?: number;           // For trend calculation
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;              // e.g., "+12.5%"
  sparkline?: number[];             // 7-day mini chart data
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

// Layout:
// ┌───────────────────────────────────┐
// │ ○ Total Value Locked              │  ← icon + label (sm, secondary)
// │                                   │
// │ $1,234,567,890                    │  ← value (4xl/5xl, mono, primary)
// │ ▲ +12.5%  ▁▂▃▄▅▆▇               │  ← trend badge + sparkline
// └───────────────────────────────────┘
//
// Value uses CountUp animation on mount and value change
// Sparkline: 48px tall, teal stroke, no axes
// Trend badge: positive=green pill, negative=red pill
```

#### HealthFactorGauge

```typescript
// components/data-display/HealthFactorGauge.tsx

interface HealthFactorGaugeProps {
  value: number;                // e.g., 1.45
  liquidationThreshold: number; // e.g., 1.0
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

// Visual: Semi-circular radial gauge (180° arc)
//
// Color zones on the arc:
//   > 2.0:    Full green (#10B981)
//   1.5-2.0:  Yellow-green gradient
//   1.0-1.5:  Yellow (#F59E0B) → Orange
//   < 1.0:    Red (#EF4444) with pulsing glow animation
//
// Center: Large number (mono, bold)
// Below arc: "Safe" | "Caution" | "At Risk" | "Liquidatable" label
//
// Animation: SVG arc draws from 0 to target value on mount (600ms ease-out)
// When < 1.0: red pulsing border animation (CSS keyframes, 1s infinite)
//
// Sizes:
//   sm: 80px diameter (inline, no label)
//   md: 140px diameter (card usage)
//   lg: 200px diameter (hero usage, with breakdown)
```

#### CreditTierBadge

```typescript
// components/data-display/CreditTierBadge.tsx

interface CreditTierBadgeProps {
  tier: 'diamond' | 'gold' | 'silver' | 'bronze' | 'unrated';
  showScore?: boolean;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

// Visual per tier:
// Diamond: icy gradient border, sparkle icon, #B9F2FF text
// Gold:    warm gradient border, crown icon, #FFD700 text
// Silver:  cool gradient border, shield icon, #C0C0C0 text
// Bronze:  earthy gradient border, circle icon, #CD7F32 text
// Unrated: gray border, question icon, #6B7280 text
//
// sm: 20px height pill, icon only
// md: 28px height pill, icon + tier name
// lg: 36px height pill, icon + tier name + score
```

### 2.3 Data Table Component (Bloomberg-Grade)

```typescript
// components/ui/Table.tsx — The most critical component in the app

interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;              // CSS width (px or %)
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  filterable?: boolean;
  sticky?: boolean;            // Sticky column (left)
  render?: (row: T) => React.ReactNode;  // Custom cell renderer
  numericFormat?: {            // Auto-format numbers
    type: 'currency' | 'percent' | 'decimal' | 'compact';
    decimals?: number;
  };
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  sortable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  virtualized?: boolean;       // TanStack Virtual for 1000+ rows
  rowHeight?: number;
  pageSize?: number;
  highlightOnHover?: boolean;
  stripedRows?: boolean;
  compactMode?: boolean;
  keyboardNav?: boolean;       // Arrow key navigation
}

// Visual specification:
//
// Header row:
//   bg: bg-secondary, border-bottom: 2px solid border-default
//   text: text-tertiary, uppercase, tracking-wider, text-xs, font-semibold
//   sort indicator: Lucide ChevronUp/Down, 12px, accent-teal when active
//   padding: 12px 16px
//
// Data rows:
//   bg: transparent (odd) / rgba(255,255,255,0.02) (even, if striped)
//   border-bottom: 1px solid border-subtle
//   hover: bg-hover (smooth 100ms transition)
//   selected: surface-selected (teal tint)
//   padding: 10px 16px
//   height: 48px default, 36px compact
//
// Number cells:
//   font-mono, tabular-nums, right-aligned
//   positive values: color-positive
//   negative values: color-negative
//
// Loading: Skeleton rows (8 rows of pulsing gray bars matching column widths)
//
// Keyboard navigation:
//   ↑/↓: Move focus between rows
//   Enter: Trigger onRowClick
//   Tab: Move between interactive cells
//
// Virtualization: Triggered when data.length > 100, uses @tanstack/react-virtual
//   Overscan: 5 rows above/below viewport
//   Row height: fixed for performance
```

### 2.4 Command Palette (⌘K)

```typescript
// components/layout/CommandPalette.tsx

// Global search + quick actions — inspired by Linear, Raycast, Vercel

// Trigger: ⌘K (Mac) / Ctrl+K (Windows)
// Library: cmdk (pacocoursey/cmdk)

// Visual:
// Glass morphism overlay (glass-bg + blur)
// Centered modal: 640px wide, max-height 480px
// Search input: 56px height, large text, auto-focus
// Results: grouped by category, 44px row height

// Categories:
// 🔍 Search: "USDC Pool", "Position #12", "Proposal #5"
// ⚡ Quick Actions: "Deposit", "Borrow", "Repay", "Create Offer"
// 📊 Markets: Jump to any pool
// 🏦 Positions: Jump to any active position
// ⚙️ Settings: Theme, notifications, preferences
// 🔗 External: Docs, Discord, GitHub

// Keyboard:
// ↑/↓: Navigate results
// Enter: Execute action
// Esc: Close
// Backspace (empty): Go back to root
// Tab: Navigate between groups

// Recent actions: Last 5 actions shown when input is empty
// Fuzzy search: fuse.js integration for typo-tolerant search
```

---

## 3. Page Specifications

### 3.1 Landing Page (Marketing — `/`)

```
STRUCTURE (top to bottom, single scroll):

1. HERO SECTION
   ┌─────────────────────────────────────────────────────┐
   │  ┌──────────────────────────────────────────────┐   │
   │  │  [Dualis Logo]           [Markets] [Docs] [Connect Wallet]  │
   │  └──────────────────────────────────────────────┘   │
   │                                                     │
   │  The Institutional Lending Protocol                 │
   │  for Canton Network                                 │
   │                                                     │
   │  Privacy-preserving lending, securities lending,    │
   │  and RWA collateralization — built for the          │
   │  world's largest financial institutions.            │
   │                                                     │
   │  [Launch App]  [Read Documentation →]               │
   │                                                     │
   │  $XXB TVL    $XXB Borrowed    XX,XXX Users          │
   │  ─────────────────────────────────────────          │
   │  Live protocol metrics (CountUp animation)          │
   │                                                     │
   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░           │
   │  (Animated 3D mesh / particle network               │
   │   representing Canton network topology)              │
   └─────────────────────────────────────────────────────┘

   Background: Dark gradient (#0A0E17 → #111827)
   3D element: Three.js particle system showing interconnected nodes
     - Nodes pulse in teal when "transactions" flow between them
     - Subtle parallax on mouse movement
     - Mobile: falls back to static SVG illustration

2. PARTNERS BAR
   ┌─────────────────────────────────────────────────────┐
   │  Trusted by the Canton Network ecosystem            │
   │  [Canton] [Goldman Sachs] [DTCC] [Broadridge]       │
   │  [Chainlink] [EquiLend]                             │
   └─────────────────────────────────────────────────────┘
   
   Logos: Grayscale, 40px height, horizontal scroll on mobile
   Hover: Logo becomes full color (200ms transition)

3. FEATURE GRID (3 columns, desktop)
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Privacy- │ │Securities│ │ RWA      │
   │ First    │ │ Lending  │ │Collateral│
   │ Lending  │ │          │ │          │
   │          │ │ First    │ │ Use TIFA │
   │ Sub-tx   │ │ tokenized│ │ receiv-  │
   │ privacy  │ │ sec      │ │ ables as │
   │ via      │ │ lending  │ │ collat-  │
   │ Canton   │ │ protocol │ │ eral     │
   └──────────┘ └──────────┘ └──────────┘
   
   Cards: glass variant, hoverable, 280px min-width
   Icons: Custom Dualis SVG, 48px, accent-teal
   Scroll animation: Fade-in from bottom (Intersection Observer)

4. HOW IT WORKS — 4-step horizontal timeline
   
   Step 1: Connect → Step 2: Deposit → Step 3: Earn/Borrow → Step 4: Manage
   
   Each step: circular numbered badge + title + description
   Active step: teal highlight with connecting line animation
   Animated: Steps reveal sequentially (300ms delay each)

5. LIVE PROTOCOL STATS
   ┌─────────────────────────────────────────────────────┐
   │  [AreaChart: TVL over time]  │  Top Markets         │
   │                              │  USDC Pool    8.2%   │
   │  6-month TVL history         │  wBTC Pool    4.1%   │
   │  with animated draw          │  T-BILL Pool  5.3%   │
   │                              │  CC Pool      6.7%   │
   └─────────────────────────────────────────────────────┘

6. SECURITY & AUDITS
   Audit badges: CertiK, Trail of Bits
   "Powered by Daml" badge
   Canton Network badge
   
7. CTA SECTION
   "Start earning institutional-grade yields"
   [Launch App →]

8. FOOTER
   Links: Docs, GitHub, Discord, Twitter, Blog
   Legal: Terms, Privacy, Disclaimers
   © 2026 Cayvox Labs
```

### 3.2 Dashboard Overview (`/dashboard`)

```
┌──────────────────────────────────────────────────────────────┐
│ SIDEBAR (260px)   │  TOPBAR (64px)                           │
│                   │  [⌘K Search]  [🔔 3]  [🌙]  [Wallet ▾] │
│  [Dualis Logo]    ├──────────────────────────────────────────┤
│                   │                                          │
│  📊 Dashboard  ●  │  Welcome back, 0x1a2b...3c4d            │
│  🏦 Markets       │                                          │
│  💰 Borrow        │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  🤝 Sec Lending   │  │ Net     │ │ Total   │ │ Health  │   │
│  ⭐ Credit Score  │  │ Worth   │ │ Supplied│ │ Factor  │   │
│  🏛️ Governance    │  │$2.45M ▲ │ │$1.8M   │ │  1.67   │   │
│  🪙 Staking       │  │ +12.5%  │ │ sparkl  │ │  [gauge]│   │
│  📦 Portfolio     │  └─────────┘ └─────────┘ └─────────┘   │
│                   │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  ──────────       │  │ Total   │ │ Earned  │ │ Credit  │   │
│  ⚙️ Settings      │  │ Borrowed│ │ (24h)   │ │ Tier    │   │
│  📖 Docs          │  │$500K    │ │ $1,234  │ │ ◆ Gold  │   │
│  🐛 Support       │  └─────────┘ └─────────┘ └─────────┘   │
│                   │                                          │
│  ──────────       │  ── Your Positions ──────────────────    │
│  V2.0.0           │                                          │
│  Canton MainNet   │  ┌────────────────────────────────────┐  │
│  🟢 Connected     │  │ Supply Positions                   │  │
│                   │  │ USDC Pool  │ $500K │ 8.2% │ Active│  │
│                   │  │ wBTC Pool  │ $1.3M │ 4.1% │ Active│  │
│                   │  └────────────────────────────────────┘  │
│                   │                                          │
│                   │  ┌────────────────────────────────────┐  │
│                   │  │ Borrow Positions                   │  │
│                   │  │ USDC   │ $200K │ HF:1.67│ ▲ Safe │  │
│                   │  │ CC     │ $300K │ HF:1.23│ ⚠ Caut │  │
│                   │  └────────────────────────────────────┘  │
│                   │                                          │
│                   │  ┌────────────────────────────────────┐  │
│                   │  │ Sec Lending Deals                  │  │
│                   │  │ SPY-2026│ Lending │ 45bps │ Active│  │
│                   │  └────────────────────────────────────┘  │
│                   │                                          │
│                   │  ── Portfolio Composition ──────────      │
│                   │  [DonutChart]  │  Asset breakdown table  │
│                   │                                          │
└───────────────────┴──────────────────────────────────────────┘

Key interactions:
- KPI cards: click to drill into relevant page
- Position rows: click opens RightPanel with full details
- Health Factor gauge: hover shows tooltip with breakdown
- Sparklines: auto-update every 30s via WebSocket
- Notification bell: slide-in panel from right
```

### 3.3 Markets Page (`/dashboard/markets`)

```
┌──────────────────────────────────────────────────────────────┐
│  Markets                                    [Filter ▾] [⚡]  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ASSET    │ TOTAL SUPPLY │ SUPPLY APY │ TOTAL BORROW  │   │
│  │          │              │            │               │   │
│  │ BORROW APY │ UTILIZATION │ ORACLE    │              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ ○ USDC   │ $245.6M     │ 8.24%  ▲  │ $189.2M      │   │
│  │          │  ▁▂▃▄▅▆     │ sparkline  │              │   │
│  │ 10.56%   │ ████████░░  │ $1.00     │ [Supply][Borrow]│  │
│  │          │ 77%         │ Chainlink  │              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ ○ wBTC   │ $1.2B       │ 4.12%  ▼  │ $456.8M      │   │
│  │          │  ▆▅▄▃▂▁     │ sparkline  │              │   │
│  │ 5.89%    │ ██████░░░░  │ $97,234   │ [Supply][Borrow]│  │
│  │          │ 38%         │ Chainlink  │              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ ○ T-BILL │ $890M       │ 5.34%  →  │ $234.5M      │   │
│  │  2026    │  ▃▃▃▃▃▃     │ sparkline  │              │   │
│  │ 6.12%    │ ███░░░░░░░  │ $99.87    │ [Supply][Borrow]│  │
│  │          │ 26%         │ NAVLink    │              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Filter options: Asset type (Stablecoin, Crypto, Treasury,   │
│  RWA), Minimum APY, Sort by (TVL, APY, Utilization)         │
│                                                              │
│  ⚡ Flash Loan button opens FlashLoanBuilder modal           │
└──────────────────────────────────────────────────────────────┘

Utilization bar: Gradient from teal (low) → yellow → red (high)
APY sparkline: 7-day mini chart, inline, 48x20px
Supply/Borrow buttons: Appear on row hover (desktop) or always visible (mobile)
```

### 3.4 Individual Pool Detail (`/dashboard/markets/[poolId]`)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Markets  /  USDC Pool                                    │
│                                                              │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │ Pool Overview           │  │ Your Position              │ │
│  │                         │  │                            │ │
│  │ Total Supply: $245.6M   │  │ Supplied: $500,000        │ │
│  │ Total Borrow: $189.2M   │  │ Earned: $4,123.45        │ │
│  │ Available: $56.4M       │  │ APY: 8.24%               │ │
│  │ Utilization: 77.03%     │  │                            │ │
│  │ Oracle: $1.0000 (CL)    │  │ [Deposit] [Withdraw]      │ │
│  └────────────────────────┘  └────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Supply APY] [Borrow APY] [Utilization] [TVL]           ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │            INTERACTIVE AREA CHART                │   ││
│  │  │  (Recharts, 30-day default, toggleable 7d/30d/  │   ││
│  │  │   90d/1y/ALL, crosshair tooltip, zoom)           │   ││
│  │  │                                                  │   ││
│  │  │  Height: 320px                                   │   ││
│  │  │  Fill: accent-teal gradient (15% opacity)        │   ││
│  │  │  Stroke: accent-teal, 2px                        │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ Interest Rate Model  │  │ Collateral Parameters       │  │
│  │                      │  │                              │  │
│  │ [Rate Curve Chart]   │  │ Max LTV:        75%         │  │
│  │  X: Utilization      │  │ Liq. Threshold: 82%         │  │
│  │  Y: Interest Rate    │  │ Liq. Penalty:   5%          │  │
│  │  Current: dot on     │  │ Borrow Cap:     $100M       │  │
│  │  curve               │  │ Reserve Factor: 10%         │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│                                                              │
│  ── Recent Activity ────────────────────────────────────     │
│  Real-time event log (deposits, borrows, liquidations)       │
│  Timestamp │ Action │ User (truncated) │ Amount │ Tx link    │
└──────────────────────────────────────────────────────────────┘
```

### 3.5 Credit Score Page (`/dashboard/credit`)

```
┌──────────────────────────────────────────────────────────────┐
│  Your Credit Score                                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │          ┌─────────────────┐                         │   │
│  │          │   SCORE RING    │     ◆ Gold Tier         │   │
│  │          │                 │     Score: 742 / 1000   │   │
│  │          │      742        │                         │   │
│  │          │    ━━━━━━━━     │     Next tier: Diamond  │   │
│  │          │   ◆ GOLD        │     Need: 108 more pts  │   │
│  │          └─────────────────┘     ████████████░░░ 87% │   │
│  │                                                      │   │
│  │  ── Score Breakdown ──                               │   │
│  │                                                      │   │
│  │  Loan Completion     ████████████████░░░  256/300   │   │
│  │  Repayment Speed     █████████████████░░  218/250   │   │
│  │  Volume History      ██████████████░░░░░  142/200   │   │
│  │  Collateral Health   ████████████████████  150/150  │   │
│  │  Sec Lending         ██░░░░░░░░░░░░░░░░░   20/100  │   │  
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tier Benefits Comparison                            │   │
│  │                                                      │   │
│  │          Diamond   Gold     Silver  Bronze  Unrated  │   │
│  │  MinColl  110%    120% ←    135%    150%    175%    │   │
│  │  MaxLTV   90%     83% ←     74%     67%     57%    │   │
│  │  RateDsc  -50bps  -25bps←   0       +25     +75    │   │
│  │                    ▲ You are here                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Credit Score History (Line Chart, 12 months)        │   │
│  │  Shows score progression over time                   │   │
│  │  Milestone markers: "First loan", "Gold achieved"    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘

Score Ring: SVG donut chart, 200px, animated draw (1200ms ease-in-out)
  - Arc color matches tier color
  - Center: large mono number with CountUp
  - Pulse animation when score increases

Breakdown bars: Horizontal, fill animation (800ms stagger 100ms each)
  - Color: teal for high %, warning for medium, neutral for low

Tier comparison: Current tier column highlighted with accent-teal background
  - Arrow indicator shows current position
```

### 3.6 Securities Lending Marketplace (`/dashboard/sec-lending`)

```
┌──────────────────────────────────────────────────────────────┐
│  Securities Lending Marketplace                 [+ New Offer]│
│                                                              │
│  [Available Offers] [My Deals] [My Offers]                   │
│                                                              │
│  Filter: [Asset Type ▾] [Fee Range ▾] [Duration ▾] [Sort ▾] │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SECURITY │ LENDER    │ FEE    │ MIN     │ COLLATERAL│   │
│  │          │           │ (bps)  │ DURATION│ TYPES     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ SPY-2026 │ 0x1a2b..  │ 45 bps │ 30d    │ USDC,     │   │
│  │ $1.2M    │ ◆ Diamond │ Fixed  │        │ T-BILL    │   │
│  │ Equity   │           │        │        │ [Accept →]│   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ T-NOTE   │ 0x5e6f..  │ 25 bps │ 7d     │ USDC,     │   │
│  │ $5.0M    │ ◆ Gold    │ Fixed  │        │ CC, wBTC  │   │
│  │ Treasury │           │        │        │ [Accept →]│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ── Active Deals ──                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Deal    │ Role   │ Security │ Status  │ Fee Accrued │   │
│  │ #A1-001 │ Lender │ SPY-2026 │ Active  │ $1,234.56  │   │
│  │         │        │          │ Day 12  │ [Details →] │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Animation & Interaction Design

### 4.1 Motion System

```
// Timing functions
--ease-out:       cubic-bezier(0.16, 1, 0.3, 1);      // Default exit
--ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1);     // Emphasis
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);  // Playful bounce
--ease-linear:    linear;                               // Progress bars

// Duration scale
--duration-instant:  50ms;     // Hover color change
--duration-fast:     100ms;    // Button press
--duration-normal:   200ms;    // Most transitions
--duration-slow:     300ms;    // Panel slide
--duration-slower:   500ms;    // Page transitions
--duration-draw:     800ms;    // Chart draw animations
--duration-counter:  1200ms;   // CountUp number animation
```

### 4.2 Key Animations

| Animation | Trigger | Duration | Easing | Details |
|-----------|---------|----------|--------|---------|
| Page transition | Route change | 300ms | ease-out | Fade + translateY(8px → 0) |
| Card hover | Mouse enter | 200ms | ease-out | translateY(0 → -2px) + shadow-lg |
| Modal open | Action click | 300ms | ease-spring | Scale(0.95 → 1) + fade, overlay fade |
| Modal close | Dismiss | 200ms | ease-out | Scale(1 → 0.95) + fade |
| Toast enter | Event | 400ms | ease-spring | translateX(100% → 0) from right |
| Toast exit | Timer/dismiss | 200ms | ease-out | translateX(0 → 100%) |
| KPI CountUp | Mount/update | 1200ms | ease-out | Numeric interpolation, mono font |
| Chart draw | Mount | 800ms | ease-in-out | SVG path dasharray animation |
| Health pulse | HF < 1.0 | 1000ms | ease-in-out | Scale(1 → 1.05) + shadow-glow-danger, infinite |
| Score ring | Mount | 1200ms | ease-in-out | SVG arc stroke-dashoffset |
| Sparkline | Mount | 600ms | ease-out | Path draw from left to right |
| Skeleton | Loading | 1500ms | ease-in-out | Shimmer gradient sweep (infinite) |
| Confetti | Success | 2000ms | physics | 50 particles, gravity, varied colors |
| Sidebar item | Active | 200ms | ease-out | Left border accent + bg tint |
| Dropdown | Open | 200ms | ease-spring | ScaleY(0.95 → 1) + fade, origin top |
| Right panel | Open | 300ms | ease-out | translateX(100% → 0), shadow-xl |
| Command palette | Open | 200ms | ease-spring | Scale(0.96 → 1) + fade |
| Table row hover | Mouse enter | 100ms | ease-out | Background color transition |
| Notification dot | New alert | 300ms | ease-spring | Scale(0 → 1), infinite pulse |

### 4.3 Micro-Interactions

```
1. DEPOSIT SUCCESS FLOW:
   User clicks "Deposit" → Button shows spinner →
   Transaction submitted toast (blue) →
   Transaction confirmed toast (green, with confetti) →
   KPI values CountUp to new values →
   Position table row highlights briefly (teal pulse)

2. HEALTH FACTOR CHANGE:
   Oracle price updates via WebSocket →
   Health factor number smoothly interpolates to new value →
   Gauge arc animates to new position →
   If crosses threshold: color transition + label change
   If < 1.0: danger glow starts pulsing

3. CREDIT SCORE INCREASE:
   After successful repayment →
   Score ring animates from old to new score →
   If tier change: confetti + tier badge morphs to new tier
   Breakdown bars re-animate to new values

4. WALLET CONNECTION:
   Click "Connect Wallet" → Modal opens →
   Select wallet → Loading spinner in wallet icon →
   Success: Address appears with jazzicon animation →
   Party ID resolves → Dashboard data loads with skeletons → data populates
```

### 4.4 Responsive Behavior

```
MOBILE (< 768px):
  - Sidebar collapses to bottom tab bar (5 items: Dashboard, Markets, Borrow, SecLending, More)
  - Top bar: simplified (logo, notification, wallet)
  - KPI grid: 2 columns → 1 column scroll
  - Tables: horizontal scroll with sticky first column
  - Charts: full width, reduced height (200px)
  - Modals: full-screen slide-up
  - Command palette: full-screen

TABLET (768-1024px):
  - Sidebar: collapsible (icon-only mode, 72px)
  - KPI grid: 3 columns
  - Tables: responsive columns (hide low-priority columns)
  - Side-by-side layouts → stack vertically

DESKTOP (1024-1440px):
  - Full layout as designed
  - Right panel: overlays content

WIDE (> 1440px):
  - Content centered at max-width: 1440px
  - Right panel: side-by-side with main content (no overlay)
```

---

## 5. Backend Implementation

### 5.1 Server Architecture

```
app/api/
├── src/
│   ├── index.ts                    # Entry point (Fastify server)
│   ├── config/
│   │   ├── env.ts                  # Environment config (zod validated)
│   │   ├── canton.ts               # Canton connection config
│   │   ├── database.ts             # PostgreSQL config
│   │   ├── redis.ts                # Redis config
│   │   └── cors.ts                 # CORS whitelist
│   │
│   ├── routes/
│   │   ├── index.ts                # Route registration
│   │   ├── health.ts               # GET /health, /ready, /live
│   │   ├── pools.routes.ts         # /v1/pools/*
│   │   ├── borrow.routes.ts        # /v1/borrow/*
│   │   ├── secLending.routes.ts    # /v1/sec-lending/*
│   │   ├── credit.routes.ts        # /v1/credit/*
│   │   ├── oracle.routes.ts        # /v1/oracle/*
│   │   ├── governance.routes.ts    # /v1/governance/*
│   │   ├── flashLoan.routes.ts     # /v1/flash-loan/*
│   │   └── admin.routes.ts         # /v1/admin/* (operator only)
│   │
│   ├── services/
│   │   ├── canton.service.ts       # Canton Ledger API interaction
│   │   ├── pool.service.ts         # Lending pool business logic
│   │   ├── borrow.service.ts       # Borrow position logic
│   │   ├── secLending.service.ts   # Securities lending logic
│   │   ├── credit.service.ts       # Credit scoring logic
│   │   ├── oracle.service.ts       # Price feed aggregation
│   │   ├── liquidation.service.ts  # Liquidation monitoring
│   │   ├── governance.service.ts   # Governance operations
│   │   ├── flashLoan.service.ts    # Flash loan execution
│   │   ├── notification.service.ts # Push notifications / email
│   │   └── analytics.service.ts    # Protocol analytics aggregation
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT validation (PartyLayer)
│   │   ├── mtls.middleware.ts       # mTLS for institutional clients
│   │   ├── rateLimit.middleware.ts  # Rate limiting (Redis-backed)
│   │   ├── validate.middleware.ts   # Zod request validation
│   │   ├── errorHandler.middleware.ts # Global error handling
│   │   ├── logging.middleware.ts    # Request/response logging
│   │   ├── cors.middleware.ts       # CORS handling
│   │   └── metrics.middleware.ts    # Prometheus metrics collection
│   │
│   ├── canton/
│   │   ├── client.ts               # Canton JSON API v2 HTTP client
│   │   ├── grpc.client.ts          # Canton gRPC Ledger API client
│   │   ├── commands.ts             # Daml command builders
│   │   ├── queries.ts              # Active contract set queries
│   │   ├── transactions.ts         # Transaction stream processing
│   │   ├── parties.ts              # Party management
│   │   └── types.ts                # Canton API type definitions
│   │
│   ├── db/
│   │   ├── client.ts               # Drizzle ORM client
│   │   ├── schema.ts               # Database schema
│   │   ├── migrations/             # SQL migration files
│   │   └── seed.ts                 # Test data seeder
│   │
│   ├── cache/
│   │   ├── redis.ts                # Redis client (ioredis)
│   │   ├── priceCache.ts           # Price feed caching layer
│   │   ├── poolCache.ts            # Pool state caching
│   │   └── sessionCache.ts         # Session data caching
│   │
│   ├── ws/
│   │   ├── server.ts               # WebSocket server (ws library)
│   │   ├── handlers.ts             # Message handlers
│   │   ├── channels.ts             # Channel subscription management
│   │   └── broadcast.ts            # Event broadcasting
│   │
│   ├── jobs/
│   │   ├── scheduler.ts            # BullMQ job scheduler
│   │   ├── interestAccrual.job.ts  # Periodic interest accrual
│   │   ├── oracleUpdate.job.ts     # Price feed refresh
│   │   ├── healthCheck.job.ts      # Position health monitoring
│   │   ├── creditRecalc.job.ts     # Credit score recalculation
│   │   ├── analytics.job.ts        # Analytics aggregation
│   │   └── cleanup.job.ts          # Stale data cleanup
│   │
│   ├── utils/
│   │   ├── logger.ts               # Pino structured logger
│   │   ├── errors.ts               # Custom error classes
│   │   ├── math.ts                 # Financial math utilities
│   │   ├── retry.ts                # Retry with exponential backoff
│   │   ├── crypto.ts               # Hashing, JWT utilities
│   │   └── validation.ts           # Shared Zod schemas
│   │
│   └── types/
│       ├── api.types.ts            # Request/response types
│       ├── canton.types.ts         # Canton contract types
│       ├── ws.types.ts             # WebSocket message types
│       └── common.types.ts         # Shared types
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── Dockerfile
├── tsconfig.json
└── package.json
```

### 5.2 Server Configuration

```typescript
// src/index.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { env } from './config/env';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { metricsPlugin } from './middleware/metrics.middleware';
import { loggingPlugin } from './middleware/logging.middleware';
import { initDatabase } from './db/client';
import { initRedis } from './cache/redis';
import { initCantonClient } from './canton/client';
import { initJobScheduler } from './jobs/scheduler';
import { initWebSocketServer } from './ws/server';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = Fastify({
    logger: false,   // We use our own Pino instance
    trustProxy: true,
    bodyLimit: 1_048_576,  // 1MB
    connectionTimeout: 30_000,
    keepAliveTimeout: 72_000,
  });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", env.CANTON_PARTICIPANT_URL, 'wss:'],
      },
    },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,           // 100 requests
    timeWindow: env.RATE_LIMIT_WINDOW, // per 60 seconds
    redis: initRedis(),
    keyGenerator: (req) => req.headers['x-party-id'] as string || req.ip,
  });

  // Plugins
  await app.register(metricsPlugin);
  await app.register(loggingPlugin);
  await app.register(websocket);

  // Initialize dependencies
  await initDatabase();
  await initCantonClient();
  const scheduler = await initJobScheduler();

  // Routes
  registerRoutes(app);

  // WebSocket
  initWebSocketServer(app);

  // Error handling
  app.setErrorHandler(errorHandler);

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await scheduler.close();
      await app.close();
      process.exit(0);
    });
  }

  // Start
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info(`Dualis API server running on port ${env.PORT}`);
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
```

### 5.3 Environment Configuration (Zod Validated)

```typescript
// src/config/env.ts

import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Canton
  CANTON_PARTICIPANT_URL: z.string().url(),
  CANTON_LEDGER_API_HOST: z.string(),
  CANTON_LEDGER_API_PORT: z.coerce.number().default(5011),
  CANTON_ADMIN_API_PORT: z.coerce.number().default(5012),
  CANTON_JSON_API_URL: z.string().url(),

  // Party IDs
  PROTOCOL_OPERATOR_PARTY: z.string(),
  ORACLE_PROVIDER_PARTY: z.string(),
  CREDIT_ASSESSOR_PARTY: z.string(),
  TREASURY_PARTY: z.string(),

  // Database
  DATABASE_URL: z.string(),
  DATABASE_POOL_MIN: z.coerce.number().default(5),
  DATABASE_POOL_MAX: z.coerce.number().default(20),

  // Redis
  REDIS_URL: z.string(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('24h'),
  MTLS_CA_CERT_PATH: z.string().optional(),
  MTLS_SERVER_CERT_PATH: z.string().optional(),
  MTLS_SERVER_KEY_PATH: z.string().optional(),

  // Chainlink
  CHAINLINK_DATA_STREAMS_URL: z.string().url().optional(),
  CHAINLINK_API_KEY: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // CORS
  CORS_ORIGINS: z.string().transform(s => s.split(',')),

  // Feature Flags
  ENABLE_SEC_LENDING: z.coerce.boolean().default(true),
  ENABLE_FLASH_LOANS: z.coerce.boolean().default(true),
  ENABLE_GOVERNANCE: z.coerce.boolean().default(true),
  ENABLE_INSTITUTIONAL_TIER: z.coerce.boolean().default(false),

  // External
  POSTHOG_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

### 5.4 Route Implementation Example — Pools

```typescript
// src/routes/pools.routes.ts

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PoolService } from '../services/pool.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const poolService = new PoolService();

// Request/Response schemas
const listPoolsQuery = z.object({
  assetType: z.enum(['stablecoin', 'crypto', 'treasury', 'rwa', 'all']).optional(),
  sortBy: z.enum(['tvl', 'supplyApy', 'borrowApy', 'utilization']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const depositBody = z.object({
  poolId: z.string(),
  amount: z.string().regex(/^\d+\.?\d*$/), // Decimal as string for precision
  partyId: z.string(),
});

const withdrawBody = z.object({
  poolId: z.string(),
  shares: z.string().regex(/^\d+\.?\d*$/),
  partyId: z.string(),
});

export async function poolRoutes(app: FastifyInstance) {

  // GET /v1/pools — List all lending pools
  app.get('/v1/pools', {
    schema: { querystring: listPoolsQuery },
  }, async (req, reply) => {
    const query = listPoolsQuery.parse(req.query);
    const pools = await poolService.listPools(query);
    return reply.send({
      data: pools.items,
      pagination: {
        total: pools.total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < pools.total,
      },
    });
  });

  // GET /v1/pools/:poolId — Pool details
  app.get('/v1/pools/:poolId', async (req, reply) => {
    const { poolId } = req.params as { poolId: string };
    const pool = await poolService.getPoolDetail(poolId);
    if (!pool) return reply.status(404).send({ error: 'Pool not found' });
    return reply.send({ data: pool });
  });

  // GET /v1/pools/:poolId/history — Historical data
  app.get('/v1/pools/:poolId/history', async (req, reply) => {
    const { poolId } = req.params as { poolId: string };
    const { period } = req.query as { period?: '7d' | '30d' | '90d' | '1y' | 'all' };
    const history = await poolService.getPoolHistory(poolId, period || '30d');
    return reply.send({ data: history });
  });

  // POST /v1/pools/:poolId/deposit — Deposit to pool (authenticated)
  app.post('/v1/pools/:poolId/deposit', {
    preHandler: [authMiddleware],
    schema: { body: depositBody },
  }, async (req, reply) => {
    const body = depositBody.parse(req.body);
    const result = await poolService.deposit({
      poolId: body.poolId,
      amount: body.amount,
      lenderParty: body.partyId,
    });
    return reply.status(201).send({
      data: result,
      transaction: {
        id: result.transactionId,
        status: 'submitted',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // POST /v1/pools/:poolId/withdraw — Withdraw from pool (authenticated)
  app.post('/v1/pools/:poolId/withdraw', {
    preHandler: [authMiddleware],
    schema: { body: withdrawBody },
  }, async (req, reply) => {
    const body = withdrawBody.parse(req.body);
    const result = await poolService.withdraw({
      poolId: body.poolId,
      shares: body.shares,
      lenderParty: body.partyId,
    });
    return reply.send({
      data: result,
      transaction: {
        id: result.transactionId,
        status: 'submitted',
        timestamp: new Date().toISOString(),
      },
    });
  });
}
```

### 5.5 Service Layer Example — Pool Service

```typescript
// src/services/pool.service.ts

import { CantonClient } from '../canton/client';
import { PoolCache } from '../cache/poolCache';
import { PriceCache } from '../cache/priceCache';
import { db } from '../db/client';
import { pools, poolSnapshots } from '../db/schema';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { calculateAPY, calculateUtilization } from '../utils/math';
import type { ListPoolsQuery, PoolDetail, PoolHistoryPoint } from '../types/api.types';

export class PoolService {
  private canton: CantonClient;
  private poolCache: PoolCache;
  private priceCache: PriceCache;

  constructor() {
    this.canton = CantonClient.getInstance();
    this.poolCache = new PoolCache();
    this.priceCache = new PriceCache();
  }

  async listPools(query: ListPoolsQuery) {
    // 1. Try cache first (5-second TTL for pool list)
    const cacheKey = `pools:list:${JSON.stringify(query)}`;
    const cached = await this.poolCache.get(cacheKey);
    if (cached) return cached;

    // 2. Query Canton ACS (Active Contract Set) for all LendingPool contracts
    const contracts = await this.canton.queryContracts({
      templateId: 'Dualis.Lending.Pool:LendingPool',
      query: {},
    });

    // 3. Enrich with prices and computed metrics
    const enriched = await Promise.all(
      contracts.map(async (contract) => {
        const payload = contract.payload;
        const price = await this.priceCache.getPrice(payload.asset.symbol);
        const utilization = calculateUtilization(
          parseFloat(payload.totalBorrows),
          parseFloat(payload.totalDeposits)
        );
        const supplyAPY = calculateAPY(
          payload.interestRateModel,
          utilization,
          'supply',
          parseFloat(payload.totalBorrows),
          parseFloat(payload.totalDeposits)
        );
        const borrowAPY = calculateAPY(
          payload.interestRateModel,
          utilization,
          'borrow'
        );

        return {
          poolId: payload.poolId,
          asset: {
            symbol: payload.asset.symbol,
            type: payload.asset.instrumentType,
            priceUSD: price,
          },
          totalSupply: parseFloat(payload.totalDeposits),
          totalSupplyUSD: parseFloat(payload.totalDeposits) * price,
          totalBorrow: parseFloat(payload.totalBorrows),
          totalBorrowUSD: parseFloat(payload.totalBorrows) * price,
          totalReserves: parseFloat(payload.totalReserves),
          utilization,
          supplyAPY,
          borrowAPY,
          isActive: payload.isActive,
          contractId: contract.contractId,
        };
      })
    );

    // 4. Filter and sort
    let filtered = enriched;
    if (query.assetType && query.assetType !== 'all') {
      const typeMap: Record<string, string> = {
        stablecoin: 'Stablecoin',
        crypto: 'CryptoCurrency',
        treasury: 'TokenizedTreasury',
        rwa: 'TokenizedReceivable',
      };
      filtered = filtered.filter(p => p.asset.type === typeMap[query.assetType!]);
    }

    const sortKey = query.sortBy || 'tvl';
    const sortMap: Record<string, (p: any) => number> = {
      tvl: (p) => p.totalSupplyUSD,
      supplyApy: (p) => p.supplyAPY,
      borrowApy: (p) => p.borrowAPY,
      utilization: (p) => p.utilization,
    };
    filtered.sort((a, b) => {
      const diff = sortMap[sortKey](b) - sortMap[sortKey](a);
      return query.sortOrder === 'asc' ? -diff : diff;
    });

    // 5. Paginate
    const total = filtered.length;
    const items = filtered.slice(query.offset, query.offset + query.limit);

    const result = { items, total };

    // 6. Cache result
    await this.poolCache.set(cacheKey, result, 5); // 5 second TTL

    return result;
  }

  async getPoolDetail(poolId: string): Promise<PoolDetail | null> {
    // Fetch pool contract + related data
    const contract = await this.canton.queryContractByKey({
      templateId: 'Dualis.Lending.Pool:LendingPool',
      key: { _1: this.canton.operatorParty, _2: poolId },
    });

    if (!contract) return null;

    const payload = contract.payload;
    const price = await this.priceCache.getPrice(payload.asset.symbol);
    const utilization = calculateUtilization(
      parseFloat(payload.totalBorrows),
      parseFloat(payload.totalDeposits)
    );

    // Fetch collateral config from ProtocolConfig
    const configContract = await this.canton.queryContracts({
      templateId: 'Dualis.Core.Config:ProtocolConfig',
      query: {},
    });
    const config = configContract[0]?.payload;
    const collateralConfig = config?.collateralConfigs?.find(
      (c: any) => c.instrumentType === payload.asset.instrumentType
    );

    // Fetch recent events from off-chain DB
    const recentActivity = await db
      .select()
      .from(poolSnapshots)
      .where(eq(poolSnapshots.poolId, poolId))
      .orderBy(desc(poolSnapshots.timestamp))
      .limit(100);

    return {
      ...this.enrichPool(payload, price, utilization),
      collateralConfig: collateralConfig || null,
      interestRateModel: payload.interestRateModel,
      accumulatedBorrowIndex: parseFloat(payload.accumulatedBorrowIndex),
      accumulatedSupplyIndex: parseFloat(payload.accumulatedSupplyIndex),
      lastAccrualTimestamp: payload.lastAccrualTimestamp,
      recentActivity,
      contractId: contract.contractId,
    };
  }

  async deposit(params: { poolId: string; amount: string; lenderParty: string }) {
    logger.info({ params }, 'Processing deposit');

    // Build and submit Daml command
    const result = await this.canton.exerciseChoice({
      templateId: 'Dualis.Lending.Pool:LendingPool',
      contractKey: { _1: this.canton.operatorParty, _2: params.poolId },
      choice: 'Deposit',
      argument: {
        lender: params.lenderParty,
        depositAmount: params.amount,
      },
    });

    // Record in off-chain DB
    await db.insert(poolSnapshots).values({
      poolId: params.poolId,
      eventType: 'deposit',
      party: params.lenderParty,
      amount: params.amount,
      transactionId: result.transactionId,
      timestamp: new Date(),
    });

    // Invalidate cache
    await this.poolCache.invalidatePool(params.poolId);

    return {
      transactionId: result.transactionId,
      poolContractId: result.events[0]?.contractId,
      positionContractId: result.events[1]?.contractId,
    };
  }

  async withdraw(params: { poolId: string; shares: string; lenderParty: string }) {
    logger.info({ params }, 'Processing withdrawal');

    // Find user's lending position
    const position = await this.canton.queryContractByKey({
      templateId: 'Dualis.Lending.Pool:LendingPosition',
      key: {
        _1: this.canton.operatorParty,
        _2: `${params.poolId}-${params.lenderParty}`,
      },
    });

    if (!position) {
      throw new AppError('POSITION_NOT_FOUND', 'No lending position found', 404);
    }

    const result = await this.canton.exerciseChoice({
      templateId: 'Dualis.Lending.Pool:LendingPosition',
      contractId: position.contractId,
      choice: 'Withdraw',
      argument: { withdrawShares: params.shares },
    });

    await db.insert(poolSnapshots).values({
      poolId: params.poolId,
      eventType: 'withdraw',
      party: params.lenderParty,
      amount: params.shares,
      transactionId: result.transactionId,
      timestamp: new Date(),
    });

    await this.poolCache.invalidatePool(params.poolId);

    return { transactionId: result.transactionId };
  }

  async getPoolHistory(poolId: string, period: string): Promise<PoolHistoryPoint[]> {
    const periodMap: Record<string, number> = {
      '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 9999,
    };
    const days = periodMap[period] || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return db
      .select({
        timestamp: poolSnapshots.timestamp,
        totalSupply: poolSnapshots.totalSupply,
        totalBorrow: poolSnapshots.totalBorrow,
        supplyAPY: poolSnapshots.supplyAPY,
        borrowAPY: poolSnapshots.borrowAPY,
        utilization: poolSnapshots.utilization,
      })
      .from(poolSnapshots)
      .where(
        and(
          eq(poolSnapshots.poolId, poolId),
          gte(poolSnapshots.timestamp, since)
        )
      )
      .orderBy(asc(poolSnapshots.timestamp));
  }

  private enrichPool(payload: any, price: number, utilization: number) {
    const supplyAPY = calculateAPY(payload.interestRateModel, utilization, 'supply',
      parseFloat(payload.totalBorrows), parseFloat(payload.totalDeposits));
    const borrowAPY = calculateAPY(payload.interestRateModel, utilization, 'borrow');

    return {
      poolId: payload.poolId,
      asset: {
        symbol: payload.asset.symbol,
        type: payload.asset.instrumentType,
        priceUSD: price,
      },
      totalSupply: parseFloat(payload.totalDeposits),
      totalSupplyUSD: parseFloat(payload.totalDeposits) * price,
      totalBorrow: parseFloat(payload.totalBorrows),
      totalBorrowUSD: parseFloat(payload.totalBorrows) * price,
      totalReserves: parseFloat(payload.totalReserves),
      utilization,
      supplyAPY,
      borrowAPY,
      isActive: payload.isActive,
    };
  }
}
```

---

## 6. Middleware & Security Layer

### 6.1 Authentication Middleware

```typescript
// src/middleware/auth.middleware.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT } from '../utils/crypto';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export interface AuthContext {
  partyId: string;
  walletType: string;
  tier: 'retail' | 'institutional';
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Missing or invalid authorization header', 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);
    req.auth = payload as AuthContext;
  } catch (err) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
  }

  // Check if protocol is paused (except for withdrawals)
  if (req.url.includes('/withdraw') === false) {
    const isPaused = await checkProtocolPaused();
    if (isPaused) {
      throw new AppError('PROTOCOL_PAUSED', 'Protocol is currently paused', 503);
    }
  }
}

// Institutional mTLS middleware (for API key + client cert)
export async function institutionalAuthMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const apiKey = req.headers['x-api-key'] as string;
  const clientCert = (req.raw as any).socket?.getPeerCertificate?.();

  if (!apiKey || !clientCert) {
    throw new AppError('UNAUTHORIZED', 'Institutional access requires API key + mTLS', 401);
  }

  // Validate API key against DB
  // Validate client certificate fingerprint
  // Set auth context with institutional tier
}
```

### 6.2 Rate Limiting Configuration

```typescript
// Rate limits by tier and endpoint type

const rateLimits = {
  // Retail (JWT auth)
  retail: {
    read: { max: 120, window: '1 minute' },   // GET requests
    write: { max: 30, window: '1 minute' },    // POST/PUT/DELETE
    ws: { max: 5, window: '1 second' },        // WebSocket messages
  },
  // Institutional (mTLS + API key)
  institutional: {
    read: { max: 1000, window: '1 minute' },
    write: { max: 200, window: '1 minute' },
    ws: { max: 50, window: '1 second' },
  },
  // Public (no auth)
  public: {
    read: { max: 60, window: '1 minute' },
    write: { max: 0, window: '1 minute' },     // No writes allowed
    ws: { max: 0, window: '1 second' },
  },
};
```

### 6.3 Request Validation

```typescript
// src/middleware/validate.middleware.ts

import { z, ZodSchema } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/errors';

export function validate(schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  querystring?: ZodSchema;
}) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.params) req.params = schema.params.parse(req.params);
      if (schema.querystring) req.query = schema.querystring.parse(req.query);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AppError('VALIDATION_ERROR', 'Request validation failed', 400, {
          errors: err.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      throw err;
    }
  };
}
```

---

## 7. Canton JSON API v2 Integration

### 7.1 Canton Client

```typescript
// src/canton/client.ts

import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';

export class CantonClient {
  private static instance: CantonClient;
  private http: AxiosInstance;
  public operatorParty: string;

  private constructor() {
    this.http = axios.create({
      baseURL: env.CANTON_JSON_API_URL,
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.operatorParty = env.PROTOCOL_OPERATOR_PARTY;

    // Request/response interceptors for logging
    this.http.interceptors.request.use((config) => {
      logger.debug({ url: config.url, method: config.method }, 'Canton API request');
      return config;
    });

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error({
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        }, 'Canton API error');
        throw error;
      }
    );
  }

  static getInstance(): CantonClient {
    if (!CantonClient.instance) {
      CantonClient.instance = new CantonClient();
    }
    return CantonClient.instance;
  }

  // Query active contracts
  async queryContracts(params: {
    templateId: string;
    query?: Record<string, any>;
    party?: string;
  }) {
    const response = await retry(
      () => this.http.post('/v2/query', {
        templateIds: [params.templateId],
        query: params.query || {},
        readers: [params.party || this.operatorParty],
      }),
      { retries: 3, minTimeout: 500 }
    );
    return response.data.result;
  }

  // Query by contract key
  async queryContractByKey(params: {
    templateId: string;
    key: any;
    party?: string;
  }) {
    const response = await this.http.post('/v2/fetch', {
      templateId: params.templateId,
      key: params.key,
      readers: [params.party || this.operatorParty],
    });
    return response.data.result;
  }

  // Exercise a choice
  async exerciseChoice(params: {
    templateId: string;
    contractId?: string;
    contractKey?: any;
    choice: string;
    argument: Record<string, any>;
    actAs?: string;
  }) {
    const body: any = {
      templateId: params.templateId,
      choice: params.choice,
      argument: params.argument,
      meta: {
        actAs: [params.actAs || this.operatorParty],
      },
    };

    if (params.contractId) {
      body.contractId = params.contractId;
    } else if (params.contractKey) {
      body.key = params.contractKey;
    }

    const response = await retry(
      () => this.http.post('/v2/exercise', body),
      { retries: 2, minTimeout: 1000 }
    );

    return {
      transactionId: response.data.result.transactionId,
      events: response.data.result.events || [],
      exerciseResult: response.data.result.exerciseResult,
    };
  }

  // Create a contract
  async createContract(params: {
    templateId: string;
    payload: Record<string, any>;
    actAs?: string;
  }) {
    const response = await this.http.post('/v2/create', {
      templateId: params.templateId,
      payload: params.payload,
      meta: {
        actAs: [params.actAs || this.operatorParty],
      },
    });
    return response.data.result;
  }

  // Subscribe to transaction stream (for automation bots)
  async streamTransactions(params: {
    templateIds: string[];
    party: string;
    offset?: string;
    onEvent: (event: any) => void;
  }) {
    // Uses Canton gRPC streaming API
    // Implementation via @grpc/grpc-js
    // See grpc.client.ts for full implementation
  }
}
```

---

## 8. Database Schema (Off-Chain)

### 8.1 PostgreSQL Schema (Drizzle ORM)

```typescript
// src/db/schema.ts

import {
  pgTable, serial, text, varchar, decimal, integer,
  timestamp, boolean, jsonb, index, uniqueIndex, pgEnum,
} from 'drizzle-orm/pg-core';

// === ENUMS ===

export const eventTypeEnum = pgEnum('event_type', [
  'deposit', 'withdraw', 'borrow', 'repay', 'liquidation',
  'sec_lending_offer', 'sec_lending_accept', 'sec_lending_return',
  'sec_lending_recall', 'credit_update', 'governance_vote',
  'stake', 'unstake', 'flash_loan',
]);

export const creditTierEnum = pgEnum('credit_tier', [
  'diamond', 'gold', 'silver', 'bronze', 'unrated',
]);

export const secLendingStatusEnum = pgEnum('sec_lending_status', [
  'offered', 'matched', 'active', 'recall_requested', 'returning', 'settled', 'defaulted',
]);

// === TABLES ===

// Pool historical snapshots (for charts and analytics)
export const poolSnapshots = pgTable('pool_snapshots', {
  id: serial('id').primaryKey(),
  poolId: varchar('pool_id', { length: 64 }).notNull(),
  eventType: eventTypeEnum('event_type'),
  party: varchar('party', { length: 256 }),
  amount: decimal('amount', { precision: 36, scale: 18 }),
  totalSupply: decimal('total_supply', { precision: 36, scale: 18 }),
  totalBorrow: decimal('total_borrow', { precision: 36, scale: 18 }),
  totalReserves: decimal('total_reserves', { precision: 36, scale: 18 }),
  supplyAPY: decimal('supply_apy', { precision: 10, scale: 6 }),
  borrowAPY: decimal('borrow_apy', { precision: 10, scale: 6 }),
  utilization: decimal('utilization', { precision: 10, scale: 6 }),
  priceUSD: decimal('price_usd', { precision: 20, scale: 8 }),
  transactionId: varchar('transaction_id', { length: 128 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  poolIdIdx: index('pool_snapshots_pool_id_idx').on(table.poolId),
  timestampIdx: index('pool_snapshots_timestamp_idx').on(table.timestamp),
  poolTimeIdx: index('pool_snapshots_pool_time_idx').on(table.poolId, table.timestamp),
}));

// Price feed history (for charts and oracle verification)
export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  asset: varchar('asset', { length: 32 }).notNull(),
  quoteCurrency: varchar('quote_currency', { length: 8 }).default('USD'),
  price: decimal('price', { precision: 20, scale: 8 }).notNull(),
  confidence: decimal('confidence', { precision: 10, scale: 8 }),
  source: varchar('source', { length: 64 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
}, (table) => ({
  assetTimeIdx: index('price_history_asset_time_idx').on(table.asset, table.timestamp),
}));

// User activity log (for credit scoring and analytics)
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  poolId: varchar('pool_id', { length: 64 }),
  amount: decimal('amount', { precision: 36, scale: 18 }),
  amountUSD: decimal('amount_usd', { precision: 20, scale: 2 }),
  metadata: jsonb('metadata'),  // Flexible event-specific data
  transactionId: varchar('transaction_id', { length: 128 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  partyIdx: index('user_activity_party_idx').on(table.partyId),
  partyTimeIdx: index('user_activity_party_time_idx').on(table.partyId, table.timestamp),
  eventTypeIdx: index('user_activity_event_type_idx').on(table.eventType),
}));

// Credit score cache (mirrors Canton state for fast reads)
export const creditScoreCache = pgTable('credit_score_cache', {
  partyId: varchar('party_id', { length: 256 }).primaryKey(),
  rawScore: decimal('raw_score', { precision: 8, scale: 2 }).notNull(),
  creditTier: creditTierEnum('credit_tier').notNull(),
  totalLoansCompleted: integer('total_loans_completed').default(0),
  totalLoansDefaulted: integer('total_loans_defaulted').default(0),
  totalVolumeRepaid: decimal('total_volume_repaid', { precision: 36, scale: 18 }).default('0'),
  onTimeRepayments: integer('on_time_repayments').default(0),
  lateRepayments: integer('late_repayments').default(0),
  lowestHealthFactor: decimal('lowest_health_factor', { precision: 10, scale: 6 }),
  liquidationCount: integer('liquidation_count').default(0),
  secLendingDeals: integer('sec_lending_deals').default(0),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});

// Liquidation events (for analytics and risk monitoring)
export const liquidationEvents = pgTable('liquidation_events', {
  id: serial('id').primaryKey(),
  borrower: varchar('borrower', { length: 256 }).notNull(),
  liquidator: varchar('liquidator', { length: 256 }).notNull(),
  poolId: varchar('pool_id', { length: 64 }).notNull(),
  collateralSeized: decimal('collateral_seized', { precision: 36, scale: 18 }).notNull(),
  collateralSeizedUSD: decimal('collateral_seized_usd', { precision: 20, scale: 2 }),
  debtRepaid: decimal('debt_repaid', { precision: 36, scale: 18 }).notNull(),
  debtRepaidUSD: decimal('debt_repaid_usd', { precision: 20, scale: 2 }),
  liquidatorReward: decimal('liquidator_reward', { precision: 36, scale: 18 }),
  protocolFee: decimal('protocol_fee', { precision: 36, scale: 18 }),
  tier: varchar('tier', { length: 32 }),
  healthFactorBefore: decimal('hf_before', { precision: 10, scale: 6 }),
  healthFactorAfter: decimal('hf_after', { precision: 10, scale: 6 }),
  transactionId: varchar('transaction_id', { length: 128 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  borrowerIdx: index('liquidation_borrower_idx').on(table.borrower),
  timestampIdx: index('liquidation_timestamp_idx').on(table.timestamp),
}));

// Securities lending deal history
export const secLendingHistory = pgTable('sec_lending_history', {
  id: serial('id').primaryKey(),
  dealId: varchar('deal_id', { length: 128 }).notNull().unique(),
  lender: varchar('lender', { length: 256 }).notNull(),
  borrower: varchar('borrower', { length: 256 }).notNull(),
  security: varchar('security', { length: 64 }).notNull(),
  securityValueUSD: decimal('security_value_usd', { precision: 20, scale: 2 }),
  feeType: varchar('fee_type', { length: 32 }),
  feeRate: decimal('fee_rate', { precision: 10, scale: 4 }),
  totalFeeAccrued: decimal('total_fee_accrued', { precision: 20, scale: 8 }),
  status: secLendingStatusEnum('status').notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  corporateActions: jsonb('corporate_actions'),
  transactionId: varchar('transaction_id', { length: 128 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  lenderIdx: index('sec_lending_lender_idx').on(table.lender),
  borrowerIdx: index('sec_lending_borrower_idx').on(table.borrower),
  statusIdx: index('sec_lending_status_idx').on(table.status),
}));

// Governance proposals (off-chain metadata)
export const governanceProposals = pgTable('governance_proposals', {
  id: serial('id').primaryKey(),
  proposalId: varchar('proposal_id', { length: 128 }).notNull().unique(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description'),
  proposer: varchar('proposer', { length: 256 }).notNull(),
  category: varchar('category', { length: 64 }),
  forVotes: decimal('for_votes', { precision: 36, scale: 18 }).default('0'),
  againstVotes: decimal('against_votes', { precision: 36, scale: 18 }).default('0'),
  abstainVotes: decimal('abstain_votes', { precision: 36, scale: 18 }).default('0'),
  quorum: decimal('quorum', { precision: 36, scale: 18 }),
  status: varchar('status', { length: 32 }).default('active'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  executionTime: timestamp('execution_time'),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// Protocol analytics (daily aggregations)
export const protocolAnalytics = pgTable('protocol_analytics', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  totalTVL: decimal('total_tvl', { precision: 20, scale: 2 }),
  totalBorrowed: decimal('total_borrowed', { precision: 20, scale: 2 }),
  totalFees24h: decimal('total_fees_24h', { precision: 20, scale: 2 }),
  totalLiquidations24h: decimal('total_liquidations_24h', { precision: 20, scale: 2 }),
  uniqueUsers24h: integer('unique_users_24h'),
  totalTransactions24h: integer('total_transactions_24h'),
  avgHealthFactor: decimal('avg_health_factor', { precision: 10, scale: 6 }),
  secLendingVolume24h: decimal('sec_lending_volume_24h', { precision: 20, scale: 2 }),
  activeSecLendingDeals: integer('active_sec_lending_deals'),
  flashLoanVolume24h: decimal('flash_loan_volume_24h', { precision: 20, scale: 2 }),
}, (table) => ({
  dateIdx: uniqueIndex('protocol_analytics_date_idx').on(table.date),
}));

// Notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
  partyId: varchar('party_id', { length: 256 }).primaryKey(),
  healthFactorWarning: boolean('hf_warning').default(true),
  healthFactorThreshold: decimal('hf_threshold', { precision: 4, scale: 2 }).default('1.2'),
  liquidationAlert: boolean('liquidation_alert').default(true),
  secLendingRecall: boolean('sec_lending_recall').default(true),
  governanceProposal: boolean('governance_proposal').default(true),
  emailAddress: varchar('email', { length: 256 }),
  telegramChatId: varchar('telegram_chat_id', { length: 64 }),
  webhookUrl: varchar('webhook_url', { length: 512 }),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});

// API keys for institutional clients
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  keyHash: varchar('key_hash', { length: 128 }).notNull().unique(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  label: varchar('label', { length: 128 }),
  permissions: jsonb('permissions'), // ['read', 'write', 'admin']
  rateLimitOverride: integer('rate_limit_override'),
  certFingerprint: varchar('cert_fingerprint', { length: 128 }),
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### 8.2 Database Indexes Strategy

```
// Performance-critical queries and their indexes:

1. Pool list (sorted by TVL): pool_snapshots_pool_id_idx
2. Pool history chart: pool_snapshots_pool_time_idx (composite)
3. User positions lookup: user_activity_party_idx
4. Credit score fetch: credit_score_cache PK (party_id)
5. Liquidation history: liquidation_timestamp_idx
6. Sec lending by status: sec_lending_status_idx
7. Analytics by date: protocol_analytics_date_idx (unique)

// Partitioning strategy (for pool_snapshots and price_history):
// Range partition by month on timestamp column
// Retention: 2 years for snapshots, 1 year for price history
// Aggregation: Daily rollups after 90 days (reduce granularity)
```

---

## 9. Caching Architecture

### 9.1 Redis Caching Strategy

```typescript
// src/cache/redis.ts

import Redis from 'ioredis';
import { env } from '../config/env';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 5000),
  lazyConnect: true,
});

// Cache key patterns and TTLs:
//
// prices:{asset}           → 5s    (price feeds, very volatile)
// pools:list:{hash}        → 5s    (pool list, frequent updates)
// pools:detail:{poolId}    → 10s   (individual pool detail)
// pools:history:{id}:{per} → 60s   (historical chart data)
// credit:{partyId}         → 30s   (credit score)
// positions:{partyId}      → 10s   (user positions)
// protocol:config          → 300s  (protocol configuration, rarely changes)
// protocol:analytics       → 60s   (aggregated metrics)
// sec-lending:offers       → 10s   (marketplace offers)
// rate-limit:{key}         → auto  (rate limiter state)
// session:{token}          → 86400 (24h session data)

export { redis };
```

### 9.2 Cache Invalidation

```
Strategies:
1. TIME-BASED: Most caches use short TTLs (5-30s) for auto-expiry
2. EVENT-BASED: Canton transaction events trigger invalidation
   - Deposit → invalidate pools:list:*, pools:detail:{poolId}
   - Borrow → invalidate pools:*, positions:{partyId}
   - Liquidation → invalidate pools:*, positions:*, credit:*
   - Price update → invalidate prices:{asset}
3. WRITE-THROUGH: On writes, update cache immediately then persist to Canton

Pattern: Cache-Aside with Event-Driven Invalidation
  - Read: Check cache → miss → query Canton → populate cache → return
  - Write: Submit to Canton → on success → invalidate related caches
  - Background: Canton transaction stream listener invalidates affected caches
```

---

## 10. WebSocket Implementation

### 10.1 WebSocket Server

```typescript
// src/ws/server.ts

import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { verifyJWT } from '../utils/crypto';
import { ChannelManager } from './channels';

const channels = new ChannelManager();

export function initWebSocketServer(app: FastifyInstance) {
  app.get('/v1/ws', { websocket: true }, (socket: WebSocket, req) => {
    let authenticated = false;
    let partyId: string | null = null;

    // Require auth within 5 seconds
    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        socket.close(4001, 'Authentication timeout');
      }
    }, 5000);

    socket.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Authentication message
        if (msg.type === 'auth') {
          const payload = await verifyJWT(msg.token);
          partyId = payload.partyId;
          authenticated = true;
          clearTimeout(authTimeout);
          socket.send(JSON.stringify({ type: 'auth:success', partyId }));
          return;
        }

        if (!authenticated) {
          socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
          return;
        }

        // Subscribe to channel
        if (msg.type === 'subscribe') {
          const allowed = validateChannelAccess(msg.channel, partyId!);
          if (allowed) {
            channels.subscribe(msg.channel, socket);
            socket.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
          } else {
            socket.send(JSON.stringify({ type: 'error', message: 'Access denied' }));
          }
        }

        // Unsubscribe
        if (msg.type === 'unsubscribe') {
          channels.unsubscribe(msg.channel, socket);
          socket.send(JSON.stringify({ type: 'unsubscribed', channel: msg.channel }));
        }

        // Ping/pong keepalive
        if (msg.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        }
      } catch (err) {
        logger.error(err, 'WebSocket message error');
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    socket.on('close', () => {
      channels.removeSocket(socket);
      clearTimeout(authTimeout);
    });
  });
}

// Available channels:
// prices:{asset}          → Real-time price updates (public)
// pool:{poolId}           → Pool state changes (public)
// position:{positionId}   → Health factor updates (private, owner only)
// liquidations            → Global liquidation events (public)
// sec-lending:offers      → New sec lending offers (public)
// sec-lending:deal:{id}   → Deal updates (private, parties only)
// governance:votes         → Live vote tallies (public)
// notifications:{partyId} → Personal notifications (private)

function validateChannelAccess(channel: string, partyId: string): boolean {
  // Public channels: prices:*, pool:*, liquidations, sec-lending:offers, governance:*
  // Private channels: position:*, sec-lending:deal:*, notifications:*
  // Private channels require the partyId to match the channel owner
  if (channel.startsWith('position:') || channel.startsWith('notifications:')) {
    return channel.includes(partyId);
  }
  return true;
}
```

---

## 11. Monitoring & Observability

### 11.1 Observability Stack

```
┌─────────────────────────────────────────────────────────┐
│                     MONITORING STACK                      │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  │
│  │Prometheus│  │ Grafana   │  │ Loki    │  │ Sentry   │  │
│  │(Metrics) │  │(Dashboard)│  │(Logs)   │  │(Errors)  │  │
│  └────┬─────┘  └─────┬─────┘  └────┬────┘  └─────┬────┘  │
│       │              │             │             │        │
│       │    ┌─────────▼──────────┐  │             │        │
│       │    │   GRAFANA UNIFIED  │  │             │        │
│       │    │   DASHBOARDS       │  │             │        │
│       │    └────────────────────┘  │             │        │
│       │                            │             │        │
│  ┌────▼────────────────────────────▼─────────────▼────┐  │
│  │                APPLICATION LAYER                    │  │
│  │  prom-client  │  pino → Loki  │  @sentry/node      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │ PagerDuty  │  │ Slack      │  │ OpsGenie           │ │
│  │ (Critical) │  │ (Warning)  │  │ (On-call rotation) │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Application Metrics (Prometheus)

```typescript
// Key metrics exposed at GET /metrics

// === BUSINESS METRICS ===
dualis_tvl_usd_total                    // Total Value Locked (gauge)
dualis_total_borrowed_usd               // Total borrowed (gauge)
dualis_pool_utilization{pool_id}        // Per-pool utilization (gauge)
dualis_pool_supply_apy{pool_id}         // Per-pool supply APY (gauge)
dualis_pool_borrow_apy{pool_id}         // Per-pool borrow APY (gauge)
dualis_active_positions_total            // Active borrow positions (gauge)
dualis_liquidations_total                // Cumulative liquidations (counter)
dualis_liquidation_volume_usd_total      // Liquidation volume USD (counter)
dualis_sec_lending_active_deals          // Active sec lending deals (gauge)
dualis_sec_lending_volume_usd_total      // Sec lending volume (counter)
dualis_flash_loan_volume_usd_total       // Flash loan volume (counter)
dualis_protocol_fees_usd_total           // Protocol revenue (counter)

// === INFRASTRUCTURE METRICS ===
dualis_api_request_duration_seconds{method,route,status}  // Histogram
dualis_api_request_total{method,route,status}             // Counter
dualis_ws_connections_active                               // Gauge
dualis_ws_messages_total{direction}                        // Counter
dualis_canton_request_duration_seconds{operation}          // Histogram
dualis_canton_request_errors_total{operation,error}        // Counter
dualis_db_query_duration_seconds{query_type}               // Histogram
dualis_cache_hit_total{cache_name}                         // Counter
dualis_cache_miss_total{cache_name}                        // Counter
dualis_job_duration_seconds{job_name}                      // Histogram
dualis_job_failures_total{job_name}                        // Counter

// === HEALTH METRICS ===
dualis_health_factor_distribution{bucket}                  // Histogram
dualis_positions_at_risk_total                              // Gauge (HF < 1.2)
dualis_oracle_staleness_seconds{feed}                      // Gauge
dualis_oracle_deviation_percent{feed}                       // Gauge
```

### 11.3 Alerting Rules

```yaml
# Critical (PagerDuty — immediate page)
- alert: ProtocolPaused
  expr: dualis_protocol_paused == 1
  for: 0m
  severity: critical

- alert: HighLiquidationRate
  expr: rate(dualis_liquidations_total[5m]) > 10
  for: 2m
  severity: critical
  annotation: "More than 10 liquidations per 5 minutes"

- alert: OracleStale
  expr: dualis_oracle_staleness_seconds > 300
  for: 1m
  severity: critical
  annotation: "Oracle feed stale for >5 minutes"

- alert: CantonAPIDown
  expr: up{job="canton-participant"} == 0
  for: 1m
  severity: critical

- alert: DatabaseDown
  expr: pg_up == 0
  for: 30s
  severity: critical

# Warning (Slack)
- alert: HighUtilization
  expr: dualis_pool_utilization > 0.90
  for: 5m
  severity: warning
  annotation: "Pool utilization above 90%"

- alert: PositionsAtRisk
  expr: dualis_positions_at_risk_total > 50
  for: 5m
  severity: warning

- alert: HighAPILatency
  expr: histogram_quantile(0.95, dualis_api_request_duration_seconds) > 2
  for: 5m
  severity: warning
  annotation: "P95 API latency above 2 seconds"

- alert: CacheHitRateLow
  expr: rate(dualis_cache_hit_total[5m]) / (rate(dualis_cache_hit_total[5m]) + rate(dualis_cache_miss_total[5m])) < 0.80
  for: 10m
  severity: warning
```

### 11.4 Grafana Dashboards

```
Dashboard 1: Protocol Overview
  - TVL trend (7d/30d/90d)
  - Supply vs Borrow totals
  - Revenue (24h, 7d, 30d)
  - Active users (24h)
  - Health factor distribution histogram
  - Liquidation volume timeline

Dashboard 2: Pool Health
  - Per-pool utilization gauges
  - Rate curves (supply/borrow APY)
  - Top pools by TVL table
  - Pool deposit/withdraw flow

Dashboard 3: Risk Monitor
  - Positions at risk count
  - Liquidation cascade risk (aggregate HF distribution)
  - Oracle price deviation
  - Collateral concentration Treemap

Dashboard 4: Infrastructure
  - API request rate (by endpoint)
  - P50/P95/P99 latency
  - Error rate
  - Canton API latency
  - DB query performance
  - Cache hit rate
  - WebSocket connection count
  - Job queue depth

Dashboard 5: Securities Lending
  - Active deals volume
  - Fee revenue
  - Recall rate
  - Mark-to-market deltas
```

---

## 12. Performance Engineering

### 12.1 Performance Targets

```
| Metric                        | Target      | Measurement        |
|-------------------------------|-------------|---------------------|
| API P50 latency               | < 100ms     | Prometheus histogram|
| API P95 latency               | < 500ms     | Prometheus histogram|
| API P99 latency               | < 2000ms    | Prometheus histogram|
| Canton round-trip             | < 1000ms    | Canton metrics      |
| Page load (LCP)               | < 2.5s      | Lighthouse / CWV    |
| First Input Delay             | < 100ms     | Lighthouse / CWV    |
| Cumulative Layout Shift       | < 0.1       | Lighthouse / CWV    |
| WebSocket message latency     | < 50ms      | Custom timing       |
| Cache hit rate                | > 90%       | Redis metrics       |
| Database query P95            | < 50ms      | Drizzle logging     |
| Concurrent WebSocket conns    | 10,000+     | Load testing        |
| Max API throughput            | 5,000 rps   | Load testing        |
```

### 12.2 Frontend Performance

```
1. CODE SPLITTING
   - Next.js automatic per-route splitting
   - Dynamic imports for heavy components:
     - Charts (Recharts) — lazy loaded on first view
     - Command palette — lazy loaded on ⌘K
     - Modals — lazy loaded on trigger
   - Bundle target: < 250KB initial JS (gzipped)

2. DATA FETCHING
   - SWR (stale-while-revalidate) for all data hooks
   - Optimistic updates for write operations
   - WebSocket for real-time data (prices, health factors)
   - React Server Components for static sections

3. RENDERING
   - Virtualized tables (TanStack Virtual) for > 100 rows
   - Memoized chart components (React.memo + useMemo)
   - requestAnimationFrame for CountUp animations
   - CSS containment on card grids
   - will-change on animated elements

4. ASSETS
   - Fonts: Variable fonts (single file, subset Latin + Turkish)
   - Icons: SVG sprite (single HTTP request)
   - Images: next/image with WebP/AVIF
   - Critical CSS inlined
```

### 12.3 Backend Performance

```
1. CONNECTION POOLING
   - PostgreSQL: pg-pool, min 5 / max 20 connections
   - Redis: ioredis with connection pooling
   - Canton: HTTP keep-alive, connection reuse

2. QUERY OPTIMIZATION
   - All frequent queries have covering indexes
   - Pool list: cached 5s, single Canton ACS query
   - User positions: cached 10s, keyed by party
   - Batch queries: Canton batch API for multiple contracts
   - Database: prepared statements via Drizzle

3. BACKGROUND PROCESSING
   - BullMQ for job scheduling (Redis-backed)
   - Interest accrual: every 5 minutes
   - Price updates: every 30 seconds
   - Health checks: every 30 seconds
   - Analytics aggregation: every 15 minutes
   - Credit recalculation: on-demand + daily batch

4. SERIALIZATION
   - Response compression (gzip/brotli via Fastify compress)
   - JSON serialization: fast-json-stringify schemas
   - Binary protocol for Canton gRPC (Protobuf)
```

---

## 13. Error Handling & Recovery

### 13.1 Error Classification

```typescript
// src/utils/errors.ts

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error codes:
// AUTH_*        — Authentication/authorization errors (401/403)
// VALIDATION_*  — Request validation errors (400)
// NOT_FOUND_*   — Resource not found (404)
// CANTON_*      — Canton Ledger API errors (502)
// ORACLE_*      — Price feed errors (503)
// PROTOCOL_*    — Protocol logic errors (422)
// RATE_LIMIT    — Rate limit exceeded (429)
// INTERNAL_*    — Unexpected server errors (500)

// Error response format:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "body.amount", "message": "Must be a positive number" }
    ],
    "requestId": "req_abc123",
    "timestamp": "2026-02-22T12:00:00Z"
  }
}
```

### 13.2 Retry & Circuit Breaker

```typescript
// src/utils/retry.ts

import pRetry from 'p-retry';

// Retry configuration by service:
// Canton API:     3 retries, 500ms → 1s → 2s backoff
// Chainlink:      3 retries, 1s → 2s → 4s backoff
// Database:       2 retries, 100ms → 200ms backoff
// Redis:          1 retry, 50ms backoff

// Circuit breaker (opossum):
// Canton API:     threshold 50%, reset after 30s
// Chainlink:      threshold 30%, reset after 60s
// DB:             threshold 70%, reset after 10s
```

---

## 14. Dependency Manifest

### 14.1 Frontend Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.x",
    "react": "^18.3.x",
    "react-dom": "^18.3.x",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-virtual": "^3.x",
    "zustand": "^4.5.x",
    "swr": "^2.2.x",
    "recharts": "^2.12.x",
    "d3": "^7.9.x",
    "framer-motion": "^11.x",
    "cmdk": "^1.0.x",
    "lucide-react": "^0.400.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-tooltip": "^1.x",
    "@radix-ui/react-tabs": "^1.x",
    "@radix-ui/react-toast": "^1.x",
    "@radix-ui/react-slider": "^1.x",
    "@radix-ui/react-toggle": "^1.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "tailwindcss": "^3.4.x",
    "fuse.js": "^7.x",
    "date-fns": "^3.x",
    "numeral": "^2.0.x",
    "qrcode.react": "^4.x",
    "@cayvox/partylayer-sdk": "workspace:*",
    "posthog-js": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.4.x",
    "@types/react": "^18.x",
    "@types/d3": "^7.x",
    "eslint": "^8.x",
    "prettier": "^3.x",
    "vitest": "^1.x",
    "@playwright/test": "^1.x",
    "storybook": "^8.x",
    "@chromatic-com/storybook": "^1.x"
  }
}
```

### 14.2 Backend Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.28.x",
    "@fastify/cors": "^9.x",
    "@fastify/helmet": "^11.x",
    "@fastify/rate-limit": "^9.x",
    "@fastify/websocket": "^10.x",
    "@fastify/compress": "^7.x",
    "drizzle-orm": "^0.33.x",
    "postgres": "^3.4.x",
    "ioredis": "^5.4.x",
    "bullmq": "^5.x",
    "zod": "^3.23.x",
    "pino": "^9.x",
    "pino-pretty": "^11.x",
    "axios": "^1.7.x",
    "@grpc/grpc-js": "^1.11.x",
    "@grpc/proto-loader": "^0.7.x",
    "jsonwebtoken": "^9.x",
    "p-retry": "^6.x",
    "opossum": "^8.x",
    "prom-client": "^15.x",
    "@sentry/node": "^8.x",
    "nanoid": "^5.x",
    "date-fns": "^3.x",
    "decimal.js": "^10.x"
  },
  "devDependencies": {
    "typescript": "^5.4.x",
    "tsx": "^4.x",
    "vitest": "^1.x",
    "drizzle-kit": "^0.24.x",
    "testcontainers": "^10.x",
    "@types/jsonwebtoken": "^9.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

### 14.3 Infrastructure Dependencies

```
Canton SDK:              Latest (Canton 3.x)
Daml SDK:                2.9.x
PostgreSQL:              16.x
Redis:                   7.2.x
Node.js:                 20.x LTS
Docker:                  24.x
Kubernetes:              1.29.x (via GKE/EKS)
Terraform:               1.7.x
GitHub Actions:          Latest runners
Prometheus:              2.50.x
Grafana:                 10.x
Loki:                    3.x
Sentry:                  Latest SaaS
```

---

## 15. Environment Configuration

### 15.1 Docker Compose (Development)

```yaml
# docker-compose.yml

version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dualis
      POSTGRES_USER: dualis
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dualis"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  canton-sandbox:
    image: digitalasset/canton:latest
    ports:
      - "5011:5011"  # Ledger API
      - "5012:5012"  # Admin API
      - "7575:7575"  # JSON API
    volumes:
      - ./deploy/canton/sandbox.conf:/canton/config.conf
      - ./daml/.daml/dist:/canton/dars
    command: ["daemon", "--config", "/canton/config.conf"]

  api:
    build:
      context: ./app/api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_URL: postgresql://dualis:dev_password@postgres:5432/dualis
      REDIS_URL: redis://redis:6379
      CANTON_JSON_API_URL: http://canton-sandbox:7575
      CANTON_LEDGER_API_HOST: canton-sandbox
      CANTON_LEDGER_API_PORT: 5011
      JWT_SECRET: dev-secret-key-minimum-32-characters-long
      CORS_ORIGINS: http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      canton-sandbox:
        condition: service_started

  frontend:
    build:
      context: ./app/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_WS_URL: ws://localhost:3001/v1/ws
      NEXT_PUBLIC_CANTON_PARTICIPANT: http://localhost:5011
    depends_on:
      - api

volumes:
  postgres_data:
```

---

## 16. Accessibility & Internationalization

### 16.1 Accessibility (WCAG 2.1 AA)

```
Requirements:
1. Color contrast: All text meets 4.5:1 ratio (AA standard)
   - Text on dark bg: #F9FAFB on #0A0E17 = 18.1:1 ✓
   - Secondary text: #9CA3AF on #0A0E17 = 7.8:1 ✓
   - Accent teal on dark: #00D4AA on #0A0E17 = 8.2:1 ✓

2. Keyboard navigation:
   - All interactive elements focusable via Tab
   - Focus ring: 2px accent-teal offset ring on all focusable elements
   - Skip to main content link
   - Modal trap focus (Radix handles this)
   - Command palette (⌘K) for power users

3. Screen readers:
   - Semantic HTML throughout (nav, main, article, section)
   - ARIA labels on all icon-only buttons
   - ARIA live regions for real-time data updates (prices, health factor)
   - Role="status" for toast notifications
   - Data tables with proper th/scope attributes

4. Motion:
   - prefers-reduced-motion: disable all animations except opacity
   - No auto-playing animations (sparklines draw on scroll intersection)

5. Forms:
   - All inputs have visible labels
   - Error messages linked via aria-describedby
   - Required fields marked with aria-required
```

### 16.2 Internationalization

```
Phase 1 (Launch):  English (en-US)
Phase 2 (Q3 2026): Turkish (tr-TR), Mandarin (zh-CN)
Phase 3 (Q1 2027): Japanese (ja-JP), Korean (ko-KR), German (de-DE)

Implementation:
- next-intl for Next.js i18n
- ICU message format for plurals, numbers, dates
- Number formatting: Intl.NumberFormat with locale
- Date formatting: date-fns with locale
- Currency: Always USD as base, localized formatting
- RTL: Not needed for initial locales, but CSS logical properties used throughout
  for future RTL support (margin-inline-start instead of margin-left, etc.)
```

---

*This document, combined with the Dualis Finance Technical Specification v1.0.0, forms the complete production blueprint for building Dualis Finance. Every layer — from pixel-perfect UI components to database indexes to alerting rules — is specified to production-ready detail.*

*Version 2.0.0 — February 2026 — Cayvox Labs*
