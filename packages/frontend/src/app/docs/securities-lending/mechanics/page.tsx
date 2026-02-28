import { Callout } from '@/components/docs/Callout';

export default function SecuritiesLendingMechanicsPage() {
  return (
    <>
      <span className="docs-badge">Securities Lending</span>
      <h1>Marketplace Mechanics</h1>
      <p className="docs-subtitle">
        Detailed mechanics of offer creation, deal matching, lifecycle
        management, and corporate action handling on the Dualis securities
        lending marketplace.
      </p>

      {/* ── Offer Creation ── */}
      <h2 id="offer-creation">Offer Creation and Matching</h2>
      <p>
        Lenders create offers by specifying the parameters of their lending
        terms. Each offer is represented as a DAML contract on Canton,
        visible to all eligible participants based on their KYC status and
        jurisdiction.
      </p>
      <p>An offer includes the following parameters:</p>
      <ul>
        <li>
          <strong>Security identifier</strong> — ISIN, CUSIP, or internal
          token ID of the instrument being offered.
        </li>
        <li>
          <strong>Quantity</strong> — The total number of units available for
          lending. Fractional quantities are supported.
        </li>
        <li>
          <strong>Fee rate</strong> — The annualised lending fee in basis
          points, paid by the borrower.
        </li>
        <li>
          <strong>Minimum collateral ratio</strong> — The required
          over-collateralisation level, which may be overridden by credit
          tier defaults.
        </li>
        <li>
          <strong>Accepted collateral types</strong> — A whitelist of
          collateral assets the lender is willing to accept (e.g., USDC,
          tokenized treasuries, Canton Coin).
        </li>
        <li>
          <strong>Term</strong> — Open-ended or fixed-duration, with optional
          minimum and maximum loan periods.
        </li>
      </ul>
      <p>
        The Dualis matching engine continuously evaluates outstanding offers
        against incoming borrow requests. Matching considers fee
        compatibility, collateral preferences, and credit tier eligibility.
        When a match is found, a pending deal contract is created atomically
        on Canton.
      </p>

      <Callout type="info" title="Direct Negotiation">
        Participants may also bypass the matching engine by negotiating
        directly with a specific counterparty. In this case, the borrower
        exercises a choice on the lender&apos;s offer contract, creating
        the deal bilaterally.
      </Callout>

      {/* ── Deal Lifecycle ── */}
      <h2 id="deal-lifecycle">Deal Lifecycle</h2>
      <p>
        Once matched, a deal progresses through a well-defined lifecycle
        enforced by the DAML contract:
      </p>
      <ol>
        <li>
          <strong>Pending</strong> — The deal contract is created. The
          borrower has a configurable window (default: 30 minutes) to post
          the required collateral. If the window expires without collateral
          being posted, the deal is automatically cancelled.
        </li>
        <li>
          <strong>Collateralised</strong> — Collateral has been locked. The
          lender confirms the transfer and the securities are delivered to
          the borrower&apos;s Canton party.
        </li>
        <li>
          <strong>Active</strong> — The loan is live. Fees accrue on a
          per-second basis using the protocol&apos;s interest accrual index.
          Collateral is continuously monitored against mark-to-market
          valuations.
        </li>
        <li>
          <strong>Returning</strong> — The borrower initiates the return. The
          contract verifies that the returned securities match the original
          instrument and quantity.
        </li>
        <li>
          <strong>Settled</strong> — All obligations are fulfilled. Collateral
          is released, fees are distributed, and the contract is archived
          on-ledger for auditability.
        </li>
      </ol>

      {/* ── Corporate Actions ── */}
      <h2 id="corporate-actions">Corporate Action Handling</h2>
      <p>
        Securities may be subject to corporate actions during the term of a
        loan. Dualis handles these events programmatically through dedicated
        DAML choice handlers:
      </p>

      <h3>Dividends</h3>
      <p>
        When a dividend is declared on a lent security, the borrower is
        contractually obligated to make a manufactured payment equivalent to
        the dividend amount. The smart contract automatically debits the
        dividend equivalent from the borrower&apos;s collateral or settled
        balance and credits it to the lender.
      </p>

      <h3>Stock Splits</h3>
      <p>
        Stock splits adjust both the loan quantity and the collateral ratio
        proportionally. A 2-for-1 split doubles the number of lent shares
        while halving the per-unit valuation, keeping the total loan value
        and collateral ratio unchanged.
      </p>

      <h3>Rights Issues</h3>
      <p>
        For rights offerings, the lender retains the right to participate.
        The contract provides a recall mechanism (see below) that allows the
        lender to recall securities before the rights record date. If the
        lender chooses not to recall, a cash-equivalent compensation is
        calculated and credited.
      </p>

      <Callout type="warning" title="Ex-Date Awareness">
        Corporate action handlers execute automatically based on on-chain
        event feeds. Participants should monitor upcoming corporate actions
        via the Dualis dashboard to plan recalls or position adjustments
        ahead of record dates.
      </Callout>

      {/* ── Recall & Buyback ── */}
      <h2 id="recall-buyback">Recall and Buyback Mechanics</h2>
      <p>
        Open-ended loans support two mechanisms for early termination:
      </p>
      <h3>Lender Recall</h3>
      <p>
        The lender may recall securities at any time by exercising the
        <code>Recall</code> choice on the active deal contract. The borrower
        receives a notification and has a settlement window (default: 24
        hours for equities, 48 hours for fixed income) to return the
        securities. Failure to return within the window triggers an
        automatic liquidation of the borrower&apos;s collateral.
      </p>
      <h3>Borrower Buyback</h3>
      <p>
        The borrower may terminate a loan early by exercising the
        <code>Return</code> choice. Fees are calculated pro-rata up to the
        return timestamp. There are no early termination penalties on
        open-ended loans.
      </p>

      {/* ── Fractional Lending ── */}
      <h2 id="fractional-lending">Fractional Lending</h2>
      <p>
        Dualis supports fractional lending, enabling participants to lend or
        borrow partial units of a security. This is particularly relevant for
        high-value instruments such as tokenized bonds or RWA positions where
        full-unit lending would limit market participation.
      </p>
      <p>
        Fractional positions are tracked with up to 10 decimal places of
        precision on Canton. Collateral ratios, fee accruals, and settlement
        calculations all operate at the same precision level, ensuring no
        rounding-induced discrepancies.
      </p>

      <Callout type="tip" title="Partial Fills">
        A single lender offer can be partially filled by multiple borrowers.
        Each partial fill creates a separate deal contract, allowing the
        lender to track and manage each borrowing relationship independently.
      </Callout>
    </>
  );
}
