import axios, { type AxiosInstance } from 'axios';
import pRetry from 'p-retry';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import type {
  CantonContract,
  ExerciseResult,
  CreateResult,
  CantonQueryFilter,
} from './types.js';

const log = createChildLogger('canton-client');

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

function generateMockContracts<T>(templateId: string): CantonContract<T>[] {
  const templateShort = templateId.split(':').pop() ?? templateId;
  const signatories = ['party::operator::0'];

  switch (templateShort) {
    case 'LendingPool':
      return [
        mockPool('pool-usdc', 'USDC', '50000000', '35000000', signatories),
        mockPool('pool-eth', 'ETH', '48000000', '25000000', signatories),
        mockPool('pool-btc', 'BTC', '32500000', '16000000', signatories),
        mockPool('pool-usd1', 'USD1', '30000000', '20000000', signatories),
        mockPool('pool-tbill', 'T-BILL-2026', '19900000', '5000000', signatories),
        mockPool('pool-spy', 'SPY-2026', '5200000', '1560000', signatories),
      ] as CantonContract<T>[];
    case 'PriceFeed':
      return [
        mockPriceFeed('ETH', '3200.50'),
        mockPriceFeed('BTC', '65000.00'),
        mockPriceFeed('USDC', '1.0001'),
        mockPriceFeed('USD1', '1.0000'),
        mockPriceFeed('T-BILL-2026', '99.50'),
        mockPriceFeed('SPY-2026', '520.00'),
      ] as CantonContract<T>[];
    case 'CreditAttestationBundle':
      return [mockAttestationBundle(signatories)] as CantonContract<T>[];
    case 'CompositeCredit':
      return [mockCompositeScore(signatories)] as CantonContract<T>[];
    case 'ProductiveProject':
      return [
        mockProductiveProject('proj-solar-01', 'Solar Farm Alpha', 'Active', signatories),
        mockProductiveProject('proj-wind-02', 'Wind Farm Beta', 'Funding', signatories),
      ] as CantonContract<T>[];
    case 'ProductiveBorrow':
      return [
        mockProductiveBorrow('pborrow-01', 'proj-solar-01', '5000000', signatories),
        mockProductiveBorrow('pborrow-02', 'proj-wind-02', '3200000', signatories),
      ] as CantonContract<T>[];
    case 'ProductiveLendingPool':
      return [
        mockProductivePool('ppool-green', 'GREEN', '25000000', '12000000', signatories),
      ] as CantonContract<T>[];
    case 'FractionalOffer':
      return [
        mockFractionalOffer('frac-offer-01', 'SPY-2026', '10000', signatories),
      ] as CantonContract<T>[];
    case 'VerifiedInstitution':
      return [mockVerifiedInstitution(signatories)] as CantonContract<T>[];
    case 'PrivacyConfig':
      return [mockPrivacyConfig(signatories)] as CantonContract<T>[];
    default:
      return [];
  }
}

function mockPool(
  poolId: string,
  symbol: string,
  deposits: string,
  borrows: string,
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: `#canton-mock-${poolId}`,
    templateId: 'Dualis.LendingPool:LendingPool',
    payload: {
      poolId,
      protocolOperator: 'party::operator::0',
      asset: { tokenAdmin: 'party::admin::0', symbol, amount: deposits, instrumentType: 'Stablecoin' },
      totalDeposits: deposits,
      totalBorrows: borrows,
      totalReserves: String(Number(deposits) * 0.02),
      interestRateModel: { type: 'VariableRate', baseRate: '0.02', multiplier: '0.1', kink: '0.8', jumpMultiplier: '0.3' },
      lastAccrualTimestamp: new Date().toISOString(),
      accumulatedBorrowIndex: '1.05',
      accumulatedSupplyIndex: '1.02',
      depositors: [],
      isActive: true,
    },
    signatories,
    observers: [],
  };
}

function mockPriceFeed(
  asset: string,
  price: string,
): CantonContract<Record<string, unknown>> {
  return {
    contractId: `#canton-mock-price-${asset.toLowerCase()}`,
    templateId: 'Dualis.Oracle:PriceFeed',
    payload: {
      feedId: `${asset.toLowerCase()}-usd`,
      protocolOperator: 'party::operator::0',
      oracleProvider: 'party::oracle::0',
      asset,
      quoteCurrency: 'USD',
      price,
      confidence: '0.99',
      timestamp: new Date().toISOString(),
      source: 'Chainlink Data Streams',
      heartbeatSeconds: 30,
      deviationThresholdPercent: '0.5',
    },
    signatories: ['party::operator::0'],
    observers: [],
  };
}

function mockAttestationBundle(
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: '#canton-mock-attestation-bundle',
    templateId: 'Dualis.Credit.Attestation:CreditAttestationBundle',
    payload: {
      owner: 'party::operator::0',
      attestations: [
        { id: 'att-001', provider: 'Chainlink', score: 85, timestamp: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000 * 30).toISOString() },
        { id: 'att-002', provider: 'EigenLayer', score: 72, timestamp: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000 * 60).toISOString() },
      ],
      lastUpdated: new Date().toISOString(),
    },
    signatories,
    observers: [],
  };
}

function mockCompositeScore(
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: '#canton-mock-composite-score',
    templateId: 'Dualis.Credit.CompositeScore:CompositeCredit',
    payload: {
      owner: 'party::operator::0',
      compositeScore: 780,
      onChainBreakdown: { repaymentHistory: 95, collateralRatio: 85, protocolUsage: 70 },
      offChainBreakdown: { creditBureau: 720, incomeVerification: 80 },
      ecosystemBreakdown: { stakingScore: 60, governanceParticipation: 45 },
      calculationTime: new Date().toISOString(),
    },
    signatories,
    observers: [],
  };
}

function mockProductiveProject(
  projectId: string,
  name: string,
  status: string,
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: `#canton-mock-${projectId}`,
    templateId: 'Dualis.Productive.Core:ProductiveProject',
    payload: {
      projectId,
      name,
      status,
      owner: 'party::operator::0',
      sector: 'Renewable Energy',
      totalCapex: '10000000',
      attestationIds: [],
      createdAt: new Date().toISOString(),
    },
    signatories,
    observers: [],
  };
}

function mockProductiveBorrow(
  borrowId: string,
  projectId: string,
  amount: string,
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: `#canton-mock-${borrowId}`,
    templateId: 'Dualis.Productive.Core:ProductiveBorrow',
    payload: {
      borrowId,
      projectId,
      borrower: 'party::operator::0',
      amount,
      outstandingBalance: amount,
      cashflowSchedule: [],
      healthStatus: 'Healthy',
      createdAt: new Date().toISOString(),
    },
    signatories,
    observers: [],
  };
}

function mockProductivePool(
  poolId: string,
  symbol: string,
  deposits: string,
  borrows: string,
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: `#canton-mock-${poolId}`,
    templateId: 'Dualis.Productive.Core:ProductiveLendingPool',
    payload: {
      poolId,
      asset: { symbol, amount: deposits },
      totalDeposits: deposits,
      totalBorrows: borrows,
      restrictedToProductive: true,
      isActive: true,
    },
    signatories,
    observers: [],
  };
}

function mockFractionalOffer(
  offerId: string,
  security: string,
  totalAmount: string,
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: `#canton-mock-${offerId}`,
    templateId: 'Dualis.SecLending.Advanced:FractionalOffer',
    payload: {
      offerId,
      lender: 'party::operator::0',
      security: { symbol: security, amount: totalAmount },
      remainingAmount: totalAmount,
      minFraction: '100',
      feeRate: '0.015',
      isActive: true,
    },
    signatories,
    observers: [],
  };
}

function mockVerifiedInstitution(
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: '#canton-mock-verified-institution',
    templateId: 'Dualis.Institutional.Core:VerifiedInstitution',
    payload: {
      institution: 'party::operator::0',
      name: 'Acme Capital Management',
      kybStatus: 'Verified',
      kybExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
      subAccounts: ['party::sub-01::0', 'party::sub-02::0'],
      tier: 'Tier1',
      verifiedAt: new Date().toISOString(),
    },
    signatories,
    observers: [],
  };
}

function mockPrivacyConfig(
  signatories: string[],
): CantonContract<Record<string, unknown>> {
  return {
    contractId: '#canton-mock-privacy-config',
    templateId: 'Dualis.Privacy.Config:PrivacyConfig',
    payload: {
      user: 'party::operator::0',
      privacyLevel: 'Standard',
      disclosureRules: [
        { ruleId: 'rule-01', counterparty: 'party::auditor::0', scope: 'CreditScore', expiresAt: new Date(Date.now() + 86400000 * 90).toISOString() },
      ],
      lastUpdated: new Date().toISOString(),
    },
    signatories,
    observers: [],
  };
}

// ---------------------------------------------------------------------------
// CantonClient
// ---------------------------------------------------------------------------

export class CantonClient {
  private static instance: CantonClient | null = null;
  private readonly http: AxiosInstance;
  private readonly isMock: boolean;

  private constructor() {
    this.isMock = env.CANTON_MOCK;

    this.http = axios.create({
      baseURL: env.CANTON_JSON_API_URL,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request logging interceptor
    this.http.interceptors.request.use((config) => {
      log.debug({ url: config.url, method: config.method }, 'Canton API request');
      return config;
    });

    // Response logging interceptor
    this.http.interceptors.response.use(
      (response) => {
        log.debug({ url: response.config.url, status: response.status }, 'Canton API response');
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          log.error(
            { url: error.config?.url, status: error.response?.status, message: error.message },
            'Canton API error',
          );
        }
        throw error;
      },
    );

    log.info({ mock: this.isMock, url: env.CANTON_JSON_API_URL }, 'Canton client initialized');
  }

  static getInstance(): CantonClient {
    if (!CantonClient.instance) {
      CantonClient.instance = new CantonClient();
    }
    return CantonClient.instance;
  }

  /**
   * Query active contracts by template ID and optional filter.
   */
  async queryContracts<T>(templateId: string, query?: Record<string, unknown>): Promise<CantonContract<T>[]> {
    if (this.isMock) {
      log.debug({ templateId }, 'Returning mock contracts');
      return generateMockContracts<T>(templateId);
    }

    return pRetry(
      async () => {
        const filter: CantonQueryFilter = { templateId, ...(query ? { query } : {}) };
        const response = await this.http.post<{ result: CantonContract<T>[] }>(
          '/v2/queries',
          filter,
        );
        return response.data.result;
      },
      {
        retries: 3,
        minTimeout: 500,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            { attempt: err.attemptNumber, retriesLeft: err.retriesLeft, templateId },
            'Canton query retry',
          );
        },
      },
    );
  }

  /**
   * Query a single contract by its key.
   */
  async queryContractByKey<T>(templateId: string, key: Record<string, unknown>): Promise<CantonContract<T> | null> {
    if (this.isMock) {
      const mocks = generateMockContracts<T>(templateId);
      return mocks[0] ?? null;
    }

    return pRetry(
      async () => {
        const response = await this.http.post<{ result: CantonContract<T> | null }>(
          '/v2/fetch',
          { templateId, key },
        );
        return response.data.result;
      },
      {
        retries: 3,
        minTimeout: 500,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            { attempt: err.attemptNumber, retriesLeft: err.retriesLeft, templateId },
            'Canton fetch retry',
          );
        },
      },
    );
  }

  /**
   * Exercise a choice on an existing contract.
   */
  async exerciseChoice(
    templateId: string,
    contractId: string,
    choice: string,
    argument: Record<string, unknown>,
  ): Promise<ExerciseResult> {
    if (this.isMock) {
      log.debug({ templateId, contractId, choice }, 'Mock exercise choice');
      return { exerciseResult: { status: 'success' }, events: [] };
    }

    return pRetry(
      async () => {
        const response = await this.http.post<ExerciseResult>(
          '/v2/exercise',
          { templateId, contractId, choice, argument },
        );
        return response.data;
      },
      {
        retries: 3,
        minTimeout: 500,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            { attempt: err.attemptNumber, retriesLeft: err.retriesLeft, choice },
            'Canton exercise retry',
          );
        },
      },
    );
  }

  /**
   * Create a new contract on the ledger.
   */
  async createContract<T>(templateId: string, payload: T): Promise<CreateResult> {
    if (this.isMock) {
      log.debug({ templateId }, 'Mock create contract');
      return {
        contractId: `#canton-mock-${Date.now()}`,
        templateId,
      };
    }

    return pRetry(
      async () => {
        const response = await this.http.post<CreateResult>(
          '/v2/create',
          { templateId, payload },
        );
        return response.data;
      },
      {
        retries: 3,
        minTimeout: 500,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            { attempt: err.attemptNumber, retriesLeft: err.retriesLeft, templateId },
            'Canton create retry',
          );
        },
      },
    );
  }

  // -------------------------------------------------------------------------
  // Credit Attestation convenience methods
  // -------------------------------------------------------------------------

  /** Create a new attestation bundle for a given owner. */
  async createAttestationBundle(owner: string): Promise<CreateResult> {
    return this.createContract('Dualis.Credit.Attestation:CreditAttestationBundle', {
      owner,
      attestations: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  /** Add an attestation to an existing attestation bundle. */
  async addAttestation(bundleId: string, attestation: Record<string, unknown>): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Credit.Attestation:CreditAttestationBundle',
      bundleId,
      'AddAttestation',
      { attestation },
    );
  }

  /** Prune expired attestations from a bundle. */
  async pruneExpiredAttestations(bundleId: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Credit.Attestation:CreditAttestationBundle',
      bundleId,
      'PruneExpired',
      { currentTime: new Date().toISOString() },
    );
  }

  // -------------------------------------------------------------------------
  // Composite Score convenience methods
  // -------------------------------------------------------------------------

  /** Create a new composite credit contract for a given owner. */
  async createCompositeCredit(owner: string): Promise<CreateResult> {
    return this.createContract('Dualis.Credit.CompositeScore:CompositeCredit', {
      owner,
      compositeScore: 0,
      onChainBreakdown: {},
      offChainBreakdown: {},
      ecosystemBreakdown: {},
      calculationTime: new Date().toISOString(),
    });
  }

  /** Recalculate a composite credit score. */
  async recalculateComposite(
    creditId: string,
    breakdowns: { onChain: Record<string, unknown>; offChain: Record<string, unknown>; ecosystem: Record<string, unknown> },
  ): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Credit.CompositeScore:CompositeCredit',
      creditId,
      'RecalculateComposite',
      {
        onChain: breakdowns.onChain,
        offChain: breakdowns.offChain,
        ecosystem: breakdowns.ecosystem,
        calculationTime: new Date().toISOString(),
      },
    );
  }

  // -------------------------------------------------------------------------
  // Productive convenience methods
  // -------------------------------------------------------------------------

  /** Create a new productive project. */
  async createProductiveProject(data: Record<string, unknown>): Promise<CreateResult> {
    return this.createContract('Dualis.Productive.Core:ProductiveProject', {
      ...data,
      status: data.status ?? 'Proposed',
      attestationIds: data.attestationIds ?? [],
      createdAt: new Date().toISOString(),
    });
  }

  /** Update a productive project's status. */
  async updateProjectStatus(projectId: string, status: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Productive.Core:ProductiveProject',
      projectId,
      'UpdateProjectStatus',
      { newStatus: status },
    );
  }

  /** Create a new productive borrow. */
  async createProductiveBorrow(data: Record<string, unknown>): Promise<CreateResult> {
    return this.createContract('Dualis.Productive.Core:ProductiveBorrow', {
      ...data,
      outstandingBalance: data.amount ?? '0',
      cashflowSchedule: data.cashflowSchedule ?? [],
      healthStatus: 'Healthy',
      createdAt: new Date().toISOString(),
    });
  }

  /** Record a cashflow repayment on a productive borrow. */
  async processCashflowRepayment(borrowId: string, entry: Record<string, unknown>): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Productive.Core:ProductiveBorrow',
      borrowId,
      'CashflowRepayment',
      { entry },
    );
  }

  /** Check the health of a productive borrow against project metrics. */
  async checkProjectHealth(borrowId: string, actual: number, expected: number): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Productive.Core:ProductiveBorrow',
      borrowId,
      'CheckProjectHealth',
      { actual, expected },
    );
  }

  // -------------------------------------------------------------------------
  // Advanced SecLending convenience methods
  // -------------------------------------------------------------------------

  /** Create a new fractional lending offer. */
  async createFractionalOffer(data: Record<string, unknown>): Promise<CreateResult> {
    return this.createContract('Dualis.SecLending.Advanced:FractionalOffer', {
      ...data,
      remainingAmount: data.totalAmount ?? data.amount ?? '0',
      isActive: true,
    });
  }

  /** Accept a fraction of a fractional lending offer. */
  async acceptFraction(offerId: string, borrower: string, amount: number): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.SecLending.Advanced:FractionalOffer',
      offerId,
      'AcceptFraction',
      { borrower, amount },
    );
  }

  /** Propose a netting agreement between two parties. */
  async proposeNetting(partyA: string, partyB: string, dealIds: string[]): Promise<CreateResult> {
    return this.createContract('Dualis.SecLending.Advanced:NettingAgreement', {
      partyA,
      partyB,
      dealIds,
      status: 'Proposed',
      proposedAt: new Date().toISOString(),
    });
  }

  /** Execute netting on an existing netting agreement. */
  async executeNetting(nettingId: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.SecLending.Advanced:NettingAgreement',
      nettingId,
      'ExecuteNetting',
      { executionTime: new Date().toISOString() },
    );
  }

  /** Process a corporate action on a handler. */
  async processCorporateAction(handlerId: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.SecLending.Advanced:CorporateActionHandler',
      handlerId,
      'ProcessCorporateAction',
      { processingTime: new Date().toISOString() },
    );
  }

  // -------------------------------------------------------------------------
  // Institutional convenience methods
  // -------------------------------------------------------------------------

  /** Create a verified institution record. */
  async createVerifiedInstitution(data: Record<string, unknown>): Promise<CreateResult> {
    return this.createContract('Dualis.Institutional.Core:VerifiedInstitution', {
      ...data,
      kybStatus: data.kybStatus ?? 'Pending',
      subAccounts: data.subAccounts ?? [],
      verifiedAt: new Date().toISOString(),
    });
  }

  /** Add a sub-account to a verified institution. */
  async addSubAccount(institutionId: string, subAccount: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Institutional.Core:VerifiedInstitution',
      institutionId,
      'AddSubAccount',
      { subAccountParty: subAccount },
    );
  }

  /** Renew KYB for a verified institution. */
  async renewKYB(institutionId: string, newExpiry: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Institutional.Core:VerifiedInstitution',
      institutionId,
      'RenewKYB',
      { newExpiry, renewalTime: new Date().toISOString() },
    );
  }

  // -------------------------------------------------------------------------
  // Privacy convenience methods
  // -------------------------------------------------------------------------

  /** Create a privacy config for a user. */
  async createPrivacyConfig(user: string): Promise<CreateResult> {
    return this.createContract('Dualis.Privacy.Config:PrivacyConfig', {
      user,
      privacyLevel: 'Standard',
      disclosureRules: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  /** Set the privacy level on a privacy config. */
  async setPrivacyLevel(configId: string, level: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Privacy.Config:PrivacyConfig',
      configId,
      'SetPrivacyLevel',
      { newLevel: level, updateTime: new Date().toISOString() },
    );
  }

  /** Add a disclosure rule to a privacy config. */
  async addDisclosure(configId: string, rule: Record<string, unknown>): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Privacy.Config:PrivacyConfig',
      configId,
      'AddDisclosure',
      { rule, updateTime: new Date().toISOString() },
    );
  }

  /** Remove a disclosure rule from a privacy config. */
  async removeDisclosure(configId: string, party: string): Promise<ExerciseResult> {
    return this.exerciseChoice(
      'Dualis.Privacy.Config:PrivacyConfig',
      configId,
      'RemoveDisclosure',
      { ruleId: party, updateTime: new Date().toISOString() },
    );
  }

  /** Check if a requester has access for a given scope. Returns true in mock mode. */
  async checkAccess(configId: string, requester: string, scope: string): Promise<boolean> {
    if (this.isMock) {
      log.debug({ configId, requester, scope }, 'Mock check access');
      return true;
    }

    const result = await this.exerciseChoice(
      'Dualis.Privacy.Config:PrivacyConfig',
      configId,
      'CheckAccess',
      { requester, scope },
    );
    return (result.exerciseResult as { hasAccess?: boolean })?.hasAccess ?? false;
  }
}
