/* ─── Landing Page Content Constants ─── */

export const HERO = {
  eyebrow: 'Built on Canton Network',
  titleLine1: 'The Future of',
  titleLine2: 'Institutional DeFi',
  subtitle:
    'Hybrid credit scoring. Productive real-world lending. Advanced securities lending. Privacy by design. All on one protocol.',
  ctaPrimary: 'Launch Protocol',
  ctaSecondary: 'Read Documentation',
  trustLabel: 'Trusted by institutions processing',
  trustValue: '$6T+',
  trustSuffix: 'in tokenized assets daily',
} as const;

export const METRICS = [
  { label: 'Total Value Locked', value: 2_400_000_000, prefix: '$', suffix: 'B', display: '$2.4B' },
  { label: 'Active Institutions', value: 127, prefix: '', suffix: '', display: '127' },
  { label: 'Daily Volume', value: 890_000_000, prefix: '$', suffix: 'M', display: '$890M' },
  { label: 'Securities Processed', value: 14_200, prefix: '', suffix: '+', display: '14,200+' },
] as const;

export const MISSION = {
  label: 'THE PROTOCOL',
  statement:
    'Dualis Finance is the first protocol to combine institutional-grade privacy with real-world productive lending — creating a financial system where traditional and decentralized finance don\'t just coexist, they amplify each other.',
  highlightWords: ['institutional-grade privacy', 'real-world productive lending'],
  detail:
    'Built on the Canton Network\'s sub-transaction privacy model, Dualis bridges the gap between Wall Street compliance standards and DeFi\'s composable innovation. The result: a protocol where serious capital meets serious technology.',
} as const;

export interface InnovationData {
  id: string;
  icon: string;
  title: string;
  description: string;
  stat: string;
  tint: string;
  size: 'large' | 'medium';
}

export const INNOVATIONS: InnovationData[] = [
  {
    id: 'credit',
    icon: 'credit',
    title: 'Hybrid Credit Scoring',
    description:
      'Three-layer composite score combining on-chain history, off-chain credentials via ZK-proofs, and ecosystem reputation. 0–1000 scale, five tiers.',
    stat: '3 data layers · ZK-verified · 0-1000 scale',
    tint: 'teal',
    size: 'large',
  },
  {
    id: 'productive',
    icon: 'productive',
    title: 'Productive Real-World Lending',
    description:
      'DeFi liquidity financing solar farms, data centers, and infrastructure. Real cash flows, real collateral, real economic impact.',
    stat: '$2M+ per project · 8.5% APY · ESG-rated',
    tint: 'amber',
    size: 'large',
  },
  {
    id: 'seclending',
    icon: 'seclending',
    title: 'Next-Gen Securities Lending',
    description:
      'Fractional P2P lending, dynamic fees, automated netting. No prime broker, 90% fee reduction.',
    stat: '5% protocol fee vs 40% broker',
    tint: 'cyan',
    size: 'medium',
  },
  {
    id: 'institutional',
    icon: 'institutional',
    title: 'Dual-Track Architecture',
    description:
      'Separate KYB-verified institutional track with API access, bulk operations, custom fees. Retail track with instant wallet access.',
    stat: 'KYB verified · REST API · Bulk ops',
    tint: 'indigo',
    size: 'medium',
  },
  {
    id: 'privacy',
    icon: 'privacy',
    title: 'Privacy by Design',
    description:
      'Canton\'s sub-transaction privacy with three user-selectable levels. Each party sees only what they should.',
    stat: '3 levels · Selective disclosure · Audit trail',
    tint: 'violet',
    size: 'medium',
  },
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect Your Wallet',
    description:
      'Link via PartyLayer SDK. Institutional users complete KYB verification for enhanced access.',
  },
  {
    step: '02',
    title: 'Deploy Capital',
    description:
      'Choose your strategy: supply to lending pools, fund productive projects, or enter securities lending markets.',
  },
  {
    step: '03',
    title: 'Earn Real Returns',
    description:
      'Track your composite credit score growth, cashflow repayments, and portfolio performance in real-time.',
  },
] as const;

export const ECOSYSTEM = {
  label: 'THE NETWORK',
  title: 'Built on Canton. Powered by Institutions.',
  subtitle:
    'Canton Network processes $280B+ in daily US Treasury repo transactions. Dualis brings DeFi innovation to this institutional backbone.',
  stats: [
    { label: 'Tokenized Assets', value: '$6T+' },
    { label: 'Institutional Nodes', value: '600+' },
    { label: 'Daily Volume', value: '$280B+' },
  ],
  nodes: [
    { id: 'dualis', label: 'DUALIS', size: 'lg', x: 50, y: 50 },
    { id: 'canton', label: 'Canton Network', size: 'md', x: 50, y: 15 },
    { id: 'tifa', label: 'TIFA Finance', size: 'sm', x: 20, y: 30 },
    { id: 'partylayer', label: 'PartyLayer', size: 'sm', x: 80, y: 30 },
    { id: 'dtcc', label: 'DTCC', size: 'sm', x: 15, y: 65 },
    { id: 'goldman', label: 'Goldman Sachs', size: 'sm', x: 85, y: 65 },
    { id: 'sync', label: 'Global Sync', size: 'sm', x: 50, y: 85 },
  ],
} as const;

export const COMPARISON = {
  label: 'THE ADVANTAGE',
  title: 'See How We Compare',
  headers: ['Feature', 'Aave V3', 'Maple', 'EquiLend', 'Dualis'],
  rows: [
    { feature: 'Credit System', values: ['None', 'Basic', 'N/A', '3-Layer Hybrid'] },
    { feature: 'Productive Lending', values: ['—', '—', '—', 'Real-World'] },
    { feature: 'Securities Lending', values: ['—', '—', 'Trad.', 'P2P Fractional'] },
    { feature: 'Privacy Control', values: ['None', 'None', 'Basic', 'Canton Selective'] },
    { feature: 'Institutional Track', values: ['Limited', 'Basic', 'Yes', 'Full KYB + API'] },
    { feature: 'Fee Structure', values: ['~15%', '~20%', '~35%', '5%'] },
    { feature: 'Settlement', values: ['On-chain', 'Hours', 'T+2', 'Atomic'] },
  ],
} as const;

export const SECURITY_CARDS = [
  {
    title: 'Canton Privacy',
    description:
      'Sub-transaction level privacy. Each party sees only their portion. Mathematically guaranteed.',
    icon: 'lock',
  },
  {
    title: 'Daml Smart Contracts',
    description:
      'Formally verifiable contracts. The same technology powering $6T in institutional assets.',
    icon: 'code',
  },
  {
    title: 'Regulatory Ready',
    description:
      'Selective disclosure to regulators. Configurable audit trails. FATF Travel Rule compatible.',
    icon: 'scale',
  },
  {
    title: 'Battle-Tested',
    description:
      'Built on the same Canton ledger processing Goldman Sachs Digital Assets and DTCC settlements.',
    icon: 'shield',
  },
] as const;

export const DEV_SECTION = {
  label: 'FOR DEVELOPERS',
  title: 'Build the Next Generation',
  subtitle: 'Comprehensive SDKs, open APIs, and full Canton Daml documentation.',
  bullets: [
    'PartyLayer Wallet SDK',
    'REST + WebSocket API',
    'Daml contract templates',
    'Institutional API access',
  ],
  code: `import { DualisSDK } from '@dualis/sdk';

const dualis = new DualisSDK({
  network: 'canton-mainnet'
});

// Get composite credit score
const score = await dualis.credit.getCompositeScore();
console.log(score.tier);  // "Gold"
console.log(score.benefits.maxLTV);  // 0.78

// Fund a productive project
await dualis.productive.fund({
  projectId: 'solar-konya-001',
  amount: '500000',
  currency: 'USDC'
});`,
} as const;

export const FOOTER_LINKS = {
  protocol: [
    { label: 'Dashboard', href: '/overview' },
    { label: 'Markets', href: '/markets' },
    { label: 'Lending', href: '/borrow' },
    { label: 'Securities', href: '/sec-lending' },
    { label: 'Governance', href: '/governance' },
  ],
  developers: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'GitHub', href: '#' },
    { label: 'SDKs', href: '#' },
    { label: 'Status', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Legal', href: '#' },
  ],
} as const;

export const NAV_LINKS = [
  { label: 'Dashboard', href: '/overview' },
  { label: 'Protocol', href: '#innovations' },
  { label: 'Innovations', href: '#innovations' },
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'Developers', href: '#developers' },
] as const;

export const TRUST_PARTNERS = [
  { abbr: 'GS', name: 'Goldman Sachs' },
  { abbr: 'DTCC', name: 'DTCC' },
  { abbr: 'BNP', name: 'BNP Paribas' },
  { abbr: 'HSBC', name: 'HSBC' },
  { abbr: 'S&P', name: 'S&P Global' },
] as const;
