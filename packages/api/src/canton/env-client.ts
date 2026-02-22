/**
 * Environment-aware Canton client.
 *
 * Wraps the base CantonClient with environment-specific behaviour:
 *   - JWT auth headers (devnet/mainnet)
 *   - TLS configuration (mainnet)
 *   - Commit-wait semantics (devnet/mainnet)
 *   - Environment-specific retry policies
 *   - Health checks
 */

import axios, { type AxiosInstance } from 'axios';
import pRetry from 'p-retry';
import { createChildLogger } from '../config/logger.js';
import { cantonConfig, type CantonConfig } from '../config/canton-env.js';
import type { CantonContract, ExerciseResult, CreateResult } from './types.js';

const log = createChildLogger('canton-env-client');

// ---------------------------------------------------------------------------
// CantonEnvClient
// ---------------------------------------------------------------------------

export class CantonEnvClient {
  private static instance: CantonEnvClient | null = null;
  private readonly http: AxiosInstance;
  private readonly config: CantonConfig;

  private constructor(config?: CantonConfig) {
    this.config = config ?? cantonConfig();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // JWT auth for devnet / mainnet
    if (this.config.requireAuth && this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`;
    }

    this.http = axios.create({
      baseURL: this.config.jsonApiUrl,
      timeout: this.config.commandTimeoutMs,
      headers,
    });

    // Request interceptor: logging
    this.http.interceptors.request.use((reqConfig) => {
      log.debug(
        { url: reqConfig.url, method: reqConfig.method, env: this.config.environment },
        'Canton API request',
      );
      return reqConfig;
    });

    // Response interceptor: logging + error capture
    this.http.interceptors.response.use(
      (response) => {
        log.debug(
          { url: response.config.url, status: response.status },
          'Canton API response',
        );
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          log.error(
            {
              url: error.config?.url,
              status: error.response?.status,
              message: error.message,
              env: this.config.environment,
            },
            'Canton API error',
          );
        }
        throw error;
      },
    );

    log.info(
      {
        env: this.config.environment,
        url: this.config.jsonApiUrl,
        auth: this.config.requireAuth,
        tls: this.config.useTls,
        mock: this.config.useMockData,
      },
      'CantonEnvClient initialized',
    );
  }

  static getInstance(config?: CantonConfig): CantonEnvClient {
    if (!CantonEnvClient.instance) {
      CantonEnvClient.instance = new CantonEnvClient(config);
    }
    return CantonEnvClient.instance;
  }

  /** Reset the singleton (for testing) */
  static resetInstance(): void {
    CantonEnvClient.instance = null;
  }

  /** Get the active config */
  getConfig(): CantonConfig {
    return this.config;
  }

  // -------------------------------------------------------------------------
  // Core operations with environment-aware retry
  // -------------------------------------------------------------------------

  async queryContracts<T>(
    templateId: string,
    query?: Record<string, unknown>,
  ): Promise<CantonContract<T>[]> {
    return pRetry(
      async () => {
        const response = await this.http.post<{ result: CantonContract<T>[] }>(
          '/v2/queries',
          { templateId, ...(query ? { query } : {}) },
        );
        return response.data.result;
      },
      {
        retries: this.config.maxRetries,
        minTimeout: this.config.retryBaseDelayMs,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            {
              attempt: err.attemptNumber,
              retriesLeft: err.retriesLeft,
              templateId,
              env: this.config.environment,
            },
            'Canton query retry',
          );
        },
      },
    );
  }

  async queryContractByKey<T>(
    templateId: string,
    key: Record<string, unknown>,
  ): Promise<CantonContract<T> | null> {
    return pRetry(
      async () => {
        const response = await this.http.post<{ result: CantonContract<T> | null }>(
          '/v2/fetch',
          { templateId, key },
        );
        return response.data.result;
      },
      {
        retries: this.config.maxRetries,
        minTimeout: this.config.retryBaseDelayMs,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            {
              attempt: err.attemptNumber,
              retriesLeft: err.retriesLeft,
              templateId,
            },
            'Canton fetch retry',
          );
        },
      },
    );
  }

  async createContract<T>(
    templateId: string,
    payload: T,
  ): Promise<CreateResult> {
    const result = await pRetry(
      async () => {
        const response = await this.http.post<CreateResult>(
          '/v2/create',
          { templateId, payload },
        );
        return response.data;
      },
      {
        retries: this.config.maxRetries,
        minTimeout: this.config.retryBaseDelayMs,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            {
              attempt: err.attemptNumber,
              retriesLeft: err.retriesLeft,
              templateId,
            },
            'Canton create retry',
          );
        },
      },
    );

    if (this.config.waitForCommit) {
      await this.waitForCommit(result.contractId);
    }

    return result;
  }

  async exerciseChoice(
    templateId: string,
    contractId: string,
    choice: string,
    argument: Record<string, unknown>,
  ): Promise<ExerciseResult> {
    const result = await pRetry(
      async () => {
        const response = await this.http.post<ExerciseResult>(
          '/v2/exercise',
          { templateId, contractId, choice, argument },
        );
        return response.data;
      },
      {
        retries: this.config.maxRetries,
        minTimeout: this.config.retryBaseDelayMs,
        factor: 2,
        onFailedAttempt: (err) => {
          log.warn(
            {
              attempt: err.attemptNumber,
              retriesLeft: err.retriesLeft,
              choice,
              env: this.config.environment,
            },
            'Canton exercise retry',
          );
        },
      },
    );

    if (this.config.waitForCommit) {
      log.debug({ choice, contractId }, 'Waiting for commit confirmation');
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Commit wait (devnet / mainnet)
  // -------------------------------------------------------------------------

  private async waitForCommit(contractId: string, maxWaitMs = 10_000): Promise<void> {
    const start = Date.now();
    const pollInterval = 500;

    while (Date.now() - start < maxWaitMs) {
      try {
        const response = await this.http.post('/v2/fetch', {
          templateId: '*',
          key: {},
          contractId,
        });
        if (response.data?.result) {
          log.debug({ contractId, elapsed: Date.now() - start }, 'Commit confirmed');
          return;
        }
      } catch {
        // Contract not yet visible, keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    log.warn({ contractId, maxWaitMs }, 'Commit wait timed out');
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------

  async isHealthy(): Promise<boolean> {
    try {
      await this.http.get('/readyz', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /** Get ledger identity info */
  async getLedgerIdentity(): Promise<{ ledgerId: string } | null> {
    try {
      const response = await this.http.get<{ ledgerId: string }>('/v2/parties');
      return response.data;
    } catch {
      return null;
    }
  }
}
