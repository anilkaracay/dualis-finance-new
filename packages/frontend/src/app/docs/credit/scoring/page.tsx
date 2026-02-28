import { Callout } from '@/components/docs/Callout';

export default function CreditScoringPage() {
  return (
    <>
      <span className="docs-badge">Credit System</span>
      <h1>Hybrid Credit Scoring</h1>
      <p className="docs-subtitle">
        A three-layer composite scoring model that combines on-chain activity,
        off-chain verified data, and ecosystem reputation into a single
        institutional credit score ranging from 0 to 1000.
      </p>

      {/* ── Overview ── */}
      <h2 id="overview">Scoring Architecture</h2>
      <p>
        The Dualis credit scoring system is designed for institutional
        participants who require a nuanced, multi-dimensional assessment of
        counterparty creditworthiness. Unlike traditional DeFi protocols that
        rely solely on collateral ratios, and unlike traditional finance that
        depends entirely on off-chain credit bureaus, Dualis combines three
        complementary data layers into a single composite score.
      </p>
      <p>
        Each participant receives a score between <strong>0 and 1000</strong>,
        which maps directly to one of five credit tiers. The score determines
        access to preferential lending rates, higher leverage, and
        under-collateralised borrowing facilities.
      </p>

      {/* ── Three Layers ── */}
      <h2 id="three-layers">Three-Layer Composite Model</h2>
      <p>
        The composite score is derived from three weighted data layers:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Weight</th>
              <th>Data Source</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>On-Chain Activity</td>
              <td>40%</td>
              <td>Canton ledger</td>
              <td>
                Direct observation of the participant&apos;s behaviour on the
                Dualis protocol — loan completions, repayment timeliness,
                volume history, and collateral management.
              </td>
            </tr>
            <tr>
              <td>Off-Chain (ZK-Verified)</td>
              <td>35%</td>
              <td>External credit data via ZK proofs</td>
              <td>
                Traditional credit metrics provided through zero-knowledge
                proofs. Participants can attest to off-chain credit ratings,
                financial statements, or regulatory standing without
                revealing the underlying data.
              </td>
            </tr>
            <tr>
              <td>Ecosystem Reputation</td>
              <td>25%</td>
              <td>Canton Network ecosystem</td>
              <td>
                Cross-protocol reputation signals from the broader Canton
                ecosystem, including participation in other DeFi protocols,
                governance activity, and network contribution metrics.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="Privacy by Design">
        The off-chain layer uses zero-knowledge proofs exclusively.
        Participants prove that their external credit data meets certain
        thresholds without revealing the actual data to Dualis or other
        participants. The ZK circuit validates the proof on Canton, and only
        the boolean result is recorded on-ledger.
      </Callout>

      {/* ── Sub-Factors ── */}
      <h2 id="sub-factors">Scoring Sub-Factors</h2>
      <p>
        The on-chain layer (40% weight) is decomposed into five sub-factors,
        each contributing a specific number of points to the total 1000-point
        scale:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Sub-Factor</th>
              <th>Max Points</th>
              <th>What It Measures</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Loan Completion</td>
              <td>300</td>
              <td>
                Number and value of loans successfully completed without
                default. Higher completion rates and larger loan values
                contribute more points.
              </td>
            </tr>
            <tr>
              <td>Repayment Timeliness</td>
              <td>250</td>
              <td>
                Consistency of on-time repayments. Early repayments earn
                bonus points, while late repayments reduce the score.
                Defaults result in significant point deductions.
              </td>
            </tr>
            <tr>
              <td>Volume History</td>
              <td>200</td>
              <td>
                Cumulative borrowing and lending volume over the
                participant&apos;s lifetime on the protocol. Demonstrates
                market engagement and protocol trust.
              </td>
            </tr>
            <tr>
              <td>Collateral Health</td>
              <td>150</td>
              <td>
                Average health factor maintained across all active positions.
                Participants who consistently maintain well-collateralised
                positions earn higher scores.
              </td>
            </tr>
            <tr>
              <td>Securities Lending</td>
              <td>100</td>
              <td>
                Participation in the securities lending marketplace,
                including lending volume, deal completion rate, and
                counterparty satisfaction.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        The five sub-factors sum to a maximum of <strong>1000 points</strong>,
        reflecting the total on-chain contribution. The off-chain and
        ecosystem layers are normalised to the same 1000-point scale before
        the weighted average is computed.
      </p>

      {/* ── Update Frequency ── */}
      <h2 id="update-frequency">Score Update Frequency</h2>
      <p>
        Credit scores are not static. The Dualis scoring engine recalculates
        scores based on the following triggers:
      </p>
      <ul>
        <li>
          <strong>Event-driven updates</strong> — Every significant on-chain
          event (loan completion, repayment, liquidation, securities lending
          settlement) triggers an immediate score recalculation for the
          affected participant.
        </li>
        <li>
          <strong>Periodic recalculation</strong> — A full recalculation
          across all sub-factors is performed every 24 hours to account for
          time-decay effects and updated market conditions.
        </li>
        <li>
          <strong>ZK proof submission</strong> — When a participant submits
          a new zero-knowledge proof for the off-chain layer, the score is
          recalculated immediately to incorporate the updated attestation.
        </li>
      </ul>

      <Callout type="tip" title="Score History">
        Participants can view their complete score history, including the
        contribution of each sub-factor over time, through the Dualis
        dashboard. Score changes are annotated with the triggering event
        for full transparency.
      </Callout>

      {/* ── Tier Mapping ── */}
      <h2 id="tier-mapping">Score to Tier Mapping</h2>
      <p>
        The composite score maps directly to one of five credit tiers, each
        unlocking specific protocol benefits:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Score Range</th>
              <th>Rate Discount</th>
              <th>Max LTV</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Diamond</td>
              <td>850 &ndash; 1000</td>
              <td>-25%</td>
              <td>0.85</td>
            </tr>
            <tr>
              <td>Gold</td>
              <td>700 &ndash; 849</td>
              <td>-15%</td>
              <td>0.78</td>
            </tr>
            <tr>
              <td>Silver</td>
              <td>500 &ndash; 699</td>
              <td>-8%</td>
              <td>0.70</td>
            </tr>
            <tr>
              <td>Bronze</td>
              <td>300 &ndash; 499</td>
              <td>0%</td>
              <td>0.60</td>
            </tr>
            <tr>
              <td>Unrated</td>
              <td>0 &ndash; 299</td>
              <td>0%</td>
              <td>0.50</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        For a full breakdown of tier benefits, collateral requirements, and
        liquidation parameters, see the{' '}
        <a href="/docs/credit/tiers">Credit Tiers</a> documentation.
      </p>
    </>
  );
}
