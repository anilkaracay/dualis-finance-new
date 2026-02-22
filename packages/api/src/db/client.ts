import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import * as schema from './schema.js';

const log = createChildLogger('db');

type DbClient = ReturnType<typeof postgres>;
type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let dbClient: DbClient | null = null;
let dbInstance: DbInstance | null = null;

/**
 * Returns the Drizzle ORM database instance.
 * Lazily initializes the connection on first call.
 * Returns `null` if the connection cannot be established (graceful degradation).
 */
export function getDb(): DbInstance | null {
  if (!dbInstance) {
    try {
      dbClient = postgres(env.DATABASE_URL, {
        max: env.DB_POOL_MAX,
        // postgres.js does not support min pool size directly; max is sufficient
        ssl: env.NODE_ENV === 'production' ? 'require' : false,
        onnotice: () => {
          // suppress notices
        },
      });
      dbInstance = drizzle(dbClient, { schema });
      log.info('Database connected');
    } catch (err) {
      log.warn({ err }, 'Database connection failed — running without DB');
      return null;
    }
  }
  return dbInstance;
}

/**
 * Cleanly closes the database connection pool.
 */
export async function closeDb(): Promise<void> {
  if (dbClient) {
    await dbClient.end();
    dbClient = null;
    dbInstance = null;
    log.info('Database connection closed');
  }
}

export { schema };
