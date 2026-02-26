import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { ApiErrorCode } from '@dualis/shared';
import { createChildLogger } from '../config/logger.js';
import { captureException } from './sentry.js';

const log = createChildLogger('error-handler');

export class AppError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const ERROR_STATUS_MAP: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  POOL_NOT_FOUND: 404,
  POSITION_NOT_FOUND: 404,
  INSUFFICIENT_BALANCE: 422,
  INSUFFICIENT_COLLATERAL: 422,
  HEALTH_FACTOR_TOO_LOW: 422,
  POOL_INACTIVE: 422,
  PROTOCOL_PAUSED: 503,
  BORROW_CAP_REACHED: 422,
  FLASH_LOAN_REPAY_FAILED: 422,
  CREDIT_CHECK_FAILED: 422,
  OFFER_EXPIRED: 422,
  DEAL_NOT_ACTIVE: 422,
  RECALL_NOT_ALLOWED: 422,
  ORACLE_STALE: 503,
  CANTON_ERROR: 502,
  CANTON_UNREACHABLE: 503,
  CANTON_CONNECTION_REFUSED: 503,
  CANTON_TIMEOUT: 504,
  CANTON_CONNECTION_RESET: 502,
  CANTON_CONTRACT_NOT_FOUND: 409,
  CANTON_CONTRACT_ARCHIVED: 409,
  CANTON_UNAVAILABLE: 503,
  SUPPLY_CAP_EXCEEDED: 422,
  INSUFFICIENT_LIQUIDITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function getStatusForCode(code: string): number {
  return ERROR_STATUS_MAP[code] ?? 500;
}

export function globalErrorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = (request.id as string) ?? 'unknown';

  if (error instanceof AppError) {
    log.warn({ code: error.code, message: error.message, requestId }, 'App error');
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Rate limit errors from @fastify/rate-limit plugin
  if (
    'statusCode' in error && (error as any).statusCode === 429 ||
    error.message?.includes('Rate limit exceeded')
  ) {
    log.warn({ requestId, message: error.message }, 'Rate limit exceeded');
    return reply.status(429).send({
      error: {
        code: 'RATE_LIMITED',
        message: error.message || 'Rate limit exceeded, please try again later',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Unknown errors — capture in Sentry
  log.error({ err: error, requestId }, 'Unhandled error');
  captureException(error);
  return reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
