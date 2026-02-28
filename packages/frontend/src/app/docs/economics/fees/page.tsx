import { Callout } from '@/components/docs/Callout';

const FEE_OVERVIEW = [
  { operation: 'Supply', fee: 'Free', notes: 'No fee charged when depositing assets into lending pools.' },
  { operation: 'Withdraw', fee: 'Free', notes: 'No fee charged when withdrawing supplied assets.' },
  { operation: 'Borrow', fee: 'Reserve factor (5-20%)', notes: 'A percentage of accrued interest is retained by the protocol.' },
  { operation: 'Flash Loan', fee: '0.09%', notes: 'Flat fee on the borrowed amount, collected within the same transaction.' },
  { operation: 'Liquidation', fee: 'Per-asset incentive', notes: 'Liquidation bonus varies by collateral asset and tier.' },
  { operation: 'Securities Lending', fee: '5-20 bps', notes: 'Commission on lending fees for tokenized securities.' },
];

const RESERVE_FACTORS = [
  { asset: 'USDC', factor: '10%', rationale: 'Deep liquidity stablecoin with minimal volatility risk.' },
  { asset: 'USDT', factor: '10%', rationale: 'High-volume stablecoin with established market presence.' },
  { asset: 'wBTC', factor: '15%', rationale: 'Wrapped Bitcoin carries bridge risk and moderate volatility.' },
  { asset: 'wETH', factor: '15%', rationale: 'Wrapped Ether with standard crypto volatility profile.' },
  { asset: 'CC (Canton Coin)', factor: '20%', rationale: 'Network-native token with emerging liquidity characteristics.' },
  { asset: 'T-BILL', factor: '5%', rationale: 'Tokenized treasury bills with minimal credit and market risk.' },
  { asset: 'TIFA-REC', factor: '15%', rationale: 'Tokenized institutional financial assets with moderate complexity.' },
];

export default function FeesPage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="fees" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Fee Structure
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          Comprehensive breakdown of all protocol fees and charges
        </p>
        <p>
          Dualis Finance employs a transparent fee structure designed to sustain protocol
          operations while remaining competitive for institutional participants. Supply and
          withdrawal operations are free of charge, while borrowing fees are collected through
          asset-specific reserve factors applied to accrued interest. Additional revenue streams
          include flash loan fees and securities lending commissions.
        </p>
      </div>

      <h2 id="fee-overview">Fee Overview</h2>
      <p>
        The following table summarizes all fees charged across the protocol. The fee model is
        intentionally simple: suppliers and withdrawers pay nothing, borrowers pay interest that
        includes a reserve factor contribution, and specialized operations like flash loans carry
        flat fees.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Fee</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {FEE_OVERVIEW.map((row) => (
              <tr key={row.operation}>
                <td><strong>{row.operation}</strong></td>
                <td>{row.fee}</td>
                <td>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="reserve-factors">Reserve Factors by Asset</h2>
      <p>
        The reserve factor determines what percentage of the interest paid by borrowers is
        directed to the protocol reserve rather than distributed to suppliers. Each asset has its
        own reserve factor calibrated to reflect its risk profile, liquidity depth, and
        operational complexity.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Reserve Factor</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {RESERVE_FACTORS.map((row) => (
              <tr key={row.asset}>
                <td><strong>{row.asset}</strong></td>
                <td>{row.factor}</td>
                <td>{row.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout type="info" title="Governance-Configurable">
        All reserve factors are governance-configurable parameters. They can be adjusted through
        a PARAMETER_CHANGE proposal requiring 10% quorum and a 48-hour timelock.
      </Callout>

      <h2 id="flash-loan-fee">Flash Loan Fee</h2>
      <p>
        Flash loans incur a flat fee of <strong>0.09%</strong> of the borrowed amount. This fee is
        collected within the same atomic transaction and is non-negotiable. Flash loan fees flow
        directly to the protocol reserve and are subsequently distributed between the treasury and
        DUAL stakers according to the current fee-sharing ratio.
      </p>
      <p>
        For example, a flash loan of 1,000,000 USDC would incur a fee of 900 USDC. The borrower
        must repay 1,000,900 USDC within the same transaction, or the entire operation reverts.
      </p>

      <h2 id="protocol-fee-rate">Protocol Fee Rate</h2>
      <p>
        In addition to the per-asset reserve factor, the protocol applies a global fee rate of
        <strong> 0.1%</strong> on certain administrative operations. This rate applies to protocol-level
        service charges and is separate from the interest-based reserve factor system.
      </p>

      <h2 id="liquidation-incentive">Liquidation Incentive</h2>
      <p>
        Liquidators receive a bonus for repaying unhealthy debt positions. The liquidation
        incentive varies by collateral asset and is expressed as a percentage of the seized
        collateral value. This incentive compensates liquidators for the gas cost and execution
        risk of the liquidation transaction while maintaining protocol solvency.
      </p>
      <p>
        Liquidation incentives are calibrated per asset based on historical volatility and
        liquidity depth. Higher-volatility assets carry larger incentives to ensure that
        liquidators remain motivated even during rapid price movements.
      </p>

      <h2 id="securities-lending-fees">Securities Lending Fees</h2>
      <p>
        The securities lending marketplace charges a commission of <strong>5 to 20 basis
        points</strong> on all lending transactions involving tokenized securities. The exact fee
        depends on the security type, borrowing demand, and loan duration. This commission is
        split between the protocol reserve and the securities pool that facilitated the
        transaction.
      </p>
      <ul>
        <li>
          <strong>Government bonds (T-BILL)</strong> -- 5 bps baseline, reflecting the low risk
          and high liquidity of sovereign debt instruments.
        </li>
        <li>
          <strong>Corporate bonds</strong> -- 10-15 bps, scaling with credit quality and
          maturity.
        </li>
        <li>
          <strong>Tokenized equities and alternatives</strong> -- Up to 20 bps for less liquid
          or more complex instruments.
        </li>
      </ul>

      <Callout type="tip" title="Fee Transparency">
        All fees are displayed in the Dualis interface before transaction confirmation. The
        protocol never charges hidden fees -- every cost is visible to the user at the point of
        action.
      </Callout>
    </>
  );
}
