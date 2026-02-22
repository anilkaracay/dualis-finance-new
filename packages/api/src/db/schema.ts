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

// ===========================================================================
// INNOVATION TABLES (5 Strategic Innovations)
// ===========================================================================

// ---------------------------------------------------------------------------
// 11. Credit Attestations — ZK-proof off-chain attestations
// ---------------------------------------------------------------------------
export const creditAttestations = pgTable('credit_attestations', {
  id: serial('id').primaryKey(),
  attestationId: varchar('attestation_id', { length: 256 }).notNull().unique(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  attestationType: varchar('attestation_type', { length: 64 }).notNull(),
  provider: varchar('provider', { length: 128 }).notNull(),
  claimedRange: varchar('claimed_range', { length: 64 }).notNull(),
  proof: jsonb('proof').$type<Record<string, unknown>>().notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 12. Composite Scores — cached 3-layer composite credit scores
// ---------------------------------------------------------------------------
export const compositeScores = pgTable('composite_scores', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull().unique(),
  compositeScore: real('composite_score').notNull(),
  tier: varchar('tier', { length: 32 }).notNull(),
  onChainScore: real('on_chain_score').notNull(),
  offChainScore: real('off_chain_score').notNull(),
  ecosystemScore: real('ecosystem_score').notNull(),
  onChainDetail: jsonb('on_chain_detail').$type<Record<string, unknown>>().notNull(),
  offChainDetail: jsonb('off_chain_detail').$type<Record<string, unknown>>().notNull(),
  ecosystemDetail: jsonb('ecosystem_detail').$type<Record<string, unknown>>().notNull(),
  benefits: jsonb('benefits').$type<Record<string, unknown>>().notNull(),
  lastCalculated: timestamp('last_calculated', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 13. Productive Projects — real-economy project submissions
// ---------------------------------------------------------------------------
export const productiveProjects = pgTable('productive_projects', {
  id: serial('id').primaryKey(),
  projectId: varchar('project_id', { length: 256 }).notNull().unique(),
  ownerPartyId: varchar('owner_party_id', { length: 256 }).notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
  attestations: jsonb('attestations').$type<string[]>().notNull(),
  requestedAmount: decimal('requested_amount', { precision: 38, scale: 18 }).notNull(),
  fundedAmount: decimal('funded_amount', { precision: 38, scale: 18 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 14. Productive Borrows — loans backed by productive projects
// ---------------------------------------------------------------------------
export const productiveBorrows = pgTable('productive_borrows', {
  id: serial('id').primaryKey(),
  borrowId: varchar('borrow_id', { length: 256 }).notNull().unique(),
  borrowerParty: varchar('borrower_party', { length: 256 }).notNull(),
  projectId: varchar('project_id', { length: 256 }).notNull(),
  poolId: varchar('pool_id', { length: 128 }).notNull(),
  loanAmount: decimal('loan_amount', { precision: 38, scale: 18 }).notNull(),
  outstandingDebt: decimal('outstanding_debt', { precision: 38, scale: 18 }).notNull(),
  interestRate: real('interest_rate').notNull(),
  collateral: jsonb('collateral').$type<Record<string, unknown>>().notNull(),
  gracePeriodEnd: timestamp('grace_period_end', { withTimezone: true }).notNull(),
  maturityDate: timestamp('maturity_date', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 15. Productive Cashflows — expected & actual project cashflows
// ---------------------------------------------------------------------------
export const productiveCashflows = pgTable('productive_cashflows', {
  id: serial('id').primaryKey(),
  borrowId: varchar('borrow_id', { length: 256 }).notNull(),
  expectedDate: timestamp('expected_date', { withTimezone: true }).notNull(),
  expectedAmount: decimal('expected_amount', { precision: 38, scale: 18 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 38, scale: 18 }),
  source: varchar('source', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
});

// ---------------------------------------------------------------------------
// 16. IoT Readings — production monitoring for productive projects
// ---------------------------------------------------------------------------
export const iotReadings = pgTable('iot_readings', {
  id: serial('id').primaryKey(),
  projectId: varchar('project_id', { length: 256 }).notNull(),
  metricType: varchar('metric_type', { length: 64 }).notNull(),
  value: real('value').notNull(),
  unit: varchar('unit', { length: 32 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 17. Fractional Offers — partial fill sec lending offers
// ---------------------------------------------------------------------------
export const fractionalOffers = pgTable('fractional_offers', {
  id: serial('id').primaryKey(),
  offerId: varchar('offer_id', { length: 256 }).notNull().unique(),
  lender: varchar('lender', { length: 256 }).notNull(),
  security: jsonb('security').$type<Record<string, unknown>>().notNull(),
  totalAmount: decimal('total_amount', { precision: 38, scale: 18 }).notNull(),
  remainingAmount: decimal('remaining_amount', { precision: 38, scale: 18 }).notNull(),
  minFillAmount: decimal('min_fill_amount', { precision: 38, scale: 18 }).notNull(),
  feeRate: real('fee_rate').notNull(),
  fills: jsonb('fills').$type<Array<Record<string, unknown>>>().default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 18. Netting Agreements — bilateral netting for sec lending
// ---------------------------------------------------------------------------
export const nettingAgreements = pgTable('netting_agreements', {
  id: serial('id').primaryKey(),
  agreementId: varchar('agreement_id', { length: 256 }).notNull().unique(),
  partyA: varchar('party_a', { length: 256 }).notNull(),
  partyB: varchar('party_b', { length: 256 }).notNull(),
  dealIds: jsonb('deal_ids').$type<string[]>().notNull(),
  netAmount: decimal('net_amount', { precision: 38, scale: 18 }).notNull(),
  netDirection: varchar('net_direction', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 19. Corporate Actions — dividend/coupon processing for sec lending
// ---------------------------------------------------------------------------
export const corporateActions = pgTable('corporate_actions', {
  id: serial('id').primaryKey(),
  actionId: varchar('action_id', { length: 256 }).notNull().unique(),
  dealId: varchar('deal_id', { length: 256 }).notNull(),
  actionType: varchar('action_type', { length: 32 }).notNull(),
  security: varchar('security', { length: 64 }).notNull(),
  recordDate: timestamp('record_date', { withTimezone: true }).notNull(),
  paymentDate: timestamp('payment_date', { withTimezone: true }).notNull(),
  amount: decimal('amount', { precision: 38, scale: 18 }).notNull(),
  status: varchar('status', { length: 32 }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 20. Verified Institutions — KYB-verified institutional entities
// ---------------------------------------------------------------------------
export const verifiedInstitutions = pgTable('verified_institutions', {
  id: serial('id').primaryKey(),
  institutionParty: varchar('institution_party', { length: 256 }).notNull().unique(),
  legalName: varchar('legal_name', { length: 256 }).notNull(),
  registrationNo: varchar('registration_no', { length: 128 }).notNull(),
  jurisdiction: varchar('jurisdiction', { length: 8 }).notNull(),
  kybStatus: varchar('kyb_status', { length: 32 }).notNull(),
  kybLevel: varchar('kyb_level', { length: 32 }).notNull(),
  riskProfile: jsonb('risk_profile').$type<Record<string, unknown>>().notNull(),
  subAccounts: jsonb('sub_accounts').$type<string[]>().default([]).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 21. Institutional API Keys — enhanced API key management
// ---------------------------------------------------------------------------
export const institutionalApiKeys = pgTable('institutional_api_keys', {
  id: serial('id').primaryKey(),
  keyId: varchar('key_id', { length: 256 }).notNull().unique(),
  institutionParty: varchar('institution_party', { length: 256 }).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  keyHash: varchar('key_hash', { length: 256 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
  permissions: jsonb('permissions').$type<string[]>().notNull(),
  rateLimit: integer('rate_limit').default(5000).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// 22. Privacy Configs — per-user privacy configuration
// ---------------------------------------------------------------------------
export const privacyConfigs = pgTable('privacy_configs', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull().unique(),
  privacyLevel: varchar('privacy_level', { length: 32 }).notNull(),
  disclosureRules: jsonb('disclosure_rules').$type<Array<Record<string, unknown>>>().default([]).notNull(),
  auditTrailEnabled: boolean('audit_trail_enabled').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 23. Privacy Audit Log — access request history
// ---------------------------------------------------------------------------
export const privacyAuditLog = pgTable('privacy_audit_log', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  requesterParty: varchar('requester_party', { length: 256 }).notNull(),
  dataScope: varchar('data_scope', { length: 32 }).notNull(),
  granted: boolean('granted').notNull(),
  reason: text('reason'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});
