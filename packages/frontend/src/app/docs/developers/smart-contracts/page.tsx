'use client';

import { Callout } from '@/components/docs/Callout';
import { CodeBlock } from '@/components/docs/CodeBlock';

export default function SmartContractsPage() {
  return (
    <>
      <h1>Smart Contracts</h1>
      <p className="docs-lead">
        Dualis Finance settles all lending, collateral, liquidation, and governance
        operations on the Canton Network using DAML smart contracts. The contract suite
        comprises 25 modules exposing 38 templates, built with DAML SDK 3.4.11 targeting
        Ledger Fragment (LF) version 2.1.
      </p>

      <h2 id="architecture">Architecture</h2>
      <p>
        The DAML contracts are organized into functional categories. Each module defines
        one or more templates with explicit signatory and observer relationships,
        enforcing Canton&apos;s privacy model at the ledger level. Contract keys have been
        removed as LF 2.x does not support the <code>key</code>/<code>maintainer</code>{' '}
        syntax &mdash; all contract references use contract IDs.
      </p>

      <Callout type="info" title="No Contract Keys">
        DAML LF 2.1 removes support for contract keys. All lookups in the Dualis
        contracts use contract IDs passed explicitly in choice arguments. This is a
        deliberate design decision aligned with Canton&apos;s privacy-first architecture.
      </Callout>

      <h2 id="module-categories">Module Categories</h2>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Modules</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Core</td>
              <td><code>Dualis.Types</code>, <code>Dualis.Utils</code></td>
              <td>Shared type definitions (CreditTier, InterestRateModel, TierLendingParams) and math utilities (Taylor series exp/ln)</td>
            </tr>
            <tr>
              <td>Lending</td>
              <td><code>Dualis.LendingPool</code>, <code>Dualis.Supply</code>, <code>Dualis.Borrow</code>, <code>Dualis.Repay</code></td>
              <td>Pool creation, supply/withdraw, borrow/repay lifecycle, interest accrual</td>
            </tr>
            <tr>
              <td>Liquidation</td>
              <td><code>Dualis.Liquidation</code>, <code>Dualis.LiquidationAuction</code></td>
              <td>Health factor monitoring, liquidation triggers, Dutch auction mechanism</td>
            </tr>
            <tr>
              <td>Credit</td>
              <td><code>Dualis.Credit</code>, <code>Dualis.CreditOracle</code></td>
              <td>Credit tier assignment (Diamond/Gold/Silver/Bronze/Unrated), rate discounts, LTV caps</td>
            </tr>
            <tr>
              <td>Oracle</td>
              <td><code>Dualis.Oracle</code>, <code>Dualis.PriceFeed</code></td>
              <td>Price feed submissions, staleness checks, multi-source aggregation</td>
            </tr>
            <tr>
              <td>Token / Governance</td>
              <td><code>Dualis.Token</code>, <code>Dualis.Governance</code>, <code>Dualis.Staking</code>, <code>Dualis.Voting</code></td>
              <td>Protocol token, governance proposals, staking rewards, vote delegation</td>
            </tr>
            <tr>
              <td>Securities Lending</td>
              <td><code>Dualis.SecLending</code>, <code>Dualis.SecLendingMatch</code></td>
              <td>Offer creation, matching engine, settlement, recall mechanism</td>
            </tr>
            <tr>
              <td>Institutional</td>
              <td><code>Dualis.Institutional</code>, <code>Dualis.SubAccount</code>, <code>Dualis.Compliance</code></td>
              <td>Institutional onboarding, sub-account management, KYC/AML integration</td>
            </tr>
            <tr>
              <td>Productive</td>
              <td><code>Dualis.Productive</code>, <code>Dualis.Vault</code>, <code>Dualis.Strategy</code></td>
              <td>Yield vaults, auto-compounding strategies, fee distribution</td>
            </tr>
            <tr>
              <td>Privacy</td>
              <td><code>Dualis.Privacy</code>, <code>Dualis.PrivacyPolicy</code></td>
              <td>Transaction privacy controls, observer management, disclosure policies</td>
            </tr>
            <tr>
              <td>Triggers</td>
              <td><code>Dualis.Triggers</code>, <code>Dualis.AutoLiquidation</code>, <code>Dualis.InterestAccrual</code></td>
              <td>Automated DAML triggers for liquidation execution and interest index updates</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="template-list">Template List</h2>
      <p>
        The 38 templates across all modules:
      </p>
      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Template</th>
              <th>Module</th>
              <th>Key Choices</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1</td><td>LendingPool</td><td>LendingPool</td><td>Supply, Withdraw, UpdateRates</td></tr>
            <tr><td>2</td><td>SupplyPosition</td><td>Supply</td><td>AccrueInterest, Redeem</td></tr>
            <tr><td>3</td><td>BorrowPosition</td><td>Borrow</td><td>AccrueInterest, Repay, AddCollateral</td></tr>
            <tr><td>4</td><td>BorrowRequest</td><td>Borrow</td><td>Approve, Reject</td></tr>
            <tr><td>5</td><td>RepaymentReceipt</td><td>Repay</td><td>Archive</td></tr>
            <tr><td>6</td><td>CollateralLock</td><td>Borrow</td><td>Release, Liquidate</td></tr>
            <tr><td>7</td><td>LiquidationTrigger</td><td>Liquidation</td><td>Execute, Cancel</td></tr>
            <tr><td>8</td><td>LiquidationAuction</td><td>LiquidationAuction</td><td>Bid, Settle, Expire</td></tr>
            <tr><td>9</td><td>CreditAssignment</td><td>Credit</td><td>Upgrade, Downgrade, Revoke</td></tr>
            <tr><td>10</td><td>CreditOracleEntry</td><td>CreditOracle</td><td>UpdateScore, Expire</td></tr>
            <tr><td>11</td><td>PriceFeed</td><td>PriceFeed</td><td>SubmitPrice, Invalidate</td></tr>
            <tr><td>12</td><td>OracleConfig</td><td>Oracle</td><td>AddSource, RemoveSource, UpdateStaleness</td></tr>
            <tr><td>13</td><td>ProtocolToken</td><td>Token</td><td>Transfer, Mint, Burn</td></tr>
            <tr><td>14</td><td>TokenAllowance</td><td>Token</td><td>Spend, Revoke</td></tr>
            <tr><td>15</td><td>GovernanceProposal</td><td>Governance</td><td>Vote, Execute, Cancel</td></tr>
            <tr><td>16</td><td>ProposalResult</td><td>Governance</td><td>Finalize</td></tr>
            <tr><td>17</td><td>StakePosition</td><td>Staking</td><td>Unstake, ClaimRewards</td></tr>
            <tr><td>18</td><td>StakeReward</td><td>Staking</td><td>Distribute, Compound</td></tr>
            <tr><td>19</td><td>VoteDelegation</td><td>Voting</td><td>Delegate, Revoke</td></tr>
            <tr><td>20</td><td>VoteRecord</td><td>Voting</td><td>Archive</td></tr>
            <tr><td>21</td><td>SecLendingOffer</td><td>SecLending</td><td>Match, Cancel, Expire</td></tr>
            <tr><td>22</td><td>SecLendingContract</td><td>SecLendingMatch</td><td>Return, Recall, Default</td></tr>
            <tr><td>23</td><td>InstitutionalAccount</td><td>Institutional</td><td>CreateSubAccount, UpdateLimits</td></tr>
            <tr><td>24</td><td>SubAccount</td><td>SubAccount</td><td>Execute, Freeze, Close</td></tr>
            <tr><td>25</td><td>ComplianceRecord</td><td>Compliance</td><td>Verify, Reject, Expire</td></tr>
            <tr><td>26</td><td>KycStatus</td><td>Compliance</td><td>Approve, Revoke</td></tr>
            <tr><td>27</td><td>YieldVault</td><td>Vault</td><td>Deposit, Withdraw, Rebalance</td></tr>
            <tr><td>28</td><td>VaultShare</td><td>Vault</td><td>Redeem, Transfer</td></tr>
            <tr><td>29</td><td>Strategy</td><td>Strategy</td><td>Execute, Pause, UpdateParams</td></tr>
            <tr><td>30</td><td>StrategyResult</td><td>Strategy</td><td>Distribute, Reinvest</td></tr>
            <tr><td>31</td><td>ProductivePosition</td><td>Productive</td><td>Harvest, Compound, Exit</td></tr>
            <tr><td>32</td><td>FeeDistribution</td><td>Productive</td><td>Claim, Reinvest</td></tr>
            <tr><td>33</td><td>PrivacyPolicy</td><td>PrivacyPolicy</td><td>AddObserver, RemoveObserver</td></tr>
            <tr><td>34</td><td>PrivacyConfig</td><td>Privacy</td><td>UpdateDefaults, GrantException</td></tr>
            <tr><td>35</td><td>FlashLoan</td><td>LendingPool</td><td>Execute, Repay</td></tr>
            <tr><td>36</td><td>InterestIndex</td><td>InterestAccrual</td><td>Accrue, Snapshot</td></tr>
            <tr><td>37</td><td>LiquidationBot</td><td>AutoLiquidation</td><td>Scan, Execute, Report</td></tr>
            <tr><td>38</td><td>TriggerConfig</td><td>Triggers</td><td>Enable, Disable, UpdateFrequency</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="building">Building</h2>
      <p>
        The DAML source lives in <code>packages/canton/daml/</code>. Build and test
        with the DAML SDK (version 3.4.11):
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`cd packages/canton/daml
~/.daml/bin/daml build`}
      </CodeBlock>
      <p>
        The build produces a DAR (DAML Archive) file:
      </p>
      <CodeBlock language="text" filename="Output">
{`.daml/dist/dualis-finance-2.0.0.dar`}
      </CodeBlock>

      <h2 id="testing">Testing</h2>
      <p>
        The contract suite includes 8 test files covering all template lifecycle
        scenarios. Run the full test suite:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`cd packages/canton/daml
~/.daml/bin/daml test`}
      </CodeBlock>

      <Callout type="tip" title="DAML Math">
        DAML has no native <code>exp</code> or <code>ln</code> functions. The{' '}
        <code>Dualis.Utils</code> module implements these using Taylor series
        approximations, validated against the TypeScript math engine in the shared
        package to ensure cross-platform consistency.
      </Callout>

      <h2 id="deployment">Deployment</h2>
      <p>
        Upload the compiled DAR to a Canton participant using the deployment script:
      </p>
      <CodeBlock language="bash" filename="Terminal">
{`./deploy/scripts/upload-dar.sh \\
  --dar .daml/dist/dualis-finance-2.0.0.dar \\
  --participant-url http://172.18.0.7:5001`}
      </CodeBlock>
      <p>
        On the current devnet, the DAR has been uploaded with 134 packages registered
        on the participant node (13 from dualis-finance, the rest are DAML standard
        library dependencies).
      </p>

      <Callout type="warning" title="LF Version">
        The contracts target LF 2.1. Attempting to upload to a participant running an
        older Canton version that only supports LF 1.x will fail. Ensure your Canton
        validator is v0.5.12 or newer.
      </Callout>
    </>
  );
}
