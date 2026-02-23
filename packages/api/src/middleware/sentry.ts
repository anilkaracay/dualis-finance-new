import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('sentry');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryModule: any = null;

export async function initSentry(): Promise<void> {
  if (!env.SENTRY_DSN) {
    log.debug('SENTRY_DSN not set — Sentry disabled');
    return;
  }

  try {
    SentryModule = await import('@sentry/node' as string);
    SentryModule.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      release: process.env.npm_package_version,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    log.info('Sentry initialized');
  } catch {
    log.warn('Sentry SDK not installed — error tracking disabled');
    SentryModule = null;
  }
}

export function captureException(error: unknown): void {
  if (SentryModule) {
    SentryModule.captureException(error);
  }
}

export async function closeSentry(): Promise<void> {
  if (SentryModule) {
    await SentryModule.close(2000);
  }
}
