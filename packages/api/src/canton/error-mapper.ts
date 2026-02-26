/**
 * Canton Error Mapper — Maps technical Canton/network errors to user-friendly messages.
 *
 * Used in route handlers to ensure raw errors like "getaddrinfo ENOTFOUND"
 * never leak to the frontend.
 */

import type { ApiErrorCode } from '@dualis/shared';

export interface CantonErrorInfo {
  code: ApiErrorCode;
  userMessage: string;
  technicalDetail: string;
  retryable: boolean;
  httpStatus: number;
}

export function mapCantonError(err: unknown): CantonErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  // --- Network / DNS errors ---
  if (lower.includes('enotfound') || lower.includes('getaddrinfo')) {
    return {
      code: 'CANTON_UNREACHABLE',
      userMessage: 'Canton ledger is currently unreachable. Please try again in a few moments.',
      technicalDetail: raw,
      retryable: true,
      httpStatus: 503,
    };
  }

  if (lower.includes('econnrefused') || lower.includes('connect econnrefused')) {
    return {
      code: 'CANTON_CONNECTION_REFUSED',
      userMessage: 'Canton ledger connection was refused. The service may be restarting.',
      technicalDetail: raw,
      retryable: true,
      httpStatus: 503,
    };
  }

  if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('esockettimedout')) {
    return {
      code: 'CANTON_TIMEOUT',
      userMessage: 'The transaction timed out. Canton ledger may be under heavy load. Please try again.',
      technicalDetail: raw,
      retryable: true,
      httpStatus: 504,
    };
  }

  if (lower.includes('econnreset') || lower.includes('socket hang up')) {
    return {
      code: 'CANTON_CONNECTION_RESET',
      userMessage: 'Connection to Canton ledger was interrupted. Please retry your transaction.',
      technicalDetail: raw,
      retryable: true,
      httpStatus: 502,
    };
  }

  // --- Canton-specific business errors ---
  if (lower.includes('contract_not_found') || lower.includes('not found on ledger')) {
    return {
      code: 'CANTON_CONTRACT_NOT_FOUND',
      userMessage: 'The contract was not found on the ledger. It may have been consumed by another transaction.',
      technicalDetail: raw,
      retryable: false,
      httpStatus: 409,
    };
  }

  if (lower.includes('contract_not_active') || lower.includes('already been archived')) {
    return {
      code: 'CANTON_CONTRACT_ARCHIVED',
      userMessage: 'This contract has already been processed. Please refresh and try again.',
      technicalDetail: raw,
      retryable: false,
      httpStatus: 409,
    };
  }

  if (lower.includes('insufficient liquidity')) {
    return {
      code: 'INSUFFICIENT_LIQUIDITY',
      userMessage: 'Insufficient liquidity in the pool for this operation.',
      technicalDetail: raw,
      retryable: false,
      httpStatus: 422,
    };
  }

  if (lower.includes('supply cap exceeded') || lower.includes('supply cap')) {
    return {
      code: 'SUPPLY_CAP_EXCEEDED',
      userMessage: 'This deposit would exceed the pool supply cap.',
      technicalDetail: raw,
      retryable: false,
      httpStatus: 422,
    };
  }

  if (lower.includes('borrow cap exceeded') || lower.includes('borrow cap')) {
    return {
      code: 'BORROW_CAP_REACHED',
      userMessage: 'This borrow would exceed the pool borrow cap.',
      technicalDetail: raw,
      retryable: false,
      httpStatus: 422,
    };
  }

  if (lower.includes('pool is not active') || lower.includes('pool inactive')) {
    return {
      code: 'POOL_INACTIVE',
      userMessage: 'This pool is currently paused. Operations are temporarily disabled.',
      technicalDetail: raw,
      retryable: false,
      httpStatus: 422,
    };
  }

  if (lower.includes('status code 401') || lower.includes('unauthorized')) {
    return {
      code: 'CANTON_UNAVAILABLE',
      userMessage: 'Canton ledger authentication failed. Please contact support.',
      technicalDetail: raw,
      retryable: false,
      httpStatus: 502,
    };
  }

  if (lower.includes('status code 503') || lower.includes('service unavailable')) {
    return {
      code: 'CANTON_UNAVAILABLE',
      userMessage: 'Canton ledger is temporarily unavailable. Please try again shortly.',
      technicalDetail: raw,
      retryable: true,
      httpStatus: 503,
    };
  }

  // --- Catch-all ---
  return {
    code: 'CANTON_ERROR',
    userMessage: 'An error occurred while processing your transaction. Please try again.',
    technicalDetail: raw,
    retryable: true,
    httpStatus: 502,
  };
}
