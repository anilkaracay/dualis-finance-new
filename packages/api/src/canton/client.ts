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
}
