import { Callout } from '@/components/docs/Callout';

const REVENUE_STREAMS = [
  { stream: 'Reserve Factor', source: 'Borrower interest', description: 'A percentage (5-20%) of all interest paid by borrowers is retained as protocol revenue. This is the primary and most consistent revenue stream.' },
  { stream: 'Flash Loan Fees', source: 'Flash loan borrowers', description: 'A 0.09% fee on every flash loan transaction. Revenue scales with flash loan volume and is collected atomically.' },
  { stream: 'Securities Lending Fees', source: 'Securities borrowers', description: 'Commission of 5-20 bps on institutional securities lending transactions through the marketplace.' },
  { stream: 'Institutional Pool Fees', source: 'Institutional participants', description: 'Management and performance fees on dedicated institutional lending pools with custom risk parameters.' },
  { stream: 'Credit Oracle API', source: 'External integrators', description: 'Subscription and per-query fees for third-party access to Dualis credit scoring and risk assessment data.' },
];

export default function RevenuePage() {
  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        <h1 id="revenue" style={{ fontSize: '2.25rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Revenue Model
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--docs-text-secondary)', marginBottom: '1.5rem' }}>
          How Dualis Finance generates and distributes protocol revenue
        </p>
        <p>
          Dualis Finance generates revenue through five distinct streams, each tied to a core
          protocol function. Revenue flows into the protocol treasury, where it is allocated
          between operational reserves, DUAL staker rewards, and ecosystem development. The
          diversified revenue model ensures protocol sustainability across varying market
          conditions and reduces dependence on any single source.
        </p>
      </div>

      <h2 id="revenue-streams">Revenue Streams</h2>
      <p>
        The following table outlines each revenue stream, its source, and how it contributes to
        the protocol&apos;s financial sustainability.
      </p>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Revenue Stream</th>
              <th>Source</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {REVENUE_STREAMS.map((row) => (
              <tr key={row.stream}>
                <td><strong>{row.stream}</strong></td>
                <td>{row.source}</td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="reserve-factor-revenue">Reserve Factor Revenue</h2>
      <p>
        The reserve factor is the protocol&apos;s primary revenue mechanism. When borrowers pay
        interest on their loans, a configurable percentage is retained by the protocol instead of
        being distributed to suppliers. The reserve factor varies by asset -- from 5% for
        low-risk tokenized treasuries (T-BILL) to 20% for Canton Coin (CC).
      </p>
      <p>
        For example, if a pool accrues 100,000 USDC in borrower interest over a period and the
        USDC reserve factor is 10%, the protocol retains 10,000 USDC while distributing 90,000
        USDC to suppliers. This mechanism ensures that the protocol accumulates reserves
        proportional to lending activity.
      </p>

      <h2 id="flash-loan-revenue">Flash Loan Revenue</h2>
      <p>
        Flash loan fees generate revenue on a per-transaction basis. The 0.09% fee is applied to
        the borrowed principal and is collected within the same atomic transaction. Flash loan
        revenue is highly variable and correlates with arbitrage opportunities, liquidation
        activity, and market volatility. During high-activity periods, flash loan fees can
        represent a significant portion of total protocol revenue.
      </p>

      <h2 id="securities-lending-revenue">Securities Lending Revenue</h2>
      <p>
        The institutional securities lending marketplace generates commission revenue of 5 to 20
        basis points on each transaction. This revenue stream is unique to Dualis and reflects the
        protocol&apos;s positioning at the intersection of traditional finance and decentralized
        lending. As the tokenized securities market grows, this stream is expected to become
        increasingly significant.
      </p>

      <h2 id="institutional-pool-revenue">Institutional Pool Revenue</h2>
      <p>
        Dedicated institutional pools operate with custom fee structures negotiated with
        institutional counterparties. These pools may include management fees (charged as a
        percentage of assets under management), performance fees (charged on excess returns), or
        flat subscription fees. Revenue from institutional pools provides a predictable, recurring
        income stream that is less sensitive to market volatility than retail lending activity.
      </p>

      <h2 id="credit-oracle-revenue">Credit Oracle API Revenue</h2>
      <p>
        The Dualis Credit Oracle provides credit assessments and risk scoring data to external
        protocols and institutions. Third-party integrators can access this data through a
        subscription-based API with per-query pricing for high-volume consumers. The Credit Oracle
        monetizes the protocol&apos;s proprietary credit infrastructure and creates a network
        effect where more data improves scoring accuracy, which in turn attracts more subscribers.
      </p>

      <Callout type="info" title="Revenue Diversification">
        By maintaining five independent revenue streams, Dualis reduces its exposure to any
        single market condition. Reserve factor income provides steady baseline revenue, while
        flash loans and securities lending capture episodic high-volume activity.
      </Callout>

      <h2 id="treasury-flow">Revenue Flow to Treasury</h2>
      <p>
        All protocol revenue flows into the unified protocol treasury. From the treasury, funds
        are allocated according to the current governance-approved distribution:
      </p>
      <ul>
        <li>
          <strong>40% to DUAL stakers</strong> -- Distributed proportionally to staked DUAL
          holders as a reward for their economic commitment to the protocol.
        </li>
        <li>
          <strong>30% to operational reserves</strong> -- Retained as a buffer against
          unexpected losses, insurance fund contributions, and day-to-day protocol operations.
        </li>
        <li>
          <strong>20% to ecosystem development</strong> -- Funds grants, integrations,
          partnerships, and community initiatives that expand the Dualis ecosystem.
        </li>
        <li>
          <strong>10% to security fund</strong> -- Dedicated to ongoing audits, bug bounty
          payouts, and security research to maintain the protocol&apos;s safety guarantees.
        </li>
      </ul>

      <Callout type="tip" title="Transparent Accounting">
        Treasury balances and revenue distribution data are publicly accessible on-chain. The
        governance dashboard provides real-time visibility into revenue accrual, distribution
        history, and current treasury holdings across all supported assets.
      </Callout>

      <h2 id="sustainability">Long-Term Sustainability</h2>
      <p>
        The Dualis revenue model is designed for long-term sustainability without reliance on
        token emissions or inflationary incentives. As protocol TVL grows and the tokenized
        securities market expands, revenue scales organically through increased borrowing activity,
        higher flash loan volumes, and growing institutional participation. The fixed DUAL supply
        ensures that revenue per token increases as the protocol matures, creating a fundamentally
        deflationary value accrual mechanism for token holders.
      </p>
    </>
  );
}
