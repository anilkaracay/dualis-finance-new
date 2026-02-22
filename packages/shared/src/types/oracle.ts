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
