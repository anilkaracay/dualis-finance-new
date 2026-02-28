'use client';

import { Callout } from '@/components/docs/Callout';

export default function EcosystemPage() {
  return (
    <>
      <h1>Canton Ecosystem</h1>
      <p className="docs-lead">
        Canton is not a blockchain in isolation. It is a growing network of institutional
        participants spanning settlement, custody, issuance, liquidity, wallets, middleware,
        lending, and applications. This page maps the ecosystem and Dualis Finance&apos;s
        position within it.
      </p>

      <h2 id="ecosystem-map">Ecosystem Map</h2>
      <p>
        The following table outlines the major categories and participants in the Canton Network
        ecosystem. Each layer represents a distinct infrastructure function, and together they
        form the full stack required for institutional digital asset markets.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Participants</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Settlement</strong></td>
              <td>LSEG, Euroclear</td>
              <td>
                Post-trade settlement infrastructure. LSEG is building its digital asset platform
                on Canton. Euroclear&apos;s D-FMI handles bond settlement for regulated markets.
              </td>
            </tr>
            <tr>
              <td><strong>Custody</strong></td>
              <td>Fireblocks, BitGo</td>
              <td>
                Institutional-grade digital asset custody with multi-party computation (MPC)
                key management and insurance coverage for stored assets.
              </td>
            </tr>
            <tr>
              <td><strong>Issuers</strong></td>
              <td>DTCC, BlackRock</td>
              <td>
                Asset tokenization and issuance. DTCC processes $2.4 quadrillion annually and
                holds $99 trillion in custody. BlackRock&apos;s BUIDL fund represents the
                institutional entry into tokenized treasuries.
              </td>
            </tr>
            <tr>
              <td><strong>Liquidity</strong></td>
              <td>Cumberland DRW, Citadel</td>
              <td>
                Market-making and liquidity provision. These firms provide the trading
                infrastructure and deep order books that institutional markets require.
              </td>
            </tr>
            <tr>
              <td><strong>Wallets</strong></td>
              <td>Console, Loop</td>
              <td>
                Canton-native wallet interfaces that manage party identities, Canton Coin
                balances, and transaction signing for end users and institutions.
              </td>
            </tr>
            <tr>
              <td><strong>Middleware</strong></td>
              <td>PartyLayer</td>
              <td>
                Wallet SDK and identity middleware that abstracts Canton&apos;s party management
                for application developers. Dualis integrates PartyLayer for wallet connectivity.
              </td>
            </tr>
            <tr>
              <td><strong>Lending</strong></td>
              <td>Dualis Finance</td>
              <td>
                Institutional-grade hybrid lending protocol. Supports over-collateralized and
                under-collateralized lending with credit tiers, flash loans, and multi-asset
                collateral across crypto, RWA, and TIFA asset classes.
              </td>
            </tr>
            <tr>
              <td><strong>Applications</strong></td>
              <td>TIFA Finance</td>
              <td>
                Tokenized invoice factoring and trade finance. TIFA assets serve as a
                collateral class within Dualis, enabling supply chain finance participants
                to access lending markets.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="dualis-position">Where Dualis Fits</h2>
      <p>
        Dualis Finance occupies the lending layer of the Canton ecosystem. While settlement
        providers handle post-trade clearing, custodians secure assets, and issuers tokenize
        securities, Dualis enables these tokenized assets to be productively deployed. An
        institution holding tokenized U.S. Treasuries via DTCC can pledge them as collateral
        on Dualis to access short-term liquidity. A market maker can use flash loans to
        arbitrage price discrepancies across Canton synchronization domains.
      </p>
      <p>
        This positioning is deliberate. Lending is the connective tissue of financial markets.
        Every asset class -- equities, bonds, real estate, invoices -- eventually needs borrowing
        and lending infrastructure. By building on Canton, Dualis has direct access to the
        tokenized assets flowing through the network&apos;s settlement and custody layers.
      </p>

      <Callout type="tip" title="Composability">
        Canton&apos;s synchronization domains allow DAML contracts from different applications
        to compose atomically. A Dualis lending position can reference a TIFA invoice token
        or a DTCC-issued treasury bond in a single atomic transaction, without bridges or
        wrapped tokens.
      </Callout>

      <h2 id="network-effects">Network Effects</h2>
      <p>
        As more institutions deploy on Canton, the network effects compound. More tokenized
        assets mean more collateral options for Dualis pools. More liquidity providers mean
        tighter spreads and more efficient markets. More wallet providers mean broader user
        access. Canton&apos;s interoperable synchronization domain model means that assets
        created in one domain can flow into Dualis lending pools in another, expanding the
        total addressable market without requiring fragmented deployments.
      </p>
      <p>
        The Canton ecosystem is still in its early stages, but the participants are not
        startups experimenting with blockchain. They are the institutions that run global
        financial markets. That distinction shapes everything about how Dualis approaches
        product design, compliance, and go-to-market strategy.
      </p>
    </>
  );
}
