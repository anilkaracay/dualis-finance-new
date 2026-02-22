import {
  pgTable,
  serial,
  varchar,
  decimal,
  timestamp,
  boolean,
  jsonb,
  integer,
  text,
  date,
  real,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// 1. Pool Snapshots — periodic snapshots of lending pool state
// ---------------------------------------------------------------------------
export const poolSnapshots = pgTable('pool_snapshots', {
  id: serial('id').primaryKey(),
  poolId: varchar('pool_id', { length: 128 }).notNull(),
  totalSupply: decimal('total_supply', { precision: 38, scale: 18 }).notNull(),
  totalBorrow: decimal('total_borrow', { precision: 38, scale: 18 }).notNull(),
  totalReserves: decimal('total_reserves', { precision: 38, scale: 18 }).notNull(),
  supplyAPY: real('supply_apy').notNull(),
  borrowAPY: real('borrow_apy').notNull(),
  utilization: real('utilization').notNull(),
  priceUSD: decimal('price_usd', { precision: 28, scale: 8 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 2. Price History — oracle price feed snapshots
// ---------------------------------------------------------------------------
export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  asset: varchar('asset', { length: 64 }).notNull(),
  price: decimal('price', { precision: 28, scale: 8 }).notNull(),
  confidence: real('confidence').notNull(),
  source: varchar('source', { length: 128 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 3. User Activity — user-level events for activity tracking
// ---------------------------------------------------------------------------
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  activityType: varchar('activity_type', { length: 32 }).notNull(), // deposit | withdraw | borrow | repay | sec_lend | vote
  poolId: varchar('pool_id', { length: 128 }),
  amount: decimal('amount', { precision: 38, scale: 18 }),
  transactionId: varchar('transaction_id', { length: 256 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 4. Credit Score Cache — caches computed credit scores
// ---------------------------------------------------------------------------
export const creditScoreCache = pgTable('credit_score_cache', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull().unique(),
  rawScore: real('raw_score').notNull(),
  creditTier: varchar('credit_tier', { length: 32 }).notNull(),
  breakdown: jsonb('breakdown').$type<Record<string, unknown>>().notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 5. Liquidation Events — historical liquidation records
// ---------------------------------------------------------------------------
export const liquidationEvents = pgTable('liquidation_events', {
  id: serial('id').primaryKey(),
  borrower: varchar('borrower', { length: 256 }).notNull(),
  liquidator: varchar('liquidator', { length: 256 }).notNull(),
  poolId: varchar('pool_id', { length: 128 }).notNull(),
  borrowPositionId: varchar('borrow_position_id', { length: 256 }).notNull(),
  collateralSeized: decimal('collateral_seized', { precision: 38, scale: 18 }).notNull(),
  liquidatorReward: decimal('liquidator_reward', { precision: 38, scale: 18 }).notNull(),
  protocolFee: decimal('protocol_fee', { precision: 38, scale: 18 }).notNull(),
  healthFactorBefore: real('health_factor_before').notNull(),
  healthFactorAfter: real('health_factor_after').notNull(),
  tier: varchar('tier', { length: 32 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 6. Securities Lending History — sec lending deal records
// ---------------------------------------------------------------------------
export const secLendingHistory = pgTable('sec_lending_history', {
  id: serial('id').primaryKey(),
  dealId: varchar('deal_id', { length: 256 }).notNull(),
  offerId: varchar('offer_id', { length: 256 }).notNull(),
  lender: varchar('lender', { length: 256 }).notNull(),
  borrower: varchar('borrower', { length: 256 }).notNull(),
  security: jsonb('security').$type<Record<string, unknown>>().notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  feeAccrued: decimal('fee_accrued', { precision: 38, scale: 18 }).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 7. Governance Proposals — governance proposal records
// ---------------------------------------------------------------------------
export const governanceProposals = pgTable('governance_proposals', {
  id: serial('id').primaryKey(),
  proposalId: varchar('proposal_id', { length: 64 }).notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  proposer: varchar('proposer', { length: 256 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  forVotes: decimal('for_votes', { precision: 38, scale: 18 }).notNull(),
  againstVotes: decimal('against_votes', { precision: 38, scale: 18 }).notNull(),
  abstainVotes: decimal('abstain_votes', { precision: 38, scale: 18 }).notNull(),
  quorum: decimal('quorum', { precision: 38, scale: 18 }).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 8. Protocol Analytics — daily protocol-level aggregated metrics
// ---------------------------------------------------------------------------
export const protocolAnalytics = pgTable('protocol_analytics', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),
  tvl: decimal('tvl', { precision: 38, scale: 18 }).notNull(),
  totalBorrowed: decimal('total_borrowed', { precision: 38, scale: 18 }).notNull(),
  totalFees: decimal('total_fees', { precision: 38, scale: 18 }).notNull(),
  totalLiquidations: decimal('total_liquidations', { precision: 38, scale: 18 }).notNull(),
  uniqueUsers: integer('unique_users').notNull(),
  totalTransactions: integer('total_transactions').notNull(),
  avgHealthFactor: real('avg_health_factor').notNull(),
  secLendingVolume: decimal('sec_lending_volume', { precision: 38, scale: 18 }).notNull(),
  flashLoanVolume: decimal('flash_loan_volume', { precision: 38, scale: 18 }).notNull(),
  protocolRevenue: decimal('protocol_revenue', { precision: 38, scale: 18 }).notNull(),
});

// ---------------------------------------------------------------------------
// 9. Notification Preferences — per-user notification settings
// ---------------------------------------------------------------------------
export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull().unique(),
  healthFactorThreshold: real('health_factor_threshold').default(1.2).notNull(),
  liquidationAlerts: boolean('liquidation_alerts').default(true).notNull(),
  secLendingAlerts: boolean('sec_lending_alerts').default(true).notNull(),
  governanceAlerts: boolean('governance_alerts').default(false).notNull(),
  emailAddress: varchar('email_address', { length: 320 }),
  emailEnabled: boolean('email_enabled').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 10. API Keys — institutional/programmatic access keys
// ---------------------------------------------------------------------------
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  keyHash: varchar('key_hash', { length: 256 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  permissions: jsonb('permissions').$type<string[]>().notNull(),
  rateLimit: integer('rate_limit').default(1000).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});
