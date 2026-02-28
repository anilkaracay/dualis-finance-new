import { Callout } from '@/components/docs/Callout';

export default function CCRewardsPage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="cc-rewards" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Canton Coin Rewards
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          How protocol participants earn Canton Coin through the app allocation program
        </p>
        <p>
          Canton Coin (CC) is the native utility token of the Canton Network. Dualis Finance
          participants earn CC rewards through the Canton Network&apos;s app allocation program,
          which distributes CC to applications and their users based on protocol activity and
          network contribution. This mechanism provides an additional incentive layer on top of
          the native DUAL token rewards, aligning Dualis participants with the broader Canton
          ecosystem.
        </p>
      </div>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        The Canton Network allocates CC to participating applications based on their contribution
        to network activity. Dualis Finance, as a deployed application on Canton, receives an app
        allocation of CC that is then distributed to protocol participants. The allocation is
        determined by several factors:
      </p>
      <ul>
        <li>
          <strong>Transaction volume</strong> -- The number and value of transactions generated
          by Dualis users on the Canton Network contributes to the protocol&apos;s share of the
          overall CC allocation.
        </li>
        <li>
          <strong>Active participants</strong> -- The number of unique parties interacting with
          Dualis contracts on Canton increases the protocol&apos;s allocation weight.
        </li>
        <li>
          <strong>TVL contribution</strong> -- Assets locked within Dualis lending pools
          represent economic activity on the Canton Network, which factors into allocation
          calculations.
        </li>
        <li>
          <strong>Network utility</strong> -- The diversity and complexity of DAML contract
          exercises originating from Dualis operations signal high-value network usage.
        </li>
      </ul>

      <Callout type="info" title="Network-Level Program">
        Canton Coin rewards are distributed by the Canton Network itself, not minted by Dualis.
        The protocol facilitates the distribution to its users but does not control the total
        allocation, which is determined by Canton&apos;s network-wide reward parameters.
      </Callout>

      <h2 id="supplier-rewards">Rewards for Suppliers</h2>
      <p>
        Suppliers who deposit assets into Dualis lending pools earn CC rewards proportional to
        their contribution to protocol TVL. The reward calculation considers both the size and
        duration of the supply position:
      </p>
      <ul>
        <li>
          <strong>Proportional share</strong> -- A supplier&apos;s CC reward is calculated as
          their share of the total pool TVL multiplied by the pool&apos;s CC allocation for
          that epoch.
        </li>
        <li>
          <strong>Time-weighted</strong> -- Rewards accumulate on a per-block basis. A supplier
          who deposits early in an epoch earns more CC than one who deposits late, reflecting
          the longer duration of their capital commitment.
        </li>
        <li>
          <strong>Multi-pool support</strong> -- Suppliers with positions across multiple pools
          earn CC from each pool independently. There is no cap on the number of pools from
          which a single address can earn rewards.
        </li>
      </ul>

      <h2 id="borrower-rewards">Rewards for Borrowers</h2>
      <p>
        Borrowers also earn CC rewards, which serve as a partial offset to their interest costs.
        Borrower rewards incentivize utilization, which is essential for generating supplier yield
        and protocol revenue. The borrower reward mechanism accounts for:
      </p>
      <ul>
        <li>
          <strong>Borrow balance</strong> -- Rewards are proportional to the outstanding borrow
          balance, encouraging sustained borrowing activity rather than short-term flash
          positions.
        </li>
        <li>
          <strong>Interest contribution</strong> -- Borrowers who generate more interest revenue
          for the protocol receive a proportionally larger share of CC rewards, aligning
          incentives between individual borrower activity and protocol health.
        </li>
        <li>
          <strong>Credit tier factor</strong> -- Higher-rated borrowers (Diamond, Gold) receive
          a modest CC reward boost, reflecting their lower default risk and positive contribution
          to pool solvency.
        </li>
      </ul>

      <Callout type="tip" title="Net Borrowing Cost">
        When evaluating borrowing costs on Dualis, consider the net effective rate: the nominal
        borrow APR minus the value of CC rewards earned. During periods of high CC allocation,
        the net borrowing cost can be significantly lower than the headline interest rate.
      </Callout>

      <h2 id="distribution-mechanics">Distribution Mechanics</h2>
      <p>
        CC rewards are distributed on an epoch basis. At the end of each epoch, the Canton Network
        calculates and allocates CC to the Dualis protocol contract. The protocol then distributes
        rewards to individual participants based on their recorded activity during that epoch.
      </p>
      <p>
        Key distribution parameters:
      </p>
      <ul>
        <li>
          <strong>Epoch length</strong> -- Reward epochs align with the Canton Network&apos;s
          epoch schedule. The current epoch duration is configurable by Canton governance.
        </li>
        <li>
          <strong>Claiming</strong> -- Accrued CC rewards can be claimed at any time after the
          epoch concludes. Unclaimed rewards do not expire and accumulate across epochs until
          claimed.
        </li>
        <li>
          <strong>Auto-compound option</strong> -- Users can opt to automatically re-supply
          claimed CC rewards into the CC lending pool, compounding their supply position and
          future CC reward earnings.
        </li>
      </ul>

      <h2 id="allocation-split">Allocation Split</h2>
      <p>
        The CC allocation received by Dualis is distributed across participant categories
        according to the following split:
      </p>
      <ul>
        <li>
          <strong>Suppliers: 50%</strong> -- The largest share goes to suppliers, reflecting
          their role as the foundation of protocol liquidity.
        </li>
        <li>
          <strong>Borrowers: 30%</strong> -- Borrowers receive a substantial share to
          incentivize utilization and offset interest costs.
        </li>
        <li>
          <strong>Liquidators: 10%</strong> -- Liquidators earn CC for maintaining protocol
          health by clearing unhealthy positions.
        </li>
        <li>
          <strong>Protocol reserve: 10%</strong> -- A portion of CC is retained by the protocol
          treasury to fund operational needs and future ecosystem initiatives.
        </li>
      </ul>

      <Callout type="info" title="Governance-Configurable">
        The allocation split between suppliers, borrowers, liquidators, and the protocol reserve
        is a governance-configurable parameter. It can be adjusted through a PARAMETER_CHANGE
        proposal to respond to changing market conditions and protocol priorities.
      </Callout>

      <h2 id="tracking">Tracking Your Rewards</h2>
      <p>
        The Dualis dashboard displays accrued CC rewards in real time. Users can view their
        pending rewards per pool, historical claim data, and projected earnings based on current
        activity levels. The rewards panel integrates with the connected wallet to provide a
        consolidated view of all CC positions -- including rewards earned through Dualis and CC
        held independently.
      </p>
    </>
  );
}
