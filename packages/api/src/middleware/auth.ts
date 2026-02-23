import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { AppError } from './errorHandler.js';
import { getDb, schema } from '../db/client.js';
import { eq } from 'drizzle-orm';
import type { PrivacyLevel } from '@dualis/shared';
import * as institutionalService from '../services/institutional.service.js';
import * as privacyService from '../services/privacy.service.js';
import { isTokenBlacklisted } from '../security/session.js';

const log = createChildLogger('auth');

// ---------------------------------------------------------------------------
// Fastify module augmentation
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId?: string;
      partyId: string;
      walletAddress?: string;
      email?: string;
      role?: string;
      tier?: string;
      isOperator?: boolean;
      isInstitutional?: boolean;
      privacyLevel?: PrivacyLevel;
    };
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Mock operator partyId for development/testing. */
const OPERATOR_PARTY_ID = 'party::operator::0';

// ---------------------------------------------------------------------------
// JWT payload type
// ---------------------------------------------------------------------------

interface JwtPayload {
  sub: string;
  partyId?: string;
  walletAddress?: string;
  email?: string;
  role?: string;
  tier?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------
// Auth middleware (preHandler hook)
// ---------------------------------------------------------------------------

/**
 * Fastify preHandler hook that authenticates requests.
 *
 * Supports two authentication methods:
 * 1. Bearer token (JWT) via the Authorization header
 * 2. API key via the X-API-Key header (for institutional access)
 *
 * On success, populates `request.user` with the authenticated identity.
 */
export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // --- Try Bearer JWT first ---
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      // Check JWT blacklist (revoked sessions)
      if (decoded.jti && await isTokenBlacklisted(decoded.jti)) {
        throw new AppError('UNAUTHORIZED', 'Token has been revoked', 401);
      }

      request.user = {
        userId: decoded.sub,
        partyId: decoded.partyId ?? decoded.sub,
        ...(decoded.walletAddress !== undefined ? { walletAddress: decoded.walletAddress } : {}),
        ...(decoded.email !== undefined ? { email: decoded.email } : {}),
        ...(decoded.role !== undefined ? { role: decoded.role } : {}),
        ...(decoded.tier !== undefined ? { tier: decoded.tier } : {}),
        isOperator: (decoded.partyId ?? decoded.sub) === OPERATOR_PARTY_ID,
      };
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      log.debug({ err }, 'JWT verification failed');
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
    }
  }

  // --- Try X-API-Key header ---
  const apiKey = request.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.length > 0) {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const db = getDb();

    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.apiKeys)
          .where(eq(schema.apiKeys.keyHash, keyHash))
          .limit(1);

        const keyRecord = rows[0];
        if (keyRecord && keyRecord.isActive) {
          // Check expiration
          if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
            throw new AppError('UNAUTHORIZED', 'API key expired', 401);
          }

          request.user = {
            partyId: keyRecord.partyId,
            isOperator: keyRecord.partyId === OPERATOR_PARTY_ID,
          };

          // Update last used timestamp (fire-and-forget)
          db.update(schema.apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(schema.apiKeys.keyHash, keyHash))
            .then(() => { /* intentionally empty */ })
            .catch((updateErr: unknown) => {
              log.warn({ err: updateErr }, 'Failed to update API key last used');
            });

          return;
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        log.warn({ err }, 'API key lookup failed');
      }
    }

    throw new AppError('UNAUTHORIZED', 'Invalid API key', 401);
  }

  // --- No credentials provided ---
  throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
}

// ---------------------------------------------------------------------------
// Operator middleware
// ---------------------------------------------------------------------------

/**
 * Fastify preHandler hook that checks if the authenticated user is an operator.
 * Must be used AFTER `authMiddleware`.
 */
export async function operatorMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (!request.user?.isOperator) {
    throw new AppError('FORBIDDEN', 'Operator access required', 403);
  }
}

// ---------------------------------------------------------------------------
// Institutional permission middleware
// ---------------------------------------------------------------------------

/**
 * Fastify preHandler hook that verifies the caller is a verified institutional party.
 * Must be used AFTER `authMiddleware`.
 */
export async function institutionalMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const partyId = request.user?.partyId;
  if (!partyId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const institution = institutionalService.getInstitutionStatus(partyId);
  if (!institution || institution.kybStatus !== 'Verified') {
    throw new AppError('FORBIDDEN', 'Verified institutional access required', 403);
  }

  // Check KYB expiry
  if (institution.expiresAt && new Date(institution.expiresAt) < new Date()) {
    throw new AppError('FORBIDDEN', 'Institutional KYB verification has expired', 403);
  }

  // Augment request.user
  if (request.user) {
    request.user.isInstitutional = true;
  }

  log.debug({ partyId, kybLevel: institution.kybLevel }, 'Institutional access granted');
}

/**
 * Creates a preHandler hook that checks institutional permission for a specific product.
 * Must be used AFTER `authMiddleware` and `institutionalMiddleware`.
 */
export function requireInstitutionalProduct(product: string) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const partyId = request.user?.partyId;
    if (!partyId) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const institution = institutionalService.getInstitutionStatus(partyId);
    if (!institution) {
      throw new AppError('FORBIDDEN', 'Institutional access required', 403);
    }

    if (!institution.riskProfile.allowedProducts.includes(product)) {
      throw new AppError(
        'FORBIDDEN',
        `Institutional access to "${product}" not permitted by risk profile`,
        403,
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Privacy-level aware middleware
// ---------------------------------------------------------------------------

/**
 * Fastify preHandler hook that attaches the user's privacy level to the request.
 * Must be used AFTER `authMiddleware`.
 * Routes can then use `request.user.privacyLevel` to filter response data.
 */
export async function privacyMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const partyId = request.user?.partyId;
  if (!partyId) return;

  const config = privacyService.getPrivacyConfig(partyId);
  if (request.user) {
    request.user.privacyLevel = config.privacyLevel;
  }

  log.debug({ partyId, privacyLevel: config.privacyLevel }, 'Privacy level attached');
}

// ---------------------------------------------------------------------------
// Optional auth middleware (does not throw if no token)
// ---------------------------------------------------------------------------

export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return;

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    request.user = {
      userId: decoded.sub,
      partyId: decoded.partyId ?? decoded.sub,
      ...(decoded.walletAddress !== undefined ? { walletAddress: decoded.walletAddress } : {}),
      ...(decoded.email !== undefined ? { email: decoded.email } : {}),
      ...(decoded.role !== undefined ? { role: decoded.role } : {}),
      ...(decoded.tier !== undefined ? { tier: decoded.tier } : {}),
      isOperator: (decoded.partyId ?? decoded.sub) === OPERATOR_PARTY_ID,
    };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
}

// ---------------------------------------------------------------------------
// Role-based access middleware
// ---------------------------------------------------------------------------

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user?.role || !roles.includes(request.user.role)) {
      throw new AppError('FORBIDDEN', `Access restricted to: ${roles.join(', ')}`, 403);
    }
  };
}
