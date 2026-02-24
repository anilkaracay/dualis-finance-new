/**
 * Canton environment configuration.
 *
 * Defines sandbox / devnet / mainnet profiles so the rest of the stack can
 * branch on `CANTON_ENV` without scattering if-checks everywhere.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CantonEnvironment = 'sandbox' | 'devnet' | 'mainnet';

export interface PartyConfig {
  operator: string;
  oracle: string;
  liquidator: string;
  treasury: string;
}

export interface CantonConfig {
  /** sandbox | devnet | mainnet */
  environment: CantonEnvironment;

  /** Canton JSON API base URL */
  jsonApiUrl: string;

  /** Canton gRPC Ledger API host:port */
  grpcUrl: string;

  /** Use mock data instead of real ledger */
  useMockData: boolean;

  /** Require JWT authentication for Ledger API */
  requireAuth: boolean;

  /** JWT token for Ledger API (devnet / mainnet) */
  jwtToken?: string;

  /** TLS certificate path (mainnet) */
  tlsCertPath?: string;

  /** Enable TLS for gRPC connections */
  useTls: boolean;

  /** Well-known party identifiers */
  parties: PartyConfig;

  /** Max retries for ledger commands */
  maxRetries: number;

  /** Base retry delay in ms */
  retryBaseDelayMs: number;

  /** Command timeout in ms */
  commandTimeoutMs: number;

  /** Wait for ledger commit before returning */
  waitForCommit: boolean;

  /** Token bridge mode: mock (sandbox) or cip56 (devnet/mainnet) */
  tokenBridgeMode: 'mock' | 'cip56';

  /** DAR file version deployed */
  darVersion: string;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const SANDBOX_CONFIG: CantonConfig = {
  environment: 'sandbox',
  jsonApiUrl: 'http://localhost:7575',
  grpcUrl: 'localhost:6865',
  useMockData: true,
  requireAuth: false,
  useTls: false,
  parties: {
    operator: 'Operator',
    oracle: 'Oracle',
    liquidator: 'Liquidator',
    treasury: 'Operator',
  },
  maxRetries: 3,
  retryBaseDelayMs: 200,
  commandTimeoutMs: 30_000,
  waitForCommit: false,
  tokenBridgeMode: 'mock',
  darVersion: '2.0.0',
};

const DEVNET_CONFIG: CantonConfig = {
  environment: 'devnet',
  jsonApiUrl: 'http://localhost:7575',
  grpcUrl: 'localhost:5001',
  useMockData: false,
  requireAuth: false,
  useTls: false,
  parties: {
    operator:
      'cantara-finance-validator-dev::12204bcabe5f617d26d082a442b560d61e60e57ad845260b01c98657285eeeb2e7ef',
    oracle:
      'cantara-finance-validator-dev::12204bcabe5f617d26d082a442b560d61e60e57ad845260b01c98657285eeeb2e7ef',
    liquidator:
      'cantara-finance-validator-dev::12204bcabe5f617d26d082a442b560d61e60e57ad845260b01c98657285eeeb2e7ef',
    treasury:
      'cantara-finance-validator-dev::12204bcabe5f617d26d082a442b560d61e60e57ad845260b01c98657285eeeb2e7ef',
  },
  maxRetries: 5,
  retryBaseDelayMs: 500,
  commandTimeoutMs: 60_000,
  waitForCommit: true,
  tokenBridgeMode: 'cip56',
  darVersion: '2.0.0',
};

const MAINNET_CONFIG: CantonConfig = {
  environment: 'mainnet',
  jsonApiUrl: 'https://canton.dualis.finance:7575',
  grpcUrl: 'canton.dualis.finance:6865',
  useMockData: false,
  requireAuth: true,
  useTls: true,
  parties: {
    operator: 'party::operator::mainnet',
    oracle: 'party::oracle::mainnet',
    liquidator: 'party::liquidator::mainnet',
    treasury: 'party::treasury::mainnet',
  },
  maxRetries: 5,
  retryBaseDelayMs: 1000,
  commandTimeoutMs: 90_000,
  waitForCommit: true,
  tokenBridgeMode: 'cip56',
  darVersion: '2.0.0',
};

const CONFIGS: Record<CantonEnvironment, CantonConfig> = {
  sandbox: SANDBOX_CONFIG,
  devnet: DEVNET_CONFIG,
  mainnet: MAINNET_CONFIG,
};

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Build a CantonConfig by merging the preset for the active environment
 * with any process.env overrides.
 */
export function getCantonConfig(): CantonConfig {
  const envName = (process.env.CANTON_ENV ?? 'sandbox') as CantonEnvironment;
  const base = CONFIGS[envName] ?? SANDBOX_CONFIG;

  const jwt = process.env.CANTON_JWT_TOKEN ?? base.jwtToken;
  const tls = process.env.CANTON_TLS_CERT_PATH ?? base.tlsCertPath;

  const config: CantonConfig = {
    ...base,

    // Allow env-var overrides for values that change per deployment
    jsonApiUrl: process.env.CANTON_JSON_API_URL ?? base.jsonApiUrl,
    grpcUrl: process.env.CANTON_GRPC_URL ?? base.grpcUrl,

    // Party overrides
    parties: {
      operator: process.env.CANTON_OPERATOR_PARTY ?? base.parties.operator,
      oracle: process.env.CANTON_ORACLE_PARTY ?? base.parties.oracle,
      liquidator: process.env.CANTON_LIQUIDATOR_PARTY ?? base.parties.liquidator,
      treasury: process.env.CANTON_TREASURY_PARTY ?? base.parties.treasury,
    },

    // Mock can be explicitly toggled regardless of environment
    useMockData:
      process.env.CANTON_MOCK !== undefined
        ? process.env.CANTON_MOCK === 'true'
        : base.useMockData,

    // Auth: require if JWT token is provided, otherwise use preset default
    requireAuth:
      process.env.CANTON_JWT_TOKEN !== undefined
        ? process.env.CANTON_JWT_TOKEN !== ''
        : base.requireAuth,

    // TLS: enable if cert path is provided, otherwise use preset default
    useTls:
      process.env.CANTON_TLS_CERT_PATH !== undefined
        ? process.env.CANTON_TLS_CERT_PATH !== ''
        : base.useTls,
  };

  // Conditionally set optional properties to avoid exactOptionalPropertyTypes issues
  if (jwt !== undefined) {
    config.jwtToken = jwt;
  }
  if (tls !== undefined) {
    config.tlsCertPath = tls;
  }

  return config;
}

/** Cached singleton */
let _config: CantonConfig | null = null;

export function cantonConfig(): CantonConfig {
  if (!_config) {
    _config = getCantonConfig();
  }
  return _config;
}

/** Reset cached config (for testing) */
export function resetCantonConfig(): void {
  _config = null;
}
