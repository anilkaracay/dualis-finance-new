# DUALIS FINANCE — Build Order

**Purpose:** This file is the master task list for building Dualis Finance. Each step is a self-contained directive you can give to Claude Code. Complete them in order — each step depends on the previous ones.

**Usage:** Copy a step's directive into Claude Code. When it's done, move to the next step. Don't skip steps.

**Reference Files:**
- `DUALIS_FINANCE_Complete_Production_Spec_v2.md` — Full spec (consult for details)
- `DESIGN_TOKENS.json` — Import directly into Tailwind/CSS config
- `API_CONTRACT.md` — All endpoint schemas
- `DAML_REFERENCE.md` — TypeScript types mirroring Daml contracts

---

## Phase 0: Project Scaffold (Steps 1-3)

### Step 0.1 — Monorepo Setup

```
Create a monorepo for Dualis Finance using the following structure:

dualis-finance/
├── packages/
│   ├── frontend/          # Next.js 14 App Router
│   ├── api/               # Fastify backend
│   ├── shared/            # Shared types & utilities
│   └── config/            # Shared configs (tsconfig, eslint)
├── daml/                  # Daml smart contracts (placeholder)
├── deploy/
│   ├── docker/
│   └── canton/
├── docs/                  # Place for reference docs
├── package.json           # Root workspace config
├── turbo.json             # Turborepo config
├── .gitignore
├── .env.example
└── README.md

Use pnpm workspaces with Turborepo.
Root package.json should have scripts: dev, build, lint, test, typecheck.
Create .env.example with all env vars from the spec (see env.ts schema in the spec).
```

### Step 0.2 — Shared Types Package

```
In packages/shared/, create the TypeScript type definitions that mirror our Daml contracts.
Use DAML_REFERENCE.md as your source. Create these files:

packages/shared/
├── src/
│   ├── index.ts              # Re-exports everything
│   ├── types/
│   │   ├── core.ts           # Asset, InstrumentType, CollateralConfig, HealthFactor
│   │   ├── lending.ts        # LendingPool, LendingPosition, BorrowPosition, CollateralPosition
│   │   ├── secLending.ts     # SecLendingOffer, SecLendingDeal, CorporateAction
│   │   ├── credit.ts         # CreditProfile, CreditTier, CreditTierAttestation
│   │   ├── liquidation.ts    # LiquidationTrigger, LiquidationResult, LiquidationTier
│   │   ├── oracle.ts         # PriceFeed, AggregatedPriceFeed
│   │   ├── token.ts          # DualToken, StakingPosition
│   │   ├── governance.ts     # Proposal, Vote
│   │   └── protocol.ts       # ProtocolConfig
│   ├── api/
│   │   ├── requests.ts       # All API request types (from API_CONTRACT.md)
│   │   ├── responses.ts      # All API response types
│   │   └── ws.ts             # WebSocket message types
│   └── utils/
│       ├── format.ts         # formatCurrency, formatPercent, formatAddress, formatDate
│       ├── math.ts           # calculateAPY, calculateHealthFactor, calculateUtilization
│       └── constants.ts      # CREDIT_TIER_THRESHOLDS, LIQUIDATION_THRESHOLDS, etc.
├── package.json
└── tsconfig.json

All types should be exported. Use Decimal.js string representation for financial numbers.
Include JSDoc comments on every type and field.
```

### Step 0.3 — Shared Config Package

```
In packages/config/, create shared configurations:

packages/config/
├── tsconfig/
│   ├── base.json           # Strict TS config
│   ├── nextjs.json         # Extends base for Next.js
│   └── node.json           # Extends base for Node.js backend
├── eslint/
│   ├── base.js             # Shared ESLint rules
│   ├── nextjs.js           # Next.js specific
│   └── node.js             # Node.js specific
└── package.json

TypeScript: strict mode, exactOptionalPropertyTypes, noUncheckedIndexedAccess.
ESLint: extend @typescript-eslint/recommended, import/order, no-console (warn).
```

---

## Phase 1: Frontend Foundation (Steps 4-10)

### Step 1.1 — Next.js Setup + Design Tokens

```
Initialize packages/frontend/ as a Next.js 14 project with App Router.

Install these exact dependencies:
- next, react, react-dom
- tailwindcss, postcss, autoprefixer
- clsx, tailwind-merge
- @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-tooltip,
  @radix-ui/react-tabs, @radix-ui/react-toast, @radix-ui/react-slider, @radix-ui/react-toggle
- lucide-react
- framer-motion
- zustand

Create tailwind.config.ts that imports ALL design tokens from DESIGN_TOKENS.json.
Map every color, spacing value, font, radius, shadow, and breakpoint from the JSON
into the Tailwind theme.extend config.

Create src/styles/globals.css with:
- CSS custom properties matching DESIGN_TOKENS.json
- CSS reset (box-sizing, margin reset, etc.)
- Font face declarations for Inter Variable and JetBrains Mono Variable
- Dark mode as default, [data-theme="light"] overrides
- Animation keyframes: shimmer, pulse-danger, fade-in, slide-up, draw-line

Create src/lib/utils/cn.ts — the clsx + tailwind-merge helper.

Download and place font files in public/fonts/:
- Inter-Variable.woff2 (Latin + Turkish subset)
- JetBrainsMono-Variable.woff2 (Latin subset)

Set up root layout (src/app/layout.tsx) with:
- Font loading via next/font/local
- ThemeProvider (dark/light)
- Metadata (title: "Dualis Finance", description, og:image)
```

### Step 1.2 — UI Primitives (Atoms)

```
Create the base UI component library in packages/frontend/src/components/ui/.
Build these components using Radix UI primitives + Tailwind styling.
Follow the exact specifications from the Complete Production Spec Section 2.2.

Components to build (in this order):

1. Button.tsx — variants: primary/secondary/ghost/danger/success,
   sizes: sm/md/lg/xl, loading state with spinner, icon support.
   Use the exact color specs from the design system.

2. Badge.tsx — variants: default/success/warning/danger/info/outline,
   sizes: sm/md. Pill shape (rounded-full).

3. Card.tsx — variants: default/elevated/outlined/glass,
   padding: none/sm/md/lg, hoverable and clickable options.

4. Input.tsx — text input with label, error state, icon left/right,
   disabled state. Uses surface-input bg, border-default, focus ring accent-teal.

5. Skeleton.tsx — loading placeholder with shimmer animation.
   Variants: text (multiple lines), circle, rect (custom dimensions).

6. Spinner.tsx — SVG spinner, sizes: sm(16)/md(20)/lg(24)/xl(32).
   Uses currentColor for theming.

7. Tooltip.tsx — Wraps Radix Tooltip. Dark bg, white text, 8px radius, arrow.

8. Dialog.tsx — Wraps Radix Dialog. Glass morphism overlay, centered content,
   close button, focus trap. Framer motion enter/exit.

9. Dropdown.tsx — Wraps Radix DropdownMenu. Consistent with card styling.

10. Tabs.tsx — Wraps Radix Tabs. Underline variant (default), pill variant.

11. Toast.tsx — Wraps Radix Toast. Slides from right, auto-dismiss,
    variants: success/error/warning/info. Action button optional.

12. Toggle.tsx — Wraps Radix Toggle. Used for theme switch etc.

13. Slider.tsx — Wraps Radix Slider. Teal track, used for collateral amounts.

14. Table.tsx — This is the most complex one. Build a composable table with:
    - Sortable columns (click header to sort)
    - Sticky header on scroll
    - Row hover highlight
    - Keyboard navigation (arrow keys)
    - Loading state (Skeleton rows)
    - Empty state slot
    - Compact mode toggle
    - Number cells auto-formatted with mono font, right-aligned
    - Positive/negative coloring for numbers

Every component must:
- Accept className prop for overrides
- Use cn() utility for class merging
- Have proper TypeScript types
- Use forwardRef where appropriate
- Support dark and light themes via CSS variables
```

### Step 1.3 — Financial Data Display Components

```
Create packages/frontend/src/components/data-display/ with these components.
These are Dualis-specific, not generic UI. Reference the spec Section 2.2 for details.

1. KPICard.tsx
   - Props: label, value (animated with CountUp), trend (up/down/flat),
     trendValue, sparkline data, icon, size (sm/md/lg), loading
   - Layout: icon+label top, large mono number center, trend badge + sparkline bottom
   - CountUp: animate from 0 to value on mount, animate between values on update
   - Sparkline: thin teal line, 48px tall, no axes

2. HealthFactorGauge.tsx
   - SVG semi-circular gauge (180° arc)
   - Color zones: >2.0 green, 1.5-2.0 yellow-green, 1.0-1.5 orange, <1.0 red
   - Center: large mono number
   - Below: status label (Safe/Caution/At Risk/Liquidatable)
   - Animated arc draw on mount (600ms)
   - Pulsing red glow when <1.0
   - Sizes: sm(80px)/md(140px)/lg(200px)

3. APYDisplay.tsx — Formatted APY with source badge (e.g., "8.24% • Chainlink")

4. AssetIcon.tsx — Token icon resolver. Maps symbol → icon.
   Fallback: first letter in colored circle. Sizes: sm/md/lg.

5. CreditTierBadge.tsx
   - Tier-specific styling (Diamond=icy blue, Gold=warm, Silver=cool, Bronze=earthy, Unrated=gray)
   - Sizes: sm (icon only), md (icon + name), lg (icon + name + score)

6. PriceChange.tsx — "+3.2%" green or "-1.5%" red, with arrow icon

7. CountUp.tsx (hook: useCountUp.ts)
   - Custom hook that animates a number from start to end
   - Uses requestAnimationFrame
   - Duration configurable (default 1200ms)
   - Easing: ease-out
   - Formats number during animation (commas, decimals)

8. SparklineChart.tsx
   - SVG line chart, minimal (no axes, no labels)
   - Props: data (number[]), width, height, color, animated
   - Smooth curve (catmull-rom or similar)
   - Optional area fill with gradient

9. UtilizationBar.tsx
   - Horizontal bar showing pool utilization %
   - Gradient: teal (0%) → yellow (70%) → red (100%)
   - Label inside or outside based on fill amount

10. TokenAmount.tsx
    - Shows: "1,234.56 USDC" with icon, plus "$1,234.56" in secondary text
    - Mono font for numbers, proper formatting
```

### Step 1.4 — Chart Components

```
Install recharts and d3. Create packages/frontend/src/components/charts/:

1. AreaChart.tsx
   - Recharts AreaChart wrapper with Dualis styling
   - Teal gradient fill (15% opacity), teal stroke (2px)
   - Crosshair tooltip on hover (dark bg, formatted values)
   - Time range tabs: 7d/30d/90d/1y/ALL
   - Responsive (ResponsiveContainer)
   - Loading: skeleton placeholder
   - Grid lines: subtle (border-subtle color)

2. InterestRateChart.tsx
   - Shows the utilization → interest rate curve
   - X axis: Utilization (0-100%), Y axis: Interest Rate
   - Current position: highlighted dot on curve
   - Kink point: dotted vertical line
   - Two curves: supply rate (teal) and borrow rate (indigo)

3. DonutChart.tsx
   - Portfolio composition (SVG donut, not Recharts)
   - Animated draw on mount
   - Center: total value
   - Legend with color dots + asset names + percentages
   - Hover: segment expands slightly

4. HistogramChart.tsx
   - Health factor distribution
   - Vertical bars, color-coded by risk zone
   - Used on risk monitoring dashboard

5. ChartTooltip.tsx
   - Shared custom tooltip for all Recharts charts
   - Dark bg, rounded, consistent formatting
   - Shows date + all series values
```

### Step 1.5 — Layout Components

```
Create packages/frontend/src/components/layout/:

1. Sidebar.tsx
   - Fixed 260px width, full height
   - Dualis logo at top (link to dashboard)
   - Navigation items with icons (Lucide):
     Dashboard, Markets, Borrow, Sec Lending, Credit Score,
     Governance, Staking, Portfolio
   - Active item: teal left border + bg tint
   - Divider
   - Settings, Docs, Support links
   - Version number + network badge (Canton MainNet 🟢) at bottom
   - Collapsible on tablet (icon-only mode, 72px)

2. Topbar.tsx
   - Fixed 64px height
   - Left: breadcrumb or page title
   - Right: ⌘K search button, notification bell (with count badge),
     theme toggle (🌙/☀️), wallet connect button/dropdown
   - Sticky top

3. CommandPalette.tsx
   - Install cmdk. Trigger: ⌘K / Ctrl+K
   - Glass morphism overlay
   - 640px wide, max 480px tall, centered
   - Search input (56px, large text, auto-focus)
   - Result groups: Search, Quick Actions, Markets, Positions, Settings
   - Recent actions when empty
   - Arrow key navigation, Enter to execute, Esc to close
   - Fuse.js for fuzzy search

4. NotificationPanel.tsx
   - Slide-in from right (320px wide)
   - Triggered by bell icon
   - Categories: All, Positions, Lending, Governance
   - Each notification: icon, title, description, timestamp, read/unread
   - Mark all as read button

5. RightPanel.tsx
   - Slide-in from right (360px wide)
   - Used for position details, transaction review
   - Header with title + close button
   - Scrollable content area
   - Framer motion slide animation

6. MobileNav.tsx
   - Bottom tab bar, visible only on mobile (<768px)
   - 5 tabs: Dashboard, Markets, Borrow, SecLending, More
   - Active tab: teal icon + label
   - Safe area padding for notched phones
```

### Step 1.6 — Wallet Components (PartyLayer)

```
Create packages/frontend/src/components/wallet/:

1. ConnectButton.tsx
   - Not connected: "Connect Wallet" button (primary variant)
   - Connected: shows truncated address + wallet icon, clicks opens dropdown
   - Loading state during connection

2. WalletDropdown.tsx
   - Shows: wallet icon, full address (copyable), party ID, network
   - Actions: Copy address, View on explorer, Disconnect
   - Credit tier badge if available

3. WalletAvatar.tsx
   - Gradient-based avatar generated from party ID
   - Sizes: sm(24px)/md(32px)/lg(40px)

4. PartyIdDisplay.tsx
   - Truncated party ID with copy button
   - Tooltip shows full ID
   - Mono font

5. TransactionToast.tsx
   - Pending: "Transaction submitted" with spinner
   - Success: "Transaction confirmed" with check, confetti trigger
   - Error: "Transaction failed" with retry button
   - Link to transaction on Canton explorer

Also create the PartyLayer hook:
src/hooks/usePartyLayer.ts
- connect(walletType) → returns partyId + adapter
- disconnect()
- signTransaction(command) → submits to Canton
- cip56Transfer(params) → CIP-56 token transfer
- isConnected, isConnecting, party, wallet state

And the wallet store:
src/stores/useWalletStore.ts (Zustand)
- party, wallet, isConnected, isConnecting
- connect(), disconnect() actions
- Persist wallet type to localStorage for auto-reconnect
```

### Step 1.7 — Zustand Stores

```
Create all Zustand stores in packages/frontend/src/stores/:

1. useWalletStore.ts — (already in Step 1.6)

2. useProtocolStore.ts
   - protocolConfig (from ProtocolConfig contract)
   - pools (LendingPool[])
   - isLoading, error
   - fetchConfig(), fetchPools() actions
   - Auto-refresh on WebSocket pool events

3. usePositionStore.ts
   - supplyPositions, borrowPositions, secLendingDeals
   - isLoading, error
   - fetchPositions(partyId) action
   - Computed: totalSuppliedUSD, totalBorrowedUSD, netWorthUSD

4. usePriceStore.ts
   - prices: Record<string, { price: number, timestamp: number }>
   - updatePrice(asset, price, timestamp)
   - getPrice(asset) → number
   - Updated via WebSocket price channel

5. useNotificationStore.ts
   - notifications: Notification[]
   - unreadCount: number
   - addNotification(), markAsRead(), markAllAsRead(), clearAll()

6. useUIStore.ts
   - sidebarCollapsed: boolean
   - rightPanelOpen: boolean
   - rightPanelContent: React.ReactNode | null
   - commandPaletteOpen: boolean
   - theme: 'dark' | 'light'
   - toggleSidebar(), openRightPanel(), toggleTheme() etc.
```

---

## Phase 2: Frontend Pages (Steps 11-18)

### Step 2.1 — Dashboard Shell Layout

```
Create the authenticated dashboard layout at:
src/app/(dashboard)/layout.tsx

This wraps all dashboard pages with:
- Sidebar (left)
- Topbar (top)
- Main content area (scrollable)
- RightPanel (conditional, right)
- CommandPalette (global, triggered by ⌘K)
- NotificationPanel (conditional, right)
- ToastProvider (global)

Use CSS Grid as specified in the design system:
- grid-template-columns: 260px 1fr (or 260px 1fr 360px with panel)
- grid-template-rows: 64px 1fr
- height: 100vh, overflow: hidden
- Sidebar and main scroll independently

Also set up:
- Keyboard shortcut listener (useKeyboardShortcuts hook)
- WebSocket connection (auto-connect when wallet connected)
- Price feed subscription
- Notification polling
```

### Step 2.2 — Dashboard Overview Page

```
Create src/app/(dashboard)/page.tsx — the main dashboard.

Layout (from spec Section 3.2):
1. Welcome message with truncated address
2. KPI Grid (6 cards, 3x2 on desktop):
   - Net Worth (with 7d sparkline and trend)
   - Total Supplied (with sparkline)
   - Health Factor (gauge, not card)
   - Total Borrowed
   - Earned (24h)
   - Credit Tier (badge)
3. Your Positions section:
   - Supply Positions table (Asset, Amount, APY, Status)
   - Borrow Positions table (Asset, Amount, Health Factor, Status)
   - Sec Lending Deals table (Security, Role, Fee, Status)
   - Each table: click row → open RightPanel with details
4. Portfolio Composition:
   - DonutChart + Asset breakdown table side by side

Data fetching:
- Use SWR hooks that hit our API
- WebSocket for real-time price/HF updates
- Skeleton loading states for all sections
- Empty states when no positions
```

### Step 2.3 — Markets Page

```
Create src/app/(dashboard)/markets/page.tsx

Layout (from spec Section 3.3):
1. Page title "Markets" with filter button and flash loan button
2. Filter bar: Asset Type dropdown, Min APY, Sort By
3. Markets Table (the Bloomberg-grade table):
   Columns: Asset (icon+name+type), Total Supply (USD), Supply APY (with sparkline),
   Total Borrow, Borrow APY, Utilization (bar), Oracle Price, Actions
4. Supply/Borrow action buttons appear on row hover
5. Clicking a row navigates to /dashboard/markets/[poolId]

Use the Table component built in Step 1.2.
Fetch pool data from GET /v1/pools with query params.
```

### Step 2.4 — Pool Detail Page

```
Create src/app/(dashboard)/markets/[poolId]/page.tsx

Layout (from spec Section 3.4):
1. Breadcrumb: Markets / USDC Pool
2. Two cards side by side:
   - Pool Overview (Total Supply, Borrow, Available, Utilization, Oracle)
   - Your Position (Supplied, Earned, APY, Deposit/Withdraw buttons)
3. Interactive AreaChart with tab toggle (Supply APY / Borrow APY / Utilization / TVL)
   - Time range selector: 7d/30d/90d/1y/ALL
   - Crosshair tooltip
4. Two cards side by side:
   - Interest Rate Model (curve chart showing current position)
   - Collateral Parameters (Max LTV, Liq Threshold, Penalty, Borrow Cap)
5. Recent Activity event log table

Deposit/Withdraw buttons open modal dialogs.
```

### Step 2.5 — Borrow Flow Page

```
Create src/app/(dashboard)/borrow/page.tsx

1. Your Borrow Positions table
   - Asset, Principal, Current Debt, Health Factor, Credit Tier, Actions
   - HF column uses color coding (green/yellow/red)
   - Actions: Repay, Add Collateral

2. New Borrow section:
   - Select asset to borrow (dropdown)
   - Enter amount (with max available display)
   - Select collateral (multi-select from deposited assets)
   - Health Factor Simulator:
     Interactive slider that shows projected HF as you change amount
     Real-time calculation using oracle prices
   - Credit tier indicator (shows your tier and how it affects rates)
   - Summary: Borrow APY, LTV, Liquidation price
   - "Review Borrow" button → TransactionReview modal

Create src/app/(dashboard)/borrow/[positionId]/page.tsx
   - Full position detail with history chart
   - Repay flow
   - Add collateral flow
   - Liquidation risk visualization
```

### Step 2.6 — Credit Score Page

```
Create src/app/(dashboard)/credit/page.tsx

Layout (from spec Section 3.5):
1. Score Ring (SVG donut, 200px, animated draw)
   - Center: large score number with CountUp
   - Tier badge next to ring
   - Progress to next tier (bar with %)

2. Score Breakdown (5 horizontal bars):
   - Loan Completion (x/300)
   - Repayment Speed (x/250)
   - Volume History (x/200)
   - Collateral Health (x/150)
   - Securities Lending (x/100)
   - Each bar animates on mount with stagger

3. Tier Benefits Comparison Table:
   - 5 columns (Diamond through Unrated)
   - Rows: Min Collateral, Max LTV, Rate Discount
   - Current tier column highlighted

4. Credit History Line Chart (12 months)
   - Score over time
   - Milestone markers
```

### Step 2.7 — Securities Lending Marketplace

```
Create src/app/(dashboard)/sec-lending/page.tsx

1. Tabs: Available Offers | My Deals | My Offers
2. Filter bar: Asset Type, Fee Range, Duration, Sort
3. Offers table with Accept button
4. Active Deals table with status timeline
5. "New Offer" button → Create offer multi-step form

Create sub-pages:
- sec-lending/offers/new/page.tsx — Multi-step offer creation wizard
- sec-lending/deals/[dealId]/page.tsx — Deal detail with timeline
```

### Step 2.8 — Governance + Staking + Portfolio + Settings

```
Create remaining pages:

src/app/(dashboard)/governance/page.tsx
- Active proposals list (card format)
- Each card: title, proposer, vote tally bar (for/against), time remaining
- Click → proposal detail with vote panel

src/app/(dashboard)/governance/[proposalId]/page.tsx
- Full proposal description
- Vote panel (For/Against/Abstain buttons)
- Voting power display
- Vote distribution chart
- Timeline (Created → Voting → Execution)

src/app/(dashboard)/staking/page.tsx
- DUAL staking interface
- Your stake amount, earned rewards
- Stake/Unstake flow
- APY display
- Safety Module info

src/app/(dashboard)/portfolio/page.tsx
- Comprehensive portfolio view
- All positions across lending, borrowing, sec lending
- P&L over time chart
- Asset allocation donut
- Transaction history table (filterable)

src/app/(dashboard)/settings/page.tsx
- Theme preference (dark/light/system)
- Notification preferences (health factor threshold, email alerts)
- Connected wallet info
- API key management (institutional)
- Language preference (placeholder for i18n)
```

---

## Phase 3: Landing Page (Step 19)

### Step 3.1 — Marketing Landing Page

```
Create src/app/page.tsx — the public landing page.

Install Three.js for the hero 3D element.
Follow the layout from spec Section 3.1:

1. Navigation bar: Logo, Markets, Docs, Connect Wallet button
2. Hero: Large headline + subtitle + CTA buttons + live protocol metrics
   - 3D particle network background (Three.js, teal nodes/connections)
   - Falls back to static SVG on mobile
   - CountUp on protocol stats
3. Partners bar: Grayscale logos, color on hover
4. Feature grid: 3 glass cards with custom icons
5. How It Works: 4-step horizontal timeline
6. Live Protocol Stats: AreaChart + Top Markets sidebar
7. Security & Audits: badge row
8. CTA section
9. Footer

Use framer-motion for scroll-triggered animations (fade-in from bottom).
Make it fully responsive.
Performance: lazy load Three.js, preload fonts, optimize LCP.
```

---

## Phase 4: Backend (Steps 20-28)

### Step 4.1 — Fastify Server Setup

```
Initialize packages/api/ as a Fastify TypeScript project.

Install: fastify, @fastify/cors, @fastify/helmet, @fastify/rate-limit,
@fastify/websocket, @fastify/compress, drizzle-orm, postgres, ioredis,
bullmq, zod, pino, axios, @grpc/grpc-js, jsonwebtoken, p-retry,
opossum, prom-client, @sentry/node, nanoid, decimal.js

Create the server bootstrap (src/index.ts) exactly as specified in
the Complete Production Spec Section 5.2. Include:
- Helmet security headers
- CORS configuration
- Rate limiting (Redis-backed)
- Compression
- WebSocket support
- Graceful shutdown
- Error handler

Create the env config (src/config/env.ts) with Zod validation
exactly as in the spec Section 5.3.
```

### Step 4.2 — Database Setup

```
Create the database layer in packages/api/src/db/:

1. schema.ts — All tables from spec Section 8.1:
   poolSnapshots, priceHistory, userActivity, creditScoreCache,
   liquidationEvents, secLendingHistory, governanceProposals,
   protocolAnalytics, notificationPreferences, apiKeys

2. client.ts — Drizzle ORM client with connection pooling

3. migrations/ — Generate initial migration from schema

4. seed.ts — Test data seeder:
   - 6 pools (USDC, wBTC, CC, T-BILL-2026, SPY-2026, ETH)
   - 30 days of snapshot history per pool
   - 10 sample users with positions
   - Price history
   - Sample liquidation events
   - Sample sec lending deals
```

### Step 4.3 — Canton Client

```
Create packages/api/src/canton/:

1. client.ts — Canton JSON API v2 client (from spec Section 7.1)
   - Singleton pattern
   - queryContracts(templateId, query)
   - queryContractByKey(templateId, key)
   - exerciseChoice(templateId, contractId/key, choice, argument)
   - createContract(templateId, payload)
   - Axios-based, with interceptors for logging
   - Retry with exponential backoff (3 attempts)

2. grpc.client.ts — Canton gRPC Ledger API client
   - Transaction stream subscription
   - Used by automation bots

3. commands.ts — Daml command builder functions
   - buildDepositCommand(poolId, lender, amount)
   - buildWithdrawCommand(positionId, shares)
   - buildBorrowCommand(...)
   - buildRepayCommand(...)
   - etc.

4. queries.ts — Common ACS query patterns
   - getAllPools()
   - getPoolByKey(poolId)
   - getUserPositions(partyId)
   - getActiveBorrows(partyId)
   - etc.

5. types.ts — Canton API type definitions
```

### Step 4.4 — Cache Layer

```
Create packages/api/src/cache/:

1. redis.ts — ioredis client with connection config

2. priceCache.ts
   - getPrice(asset) → number
   - setPrice(asset, price, timestamp)
   - TTL: 5 seconds
   - Fallback: fetch from Canton if cache miss

3. poolCache.ts
   - get(key), set(key, data, ttl), invalidatePool(poolId)
   - Pool list cache: 5s TTL
   - Pool detail cache: 10s TTL

4. sessionCache.ts
   - Session data for authenticated users
   - TTL: 24 hours
```

### Step 4.5 — API Routes (All Endpoints)

```
Create all route files in packages/api/src/routes/.
Reference API_CONTRACT.md for exact request/response schemas.

In this order:
1. health.ts — GET /health, /ready, /live
2. pools.routes.ts — Full implementation from spec Section 5.4
3. borrow.routes.ts — Request, positions list, repay, add collateral
4. secLending.routes.ts — Offers CRUD, accept, deals, recall, return
5. credit.routes.ts — Score, history
6. oracle.routes.ts — Prices list, specific asset
7. governance.routes.ts — Proposals CRUD, vote
8. flashLoan.routes.ts — Execute flash loan
9. admin.routes.ts — Protocol config, emergency pause (operator only)

Each route file:
- Zod request validation
- Auth middleware (where required)
- Delegates to service layer
- Consistent response format: { data, pagination?, transaction? }
```

### Step 4.6 — Service Layer

```
Create all services in packages/api/src/services/.
These contain the business logic. Reference the Complete Production Spec
Section 5.5 for the PoolService example. Apply the same pattern to:

1. pool.service.ts — (already detailed in spec)
2. borrow.service.ts — Borrow flow: validate credit tier → check collateral →
   submit command → record activity → invalidate caches
3. secLending.service.ts — Offer/deal lifecycle management
4. credit.service.ts — Score calculation, tier attestation
5. oracle.service.ts — Price aggregation, staleness detection
6. liquidation.service.ts — Health factor monitoring, trigger creation
7. governance.service.ts — Proposal management, vote tallying
8. flashLoan.service.ts — Flash loan validation and execution
9. notification.service.ts — Push to WebSocket, email, Telegram
10. analytics.service.ts — Protocol-wide metrics aggregation
```

### Step 4.7 — Middleware

```
Create all middleware in packages/api/src/middleware/:

1. auth.middleware.ts — JWT validation (from spec Section 6.1)
2. mtls.middleware.ts — mTLS for institutional (client cert validation)
3. rateLimit.middleware.ts — Tier-based rate limiting
4. validate.middleware.ts — Zod schema validation (from spec Section 6.3)
5. errorHandler.middleware.ts — Global error handler, structured error response
6. logging.middleware.ts — Request/response logging with Pino
7. metrics.middleware.ts — Prometheus metrics collection per endpoint
```

### Step 4.8 — WebSocket Server

```
Create packages/api/src/ws/:

1. server.ts — WebSocket server (from spec Section 10.1)
   - Auth-required (5s timeout)
   - Channel subscription model
   - Ping/pong keepalive

2. channels.ts — Channel manager
   - subscribe(channel, socket)
   - unsubscribe(channel, socket)
   - broadcast(channel, message)
   - removeSocket(socket) — cleanup on disconnect

3. handlers.ts — Message type handlers
4. broadcast.ts — Event broadcasting to channels

Channels: prices:*, pool:*, position:*, liquidations,
sec-lending:offers, sec-lending:deal:*, governance:votes, notifications:*
```

### Step 4.9 — Background Jobs

```
Create packages/api/src/jobs/:

1. scheduler.ts — BullMQ scheduler setup

2. interestAccrual.job.ts
   - Runs every 5 minutes
   - Calls AccrueInterest on each active pool

3. oracleUpdate.job.ts
   - Runs every 30 seconds
   - Fetches prices from Chainlink
   - Updates PriceFeed contracts
   - Broadcasts to WebSocket price channels
   - Records to priceHistory table

4. healthCheck.job.ts
   - Runs every 30 seconds
   - Fetches all active BorrowPositions
   - Calculates health factors
   - If HF < 1.0: creates LiquidationTrigger
   - If HF < 1.2: sends notification to borrower
   - Broadcasts to WebSocket position channels

5. creditRecalc.job.ts
   - Triggered on-demand (after repayment, liquidation)
   - Daily batch recalculation for all users
   - Updates creditScoreCache table

6. analytics.job.ts
   - Runs every 15 minutes
   - Aggregates protocol-wide metrics
   - Writes to protocolAnalytics table

7. cleanup.job.ts
   - Runs daily at 3 AM UTC
   - Prunes old pool snapshots (>90 days → daily rollup)
   - Cleans expired sessions
```

---

## Phase 5: Integration & Polish (Steps 29-33)

### Step 5.1 — Frontend ↔ Backend Integration

```
Connect the frontend to the backend API:

1. Create packages/frontend/src/lib/api/fetcher.ts
   - Axios instance with base URL from env
   - Auth header injection from wallet store
   - Error interceptor

2. Create packages/frontend/src/lib/api/endpoints.ts
   - All API endpoint constants

3. Create SWR/React Query hooks for each data type:
   - usePoolList(filters) — GET /v1/pools
   - usePoolDetail(poolId) — GET /v1/pools/:id
   - usePoolHistory(poolId, period) — GET /v1/pools/:id/history
   - useBorrowPositions() — GET /v1/borrow/positions
   - useSecLendingOffers(filters) — GET /v1/sec-lending/offers
   - useCreditScore() — GET /v1/credit/score
   - useOraclePrices() — GET /v1/oracle/prices
   - useGovernanceProposals() — GET /v1/governance/proposals

4. Create mutation hooks:
   - useDeposit(), useWithdraw(), useBorrow(), useRepay()
   - Each: optimistic update → API call → revalidate on success/error

5. Create WebSocket hook (src/hooks/useWebSocket.ts):
   - Auto-connect when wallet connected
   - Subscribe to relevant channels
   - Update Zustand stores on messages
   - Reconnect with exponential backoff
```

### Step 5.2 — Docker & Development Environment

```
Create Docker setup:

1. packages/api/Dockerfile — Multi-stage build (build + runtime)
2. packages/frontend/Dockerfile — Next.js standalone build
3. Root docker-compose.yml (from spec Section 15.1):
   - postgres, redis, canton-sandbox, api, frontend
4. deploy/canton/sandbox.conf — Canton sandbox configuration
5. deploy/docker/nginx.conf — Reverse proxy for production

Create development scripts in root package.json:
- "dev": Starts all services (turbo run dev)
- "dev:frontend": Frontend only
- "dev:api": API only
- "dev:db:migrate": Run DB migrations
- "dev:db:seed": Seed test data
- "dev:canton": Start Canton sandbox
```

### Step 5.3 — Testing Setup

```
Set up testing infrastructure:

Frontend (Vitest + Playwright):
1. Vitest config for unit tests (components, hooks, utils)
2. Playwright config for E2E tests
3. Write tests for:
   - All utility functions (format, math)
   - Critical components (HealthFactorGauge, KPICard, Table)
   - Key user flows (connect wallet, deposit, borrow)

Backend (Vitest + Testcontainers):
1. Vitest config for unit + integration tests
2. Testcontainers for PostgreSQL + Redis in tests
3. Write tests for:
   - All service methods
   - All middleware
   - API endpoints (integration)
   - Canton client (mocked)
```

### Step 5.4 — Monitoring Setup

```
Create monitoring configuration:

1. packages/api/src/middleware/metrics.middleware.ts
   - Prometheus metrics from spec Section 11.2
   - Custom business metrics + infra metrics

2. deploy/monitoring/
   - prometheus.yml — Scrape config
   - grafana/dashboards/ — 5 dashboard JSONs (from spec Section 11.4)
   - grafana/datasources.yml
   - alertmanager.yml — Alert routing (from spec Section 11.3)

3. Add to docker-compose.yml:
   - prometheus, grafana, alertmanager services

4. Sentry integration:
   - Frontend: @sentry/nextjs
   - Backend: @sentry/node
   - Error boundary component
```

### Step 5.5 — Performance & Accessibility Audit

```
Final optimization pass:

1. Lighthouse audit — target all Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
2. Bundle analysis — ensure <250KB initial JS gzipped
3. Verify all lazy loading (charts, modals, command palette)
4. WCAG 2.1 AA audit:
   - Color contrast check (all text 4.5:1+)
   - Keyboard navigation test (every interactive element)
   - Screen reader test (semantic HTML, ARIA labels)
   - Focus ring visibility
5. Responsive test: 375px, 768px, 1024px, 1440px, 1920px
6. Dark/light theme test
```

---

## Phase 6: Launch Prep (Steps 34-36)

### Step 6.1 — CI/CD Pipeline

```
Create .github/workflows/:

1. ci.yml (on push to any branch):
   - pnpm install
   - Typecheck (turbo typecheck)
   - Lint (turbo lint)
   - Unit tests (turbo test)
   - Build (turbo build)

2. staging.yml (on push to staging):
   - All CI steps
   - Build Docker images
   - Deploy to staging environment
   - Run E2E tests against staging

3. production.yml (on release tag):
   - All CI steps
   - Build production Docker images
   - Deploy to production
   - Smoke tests
   - Rollback on failure
```

### Step 6.2 — Documentation

```
Create comprehensive documentation:

1. README.md — Project overview, quick start, architecture diagram
2. docs/ARCHITECTURE.md — High-level architecture decisions
3. docs/DEVELOPMENT.md — Development setup, running locally, coding standards
4. docs/API.md — Generated from route schemas (or Swagger/OpenAPI)
5. docs/DEPLOYMENT.md — Deployment procedures, environment setup
6. packages/frontend/README.md — Component library docs (or Storybook)
```

### Step 6.3 — Final Checklist

```
Pre-launch verification:

[ ] All TypeScript strict mode — zero errors
[ ] All tests passing (unit + integration + E2E)
[ ] Lighthouse performance score > 90
[ ] WCAG 2.1 AA compliance verified
[ ] Security headers verified (helmet)
[ ] Rate limiting tested
[ ] WebSocket reconnection tested
[ ] Error handling verified (all error codes return correct responses)
[ ] Canton sandbox integration working end-to-end
[ ] Docker compose up → full stack running
[ ] Monitoring dashboards showing data
[ ] Alerting rules firing correctly
[ ] Documentation complete and accurate
[ ] .env.example has all required variables
[ ] No console.log() in production code
[ ] No hardcoded secrets anywhere
[ ] Bundle size within target (<250KB gzipped)
[ ] Responsive design verified on all breakpoints
[ ] Dark + light themes working
```

---

---

## Phase 4: Strategic Innovations

### Step 4.1: Credit Attestation System
- Off-chain attestation types (credit bureau, income, business, KYC)
- ZK-proof verification pipeline
- AttestationBundle Daml template
- Attestation service with CRUD + revocation
- API routes for attestation management

### Step 4.2: Composite Score Engine
- 3-layer score calculation (on-chain 400 + off-chain 350 + ecosystem 250)
- Tier derivation (Diamond/Gold/Silver/Bronze/Unrated)
- Tier-based lending parameters (LTV, rate discount, collateral ratio)
- Score simulation for hypothetical attestations
- CompositeCredit Daml template with RecalculateComposite choice

### Step 4.3: Productive Lending Framework
- 10 project categories with metadata
- Hybrid collateral model (crypto + project assets + TIFA)
- Cash flow repayment from project revenue
- IoT integration for production monitoring
- ESG-adjusted interest rates
- ProductiveProject, ProductiveBorrow, ProductiveLendingPool templates

### Step 4.4: Advanced Securities Lending
- Fractional offer splitting with minimum amounts
- Dynamic fee model (base + demand + duration + credit)
- Corporate action handling (dividends, coupons, splits)
- Bilateral netting agreements
- FractionalOffer, CorporateActionHandler, NettingAgreement templates

### Step 4.5: Institutional Track
- KYB verification workflow (Pending → InReview → Verified)
- Sub-account management
- API key lifecycle (create, list, revoke)
- Bulk operations (deposit, withdraw, borrow)
- Tiered fee schedules
- VerifiedInstitution, InstitutionalPool, BulkOperation templates

### Step 4.6: Privacy System
- 3-level privacy (Public, Selective, Maximum)
- Selective disclosure rules per party
- Data scope access control
- Privacy audit trail
- PrivacyConfig template with CheckAccess non-consuming choice

---

**Total estimated build time: 25-32 weeks (as per v1.0.0 roadmap)**
**With aggressive parallel development: 16-20 weeks**

*Each step above is designed to be completable in 1-3 Claude Code sessions.*
