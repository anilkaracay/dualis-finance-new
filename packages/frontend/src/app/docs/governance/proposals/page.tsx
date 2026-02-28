import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

const PROPOSAL_TYPES = [
  { type: 'PARAMETER_CHANGE', quorum: '10%', votingPeriod: '5 days', timelock: '48 hours' },
  { type: 'NEW_POOL', quorum: '15%', votingPeriod: '5 days', timelock: '48 hours' },
  { type: 'POOL_DEPRECATION', quorum: '20%', votingPeriod: '5 days', timelock: '48 hours' },
  { type: 'TREASURY_SPEND', quorum: '25%', votingPeriod: '5 days', timelock: '72 hours' },
  { type: 'EMERGENCY_ACTION', quorum: '5%', votingPeriod: '1 day', timelock: '0 hours' },
  { type: 'PROTOCOL_UPGRADE', quorum: '20%', votingPeriod: '7 days', timelock: '96 hours' },
];

const LIFECYCLE_STAGES = [
  { stage: 'Draft', description: 'The proposer prepares the proposal content, specifies the type, and attaches any on-chain actions. Draft proposals are not yet visible to voters.' },
  { stage: 'Active', description: 'The proposal is submitted on-chain and voting begins. A snapshot of all DUAL balances is taken at the block the proposal becomes active.' },
  { stage: 'Succeeded / Defeated', description: 'When the voting period ends, the proposal is marked as Succeeded if it meets both the quorum threshold and a simple majority of For votes. Otherwise it is Defeated.' },
  { stage: 'Queued', description: 'Succeeded proposals enter the timelock queue. The timelock delay varies by proposal type. During this period, the community can review the pending execution.' },
  { stage: 'Executed', description: 'After the timelock expires, the proposal can be executed within the 7-day execution window. If not executed within this window, the proposal expires.' },
];

export default function ProposalsPage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="proposals" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Proposal System
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          How governance proposals are created, voted on, and executed
        </p>
        <p>
          The Dualis governance proposal system allows DUAL token holders to submit, debate, and
          enact changes to the protocol. Every modification to protocol parameters, pool
          configuration, treasury allocation, or contract upgrades must pass through this formal
          governance process. Proposals follow a structured lifecycle and are subject to
          type-specific quorum, voting period, and timelock requirements.
        </p>
      </div>

      <h2 id="proposal-threshold">Proposal Threshold</h2>
      <p>
        To create a governance proposal, an account must hold at least <strong>100 DUAL</strong> tokens
        at the time of submission. This threshold prevents spam while keeping proposal creation
        accessible to a broad set of participants. The threshold applies to the proposer&apos;s own
        balance and includes any delegated voting power.
      </p>

      <Callout type="info" title="Threshold Requirement">
        The proposal creation threshold is 100 DUAL. This is a governance-configurable parameter
        that can itself be changed through a PARAMETER_CHANGE proposal.
      </Callout>

      <h2 id="dip-numbering">DIP Numbering System</h2>
      <p>
        Every proposal receives a sequential Dualis Improvement Proposal (DIP) number upon
        submission. The numbering follows a simple sequential pattern: DIP-001, DIP-002, DIP-003,
        and so on. DIP numbers are assigned on-chain and are immutable once created.
      </p>
      <CodeBlock language="text" filename="DIP Format">
{`DIP-001: Adjust USDC Reserve Factor to 12%
DIP-002: Add wSTETH as Collateral Asset
DIP-003: Treasury Grant for Security Audit
DIP-004: Emergency Pause on T-BILL Pool`}
      </CodeBlock>
      <p>
        Each DIP includes the proposal type, a human-readable title, a detailed description of the
        change and its rationale, and the on-chain actions to be executed if the proposal passes.
      </p>

      <h2 id="proposal-lifecycle">Proposal Lifecycle</h2>
      <p>
        Every proposal progresses through a well-defined lifecycle with five stages. Each stage
        serves as a checkpoint that ensures sufficient community review before changes take effect.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {LIFECYCLE_STAGES.map((row) => (
              <tr key={row.stage}>
                <td><strong>{row.stage}</strong></td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="warning" title="Expiration">
        If a succeeded proposal is not executed within the 7-day execution window after its
        timelock expires, it becomes permanently expired and must be resubmitted as a new DIP.
      </Callout>

      <h2 id="proposal-types">Proposal Types</h2>
      <p>
        Dualis supports six distinct proposal types, each with tailored governance parameters.
        Higher-impact changes require larger quorums and longer timelocks, while emergency actions
        are designed for rapid response with minimal delay.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Quorum</th>
              <th>Voting Period</th>
              <th>Timelock</th>
            </tr>
          </thead>
          <tbody>
            {PROPOSAL_TYPES.map((row) => (
              <tr key={row.type}>
                <td><strong>{row.type}</strong></td>
                <td>{row.quorum}</td>
                <td>{row.votingPeriod}</td>
                <td>{row.timelock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="parameter-change">Parameter Change</h2>
      <p>
        PARAMETER_CHANGE proposals modify configurable protocol values such as reserve factors,
        interest rate model parameters, collateral factors, and liquidation incentives. These are
        the most common proposal type and require a 10% quorum with a 5-day voting period.
      </p>

      <h2 id="new-pool">New Pool Creation</h2>
      <p>
        NEW_POOL proposals add a new lending market to the protocol. They specify the asset,
        initial risk parameters, oracle configuration, and supply caps. A 15% quorum ensures
        adequate community review before new markets are launched.
      </p>

      <h2 id="emergency-action">Emergency Action</h2>
      <p>
        EMERGENCY_ACTION proposals are reserved for critical situations such as oracle failures,
        exploit mitigation, or market circuit-breaker activation. They carry the lowest quorum
        requirement (5%), a 1-day voting period, and zero timelock, allowing immediate execution
        upon passage. Despite the expedited process, emergency proposals still require a majority
        vote and are subject to the admin veto mechanism.
      </p>

      <Callout type="danger" title="Zero Timelock">
        Emergency proposals execute immediately upon passage with no timelock delay. This
        capability is intentionally limited to protocol safety operations and cannot be used for
        parameter changes or treasury actions.
      </Callout>

      <h2 id="cancellation">Proposal Cancellation</h2>
      <p>
        A proposal can be cancelled by its original proposer at any time before execution. If the
        proposer&apos;s DUAL balance drops below the 100 DUAL threshold during the voting period,
        any community member can trigger cancellation. This mechanism ensures that proposers
        maintain sufficient stake throughout the governance process.
      </p>
    </>
  );
}
