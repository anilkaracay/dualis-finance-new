import { z } from 'zod';

/** Parse string "true"/"false" to boolean (unlike z.coerce.boolean which uses Boolean()). */
const booleanString = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === '1';
  });

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Canton
  CANTON_ENV: z.enum(['sandbox', 'devnet', 'mainnet']).default('sandbox'),
  CANTON_JSON_API_URL: z.string().url().default('http://localhost:7575'),
  CANTON_GRPC_URL: z.string().default('localhost:6865'),
  CANTON_MOCK: booleanString.default(true),
  CANTON_JWT_TOKEN: z.string().optional(),
  CANTON_TLS_CERT_PATH: z.string().optional(),
  CANTON_OPERATOR_PARTY: z.string().default('party::operator'),
  CANTON_ORACLE_PARTY: z.string().default('party::oracle'),

  // Splice Wallet API (validator wallet REST API for CC balance queries)
  SPLICE_WALLET_API_URL: z.string().optional(),
  SPLICE_WALLET_JWT_SECRET: z.string().default('unsafe'),
  SPLICE_WALLET_JWT_AUDIENCE: z.string().default('https://validator.example.com'),

  // Database
  DATABASE_URL: z.string().default('postgresql://localhost:5432/dualis'),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(20),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().default('dev-jwt-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-in-production'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Security (MP22)
  BODY_SIZE_LIMIT_BYTES: z.coerce.number().default(1_048_576), // 1MB
  COOKIE_SECRET: z.string().default('dev-cookie-secret-change-in-production'),
  BRUTE_FORCE_MAX_ATTEMPTS: z.coerce.number().default(8),
  BRUTE_FORCE_LOCKOUT_SEC: z.coerce.number().default(900),
  BAN_THRESHOLD: z.coerce.number().default(3),
  BAN_DURATION_SECONDS: z.coerce.number().default(900),
  CSRF_ENABLED: booleanString.default(false),

  // Oracle
  ORACLE_UPDATE_INTERVAL_MS: z.coerce.number().default(30000),
  COINGECKO_API_KEY: z.string().optional(),
  COINGECKO_BASE_URL: z.string().default('https://api.coingecko.com/api/v3'),
  BINANCE_WS_URL: z.string().default('wss://stream.binance.com:9443/ws'),
  BINANCE_WS_ENABLED: booleanString.default(false),
  ORACLE_CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(0.10),
  ORACLE_TWAP_WINDOW_MS: z.coerce.number().default(300000),
  ORACLE_CANTON_SYNC_ENABLED: booleanString.default(false),
  ORACLE_MIN_SOURCES: z.coerce.number().default(1),

  // Features
  FEATURE_FLASH_LOANS: booleanString.default(true),
  FEATURE_SEC_LENDING: booleanString.default(true),
  FEATURE_GOVERNANCE: booleanString.default(true),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Notification (MP20)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_ADDRESS: z.string().default('notifications@dualis.finance'),
  RESEND_FROM_NAME: z.string().default('Dualis Finance'),
  RESEND_DRY_RUN: booleanString.default(false),
  NOTIFICATION_HF_SCAN_INTERVAL_MS: z.coerce.number().default(60000),
  NOTIFICATION_EMAIL_RATE_LIMIT: z.coerce.number().default(10),
  NOTIFICATION_WEBHOOK_TIMEOUT_MS: z.coerce.number().default(10000),
  NOTIFICATION_RETENTION_DAYS: z.coerce.number().default(90),
  NOTIFICATION_DELIVERY_LOG_RETENTION_DAYS: z.coerce.number().default(30),
  NOTIFICATION_DIGEST_TIME_UTC: z.string().default('09:00'),

  // KYC — Sumsub (MP21)
  SUMSUB_APP_TOKEN: z.string().optional(),
  SUMSUB_SECRET_KEY: z.string().optional(),
  SUMSUB_BASE_URL: z.string().default('https://api.sumsub.com'),
  SUMSUB_WEBHOOK_SECRET: z.string().optional(),
  SUMSUB_KYC_LEVEL_NAME: z.string().default('basic-kyc-level'),
  SUMSUB_MOCK: booleanString.default(true),

  // AML — Chainalysis (MP21)
  CHAINALYSIS_API_KEY: z.string().optional(),
  CHAINALYSIS_BASE_URL: z.string().default('https://api.chainalysis.com/api/kyt/v2'),
  CHAINALYSIS_MOCK: booleanString.default(true),

  // Compliance (MP21)
  COMPLIANCE_AUTO_APPROVE_THRESHOLD: z.coerce.number().default(25),
  COMPLIANCE_MANUAL_REVIEW_THRESHOLD: z.coerce.number().default(50),
  COMPLIANCE_BLOCK_THRESHOLD: z.coerce.number().default(75),
  COMPLIANCE_DOCUMENT_RETENTION_YEARS: z.coerce.number().default(8),
  COMPLIANCE_RESCREENING_LOW_MONTHS: z.coerce.number().default(12),
  COMPLIANCE_RESCREENING_MED_MONTHS: z.coerce.number().default(3),
  COMPLIANCE_RESCREENING_HIGH_MONTHS: z.coerce.number().default(1),
  COMPLIANCE_JURISDICTION: z.string().default('TR'),
  COMPLIANCE_PERIODIC_SCREENING_INTERVAL_MS: z.coerce.number().default(86400000),
  COMPLIANCE_SANCTIONS_UPDATE_INTERVAL_MS: z.coerce.number().default(86400000),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}

export const env = loadEnv();
