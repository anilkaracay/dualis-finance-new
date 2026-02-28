/* ─── Docs Navigation Tree ─── */

export interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

export interface NavSection {
  label: string;
  icon: string;
  items: NavItem[];
}

export const DOCS_NAV: NavSection[] = [
  {
    label: 'Overview',
    icon: '◎',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Why Dualis Finance', href: '/docs/why-dualis' },
      { title: 'Core Concepts', href: '/docs/core-concepts' },
      { title: 'Glossary', href: '/docs/glossary' },
    ],
  },
  {
    label: 'Protocol',
    icon: '⬡',
    items: [
      { title: 'Architecture', href: '/docs/protocol/architecture' },
      { title: 'Hybrid Lending', href: '/docs/protocol/hybrid-lending' },
      { title: 'Collateral Framework', href: '/docs/protocol/collateral-framework' },
      { title: 'Interest Rate Model', href: '/docs/protocol/interest-rate-model' },
      { title: 'Liquidation Engine', href: '/docs/protocol/liquidation' },
      { title: 'Flash Loans', href: '/docs/protocol/flash-loans' },
      { title: 'Privacy Model', href: '/docs/protocol/privacy' },
    ],
  },
  {
    label: 'Securities Lending',
    icon: '⊞',
    items: [
      { title: 'Overview', href: '/docs/securities-lending/overview' },
      { title: 'Marketplace Mechanics', href: '/docs/securities-lending/mechanics' },
      { title: 'Fee Structure', href: '/docs/securities-lending/fees' },
      { title: 'Netting & Settlement', href: '/docs/securities-lending/netting' },
    ],
  },
  {
    label: 'Credit System',
    icon: '◆',
    items: [
      { title: 'Hybrid Credit Scoring', href: '/docs/credit/scoring' },
      { title: 'Credit Tiers', href: '/docs/credit/tiers' },
      { title: 'Under-Collateralized Lending', href: '/docs/credit/undercollateralized' },
      { title: 'Credit Oracle API', href: '/docs/credit/oracle-api' },
    ],
  },
  {
    label: 'Governance',
    icon: '⬢',
    items: [
      { title: 'DUAL Token', href: '/docs/governance/dual-token' },
      { title: 'Proposal System', href: '/docs/governance/proposals' },
      { title: 'Voting & Delegation', href: '/docs/governance/voting' },
      { title: 'Timelock & Execution', href: '/docs/governance/timelock' },
    ],
  },
  {
    label: 'Economics',
    icon: '◈',
    items: [
      { title: 'Fee Structure', href: '/docs/economics/fees' },
      { title: 'Revenue Model', href: '/docs/economics/revenue' },
      { title: 'Token Economics', href: '/docs/economics/tokenomics' },
      { title: 'Canton Coin Rewards', href: '/docs/economics/cc-rewards' },
    ],
  },
  {
    label: 'Canton Network',
    icon: '⊕',
    items: [
      { title: 'Why Canton', href: '/docs/canton/why-canton' },
      { title: 'Canton Ecosystem', href: '/docs/canton/ecosystem' },
      { title: 'DAML Smart Contracts', href: '/docs/canton/daml' },
      { title: 'Privacy Architecture', href: '/docs/canton/privacy' },
    ],
  },
  {
    label: 'Developers',
    icon: '⌘',
    items: [
      { title: 'Getting Started', href: '/docs/developers/getting-started' },
      { title: 'API Reference', href: '/docs/developers/api-reference' },
      { title: 'SDK Integration', href: '/docs/developers/sdk' },
      { title: 'PartyLayer (Wallet SDK)', href: '/docs/developers/partylayer' },
      { title: 'Smart Contract Reference', href: '/docs/developers/smart-contracts' },
      { title: 'WebSocket API', href: '/docs/developers/websocket' },
      { title: 'Error Codes', href: '/docs/developers/error-codes' },
    ],
  },
  {
    label: 'Security',
    icon: '⊘',
    items: [
      { title: 'Security Model', href: '/docs/security/model' },
      { title: 'Audit Status', href: '/docs/security/audits' },
      { title: 'KYC/AML Compliance', href: '/docs/security/kyc-aml' },
      { title: 'Bug Bounty', href: '/docs/security/bug-bounty' },
    ],
  },
  {
    label: 'Resources',
    icon: '⊡',
    items: [
      { title: 'FAQ', href: '/docs/resources/faq' },
      { title: 'Roadmap', href: '/docs/resources/roadmap' },
      { title: 'Brand Assets', href: '/docs/resources/brand' },
      { title: 'Contact', href: '/docs/resources/contact' },
    ],
  },
];

/** Flatten all nav items for prev/next navigation */
export function getFlatNav(): NavItem[] {
  return DOCS_NAV.flatMap((section) => section.items);
}

/** Get prev/next for a given path */
export function getPrevNext(path: string): { prev: NavItem | null; next: NavItem | null } {
  const flat = getFlatNav();
  const idx = flat.findIndex((item) => item.href === path);
  return {
    prev: idx > 0 ? flat[idx - 1] ?? null : null,
    next: idx < flat.length - 1 ? flat[idx + 1] ?? null : null,
  };
}

/** Find section label for a given path */
export function getSectionLabel(path: string): string | null {
  for (const section of DOCS_NAV) {
    if (section.items.some((item) => item.href === path)) {
      return section.label;
    }
  }
  return null;
}
