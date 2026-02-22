import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Canton
  CANTON_ENV: z.enum(['sandbox', 'devnet', 'mainnet']).default('sandbox'),
  CANTON_JSON_API_URL: z.string().url().default('http://localhost:7575'),
  CANTON_GRPC_URL: z.string().default('localhost:6865'),
  CANTON_MOCK: z.coerce.boolean().default(true),
  CANTON_JWT_TOKEN: z.string().optional(),
  CANTON_TLS_CERT_PATH: z.string().optional(),
  CANTON_OPERATOR_PARTY: z.string().default('party::operator'),
  CANTON_ORACLE_PARTY: z.string().default('party::oracle'),

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

  // Oracle
  ORACLE_UPDATE_INTERVAL_MS: z.coerce.number().default(30000),
  COINGECKO_API_KEY: z.string().optional(),
  COINGECKO_BASE_URL: z.string().default('https://api.coingecko.com/api/v3'),
  BINANCE_WS_URL: z.string().default('wss://stream.binance.com:9443/ws'),
  BINANCE_WS_ENABLED: z.coerce.boolean().default(false),
  ORACLE_CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(0.10),
  ORACLE_TWAP_WINDOW_MS: z.coerce.number().default(300000),
  ORACLE_CANTON_SYNC_ENABLED: z.coerce.boolean().default(false),
  ORACLE_MIN_SOURCES: z.coerce.number().default(1),

  // Features
  FEATURE_FLASH_LOANS: z.coerce.boolean().default(true),
  FEATURE_SEC_LENDING: z.coerce.boolean().default(true),
  FEATURE_GOVERNANCE: z.coerce.boolean().default(true),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
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
