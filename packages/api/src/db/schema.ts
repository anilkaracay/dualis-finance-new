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
  index,
  uniqueIndex,
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
  // Index-based accrual tracking
  borrowIndex: decimal('borrow_index', { precision: 36, scale: 18 }),
  supplyIndex: decimal('supply_index', { precision: 36, scale: 18 }),
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
  debtAsset: varchar('debt_asset', { length: 64 }),
  debtRepaid: decimal('debt_repaid', { precision: 38, scale: 18 }),
  collateralAsset: varchar('collateral_asset', { length: 64 }),
  collateralSeized: decimal('collateral_seized', { precision: 38, scale: 18 }).notNull(),
  liquidationPenalty: real('liquidation_penalty'),
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
// 7. Governance Proposals — full governance proposal records (MP23)
// ---------------------------------------------------------------------------
export const governanceProposals = pgTable('governance_proposals', {
  id: varchar('id', { length: 32 }).primaryKey(),              // 'DIP-1', 'DIP-2', ...
  proposalNumber: integer('proposal_number').notNull().unique(),
  proposerId: varchar('proposer_id', { length: 256 }).notNull(),
  proposerAddress: varchar('proposer_address', { length: 256 }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  discussionUrl: text('discussion_url'),
  type: varchar('type', { length: 64 }).notNull(),             // ProposalType enum
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  status: varchar('status', { length: 32 }).notNull().default('DRAFT'),
  snapshotBlock: integer('snapshot_block'),
  votingStartsAt: timestamp('voting_starts_at', { withTimezone: true }),
  votingEndsAt: timestamp('voting_ends_at', { withTimezone: true }),
  timelockEndsAt: timestamp('timelock_ends_at', { withTimezone: true }),
  executionDeadline: timestamp('execution_deadline', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  vetoedAt: timestamp('vetoed_at', { withTimezone: true }),
  vetoedBy: varchar('vetoed_by', { length: 256 }),
  votesFor: decimal('votes_for', { precision: 28, scale: 8 }).notNull().default('0'),
  votesAgainst: decimal('votes_against', { precision: 28, scale: 8 }).notNull().default('0'),
  votesAbstain: decimal('votes_abstain', { precision: 28, scale: 8 }).notNull().default('0'),
  totalVoters: integer('total_voters').notNull().default(0),
  quorumRequired: decimal('quorum_required', { precision: 28, scale: 8 }).notNull(),
  quorumMet: boolean('quorum_met').default(false),
  damlContractId: varchar('daml_contract_id', { length: 256 }),
  damlTimelockId: varchar('daml_timelock_id', { length: 256 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('gov_proposals_status_idx').on(table.status),
  typeIdx: index('gov_proposals_type_idx').on(table.type),
  proposerIdx: index('gov_proposals_proposer_idx').on(table.proposerId),
  votingEndsIdx: index('gov_proposals_voting_ends_idx').on(table.votingEndsAt),
}));

// ---------------------------------------------------------------------------
// 7b. Governance Votes — individual vote records (MP23)
// ---------------------------------------------------------------------------
export const governanceVotes = pgTable('governance_votes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  proposalId: varchar('proposal_id', { length: 32 }).notNull(),
  voterId: varchar('voter_id', { length: 256 }).notNull(),
  voterAddress: varchar('voter_address', { length: 256 }).notNull(),
  direction: varchar('direction', { length: 16 }).notNull(),   // VoteDirection enum
  weight: decimal('weight', { precision: 28, scale: 8 }).notNull(),
  isDelegated: boolean('is_delegated').default(false),
  delegatedFrom: varchar('delegated_from', { length: 256 }),
  damlContractId: varchar('daml_contract_id', { length: 256 }),
  castAt: timestamp('cast_at', { withTimezone: true }).defaultNow().notNull(),
  previousDirection: varchar('previous_direction', { length: 16 }),
  changedAt: timestamp('changed_at', { withTimezone: true }),
}, (table) => ({
  proposalIdx: index('gov_votes_proposal_idx').on(table.proposalId),
  voterIdx: index('gov_votes_voter_idx').on(table.voterId),
}));

// ---------------------------------------------------------------------------
// 7c. Governance Delegations — vote power delegation records (MP23)
// ---------------------------------------------------------------------------
export const governanceDelegations = pgTable('governance_delegations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  delegatorId: varchar('delegator_id', { length: 256 }).notNull(),
  delegatorAddress: varchar('delegator_address', { length: 256 }).notNull(),
  delegateeId: varchar('delegatee_id', { length: 256 }).notNull(),
  delegateeAddress: varchar('delegatee_address', { length: 256 }).notNull(),
  amount: decimal('amount', { precision: 28, scale: 8 }).notNull(),
  isActive: boolean('is_active').default(true),
  damlContractId: varchar('daml_contract_id', { length: 256 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => ({
  delegatorIdx: index('gov_delegations_delegator_idx').on(table.delegatorId),
  delegateeIdx: index('gov_delegations_delegatee_idx').on(table.delegateeId),
  activeIdx: index('gov_delegations_active_idx').on(table.isActive),
}));

// ---------------------------------------------------------------------------
// 7d. Governance Token Snapshots — frozen balances per proposal (MP23)
// ---------------------------------------------------------------------------
export const governanceTokenSnapshots = pgTable('governance_token_snapshots', {
  id: varchar('id', { length: 64 }).primaryKey(),
  proposalId: varchar('proposal_id', { length: 32 }).notNull(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  userAddress: varchar('user_address', { length: 256 }).notNull(),
  balance: decimal('balance', { precision: 28, scale: 8 }).notNull(),
  delegatedTo: varchar('delegated_to', { length: 256 }),
  receivedDelegation: decimal('received_delegation', { precision: 28, scale: 8 }).default('0'),
  effectiveVotingPower: decimal('effective_voting_power', { precision: 28, scale: 8 }).notNull(),
  snapshotBlock: integer('snapshot_block').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  proposalIdx: index('gov_snapshots_proposal_idx').on(table.proposalId),
}));

// ---------------------------------------------------------------------------
// 7e. Governance Execution Queue — timelock tracking (MP23)
// ---------------------------------------------------------------------------
export const governanceExecutionQueue = pgTable('governance_execution_queue', {
  id: varchar('id', { length: 64 }).primaryKey(),
  proposalId: varchar('proposal_id', { length: 32 }).notNull().unique(),
  actionType: varchar('action_type', { length: 64 }).notNull(),
  actionPayload: jsonb('action_payload').$type<Record<string, unknown>>().notNull(),
  timelockEndsAt: timestamp('timelock_ends_at', { withTimezone: true }).notNull(),
  executionDeadline: timestamp('execution_deadline', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('PENDING'),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  executedBy: varchar('executed_by', { length: 256 }),
  executionTxHash: varchar('execution_tx_hash', { length: 256 }),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('gov_exec_queue_status_idx').on(table.status),
  timelockIdx: index('gov_exec_queue_timelock_idx').on(table.timelockEndsAt),
}));

// ---------------------------------------------------------------------------
// 7f. DUAL Token Balances — off-chain cache (MP23)
// ---------------------------------------------------------------------------
export const dualTokenBalances = pgTable('dual_token_balances', {
  userId: varchar('user_id', { length: 256 }).primaryKey(),
  userAddress: varchar('user_address', { length: 256 }).notNull(),
  balance: decimal('balance', { precision: 28, scale: 8 }).notNull().default('0'),
  totalDelegatedOut: decimal('total_delegated_out', { precision: 28, scale: 8 }).notNull().default('0'),
  totalDelegatedIn: decimal('total_delegated_in', { precision: 28, scale: 8 }).notNull().default('0'),
  effectiveVotingPower: decimal('effective_voting_power', { precision: 28, scale: 8 }).notNull().default('0'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
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
// 9. Notification Preferences — per-user notification settings (MP20 expanded)
// ---------------------------------------------------------------------------
export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull().unique(),
  // Legacy fields (kept for backwards compat)
  healthFactorThreshold: real('health_factor_threshold').default(1.2).notNull(),
  liquidationAlerts: boolean('liquidation_alerts').default(true).notNull(),
  secLendingAlerts: boolean('sec_lending_alerts').default(true).notNull(),
  governanceAlerts: boolean('governance_alerts').default(false).notNull(),
  emailAddress: varchar('email_address', { length: 320 }),
  emailEnabled: boolean('email_enabled').default(false).notNull(),
  // MP20 — Channel toggles
  channelInApp: boolean('channel_in_app').default(true).notNull(),
  channelWebhook: boolean('channel_webhook').default(false).notNull(),
  // MP20 — Financial notification thresholds
  hfCautionThreshold: real('hf_caution_threshold').default(1.5).notNull(),
  hfDangerThreshold: real('hf_danger_threshold').default(1.2).notNull(),
  hfCriticalThreshold: real('hf_critical_threshold').default(1.05).notNull(),
  financialEnabled: boolean('financial_enabled').default(true).notNull(),
  interestMilestones: boolean('interest_milestones').default(true).notNull(),
  rateChanges: boolean('rate_changes').default(true).notNull(),
  // MP20 — Auth notifications
  authEnabled: boolean('auth_enabled').default(true).notNull(),
  newLoginAlerts: boolean('new_login_alerts').default(true).notNull(),
  // MP20 — Governance notifications
  governanceEnabled: boolean('governance_enabled').default(false).notNull(),
  // MP20 — Digest mode
  digestEnabled: boolean('digest_enabled').default(false).notNull(),
  digestFrequency: varchar('digest_frequency', { length: 16 }).default('daily').notNull(),
  digestTime: varchar('digest_time', { length: 8 }).default('09:00').notNull(),
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

// ===========================================================================
// AUTH & ONBOARDING TABLES
// ===========================================================================

// ---------------------------------------------------------------------------
// 24. Users — user accounts (retail + institutional)
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull().unique(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 256 }),
  role: varchar('role', { length: 32 }).notNull().default('retail'),
  accountStatus: varchar('account_status', { length: 32 }).notNull().default('pending_verification'),
  authProvider: varchar('auth_provider', { length: 32 }).notNull().default('email'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  walletAddress: varchar('wallet_address', { length: 256 }).unique(),
  partyId: varchar('party_id', { length: 256 }).notNull().unique(),
  displayName: varchar('display_name', { length: 256 }),
  kycStatus: varchar('kyc_status', { length: 32 }).notNull().default('not_started'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  // MP21 KYC/AML Compliance fields
  amlStatus: varchar('aml_status', { length: 32 }).default('not_screened'),
  complianceRiskLevel: varchar('compliance_risk_level', { length: 32 }),
  lastRiskAssessmentAt: timestamp('last_risk_assessment_at', { withTimezone: true }),
  sumsubApplicantId: varchar('sumsub_applicant_id', { length: 256 }),
  nextScreeningAt: timestamp('next_screening_at', { withTimezone: true }),
  // MP19 Admin Panel fields
  isAdminActive: boolean('is_admin_active').default(false).notNull(),
  adminActivatedAt: timestamp('admin_activated_at', { withTimezone: true }),
  adminActivatedBy: integer('admin_activated_by'),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  suspendedBy: integer('suspended_by'),
  suspendedReason: text('suspended_reason'),
  isBlacklisted: boolean('is_blacklisted').default(false).notNull(),
  blacklistedAt: timestamp('blacklisted_at', { withTimezone: true }),
  blacklistedReason: text('blacklisted_reason'),
});

// ---------------------------------------------------------------------------
// 25. Sessions — active user sessions with refresh tokens
// ---------------------------------------------------------------------------
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  refreshTokenHash: varchar('refresh_token_hash', { length: 256 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  device: varchar('device', { length: 256 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 26. Login Events — audit trail of login attempts
// ---------------------------------------------------------------------------
export const loginEvents = pgTable('login_events', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }),
  email: varchar('email', { length: 320 }),
  provider: varchar('provider', { length: 32 }).notNull(),
  success: boolean('success').notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  failureReason: varchar('failure_reason', { length: 128 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 27. Email Verification Tokens
// ---------------------------------------------------------------------------
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  tokenHash: varchar('token_hash', { length: 256 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 28. Password Reset Tokens
// ---------------------------------------------------------------------------
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  tokenHash: varchar('token_hash', { length: 256 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 29. Wallet Nonces — challenge-response for wallet login
// ---------------------------------------------------------------------------
export const walletNonces = pgTable('wallet_nonces', {
  id: serial('id').primaryKey(),
  walletAddress: varchar('wallet_address', { length: 256 }).notNull(),
  nonce: text('nonce').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 30. Retail Profiles — retail user profile data
// ---------------------------------------------------------------------------
export const retailProfiles = pgTable('retail_profiles', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull().unique(),
  firstName: varchar('first_name', { length: 256 }),
  lastName: varchar('last_name', { length: 256 }),
  country: varchar('country', { length: 8 }),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 31. Institutions — full institution records for KYB
// ---------------------------------------------------------------------------
export const institutions = pgTable('institutions', {
  id: serial('id').primaryKey(),
  institutionId: varchar('institution_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  companyName: varchar('company_name', { length: 256 }).notNull(),
  companyLegalName: varchar('company_legal_name', { length: 256 }),
  registrationNumber: varchar('registration_number', { length: 128 }),
  taxId: varchar('tax_id', { length: 128 }),
  jurisdiction: varchar('jurisdiction', { length: 8 }).notNull(),
  companyType: varchar('company_type', { length: 64 }),
  website: varchar('website', { length: 512 }),
  addressLine1: varchar('address_line_1', { length: 256 }),
  addressLine2: varchar('address_line_2', { length: 256 }),
  city: varchar('city', { length: 128 }),
  state: varchar('state', { length: 128 }),
  postalCode: varchar('postal_code', { length: 32 }),
  country: varchar('country', { length: 8 }),
  repFirstName: varchar('rep_first_name', { length: 256 }).notNull(),
  repLastName: varchar('rep_last_name', { length: 256 }).notNull(),
  repTitle: varchar('rep_title', { length: 256 }).notNull(),
  repEmail: varchar('rep_email', { length: 320 }).notNull(),
  repPhone: varchar('rep_phone', { length: 32 }),
  kybStatus: varchar('kyb_status', { length: 32 }).notNull().default('not_started'),
  onboardingStep: integer('onboarding_step').default(1).notNull(),
  kybSubmittedAt: timestamp('kyb_submitted_at', { withTimezone: true }),
  kybApprovedAt: timestamp('kyb_approved_at', { withTimezone: true }),
  kybReviewNotes: text('kyb_review_notes'),
  beneficialOwners: jsonb('beneficial_owners').$type<Array<Record<string, unknown>>>().default([]).notNull(),
  riskProfile: jsonb('risk_profile').$type<Record<string, unknown>>(),
  apiKeyHash: varchar('api_key_hash', { length: 256 }),
  apiKeyPrefix: varchar('api_key_prefix', { length: 16 }),
  customFeeRate: real('custom_fee_rate'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 32. Compliance Documents — uploaded documents for KYB
// ---------------------------------------------------------------------------
export const complianceDocuments = pgTable('compliance_documents', {
  id: serial('id').primaryKey(),
  documentId: varchar('document_id', { length: 256 }).notNull().unique(),
  institutionId: varchar('institution_id', { length: 256 }).notNull(),
  documentType: varchar('document_type', { length: 64 }).notNull(),
  fileName: varchar('file_name', { length: 256 }).notNull(),
  mimeType: varchar('mime_type', { length: 128 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageKey: varchar('storage_key', { length: 512 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  reviewNote: text('review_note'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// 33. Price Snapshots — aggregated oracle price snapshots
// ---------------------------------------------------------------------------
export const priceSnapshots = pgTable('price_snapshots', {
  id: serial('id').primaryKey(),
  asset: varchar('asset', { length: 64 }).notNull(),
  medianPrice: decimal('median_price', { precision: 28, scale: 8 }).notNull(),
  sources: jsonb('sources').$type<Array<Record<string, unknown>>>().notNull(),
  confidence: real('confidence').notNull(),
  twapData: jsonb('twap_data').$type<Record<string, unknown>>(),
  circuitBreakerActive: boolean('circuit_breaker_active').default(false).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 34. Oracle Alerts — circuit breaker trips, source failures, etc.
// ---------------------------------------------------------------------------
export const oracleAlerts = pgTable('oracle_alerts', {
  id: serial('id').primaryKey(),
  alertType: varchar('alert_type', { length: 64 }).notNull(),
  asset: varchar('asset', { length: 64 }),
  message: text('message').notNull(),
  severity: varchar('severity', { length: 16 }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 35. Wallet Connections — multi-wallet management per user
// ---------------------------------------------------------------------------
export const walletConnections = pgTable('wallet_connections', {
  id: serial('id').primaryKey(),
  connectionId: varchar('connection_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  walletAddress: varchar('wallet_address', { length: 256 }).notNull(),
  walletType: varchar('wallet_type', { length: 32 }).notNull(),
  custodyMode: varchar('custody_mode', { length: 32 }).notNull().default('self-custody'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  label: varchar('label', { length: 128 }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
  connectedAt: timestamp('connected_at', { withTimezone: true }).defaultNow().notNull(),
  disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 36. Party Mappings — user ↔ Canton party associations
// ---------------------------------------------------------------------------
export const partyMappings = pgTable('party_mappings', {
  id: serial('id').primaryKey(),
  mappingId: varchar('mapping_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  walletConnectionId: varchar('wallet_connection_id', { length: 256 }),
  custodyMode: varchar('custody_mode', { length: 32 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 37. Wallet Preferences — per-user signing & routing configuration
// ---------------------------------------------------------------------------
export const walletPreferences = pgTable('wallet_preferences', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull().unique(),
  defaultWalletConnectionId: varchar('default_wallet_connection_id', { length: 256 }),
  signingThreshold: decimal('signing_threshold', { precision: 38, scale: 18 }).default('1000').notNull(),
  routingMode: varchar('routing_mode', { length: 32 }).notNull().default('auto'),
  autoDisconnectMinutes: integer('auto_disconnect_minutes').default(30).notNull(),
  showTransactionConfirm: boolean('show_transaction_confirm').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 38. Custodial Parties — managed Canton parties for institutional users
// ---------------------------------------------------------------------------
export const custodialParties = pgTable('custodial_parties', {
  id: serial('id').primaryKey(),
  custodialPartyId: varchar('custodial_party_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  encryptedKeyRef: varchar('encrypted_key_ref', { length: 512 }),
  status: varchar('status', { length: 32 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// 39. Transaction Logs — all Canton transactions with routing metadata
// ---------------------------------------------------------------------------
export const transactionLogs = pgTable('transaction_logs', {
  id: serial('id').primaryKey(),
  transactionLogId: varchar('transaction_log_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  walletConnectionId: varchar('wallet_connection_id', { length: 256 }),
  txHash: varchar('tx_hash', { length: 512 }),
  templateId: varchar('template_id', { length: 256 }),
  choiceName: varchar('choice_name', { length: 128 }),
  routingMode: varchar('routing_mode', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  amountUsd: decimal('amount_usd', { precision: 28, scale: 8 }),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

// ===========================================================================
// MP19 — Admin Panel Tables
// ===========================================================================

// ---------------------------------------------------------------------------
// 40. Admin Audit Logs — every admin action is recorded
// ---------------------------------------------------------------------------
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: varchar('action', { length: 128 }).notNull(),
  targetType: varchar('target_type', { length: 64 }).notNull(),
  targetId: varchar('target_id', { length: 256 }),
  oldValue: jsonb('old_value').$type<unknown>(),
  newValue: jsonb('new_value').$type<unknown>(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 41. Admin Sessions — track admin panel logins separately
// ---------------------------------------------------------------------------
export const adminSessions = pgTable('admin_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  loginAt: timestamp('login_at', { withTimezone: true }).defaultNow().notNull(),
  logoutAt: timestamp('logout_at', { withTimezone: true }),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// 42. Protocol Config — singleton row for global protocol settings
// ---------------------------------------------------------------------------
export const protocolConfig = pgTable('protocol_config', {
  id: serial('id').primaryKey(),
  protocolFeeRate: decimal('protocol_fee_rate', { precision: 10, scale: 6 }).notNull().default('0.001'),
  liquidationIncentiveRate: decimal('liquidation_incentive_rate', { precision: 10, scale: 6 }).notNull().default('0.05'),
  flashLoanFeeRate: decimal('flash_loan_fee_rate', { precision: 10, scale: 6 }).notNull().default('0.0009'),
  minBorrowAmount: decimal('min_borrow_amount', { precision: 28, scale: 8 }).notNull().default('100'),
  maxBorrowAmount: decimal('max_borrow_amount', { precision: 28, scale: 8 }).notNull().default('10000000'),
  isPaused: boolean('is_paused').default(false).notNull(),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  pausedBy: integer('paused_by'),
  pauseReason: text('pause_reason'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: integer('updated_by'),
});

// ---------------------------------------------------------------------------
// 43. Pool Parameter History — track every parameter change
// ---------------------------------------------------------------------------
export const poolParameterHistory = pgTable('pool_parameter_history', {
  id: serial('id').primaryKey(),
  poolId: varchar('pool_id', { length: 128 }).notNull(),
  parameterName: varchar('parameter_name', { length: 128 }).notNull(),
  oldValue: varchar('old_value', { length: 256 }),
  newValue: varchar('new_value', { length: 256 }),
  changedBy: integer('changed_by').notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  reason: text('reason'),
});

// ===========================================================================
// MP20 — Notification & Alert System Tables
// ===========================================================================

// ---------------------------------------------------------------------------
// 44. Notifications — all notification records
// ---------------------------------------------------------------------------
export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 64 }).primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  type: varchar('type', { length: 64 }).notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  severity: varchar('severity', { length: 16 }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().default({}).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  channels: jsonb('channels').$type<string[]>().default(['in_app']).notNull(),
  link: text('link'),
  readAt: timestamp('read_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_notifications_party_created').on(table.partyId, table.createdAt),
  index('idx_notifications_party_status').on(table.partyId, table.status),
  index('idx_notifications_type_created').on(table.type, table.createdAt),
]);

// ---------------------------------------------------------------------------
// 45. Webhook Endpoints — institutional webhook configurations
// ---------------------------------------------------------------------------
export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: varchar('id', { length: 64 }).primaryKey(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  url: text('url').notNull(),
  secret: varchar('secret', { length: 256 }).notNull(),
  events: jsonb('events').$type<string[]>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  failureCount: integer('failure_count').default(0).notNull(),
  lastDeliveryAt: timestamp('last_delivery_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_webhook_endpoints_party').on(table.partyId),
]);

// ---------------------------------------------------------------------------
// 46. Webhook Delivery Log — webhook delivery audit trail
// ---------------------------------------------------------------------------
export const webhookDeliveryLog = pgTable('webhook_delivery_log', {
  id: varchar('id', { length: 64 }).primaryKey(),
  webhookEndpointId: varchar('webhook_endpoint_id', { length: 64 }).notNull(),
  notificationId: varchar('notification_id', { length: 64 }).notNull(),
  httpStatus: integer('http_status'),
  responseBody: text('response_body'),
  attempt: integer('attempt').notNull().default(1),
  success: boolean('success').notNull(),
  error: text('error'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_webhook_delivery_endpoint').on(table.webhookEndpointId, table.deliveredAt),
  index('idx_webhook_delivery_notification').on(table.notificationId),
]);

// ---------------------------------------------------------------------------
// 47. Email Delivery Log — email delivery audit trail
// ---------------------------------------------------------------------------
export const emailDeliveryLog = pgTable('email_delivery_log', {
  id: varchar('id', { length: 64 }).primaryKey(),
  notificationId: varchar('notification_id', { length: 64 }).notNull(),
  partyId: varchar('party_id', { length: 256 }).notNull(),
  toAddress: varchar('to_address', { length: 320 }).notNull(),
  templateId: varchar('template_id', { length: 64 }).notNull(),
  resendId: varchar('resend_id', { length: 256 }),
  status: varchar('status', { length: 16 }).notNull(),
  error: text('error'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_email_delivery_party').on(table.partyId, table.sentAt),
  index('idx_email_delivery_notification').on(table.notificationId),
]);

// ===========================================================================
// MP21 — KYC/AML Compliance Tables
// ===========================================================================

// ---------------------------------------------------------------------------
// 48. KYC Verifications — Sumsub identity verification records
// ---------------------------------------------------------------------------
export const kycVerifications = pgTable('kyc_verifications', {
  id: serial('id').primaryKey(),
  verificationId: varchar('verification_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  provider: varchar('provider', { length: 32 }).notNull().default('sumsub'),
  externalApplicantId: varchar('external_applicant_id', { length: 256 }),
  status: varchar('status', { length: 32 }).notNull().default('not_started'),
  reviewAnswer: varchar('review_answer', { length: 16 }),
  rejectionReason: text('rejection_reason'),
  rejectionLabels: jsonb('rejection_labels').$type<string[]>().default([]).notNull(),
  documentTypes: jsonb('document_types').$type<string[]>().default([]).notNull(),
  checkResults: jsonb('check_results').$type<Record<string, string>>(),
  rawResponse: jsonb('raw_response').$type<Record<string, unknown>>(),
  attemptCount: integer('attempt_count').default(1).notNull(),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_kyc_verifications_user').on(table.userId),
  index('idx_kyc_verifications_status').on(table.status),
  index('idx_kyc_verifications_external').on(table.externalApplicantId),
]);

// ---------------------------------------------------------------------------
// 49. AML Screenings — wallet and transaction screening records
// ---------------------------------------------------------------------------
export const amlScreenings = pgTable('aml_screenings', {
  id: serial('id').primaryKey(),
  screeningId: varchar('screening_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  screeningType: varchar('screening_type', { length: 32 }).notNull(),
  provider: varchar('provider', { length: 32 }).notNull().default('chainalysis'),
  externalId: varchar('external_id', { length: 256 }),
  status: varchar('status', { length: 32 }).notNull().default('clean'),
  riskScore: real('risk_score').default(0).notNull(),
  riskCategory: varchar('risk_category', { length: 32 }),
  walletAddress: varchar('wallet_address', { length: 256 }),
  exposures: jsonb('exposures').$type<Array<Record<string, unknown>>>().default([]).notNull(),
  flagReasons: jsonb('flag_reasons').$type<string[]>().default([]).notNull(),
  rawResponse: jsonb('raw_response').$type<Record<string, unknown>>(),
  reviewedBy: varchar('reviewed_by', { length: 256 }),
  reviewNote: text('review_note'),
  screenedAt: timestamp('screened_at', { withTimezone: true }).defaultNow().notNull(),
  nextScreeningAt: timestamp('next_screening_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_aml_screenings_user_type').on(table.userId, table.screeningType, table.screenedAt),
  index('idx_aml_screenings_wallet').on(table.walletAddress),
  index('idx_aml_screenings_status').on(table.status),
  index('idx_aml_screenings_next').on(table.nextScreeningAt),
]);

// ---------------------------------------------------------------------------
// 50. Risk Assessments — composite risk scoring records
// ---------------------------------------------------------------------------
export const riskAssessments = pgTable('risk_assessments', {
  id: serial('id').primaryKey(),
  assessmentId: varchar('assessment_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  kycScore: real('kyc_score').notNull(),
  amlScore: real('aml_score').notNull(),
  pepScore: real('pep_score').notNull(),
  geoScore: real('geo_score').notNull(),
  behavioralScore: real('behavioral_score').notNull(),
  compositeScore: real('composite_score').notNull(),
  riskLevel: varchar('risk_level', { length: 32 }).notNull(),
  factors: jsonb('factors').$type<Array<Record<string, unknown>>>().default([]).notNull(),
  decision: varchar('decision', { length: 32 }).notNull(),
  decisionReason: text('decision_reason').notNull(),
  triggeredBy: varchar('triggered_by', { length: 64 }).notNull(),
  previousRiskLevel: varchar('previous_risk_level', { length: 32 }),
  reviewedBy: integer('reviewed_by'),
  reviewNote: text('review_note'),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_risk_assessments_user').on(table.userId, table.createdAt),
  index('idx_risk_assessments_level').on(table.riskLevel),
  index('idx_risk_assessments_valid').on(table.validUntil),
]);

// ---------------------------------------------------------------------------
// 51. Compliance Audit Log — immutable INSERT-only compliance event log
// ---------------------------------------------------------------------------
export const complianceAuditLog = pgTable('compliance_audit_log', {
  id: serial('id').primaryKey(),
  eventId: varchar('event_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }),
  action: varchar('action', { length: 64 }).notNull(),
  actorId: varchar('actor_id', { length: 256 }),
  actorType: varchar('actor_type', { length: 32 }).notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_compliance_audit_user').on(table.userId, table.createdAt),
  index('idx_compliance_audit_action').on(table.action, table.createdAt),
  index('idx_compliance_audit_category').on(table.category, table.createdAt),
]);

// ---------------------------------------------------------------------------
// 52. Sanctions List Entries — cached sanctions/PEP list entries
// ---------------------------------------------------------------------------
export const sanctionsListEntries = pgTable('sanctions_list_entries', {
  id: serial('id').primaryKey(),
  entryId: varchar('entry_id', { length: 256 }).notNull().unique(),
  listSource: varchar('list_source', { length: 64 }).notNull(),
  entityType: varchar('entity_type', { length: 32 }).notNull(),
  fullName: varchar('full_name', { length: 512 }).notNull(),
  normalizedName: varchar('normalized_name', { length: 512 }).notNull(),
  aliases: jsonb('aliases').$type<string[]>().default([]).notNull(),
  nationality: varchar('nationality', { length: 8 }),
  dateOfBirth: varchar('date_of_birth', { length: 32 }),
  identifiers: jsonb('identifiers').$type<Record<string, string>>(),
  isActive: boolean('is_active').default(true).notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_sanctions_normalized_name').on(table.normalizedName),
  index('idx_sanctions_list_source').on(table.listSource),
  index('idx_sanctions_active').on(table.isActive),
]);

// ---------------------------------------------------------------------------
// 53. Data Deletion Requests — GDPR right-to-erasure tracking
// ---------------------------------------------------------------------------
export const dataDeletionRequests = pgTable('data_deletion_requests', {
  id: serial('id').primaryKey(),
  requestId: varchar('request_id', { length: 256 }).notNull().unique(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  requestType: varchar('request_type', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('pending'),
  reason: text('reason'),
  retentionEndDate: timestamp('retention_end_date', { withTimezone: true }),
  processedBy: integer('processed_by'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  exportFileKey: varchar('export_file_key', { length: 512 }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_deletion_requests_user').on(table.userId),
  index('idx_deletion_requests_status').on(table.status),
]);

// ===========================================================================
// MP24 — Analytics & Reporting Engine Tables
// ===========================================================================

// ---------------------------------------------------------------------------
// 54. Analytics Pool Snapshots — hourly pool-level snapshots
// ---------------------------------------------------------------------------
export const analyticsPoolSnapshots = pgTable('analytics_pool_snapshots', {
  id: serial('id').primaryKey(),
  poolId: varchar('pool_id', { length: 128 }).notNull(),
  totalSupplyUsd: decimal('total_supply_usd', { precision: 30, scale: 6 }).notNull(),
  totalBorrowUsd: decimal('total_borrow_usd', { precision: 30, scale: 6 }).notNull(),
  availableLiquidityUsd: decimal('available_liquidity_usd', { precision: 30, scale: 6 }).notNull(),
  tvlUsd: decimal('tvl_usd', { precision: 30, scale: 6 }).notNull(),
  utilization: decimal('utilization', { precision: 10, scale: 6 }).notNull(),
  supplyApy: decimal('supply_apy', { precision: 10, scale: 6 }).notNull(),
  borrowApy: decimal('borrow_apy', { precision: 10, scale: 6 }).notNull(),
  depositorCount: integer('depositor_count').notNull().default(0),
  borrowerCount: integer('borrower_count').notNull().default(0),
  reserveUsd: decimal('reserve_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('uq_analytics_pool_snapshots_pool_time').on(table.poolId, table.snapshotAt),
  index('idx_analytics_pool_snapshots_pool_time').on(table.poolId, table.snapshotAt),
  index('idx_analytics_pool_snapshots_time').on(table.snapshotAt),
]);

// ---------------------------------------------------------------------------
// 55. Analytics Protocol Snapshots — hourly protocol-level aggregates
// ---------------------------------------------------------------------------
export const analyticsProtocolSnapshots = pgTable('analytics_protocol_snapshots', {
  id: serial('id').primaryKey(),
  totalTvlUsd: decimal('total_tvl_usd', { precision: 30, scale: 6 }).notNull(),
  totalSupplyUsd: decimal('total_supply_usd', { precision: 30, scale: 6 }).notNull(),
  totalBorrowUsd: decimal('total_borrow_usd', { precision: 30, scale: 6 }).notNull(),
  totalReserveUsd: decimal('total_reserve_usd', { precision: 30, scale: 6 }).notNull(),
  totalUsers: integer('total_users').notNull().default(0),
  activePools: integer('active_pools').notNull().default(0),
  avgUtilization: decimal('avg_utilization', { precision: 10, scale: 6 }).notNull(),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_analytics_protocol_snapshots_time').on(table.snapshotAt),
]);

// ---------------------------------------------------------------------------
// 56. Analytics User Position Snapshots — daily per-user snapshots
// ---------------------------------------------------------------------------
export const analyticsUserPositionSnapshots = pgTable('analytics_user_position_snapshots', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  totalSupplyUsd: decimal('total_supply_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  totalBorrowUsd: decimal('total_borrow_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  totalCollateralUsd: decimal('total_collateral_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  netWorthUsd: decimal('net_worth_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  interestEarnedUsd: decimal('interest_earned_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  interestPaidUsd: decimal('interest_paid_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  netInterestUsd: decimal('net_interest_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  healthFactor: decimal('health_factor', { precision: 10, scale: 4 }),
  netApy: decimal('net_apy', { precision: 10, scale: 6 }),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('uq_analytics_user_snapshots_user_time').on(table.userId, table.snapshotAt),
  index('idx_analytics_user_snapshots_user_time').on(table.userId, table.snapshotAt),
]);

// ---------------------------------------------------------------------------
// 57. Analytics Events — real-time event log for all lending actions
// ---------------------------------------------------------------------------
export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  userId: varchar('user_id', { length: 256 }),
  poolId: varchar('pool_id', { length: 128 }),
  amount: decimal('amount', { precision: 30, scale: 6 }),
  amountUsd: decimal('amount_usd', { precision: 30, scale: 6 }).notNull(),
  txHash: text('tx_hash'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_analytics_events_type').on(table.eventType, table.createdAt),
  index('idx_analytics_events_user').on(table.userId, table.createdAt),
  index('idx_analytics_events_pool').on(table.poolId, table.createdAt),
]);

// ---------------------------------------------------------------------------
// 58. Protocol Health Snapshots — every 15 minutes
// ---------------------------------------------------------------------------
export const protocolHealthSnapshots = pgTable('protocol_health_snapshots', {
  id: serial('id').primaryKey(),
  healthScore: integer('health_score').notNull(),
  badDebtRatio: decimal('bad_debt_ratio', { precision: 10, scale: 6 }).notNull(),
  reserveCoverage: decimal('reserve_coverage', { precision: 10, scale: 6 }).notNull(),
  avgHealthFactor: decimal('avg_health_factor', { precision: 10, scale: 4 }),
  hfDangerCount: integer('hf_danger_count').notNull().default(0),
  hfDangerVolumeUsd: decimal('hf_danger_volume_usd', { precision: 30, scale: 6 }).notNull().default('0'),
  liquidationEfficiency: decimal('liquidation_efficiency', { precision: 10, scale: 6 }),
  oracleUptime: decimal('oracle_uptime', { precision: 10, scale: 6 }),
  concentrationRisk: decimal('concentration_risk', { precision: 10, scale: 6 }),
  details: jsonb('details').$type<Record<string, unknown>>(),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_health_snapshots_time').on(table.snapshotAt),
]);

// ---------------------------------------------------------------------------
// 59. Revenue Log — protocol revenue tracking
// ---------------------------------------------------------------------------
export const revenueLog = pgTable('revenue_log', {
  id: serial('id').primaryKey(),
  poolId: varchar('pool_id', { length: 128 }),
  revenueType: varchar('revenue_type', { length: 30 }).notNull(),
  amount: decimal('amount', { precision: 30, scale: 6 }).notNull(),
  amountUsd: decimal('amount_usd', { precision: 30, scale: 6 }).notNull(),
  asset: varchar('asset', { length: 20 }).notNull(),
  txHash: text('tx_hash'),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_revenue_log_type').on(table.revenueType, table.createdAt),
  index('idx_revenue_log_pool').on(table.poolId, table.createdAt),
]);
