import { Callout } from '@/components/docs/Callout';

const QUORUM_TABLE = [
  { type: 'PARAMETER_CHANGE', quorum: '10%', rationale: 'Routine adjustments to existing parameters require moderate participation.' },
  { type: 'NEW_POOL', quorum: '15%', rationale: 'Adding new markets introduces risk and warrants broader consensus.' },
  { type: 'POOL_DEPRECATION', quorum: '20%', rationale: 'Removing a market affects active positions and requires strong community support.' },
  { type: 'TREASURY_SPEND', quorum: '25%', rationale: 'Deploying treasury funds demands the highest standard of community alignment.' },
  { type: 'EMERGENCY_ACTION', quorum: '5%', rationale: 'Time-critical safety measures must be executable with minimal quorum.' },
  { type: 'PROTOCOL_UPGRADE', quorum: '20%', rationale: 'Contract upgrades carry significant risk and require substantial participation.' },
];

export default function VotingPage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="voting" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Voting &amp; Delegation
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          How DUAL holders vote on proposals and delegate their voting power
        </p>
        <p>
          Dualis Finance uses a token-weighted voting system where each DUAL token represents one
          unit of voting power. Holders can vote directly on proposals or delegate their voting
          power to a trusted representative. The system supports three voting options -- For,
          Against, and Abstain -- and uses snapshot-based balance tracking to prevent manipulation.
        </p>
      </div>

      <h2 id="voting-options">Voting Options</h2>
      <p>
        When a proposal enters its Active phase, all eligible DUAL holders can cast their vote
        using one of three options:
      </p>
      <ul>
        <li>
          <strong>For</strong> -- Indicates support for the proposal. For votes count toward both
          the quorum calculation and the approval majority.
        </li>
        <li>
          <strong>Against</strong> -- Indicates opposition to the proposal. Against votes count
          toward the quorum but reduce the approval ratio.
        </li>
        <li>
          <strong>Abstain</strong> -- Indicates neither support nor opposition. Abstain votes
          count toward the quorum requirement but do not influence the For/Against ratio. This
          allows holders to contribute to quorum without taking a position on contentious issues.
        </li>
      </ul>
      <p>
        A proposal succeeds when it meets two conditions: the total votes cast (For + Against +
        Abstain) meet the quorum threshold, and the For votes exceed the Against votes (simple
        majority).
      </p>

      <h2 id="voting-power">Voting Power</h2>
      <p>
        Voting power is determined by a holder&apos;s DUAL balance at the snapshot block. When a
        proposal transitions to Active status, the system records a snapshot of all token balances
        at that block height. This snapshot is immutable for the duration of the voting period,
        meaning that subsequent transfers or trades do not affect voting eligibility or weight.
      </p>

      <Callout type="info" title="Snapshot Mechanics">
        Voting power is locked at the block when the proposal becomes Active. Buying or selling
        DUAL after the snapshot has no effect on your ability to vote on that particular proposal.
      </Callout>

      <p>
        Staked DUAL carries a 1.5x voting power multiplier. If a holder has 1,000 DUAL staked at
        the snapshot block, their effective voting power is 1,500. This multiplier incentivizes
        long-term protocol participation and aligns voting influence with economic commitment.
      </p>

      <h2 id="delegation">Delegation System</h2>
      <p>
        DUAL holders who prefer not to vote directly can delegate their voting power to another
        address. Delegation transfers voting power without transferring token ownership -- the
        delegator retains full custody of their DUAL tokens and can revoke the delegation at any
        time.
      </p>
      <p>
        Key properties of the delegation system:
      </p>
      <ul>
        <li>
          <strong>One-to-one delegation</strong> -- Each address can delegate to exactly one
          delegate at a time. Changing delegates immediately transfers all voting power to the new
          delegate.
        </li>
        <li>
          <strong>Non-transitive</strong> -- Delegated voting power does not cascade. If Alice
          delegates to Bob, and Bob delegates to Carol, Carol does not receive Alice&apos;s votes.
          Alice&apos;s power remains with Bob.
        </li>
        <li>
          <strong>Self-delegation</strong> -- By default, all DUAL holders are self-delegated. To
          vote on proposals directly, no explicit delegation action is required.
        </li>
        <li>
          <strong>Instant revocation</strong> -- Delegators can revoke and re-delegate at any
          time. Changes take effect immediately for future proposal snapshots but do not affect
          proposals where the snapshot has already been taken.
        </li>
      </ul>

      <Callout type="tip" title="Active Delegates">
        The Dualis governance dashboard displays active delegates along with their voting history,
        participation rate, and total delegated power. This transparency helps delegators make
        informed choices.
      </Callout>

      <h2 id="quorum-requirements">Quorum Requirements</h2>
      <p>
        Each proposal type has a distinct quorum threshold, expressed as a percentage of the total
        DUAL supply. The quorum must be met for a proposal to pass, regardless of the For/Against
        ratio. This ensures that significant protocol changes cannot be enacted by a small number
        of token holders.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Proposal Type</th>
              <th>Quorum</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {QUORUM_TABLE.map((row) => (
              <tr key={row.type}>
                <td><strong>{row.type}</strong></td>
                <td>{row.quorum}</td>
                <td>{row.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="vote-changes">Changing Your Vote</h2>
      <p>
        Voters may change their vote at any point during the active voting period. The most recent
        vote cast by an address is the one that counts at the time the voting period closes. This
        flexibility allows participants to adjust their position as discussion evolves and new
        information emerges during the deliberation period.
      </p>

      <h2 id="off-chain-signaling">Off-Chain Signaling</h2>
      <p>
        Before submitting a formal on-chain proposal, authors are encouraged to publish a
        discussion post in the Dualis governance forum. Off-chain signaling polls allow the
        community to gauge sentiment, refine proposal parameters, and identify potential issues
        before committing to the on-chain governance process. While signaling votes are
        non-binding, proposals with strong off-chain support historically achieve higher quorum
        participation.
      </p>
    </>
  );
}
