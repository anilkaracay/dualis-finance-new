/**
 * Database seed script.
 *
 * Run with: npx tsx src/db/seed.ts
 *
 * Inserts realistic mock data for local development and testing.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/dualis';

function log(msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[seed ${ts}] ${msg}`);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomElement<T>(arr: readonly T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx]!;
}

// ---------------------------------------------------------------------------
// Pool definitions
// ---------------------------------------------------------------------------

const POOLS = [
  { poolId: 'pool-usdc', asset: 'USDC', basePrice: 1.0, baseSupply: 50_000_000, baseBorrow: 35_000_000 },
  { poolId: 'pool-eth', asset: 'ETH', basePrice: 3200, baseSupply: 15_000, baseBorrow: 8_000 },
  { poolId: 'pool-btc', asset: 'BTC', basePrice: 65_000, baseSupply: 500, baseBorrow: 250 },
  { poolId: 'pool-usd1', asset: 'USD1', basePrice: 1.0, baseSupply: 30_000_000, baseBorrow: 20_000_000 },
  { poolId: 'pool-tbill', asset: 'T-BILL-2026', basePrice: 99.5, baseSupply: 200_000, baseBorrow: 50_000 },
  { poolId: 'pool-spy', asset: 'SPY-2026', basePrice: 520, baseSupply: 10_000, baseBorrow: 3_000 },
] as const;

const USERS = [
  'party::alice::1',
  'party::bob::2',
  'party::carol::3',
  'party::dave::4',
  'party::eve::5',
] as const;

const ACTIVITY_TYPES = ['deposit', 'withdraw', 'borrow', 'repay', 'sec_lend', 'vote'] as const;
const LIQUIDATION_TIERS = ['MarginCall', 'SoftLiquidation', 'ForcedLiquidation', 'FullLiquidation'] as const;
const SEC_STATUSES = ['Active', 'Settled', 'RecallRequested'] as const;

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  log('Connecting to database...');
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // -----------------------------------------------------------------------
    // 1. Pool snapshots — 6 pools x 30 days
    // -----------------------------------------------------------------------
    log('Inserting pool snapshots...');
    const poolSnapshotRows: (typeof schema.poolSnapshots.$inferInsert)[] = [];

    for (const pool of POOLS) {
      for (let day = 29; day >= 0; day--) {
        const drift = 1 + (Math.random() - 0.5) * 0.1; // +/-5%
        const supply = pool.baseSupply * drift;
        const borrow = pool.baseBorrow * drift * randomBetween(0.9, 1.1);
        const reserves = supply * 0.02 * randomBetween(0.8, 1.2);
        const utilization = borrow / supply;
        const supplyAPY = utilization * randomBetween(0.02, 0.08);
        const borrowAPY = supplyAPY * randomBetween(1.2, 1.5);
        const price = pool.basePrice * (1 + (Math.random() - 0.5) * 0.04);

        poolSnapshotRows.push({
          poolId: pool.poolId,
          totalSupply: supply.toFixed(8),
          totalBorrow: borrow.toFixed(8),
          totalReserves: reserves.toFixed(8),
          supplyAPY,
          borrowAPY,
          utilization,
          priceUSD: price.toFixed(8),
          timestamp: daysAgo(day),
        });
      }
    }

    await db.insert(schema.poolSnapshots).values(poolSnapshotRows);
    log(`  Inserted ${poolSnapshotRows.length} pool snapshots`);

    // -----------------------------------------------------------------------
    // 2. Price history — 6 assets x 30 days
    // -----------------------------------------------------------------------
    log('Inserting price history...');
    const priceRows: (typeof schema.priceHistory.$inferInsert)[] = [];

    for (const pool of POOLS) {
      for (let day = 29; day >= 0; day--) {
        const price = pool.basePrice * (1 + (Math.random() - 0.5) * 0.04);
        priceRows.push({
          asset: pool.asset,
          price: price.toFixed(8),
          confidence: randomBetween(0.95, 1.0),
          source: 'Chainlink Data Streams',
          timestamp: daysAgo(day),
        });
      }
    }

    await db.insert(schema.priceHistory).values(priceRows);
    log(`  Inserted ${priceRows.length} price history records`);

    // -----------------------------------------------------------------------
    // 3. Credit scores — 5 users
    // -----------------------------------------------------------------------
    log('Inserting credit score cache...');
    const creditRows: (typeof schema.creditScoreCache.$inferInsert)[] = [];

    for (let i = 0; i < USERS.length; i++) {
      const rawScore = randomBetween(300, 950);
      const tier =
        rawScore >= 850 ? 'Diamond' :
        rawScore >= 700 ? 'Gold' :
        rawScore >= 500 ? 'Silver' :
        rawScore >= 300 ? 'Bronze' : 'Unrated';

      creditRows.push({
        partyId: USERS[i]!,
        rawScore,
        creditTier: tier,
        breakdown: {
          loanCompletion: { score: Math.round(rawScore * 0.3), max: 300 },
          repaymentTimeliness: { score: Math.round(rawScore * 0.25), max: 250 },
          volumeHistory: { score: Math.round(rawScore * 0.2), max: 200 },
          collateralHealth: { score: Math.round(rawScore * 0.15), max: 150 },
          securitiesLending: { score: Math.round(rawScore * 0.1), max: 100 },
        },
        lastUpdated: new Date(),
      });
    }

    await db.insert(schema.creditScoreCache).values(creditRows);
    log(`  Inserted ${creditRows.length} credit scores`);

    // -----------------------------------------------------------------------
    // 4. User activity — 20 events
    // -----------------------------------------------------------------------
    log('Inserting user activity...');
    const activityRows: (typeof schema.userActivity.$inferInsert)[] = [];

    for (let i = 0; i < 20; i++) {
      const pool = randomElement(POOLS);
      const activityType = randomElement(ACTIVITY_TYPES);
      activityRows.push({
        partyId: randomElement(USERS),
        activityType,
        poolId: activityType === 'vote' ? null : pool.poolId,
        amount: activityType === 'vote' ? null : randomBetween(100, 100000).toFixed(8),
        transactionId: `tx-${crypto.randomUUID().slice(0, 8)}`,
        metadata: { source: 'seed', index: i },
        timestamp: daysAgo(Math.floor(randomBetween(0, 29))),
      });
    }

    await db.insert(schema.userActivity).values(activityRows);
    log(`  Inserted ${activityRows.length} activity events`);

    // -----------------------------------------------------------------------
    // 5. Liquidation events — 3 events
    // -----------------------------------------------------------------------
    log('Inserting liquidation events...');
    const liqRows: (typeof schema.liquidationEvents.$inferInsert)[] = [];

    for (let i = 0; i < 3; i++) {
      const pool = randomElement(POOLS);
      const hfBefore = randomBetween(0.75, 0.98);
      liqRows.push({
        borrower: randomElement(USERS),
        liquidator: `party::liquidator::${i + 1}`,
        poolId: pool.poolId,
        borrowPositionId: `borrow-pos-${crypto.randomUUID().slice(0, 8)}`,
        collateralSeized: randomBetween(1000, 50000).toFixed(8),
        liquidatorReward: randomBetween(50, 2500).toFixed(8),
        protocolFee: randomBetween(10, 500).toFixed(8),
        healthFactorBefore: hfBefore,
        healthFactorAfter: randomBetween(1.05, 1.5),
        tier: randomElement(LIQUIDATION_TIERS),
        timestamp: daysAgo(Math.floor(randomBetween(0, 15))),
      });
    }

    await db.insert(schema.liquidationEvents).values(liqRows);
    log(`  Inserted ${liqRows.length} liquidation events`);

    // -----------------------------------------------------------------------
    // 6. Securities lending history — 5 entries
    // -----------------------------------------------------------------------
    log('Inserting sec lending history...');
    const secRows: (typeof schema.secLendingHistory.$inferInsert)[] = [];

    for (let i = 0; i < 5; i++) {
      const startDay = Math.floor(randomBetween(10, 25));
      const status = randomElement(SEC_STATUSES);
      secRows.push({
        dealId: `deal-${crypto.randomUUID().slice(0, 8)}`,
        offerId: `offer-${crypto.randomUUID().slice(0, 8)}`,
        lender: USERS[i % USERS.length]!,
        borrower: USERS[(i + 1) % USERS.length]!,
        security: { symbol: randomElement(['SPY-2026', 'T-BILL-2026', 'T-NOTE-10Y']), amount: randomBetween(10, 500).toFixed(2), type: 'TokenizedEquity' },
        status,
        feeAccrued: randomBetween(50, 5000).toFixed(8),
        startDate: daysAgo(startDay),
        endDate: status === 'Settled' ? daysAgo(Math.floor(randomBetween(0, startDay - 1))) : null,
        timestamp: daysAgo(startDay),
      });
    }

    await db.insert(schema.secLendingHistory).values(secRows);
    log(`  Inserted ${secRows.length} sec lending entries`);

    // -----------------------------------------------------------------------
    // 7. Governance proposals — 3 proposals
    // -----------------------------------------------------------------------
    log('Inserting governance proposals...');
    const proposalRows: (typeof schema.governanceProposals.$inferInsert)[] = [];

    const proposals = [
      { id: 'DIP-001', title: 'Reduce USDC Reserve Factor to 5%', category: 'parameter_change', status: 'executed' },
      { id: 'DIP-002', title: 'Add T-NOTE-10Y as Collateral Asset', category: 'asset_listing', status: 'active' },
      { id: 'DIP-003', title: 'Protocol v2.0 Upgrade Roadmap', category: 'protocol_upgrade', status: 'passed' },
    ] as const;

    for (const p of proposals) {
      const startDay = p.status === 'executed' ? 20 : p.status === 'passed' ? 10 : 2;
      proposalRows.push({
        proposalId: p.id,
        title: p.title,
        description: `Full description for proposal ${p.id}: ${p.title}. This proposal aims to improve protocol efficiency and user experience.`,
        category: p.category,
        proposer: randomElement(USERS),
        status: p.status,
        forVotes: randomBetween(100_000, 500_000).toFixed(8),
        againstVotes: randomBetween(10_000, 100_000).toFixed(8),
        abstainVotes: randomBetween(1_000, 20_000).toFixed(8),
        quorum: '100000.00000000',
        startTime: daysAgo(startDay),
        endTime: daysAgo(Math.max(0, startDay - 7)),
        executedAt: p.status === 'executed' ? daysAgo(startDay - 8) : null,
      });
    }

    await db.insert(schema.governanceProposals).values(proposalRows);
    log(`  Inserted ${proposalRows.length} governance proposals`);

    // -----------------------------------------------------------------------
    // 8. Protocol analytics — 30 days
    // -----------------------------------------------------------------------
    log('Inserting protocol analytics...');
    const analyticsRows: (typeof schema.protocolAnalytics.$inferInsert)[] = [];

    for (let day = 29; day >= 0; day--) {
      const d = daysAgo(day);
      const dateStr = d.toISOString().split('T')[0]!;
      const tvlBase = 250_000_000;
      const drift = 1 + (Math.random() - 0.5) * 0.1;

      analyticsRows.push({
        date: dateStr,
        tvl: (tvlBase * drift).toFixed(8),
        totalBorrowed: (tvlBase * 0.6 * drift).toFixed(8),
        totalFees: randomBetween(10_000, 50_000).toFixed(8),
        totalLiquidations: randomBetween(0, 100_000).toFixed(8),
        uniqueUsers: Math.floor(randomBetween(200, 800)),
        totalTransactions: Math.floor(randomBetween(1000, 5000)),
        avgHealthFactor: randomBetween(1.3, 2.0),
        secLendingVolume: randomBetween(500_000, 5_000_000).toFixed(8),
        flashLoanVolume: randomBetween(1_000_000, 10_000_000).toFixed(8),
        protocolRevenue: randomBetween(5_000, 25_000).toFixed(8),
      });
    }

    await db.insert(schema.protocolAnalytics).values(analyticsRows);
    log(`  Inserted ${analyticsRows.length} analytics records`);

    // -----------------------------------------------------------------------
    // Done
    // -----------------------------------------------------------------------
    log('Seed completed successfully!');
  } catch (err) {
    log(`Seed failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    await client.end();
    log('Database connection closed');
  }
}

seed();
