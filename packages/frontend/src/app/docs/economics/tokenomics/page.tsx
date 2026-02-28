import { Callout } from '@/components/docs/Callout';

const ALLOCATIONS = [
  { category: 'Protocol Development', pct: '25%', tokens: '250,000,000', vesting: '4-year linear, 12-month cliff' },
  { category: 'Ecosystem Growth', pct: '20%', tokens: '200,000,000', vesting: '3-year linear, 6-month cliff' },
  { category: 'Community Rewards', pct: '25%', tokens: '250,000,000', vesting: 'Per-epoch, usage-based' },
  { category: 'Treasury', pct: '15%', tokens: '150,000,000', vesting: 'DAO-controlled' },
  { category: 'Investors', pct: '10%', tokens: '100,000,000', vesting: '2-year linear, 6-month cliff' },
  { category: 'Advisors', pct: '5%', tokens: '50,000,000', vesting: '2-year linear, 12-month cliff' },
];

const UTILITY_BREAKDOWN = [
  { function: 'Governance Voting', weight: 'Primary', description: 'Vote on all protocol proposals. Staked DUAL receives a 1.5x voting power multiplier.' },
  { function: 'Revenue Sharing', weight: 'Primary', description: 'Stakers receive 40% of protocol revenue proportional to their staked balance.' },
  { function: 'Proposal Creation', weight: 'Secondary', description: 'Minimum 100 DUAL required to submit governance proposals.' },
  { function: 'Credit Tier Boost', weight: 'Secondary', description: 'DUAL stakers receive enhanced credit tier parameters and rate discounts.' },
  { function: 'Fee Discounts', weight: 'Tertiary', description: 'Staking DUAL unlocks reduced fees on specific protocol operations.' },
];

export default function TokenomicsPage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="tokenomics" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Token Economics
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          DUAL token supply, allocation, staking, and value accrual mechanics
        </p>
        <p>
          The DUAL token economy is built around a fixed supply of 1,000,000,000 tokens with no
          minting capability. The tokenomics model emphasizes long-term alignment between protocol
          participants through vesting schedules, staking incentives, and revenue sharing. This
          page provides a comprehensive view of the token&apos;s economic design, from initial
          allocation through ongoing utility and value accrual.
        </p>
      </div>

      <h2 id="total-supply">Total Supply</h2>
      <p>
        The DUAL token has a fixed total supply of <strong>1,000,000,000</strong> (one billion)
        tokens. There is no minting function, no inflationary mechanism, and no ability to
        increase supply through any governance action. The entire supply is allocated at genesis
        according to the distribution table below.
      </p>

      <Callout type="info" title="Non-Inflationary Design">
        Unlike many DeFi governance tokens, DUAL has zero inflation. All rewards come from
        protocol revenue and the pre-allocated Community Rewards pool -- never from newly
        minted tokens.
      </Callout>

      <h2 id="allocation">Token Allocation</h2>
      <p>
        The token allocation is structured to balance the needs of protocol development, community
        growth, and long-term incentive alignment. Each category has been assigned a vesting
        schedule proportional to its time horizon.
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

      <h2 id="staking-mechanics">Staking Mechanics</h2>
      <p>
        DUAL staking is the primary mechanism for earning protocol revenue and amplifying
        governance influence. Stakers deposit DUAL into the staking contract and receive stkDUAL,
        a non-transferable receipt token that tracks their staked position and accrued rewards.
      </p>
      <ul>
        <li>
          <strong>Reward accrual</strong> -- Protocol revenue is distributed to the staking pool
          continuously. Rewards accrue per block based on the staker&apos;s proportional share of
          total staked supply.
        </li>
        <li>
          <strong>Cooldown period</strong> -- Unstaking requires initiating a 7-day cooldown. During
          this period, tokens remain staked and continue earning rewards. After the cooldown, tokens
          can be withdrawn within a 48-hour unstake window.
        </li>
        <li>
          <strong>Voting multiplier</strong> -- Staked DUAL carries a 1.5x voting power multiplier.
          A holder with 10,000 staked DUAL has the voting power equivalent of 15,000 unstaked tokens.
        </li>
        <li>
          <strong>Slashing protection</strong> -- There is no slashing mechanism in the current
          staking design. Staked tokens cannot be reduced or confiscated by the protocol under any
          circumstances.
        </li>
      </ul>

      <h2 id="token-utility">Token Utility Breakdown</h2>
      <p>
        The DUAL token serves multiple functions within the protocol ecosystem. These utilities
        create diverse demand drivers and reinforce the incentive to hold and stake tokens.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Function</th>
              <th>Priority</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {UTILITY_BREAKDOWN.map((row) => (
              <tr key={row.function}>
                <td><strong>{row.function}</strong></td>
                <td>{row.weight}</td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="value-accrual">Value Accrual</h2>
      <p>
        The DUAL token accrues value through three complementary mechanisms:
      </p>
      <ul>
        <li>
          <strong>Revenue sharing</strong> -- 40% of all protocol revenue is distributed to
          stakers, creating a direct link between protocol success and token value.
        </li>
        <li>
          <strong>Governance premium</strong> -- As the protocol manages larger TVL and more
          complex operations, the governance rights embedded in DUAL become increasingly valuable.
        </li>
        <li>
          <strong>Supply scarcity</strong> -- With a fixed supply and significant portions locked
          in vesting or staking, the circulating supply contracts over time, creating natural
          scarcity as demand for governance participation and fee sharing grows.
        </li>
      </ul>

      <Callout type="tip" title="Community Rewards">
        The 25% Community Rewards allocation (250,000,000 DUAL) is distributed per epoch based
        on protocol usage. Active suppliers, borrowers, and liquidators earn DUAL proportional to
        their contribution to protocol activity.
      </Callout>

      <h2 id="emission-schedule">Emission Schedule</h2>
      <p>
        The Community Rewards pool distributes tokens on a per-epoch basis with a declining
        emission curve. Early participants receive a proportionally larger share of rewards,
        incentivizing adoption during the protocol&apos;s growth phase. The emission rate is
        calibrated to distribute the full 250,000,000 DUAL allocation over approximately 5 years,
        with the first year accounting for roughly 40% of total emissions and subsequent years
        declining proportionally.
      </p>
      <p>
        The exact distribution per epoch is determined by a formula that accounts for total
        protocol TVL, utilization rates across active pools, and the number of unique participants.
        This dynamic approach ensures that rewards scale with genuine protocol usage rather than
        following a rigid, predetermined schedule.
      </p>
    </>
  );
}
