import { Callout } from '@/components/docs/Callout';

const ALLOCATIONS = [
  { category: 'Protocol Development', pct: '25%', tokens: '250,000,000', vesting: '4-year linear, 12-month cliff' },
  { category: 'Ecosystem Growth', pct: '20%', tokens: '200,000,000', vesting: '3-year linear, 6-month cliff' },
  { category: 'Community Rewards', pct: '25%', tokens: '250,000,000', vesting: 'Per-epoch, usage-based' },
  { category: 'Treasury', pct: '15%', tokens: '150,000,000', vesting: 'DAO-controlled' },
  { category: 'Investors', pct: '10%', tokens: '100,000,000', vesting: '2-year linear, 6-month cliff' },
  { category: 'Advisors', pct: '5%', tokens: '50,000,000', vesting: '2-year linear, 12-month cliff' },
];

const UTILITIES = [
  { utility: 'Governance Voting', description: 'Vote on protocol proposals including parameter changes, new pool creation, treasury spending, and protocol upgrades.' },
  { utility: 'Staking', description: 'Stake DUAL to earn a share of protocol revenue and boost voting power. Staked tokens are subject to a cooldown period upon unstaking.' },
  { utility: 'Fee Sharing', description: 'A portion of protocol revenue is distributed to DUAL stakers proportional to their staked balance.' },
  { utility: 'Proposal Creation', description: 'Hold at least 100 DUAL to create governance proposals and submit them for community voting.' },
  { utility: 'Credit Tier Discounts', description: 'DUAL stakers receive improved credit tier parameters, including reduced interest rate premiums and enhanced LTV ratios.' },
];

export default function DualTokenPage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="dual-token" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          DUAL Token
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          The governance and utility token powering the Dualis Finance protocol
        </p>
        <p>
          DUAL is the native governance token of Dualis Finance. It serves as the backbone of the
          protocol&apos;s decentralized decision-making process, aligning the incentives of participants,
          developers, and the broader community. Token holders can vote on protocol changes, stake
          to earn fee revenue, and participate in the long-term direction of the platform.
        </p>
      </div>

      <h2 id="token-utility">Token Utility</h2>
      <p>
        The DUAL token has been designed with multiple complementary functions that reinforce
        protocol security, participation, and alignment. Each utility creates a distinct reason
        for long-term token holding and active protocol participation.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Utility</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {UTILITIES.map((row) => (
              <tr key={row.utility}>
                <td><strong>{row.utility}</strong></td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="token-allocation">Token Allocation</h2>
      <p>
        The total supply of DUAL is fixed at <strong>1,000,000,000</strong> (one billion) tokens.
        There is no minting function and no inflationary mechanism. The supply is allocated across
        six categories, each with its own vesting schedule to ensure long-term alignment.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Allocation</th>
              <th>Tokens</th>
              <th>Vesting Schedule</th>
            </tr>
          </thead>
          <tbody>
            {ALLOCATIONS.map((row) => (
              <tr key={row.category}>
                <td><strong>{row.category}</strong></td>
                <td>{row.pct}</td>
                <td>{row.tokens}</td>
                <td>{row.vesting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info" title="Fixed Supply">
        The DUAL token has no mint function. The total supply of 1,000,000,000 tokens is immutable
        and cannot be increased through any governance action or protocol upgrade.
      </Callout>

      <h2 id="vesting-schedules">Vesting Schedules</h2>
      <p>
        Vesting ensures that long-term contributors and investors remain aligned with the
        protocol&apos;s success. Each allocation category follows a distinct schedule:
      </p>
      <ul>
        <li>
          <strong>Protocol Development (25%)</strong> -- Tokens vest linearly over 4 years with a
          12-month cliff. No tokens are released during the first year; after the cliff, tokens
          unlock on a per-block basis over the remaining 3 years.
        </li>
        <li>
          <strong>Ecosystem Growth (20%)</strong> -- A 3-year linear vesting schedule with a
          6-month cliff. These tokens fund grants, partnerships, liquidity programs, and
          integrations that expand the Dualis ecosystem.
        </li>
        <li>
          <strong>Community Rewards (25%)</strong> -- Distributed on a per-epoch basis according
          to protocol usage. Suppliers, borrowers, and liquidators earn DUAL proportional to their
          activity. There is no cliff; distribution begins at protocol launch.
        </li>
        <li>
          <strong>Treasury (15%)</strong> -- Fully controlled by the DAO through governance
          proposals. Treasury tokens can only be deployed through a governance vote that meets the
          25% quorum requirement for treasury spend proposals.
        </li>
        <li>
          <strong>Investors (10%)</strong> -- 2-year linear vesting with a 6-month cliff. Investor
          tokens are locked during the cliff period and then release proportionally each block.
        </li>
        <li>
          <strong>Advisors (5%)</strong> -- 2-year linear vesting with a 12-month cliff. Advisor
          allocations follow the same mechanism as investor tokens but with a longer cliff to
          incentivize sustained contributions.
        </li>
      </ul>

      <h2 id="staking">Staking Mechanics</h2>
      <p>
        DUAL holders can stake their tokens to earn a proportional share of protocol revenue and
        amplify their governance voting power. Staked DUAL accrues rewards from the protocol fee
        pool, which collects revenue from reserve factors, flash loan fees, and securities lending
        commissions.
      </p>
      <p>
        Unstaking requires a 7-day cooldown period during which tokens remain locked and continue
        earning rewards. After the cooldown completes, tokens can be withdrawn freely. This
        mechanism prevents short-term staking exploits around governance votes and revenue
        distribution events.
      </p>

      <Callout type="tip" title="Voting Power Boost">
        Staked DUAL carries a 1.5x voting power multiplier compared to unstaked tokens. This
        incentivizes long-term participation and ensures that governance decisions are driven by
        committed stakeholders.
      </Callout>

      <h2 id="fee-sharing">Fee Sharing</h2>
      <p>
        Protocol revenue is split between the treasury and DUAL stakers. A configurable percentage
        of all protocol fees -- currently set at 40% -- flows to the staking reward pool and is
        distributed proportionally to stakers based on their share of the total staked supply. The
        remaining 60% is directed to the protocol treasury for operational expenses, development
        funding, and ecosystem growth.
      </p>
      <p>
        Fee sharing rewards are denominated in the underlying fee token (for example, USDC from
        borrow reserve factors). Stakers can claim accumulated rewards at any time without
        affecting their staked position.
      </p>
    </>
  );
}
