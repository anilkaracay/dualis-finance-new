/** Individual price feed from an oracle provider */
export interface PriceFeed {
  /** Feed identifier */
  feedId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Oracle provider party */
  oracleProvider: string;
  /** Asset symbol */
  asset: string;
  /** Quote currency (e.g., "USD") */
  quoteCurrency: string;
  /** Current price (Decimal as string) */
  price: string;
  /** Price confidence (Decimal as string, 0-1) */
  confidence: string;
  /** Price timestamp (ISO 8601) */
  timestamp: string;
  /** Price source (e.g., "Chainlink Data Streams") */
  source: string;
  /** Heartbeat interval in seconds */
  heartbeatSeconds: number;
  /** Deviation threshold for updates (Decimal as string, percentage) */
  deviationThresholdPercent: string;
}

/** Aggregated price feed from multiple sources */
export interface AggregatedPriceFeed {
  /** Feed identifier */
  feedId: string;
  /** Protocol operator party */
  protocolOperator: string;
  /** Source data: [provider party, price, timestamp] */
  sources: Array<[string, string, string]>;
  /** Aggregated price (Decimal as string) */
  aggregatedPrice: string;
  /** Minimum number of sources required */
  minSources: number;
  /** Maximum allowed deviation between sources (Decimal as string) */
  maxDeviation: string;
  /** Last aggregation timestamp (ISO 8601) */
  lastAggregated: string;
}

// ============================================================================
// Oracle Pipeline Shared Types (MP16)
// ============================================================================

/** Oracle pipeline status response (GET /oracle/status) */
export interface OracleStatusResponse {
  isHealthy: boolean;
  lastCycleTs: number | null;
  lastCycleDurationMs: number | null;
  sourceStatuses: OracleSourceStatus[];
  assetCount: number;
  circuitBreakers: OracleCircuitBreakerInfo[];
}

/** Individual oracle source adapter status */
export interface OracleSourceStatus {
  source: string;
  isConnected: boolean;
  lastFetchTs: number | null;
  lastError: string | null;
  assetCount: number;
}

/** Circuit breaker info for a single asset */
export interface OracleCircuitBreakerInfo {
  asset: string;
  isTripped: boolean;
  reason: string | null;
  trippedAt: number | null;
  recoversAt: number | null;
}

/** TWAP response (GET /oracle/twap/:asset) */
export interface TWAPResponse {
  asset: string;
  price5m: number | null;
  price15m: number | null;
  price1h: number | null;
  sampleCount: number;
  lastSampleTs: number;
}

/** Oracle alert item (GET /oracle/alerts) */
export interface OracleAlertItem {
  id: string;
  type: string;
  asset: string | null;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  metadata: Record<string, unknown>;
  timestamp: number;
}
