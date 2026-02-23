/**
 * Database seed script.
 *
 * Run with: npx tsx src/db/seed.ts
 *
 * Inserts realistic mock data for local development and testing.
 */
import { createHash } from 'node:crypto';
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
    // 7. Governance proposals — 3 proposals (MP23 schema)
    // -----------------------------------------------------------------------
    log('Inserting governance proposals...');
    const proposalRows: (typeof schema.governanceProposals.$inferInsert)[] = [];

    const proposals = [
      { id: 'DIP-1', num: 1, title: 'Reduce USDC Reserve Factor to 5%', type: 'PARAMETER_CHANGE', status: 'EXECUTED' },
      { id: 'DIP-2', num: 2, title: 'Add T-NOTE-10Y as Collateral Asset', type: 'COLLATERAL_ADD', status: 'ACTIVE' },
      { id: 'DIP-3', num: 3, title: 'Protocol v2.0 Upgrade Roadmap', type: 'PROTOCOL_UPGRADE', status: 'PASSED' },
    ] as const;

    for (const p of proposals) {
      const startDay = p.status === 'EXECUTED' ? 20 : p.status === 'PASSED' ? 10 : 2;
      const proposer = randomElement(USERS);
      proposalRows.push({
        id: p.id,
        proposalNumber: p.num,
        proposerId: proposer,
        proposerAddress: proposer,
        title: p.title,
        description: `Full description for proposal ${p.id}: ${p.title}. This proposal aims to improve protocol efficiency and user experience. It has been thoroughly reviewed by the risk committee and community members.`,
        type: p.type,
        payload: { type: p.type, data: { rationale: 'Seed data' } },
        status: p.status,
        snapshotBlock: p.num,
        votingStartsAt: daysAgo(startDay),
        votingEndsAt: daysAgo(Math.max(0, startDay - 7)),
        votesFor: randomBetween(100_000, 500_000).toFixed(8),
        votesAgainst: randomBetween(10_000, 100_000).toFixed(8),
        votesAbstain: randomBetween(1_000, 20_000).toFixed(8),
        totalVoters: Math.floor(randomBetween(10, 100)),
        quorumRequired: '100000.00000000',
        quorumMet: true,
        executedAt: p.status === 'EXECUTED' ? daysAgo(startDay - 8) : null,
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
    // 9. Credit Attestations — 5 entries
    // -----------------------------------------------------------------------
    log('Inserting credit attestations...');
    const attestationProviders = ['findeks', 'experian', 'transunion', 'tifa', 'chainlink'] as const;
    const attestationTypes = ['credit_bureau', 'income_verification', 'business_verification', 'kyc_completion', 'tifa_performance'] as const;
    const claimedRanges = ['excellent', 'good', 'above_700', 'verified', 'high_performance'] as const;
    const attestationRows: (typeof schema.creditAttestations.$inferInsert)[] = [];

    for (let i = 0; i < 5; i++) {
      const isExpired = i === 3;
      const isRevoked = i === 4;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      attestationRows.push({
        attestationId: `att-${crypto.randomUUID().slice(0, 8)}`,
        partyId: USERS[i % USERS.length]!,
        attestationType: attestationTypes[i]!,
        provider: attestationProviders[i]!,
        claimedRange: claimedRanges[i]!,
        proof: { proofData: `zkp-${i}-mock`, verifierKey: `vk-${i}`, publicInputs: ['inp1', 'inp2'], circuit: `circuit-v${i + 1}`, generatedAt: daysAgo(i + 1).toISOString() },
        issuedAt: daysAgo(30 + i * 10),
        expiresAt: isExpired ? daysAgo(1) : futureDate,
        revoked: isRevoked,
        verified: !isRevoked && !isExpired,
      });
    }
    await db.insert(schema.creditAttestations).values(attestationRows);
    log(`  Inserted ${attestationRows.length} credit attestations`);

    // -----------------------------------------------------------------------
    // 10. Composite Scores — 5 entries
    // -----------------------------------------------------------------------
    log('Inserting composite scores...');
    const compScoreRows: (typeof schema.compositeScores.$inferInsert)[] = [];
    for (let i = 0; i < USERS.length; i++) {
      const onChain = Math.round(randomBetween(180, 360));
      const offChain = Math.round(randomBetween(100, 300));
      const ecosystem = Math.round(randomBetween(50, 200));
      const total = onChain + offChain + ecosystem;
      const tier = total >= 850 ? 'Diamond' : total >= 700 ? 'Gold' : total >= 500 ? 'Silver' : total >= 300 ? 'Bronze' : 'Unrated';
      compScoreRows.push({
        partyId: USERS[i]!,
        compositeScore: total,
        tier,
        onChainScore: onChain,
        offChainScore: offChain,
        ecosystemScore: ecosystem,
        onChainDetail: { loanCompletion: Math.round(onChain * 0.375), repaymentSpeed: Math.round(onChain * 0.25), collateralHealth: Math.round(onChain * 0.2), protocolHistory: Math.round(onChain * 0.1), secLendingRecord: Math.round(onChain * 0.075), total: onChain },
        offChainDetail: { creditBureauScore: Math.round(offChain * 0.43), incomeVerification: Math.round(offChain * 0.29), businessVerification: Math.round(offChain * 0.14), kycCompletion: Math.round(offChain * 0.14), total: offChain },
        ecosystemDetail: { tifaPerformance: Math.round(ecosystem * 0.4), crossProtocolRefs: Math.round(ecosystem * 0.32), governanceStaking: Math.round(ecosystem * 0.28), total: ecosystem },
        benefits: tier === 'Diamond' ? { maxLTV: 0.85, rateDiscount: 0.25, minCollateralRatio: 1.15, liquidationBuffer: 0.05 } : tier === 'Gold' ? { maxLTV: 0.78, rateDiscount: 0.15, minCollateralRatio: 1.25, liquidationBuffer: 0.08 } : { maxLTV: 0.70, rateDiscount: 0.08, minCollateralRatio: 1.35, liquidationBuffer: 0.10 },
        lastCalculated: new Date(),
      });
    }
    await db.insert(schema.compositeScores).values(compScoreRows);
    log(`  Inserted ${compScoreRows.length} composite scores`);

    // -----------------------------------------------------------------------
    // 11. Productive Projects — 6 projects
    // -----------------------------------------------------------------------
    log('Inserting productive projects...');
    const projectCategories = ['SolarEnergy', 'SolarEnergy', 'WindEnergy', 'DataCenter', 'SupplyChain', 'EquipmentLeasing'] as const;
    const projectStatuses = ['Operational', 'InConstruction', 'Funded', 'Approved', 'Proposed', 'UnderReview'] as const;
    const projectLocations = ['Istanbul, TR', 'Antalya, TR', 'Izmir, TR', 'Frankfurt, DE', 'Dubai, AE', 'Zurich, CH'] as const;
    const esgRatings = ['A', 'A', 'B', 'B', 'C', 'Unrated'] as const;
    const projectRows: (typeof schema.productiveProjects.$inferInsert)[] = [];
    for (let i = 0; i < 6; i++) {
      projectRows.push({
        projectId: `proj-${String(i + 1).padStart(3, '0')}`,
        ownerPartyId: USERS[i % USERS.length]!,
        category: projectCategories[i]!,
        status: projectStatuses[i]!,
        metadata: { location: projectLocations[i], capacity: i < 3 ? `${Math.round(randomBetween(5, 50))} MW` : null, offTaker: i < 2 ? 'National Grid Corp' : null, insurancePolicy: `POL-${crypto.randomUUID().slice(0, 6)}`, independentValue: randomBetween(1_000_000, 50_000_000).toFixed(2), expectedIRR: randomBetween(0.08, 0.18), constructionPeriod: Math.floor(randomBetween(6, 24)), operationalLife: Math.floor(randomBetween(15, 30)), esgRating: esgRatings[i], iotFeedId: i < 2 ? `iot-feed-${i + 1}` : null },
        attestations: [`att-proj-${i}`],
        requestedAmount: randomBetween(500_000, 20_000_000).toFixed(8),
        fundedAmount: ['Operational', 'InConstruction', 'Funded'].includes(projectStatuses[i]!) ? randomBetween(500_000, 15_000_000).toFixed(8) : '0.00000000',
      });
    }
    await db.insert(schema.productiveProjects).values(projectRows);
    log(`  Inserted ${projectRows.length} productive projects`);

    // -----------------------------------------------------------------------
    // 12. Productive Borrows — 4 entries
    // -----------------------------------------------------------------------
    log('Inserting productive borrows...');
    const prodBorrowStatuses = ['Active', 'Repaying', 'GracePeriod', 'Active'] as const;
    const prodBorrowRows: (typeof schema.productiveBorrows.$inferInsert)[] = [];
    for (let i = 0; i < 4; i++) {
      const loanAmt = randomBetween(500_000, 10_000_000);
      const outstanding = loanAmt * randomBetween(0.3, 0.95);
      const futureGrace = new Date(); futureGrace.setDate(futureGrace.getDate() + 30);
      const futureMaturity = new Date(); futureMaturity.setDate(futureMaturity.getDate() + 365);
      prodBorrowRows.push({
        borrowId: `pborrow-${String(i + 1).padStart(3, '0')}`,
        borrowerParty: USERS[i % USERS.length]!,
        projectId: `proj-${String(i + 1).padStart(3, '0')}`,
        poolId: randomElement(POOLS).poolId,
        loanAmount: loanAmt.toFixed(8),
        outstandingDebt: outstanding.toFixed(8),
        interestRate: randomBetween(0.04, 0.09),
        collateral: { cryptoCollateral: (loanAmt * 0.3).toFixed(2), projectAssetValue: (loanAmt * 0.5).toFixed(2), tifaCollateral: (loanAmt * 0.2).toFixed(2), totalValue: loanAmt.toFixed(2), cryptoRatio: 0.3 },
        gracePeriodEnd: futureGrace,
        maturityDate: futureMaturity,
        status: prodBorrowStatuses[i]!,
      });
    }
    await db.insert(schema.productiveBorrows).values(prodBorrowRows);
    log(`  Inserted ${prodBorrowRows.length} productive borrows`);

    // -----------------------------------------------------------------------
    // 13. Productive Cashflows — 12 months per borrow
    // -----------------------------------------------------------------------
    log('Inserting productive cashflows...');
    const cashflowSources = ['energy_sales', 'lease_income', 'export_revenue', 'equipment_lease'] as const;
    const cashflowRows: (typeof schema.productiveCashflows.$inferInsert)[] = [];
    for (let b = 0; b < 4; b++) {
      for (let m = 0; m < 12; m++) {
        const isPast = m < 6;
        const cfDate = new Date();
        cfDate.setDate(cfDate.getDate() + (isPast ? (m - 6) * 30 : (m - 5) * 30));
        cashflowRows.push({
          borrowId: `pborrow-${String(b + 1).padStart(3, '0')}`,
          expectedDate: cfDate,
          expectedAmount: randomBetween(20_000, 200_000).toFixed(8),
          actualAmount: isPast ? randomBetween(18_000, 210_000).toFixed(8) : null,
          source: cashflowSources[b % cashflowSources.length]!,
          status: isPast ? (Math.random() > 0.1 ? 'Received' : 'Partial') : 'Projected',
        });
      }
    }
    await db.insert(schema.productiveCashflows).values(cashflowRows);
    log(`  Inserted ${cashflowRows.length} productive cashflows`);

    // -----------------------------------------------------------------------
    // 14. IoT Readings — every 4 hours for 30 days, 2 projects
    // -----------------------------------------------------------------------
    log('Inserting IoT readings...');
    const iotRows: (typeof schema.iotReadings.$inferInsert)[] = [];
    for (const projIdx of [0, 1]) {
      for (let day = 29; day >= 0; day--) {
        for (let hour = 0; hour < 24; hour += 4) {
          const d = daysAgo(day);
          d.setHours(hour, 0, 0, 0);
          iotRows.push({
            projectId: `proj-${String(projIdx + 1).padStart(3, '0')}`,
            metricType: 'solar_output_kw',
            value: hour >= 6 && hour <= 18 ? randomBetween(200, 800) : randomBetween(0, 50),
            unit: 'kW',
            timestamp: d,
          });
        }
      }
    }
    await db.insert(schema.iotReadings).values(iotRows);
    log(`  Inserted ${iotRows.length} IoT readings`);

    // -----------------------------------------------------------------------
    // 15. Fractional Offers — 3 entries
    // -----------------------------------------------------------------------
    log('Inserting fractional offers...');
    const fracSecurities = ['AAPL', 'TSLA', 'SPY'] as const;
    const fracOfferRows: (typeof schema.fractionalOffers.$inferInsert)[] = [];
    for (let i = 0; i < 3; i++) {
      const total = randomBetween(10_000, 100_000);
      const remaining = total * randomBetween(0.2, 0.8);
      fracOfferRows.push({
        offerId: `frac-offer-${String(i + 1).padStart(3, '0')}`,
        lender: USERS[i % USERS.length]!,
        security: { symbol: fracSecurities[i], amount: total, type: 'TokenizedEquity' },
        totalAmount: total.toFixed(8),
        remainingAmount: remaining.toFixed(8),
        minFillAmount: (total * 0.05).toFixed(8),
        feeRate: randomBetween(0.15, 0.50),
        fills: i > 0 ? [{ filledBy: USERS[(i + 1) % USERS.length], amount: (total - remaining).toFixed(8), filledAt: daysAgo(i).toISOString() }] : [],
        isActive: true,
      });
    }
    await db.insert(schema.fractionalOffers).values(fracOfferRows);
    log(`  Inserted ${fracOfferRows.length} fractional offers`);

    // -----------------------------------------------------------------------
    // 16. Netting Agreements — 1 entry
    // -----------------------------------------------------------------------
    log('Inserting netting agreements...');
    await db.insert(schema.nettingAgreements).values([{
      agreementId: 'net-001',
      partyA: USERS[0]!,
      partyB: USERS[1]!,
      dealIds: ['deal-001', 'deal-002'],
      netAmount: randomBetween(5_000, 50_000).toFixed(8),
      netDirection: 'partyA_owes',
      status: 'proposed',
    }]);
    log('  Inserted 1 netting agreement');

    // -----------------------------------------------------------------------
    // 17. Corporate Actions — 2 entries
    // -----------------------------------------------------------------------
    log('Inserting corporate actions...');
    await db.insert(schema.corporateActions).values([
      { actionId: 'ca-001', dealId: 'deal-001', actionType: 'Dividend', security: 'AAPL', recordDate: daysAgo(5), paymentDate: daysAgo(2), amount: '2500.00000000', status: 'processed', processedAt: daysAgo(2) },
      { actionId: 'ca-002', dealId: 'deal-003', actionType: 'CouponPayment', security: 'US-T10Y', recordDate: daysAgo(1), paymentDate: daysAgo(-5), amount: '12500.00000000', status: 'pending' },
    ]);
    log('  Inserted 2 corporate actions');

    // -----------------------------------------------------------------------
    // 18. Verified Institutions — 3 entries
    // -----------------------------------------------------------------------
    log('Inserting verified institutions...');
    const futureExpiry = new Date(); futureExpiry.setDate(futureExpiry.getDate() + 305);
    const futureExpiry2 = new Date(); futureExpiry2.setDate(futureExpiry2.getDate() + 335);
    await db.insert(schema.verifiedInstitutions).values([
      { institutionParty: 'party::institution-tr-001', legalName: 'Cayvox Capital A.Ş.', registrationNo: 'TR-MKK-2024-001', jurisdiction: 'TR', kybStatus: 'Verified', kybLevel: 'Full', riskProfile: { riskCategory: 'low', maxSingleExposure: '50000000', maxTotalExposure: '200000000', allowedProducts: ['lending', 'secLending', 'staking'], jurisdictionRules: ['TR', 'EU'] }, subAccounts: ['party::sub-tr-001', 'party::sub-tr-002'], verifiedAt: daysAgo(60), expiresAt: futureExpiry },
      { institutionParty: 'party::institution-us-001', legalName: 'Canton Trust LLC', registrationNo: 'US-SEC-2024-001', jurisdiction: 'US', kybStatus: 'Verified', kybLevel: 'Enhanced', riskProfile: { riskCategory: 'medium', maxSingleExposure: '25000000', maxTotalExposure: '100000000', allowedProducts: ['lending', 'secLending'], jurisdictionRules: ['US'] }, subAccounts: [], verifiedAt: daysAgo(30), expiresAt: futureExpiry2 },
      { institutionParty: 'party::institution-ch-001', legalName: 'Helvetia Digital AG', registrationNo: 'CH-FINMA-2024-001', jurisdiction: 'CH', kybStatus: 'InReview', kybLevel: 'Basic', riskProfile: { riskCategory: 'low', maxSingleExposure: '100000000', maxTotalExposure: '500000000', allowedProducts: ['lending'], jurisdictionRules: ['CH', 'EU'] }, subAccounts: [] },
    ]);
    log('  Inserted 3 verified institutions');

    // -----------------------------------------------------------------------
    // 19. Privacy Configs — 5 entries
    // -----------------------------------------------------------------------
    log('Inserting privacy configs...');
    const privacyLevels = ['Public', 'Selective', 'Maximum', 'Public', 'Selective'] as const;
    const privacyRows: (typeof schema.privacyConfigs.$inferInsert)[] = [];
    for (let i = 0; i < USERS.length; i++) {
      const rules = privacyLevels[i] === 'Selective' ? [
        { id: `rule-${i}-1`, discloseTo: 'party::regulator::sec', displayName: 'SEC Reporting', dataScope: 'All', purpose: 'Regulatory compliance', expiresAt: null, isActive: true, createdAt: daysAgo(30).toISOString() },
      ] : [];
      privacyRows.push({
        partyId: USERS[i]!,
        privacyLevel: privacyLevels[i]!,
        disclosureRules: rules,
        auditTrailEnabled: true,
      });
    }
    await db.insert(schema.privacyConfigs).values(privacyRows);
    log(`  Inserted ${privacyRows.length} privacy configs`);

    // -----------------------------------------------------------------------
    // 20. Demo Auth Users — retail + institutional
    // -----------------------------------------------------------------------
    log('Inserting demo auth users...');

    // bcrypt hash of "Demo1234!" — pre-computed to avoid requiring bcrypt in seed
    // Generated with: await bcrypt.hash('Demo1234!', 12)
    const demoPasswordHash = '$2b$12$BqdXy89V7JJbbbx/9y9Dy.CT3oaTKUIGOoUS6x9MogXc8iKeBGOz2';

    // Retail demo user
    await db.insert(schema.users).values({
      userId: 'user_demo_retail_001',
      email: 'demo@dualis.finance',
      passwordHash: demoPasswordHash,
      role: 'retail',
      accountStatus: 'active',
      authProvider: 'email',
      emailVerified: true,
      emailVerifiedAt: daysAgo(30),
      partyId: 'party::alice::1',
      displayName: 'Alice Demo',
      kycStatus: 'verified',
      lastLoginAt: daysAgo(1),
    }).onConflictDoNothing();

    await db.insert(schema.retailProfiles).values({
      userId: 'user_demo_retail_001',
      firstName: 'Alice',
      lastName: 'Demo',
      country: 'US',
      onboardingCompleted: true,
    }).onConflictDoNothing();

    // Second retail user
    await db.insert(schema.users).values({
      userId: 'user_demo_retail_002',
      email: 'bob@dualis.finance',
      passwordHash: demoPasswordHash,
      role: 'retail',
      accountStatus: 'active',
      authProvider: 'email',
      emailVerified: true,
      emailVerifiedAt: daysAgo(25),
      partyId: 'party::bob::2',
      displayName: 'Bob Trader',
      kycStatus: 'verified',
      lastLoginAt: daysAgo(2),
    }).onConflictDoNothing();

    await db.insert(schema.retailProfiles).values({
      userId: 'user_demo_retail_002',
      firstName: 'Bob',
      lastName: 'Trader',
      country: 'DE',
      onboardingCompleted: true,
    }).onConflictDoNothing();

    // Institutional demo user (verified)
    await db.insert(schema.users).values({
      userId: 'user_demo_inst_001',
      email: 'institutional@dualis.finance',
      passwordHash: demoPasswordHash,
      role: 'institutional',
      accountStatus: 'active',
      authProvider: 'email',
      emailVerified: true,
      emailVerifiedAt: daysAgo(60),
      partyId: 'party::institution-tr-001',
      displayName: 'Cayvox Capital',
      kycStatus: 'verified',
      lastLoginAt: daysAgo(1),
    }).onConflictDoNothing();

    await db.insert(schema.institutions).values({
      institutionId: 'inst_demo_001',
      userId: 'user_demo_inst_001',
      companyName: 'Cayvox Capital',
      companyLegalName: 'Cayvox Capital A.S.',
      registrationNumber: 'TR-MKK-2024-001',
      taxId: 'TR-1234567890',
      jurisdiction: 'TR',
      companyType: 'asset_management',
      website: 'https://cayvox.capital',
      addressLine1: 'Levent Mah. Buyukdere Cad. No:1',
      city: 'Istanbul',
      country: 'TR',
      postalCode: '34330',
      repFirstName: 'Mehmet',
      repLastName: 'Ozkaya',
      repTitle: 'Chief Compliance Officer',
      repEmail: 'compliance@cayvox.capital',
      repPhone: '+90-212-555-0100',
      kybStatus: 'verified',
      onboardingStep: 7,
      kybSubmittedAt: daysAgo(65),
      kybApprovedAt: daysAgo(58),
      beneficialOwners: [
        { id: 'ubo-001', firstName: 'Mehmet', lastName: 'Ozkaya', ownershipPercent: 60, isPEP: false, idVerified: true },
        { id: 'ubo-002', firstName: 'Elif', lastName: 'Demir', ownershipPercent: 40, isPEP: false, idVerified: true },
      ],
      riskProfile: {
        riskCategory: 'low',
        maxSingleExposure: '50000000',
        maxTotalExposure: '200000000',
        allowedProducts: ['lending', 'secLending', 'staking'],
        jurisdictionRules: ['TR', 'EU'],
      },
    }).onConflictDoNothing();

    // Institutional user (pending KYB)
    await db.insert(schema.users).values({
      userId: 'user_demo_inst_002',
      email: 'onboarding@cantontrustllc.com',
      passwordHash: demoPasswordHash,
      role: 'institutional',
      accountStatus: 'pending_verification',
      authProvider: 'email',
      emailVerified: true,
      emailVerifiedAt: daysAgo(10),
      partyId: 'party::institution-us-001',
      displayName: 'Canton Trust LLC',
      kycStatus: 'not_started',
      lastLoginAt: daysAgo(3),
    }).onConflictDoNothing();

    await db.insert(schema.institutions).values({
      institutionId: 'inst_demo_002',
      userId: 'user_demo_inst_002',
      companyName: 'Canton Trust LLC',
      companyLegalName: 'Canton Trust LLC',
      registrationNumber: 'US-SEC-2024-001',
      jurisdiction: 'US',
      companyType: 'trust_company',
      repFirstName: 'Sarah',
      repLastName: 'Johnson',
      repTitle: 'Managing Director',
      repEmail: 'sarah@cantontrustllc.com',
      kybStatus: 'under_review',
      onboardingStep: 7,
      kybSubmittedAt: daysAgo(5),
    }).onConflictDoNothing();

    // Demo API key for institutional user (sha256 of "dualis_test_key_cayvox_001")
    const demoApiKeyHash = createHash('sha256').update('dualis_test_key_cayvox_001').digest('hex');
    await db.insert(schema.apiKeys).values({
      keyHash: demoApiKeyHash,
      name: 'Demo API Key',
      partyId: 'party::institution-tr-001',
      isActive: true,
      permissions: ['read', 'trade'],
    }).onConflictDoNothing();

    log('  Inserted 4 demo users (2 retail + 2 institutional) and 1 demo API key');
    log('  Demo credentials: demo@dualis.finance / Demo1234!');

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
