import { Callout } from '@/components/docs/Callout';

const TIMELOCK_TABLE = [
  { type: 'PARAMETER_CHANGE', timelock: '48 hours', executionWindow: '7 days', rationale: 'Standard delay for routine parameter updates.' },
  { type: 'NEW_POOL', timelock: '48 hours', executionWindow: '7 days', rationale: 'Sufficient time for market participants to prepare.' },
  { type: 'POOL_DEPRECATION', timelock: '48 hours', executionWindow: '7 days', rationale: 'Allows users to exit positions before deprecation.' },
  { type: 'TREASURY_SPEND', timelock: '72 hours', executionWindow: '7 days', rationale: 'Extended review for fund deployment decisions.' },
  { type: 'EMERGENCY_ACTION', timelock: '0 hours', executionWindow: '7 days', rationale: 'Immediate execution for critical safety operations.' },
  { type: 'PROTOCOL_UPGRADE', timelock: '96 hours', executionWindow: '7 days', rationale: 'Maximum delay for high-impact contract upgrades.' },
];

export default function TimelockPage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="timelock" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Timelock &amp; Execution
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          Mandatory delays between proposal approval and on-chain execution
        </p>
        <p>
          The Dualis timelock system introduces a mandatory waiting period between a proposal
          passing its governance vote and being executed on-chain. This delay gives the community
          time to review approved changes, identify potential issues, and react before the protocol
          state is modified. The timelock duration varies by proposal type, reflecting the risk and
          impact level of each category.
        </p>
      </div>

      <h2 id="timelock-durations">Timelock Durations</h2>
      <p>
        Each proposal type is assigned a specific timelock delay. Once a proposal passes the
        voting phase and enters the Queued state, the timelock countdown begins. The proposal
        cannot be executed until the full delay has elapsed.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Proposal Type</th>
              <th>Timelock</th>
              <th>Execution Window</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {TIMELOCK_TABLE.map((row) => (
              <tr key={row.type}>
                <td><strong>{row.type}</strong></td>
                <td>{row.timelock}</td>
                <td>{row.executionWindow}</td>
                <td>{row.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="danger" title="Emergency Actions Have Zero Timelock">
        EMERGENCY_ACTION proposals execute immediately upon passing the vote with no delay. This
        is by design -- emergency actions address critical threats such as oracle failures, active
        exploits, or market circuit breakers where any delay could result in protocol losses.
        Emergency proposals are subject to the admin veto as a final safeguard.
      </Callout>

      <h2 id="execution-window">Execution Window</h2>
      <p>
        After the timelock delay expires, the proposal enters the execution window. Any address
        can trigger the execution of a queued proposal during this window -- the executor does not
        need to be the original proposer. The execution window is <strong>7 days</strong> for all
        proposal types.
      </p>
      <p>
        If the proposal is not executed within the 7-day window, it expires permanently. Expired
        proposals cannot be revived or re-queued; they must be resubmitted as a new DIP with a
        fresh voting cycle. This prevents stale proposals from being executed long after their
        original context may have changed.
      </p>

      <h2 id="grace-period">Grace Period</h2>
      <p>
        The protocol includes a 48-hour grace period at the end of the execution window. During
        the grace period, the governance dashboard displays a prominent warning that the proposal
        is about to expire. This gives the community a final opportunity to execute proposals that
        may have been overlooked.
      </p>
      <p>
        The grace period is purely informational -- it does not extend the execution window.
        Proposals that are not executed by the end of the 7-day window (including the grace period
        notification) are marked as expired.
      </p>

      <h2 id="admin-veto">Admin Veto Mechanism</h2>
      <p>
        As a final security safeguard, the protocol maintains an admin veto capability. The veto
        power is held by a multi-signature wallet controlled by the Dualis security council, a
        committee of protocol contributors and independent security researchers.
      </p>
      <p>
        The veto can be exercised during the timelock period to cancel a queued proposal before
        execution. The veto mechanism is designed exclusively for scenarios where a passed proposal
        would compromise protocol security, violate regulatory requirements, or contain a
        technical error that could lead to loss of funds.
      </p>

      <Callout type="warning" title="Veto Limitations">
        The admin veto cannot be used after a proposal has been executed. It can only cancel
        proposals that are in the Queued state during their timelock period. The veto power itself
        is subject to governance -- the community can vote to revoke or transfer veto authority
        through a PROTOCOL_UPGRADE proposal.
      </Callout>

      <h2 id="veto-transparency">Veto Transparency</h2>
      <p>
        Every veto action is recorded on-chain with a mandatory justification. The security
        council must publish a detailed explanation for each veto, including the specific risk
        identified and the recommended path forward. This transparency requirement ensures that
        veto power is exercised responsibly and remains accountable to the community.
      </p>
      <ul>
        <li>
          <strong>On-chain record</strong> -- The veto transaction includes the proposal ID,
          timestamp, council member signatures, and a justification hash.
        </li>
        <li>
          <strong>Public disclosure</strong> -- The full justification text is published to the
          governance forum within 24 hours of the veto.
        </li>
        <li>
          <strong>Community review</strong> -- After a veto, the community may submit a revised
          proposal addressing the identified concerns. Vetoed proposals are tracked separately in
          the governance dashboard.
        </li>
      </ul>

      <h2 id="timelock-flow">End-to-End Flow</h2>
      <p>
        The complete governance execution timeline for a standard PARAMETER_CHANGE proposal
        illustrates how these mechanisms work together:
      </p>
      <ol>
        <li><strong>Day 0</strong> -- Proposal submitted on-chain as a DIP. Voting begins.</li>
        <li><strong>Day 5</strong> -- Voting period ends. Proposal passes with quorum met and majority For votes.</li>
        <li><strong>Day 5</strong> -- Proposal enters the timelock queue. 48-hour countdown begins.</li>
        <li><strong>Day 7</strong> -- Timelock expires. The 7-day execution window opens.</li>
        <li><strong>Day 7-14</strong> -- Any address may execute the proposal on-chain.</li>
        <li><strong>Day 12</strong> -- Grace period warning appears (48 hours before expiry).</li>
        <li><strong>Day 14</strong> -- Execution window closes. If not executed, the proposal expires.</li>
      </ol>
    </>
  );
}
