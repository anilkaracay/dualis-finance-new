import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { AppError } from './errorHandler.js';
import { getDb, schema } from '../db/client.js';
import { eq } from 'drizzle-orm';

const log = createChildLogger('auth');

// ---------------------------------------------------------------------------
// Fastify module augmentation
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      partyId: string;
      walletAddress?: string;
      tier?: string;
      isOperator?: boolean;
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
  walletAddress?: string;
  tier?: string;
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
      request.user = {
        partyId: decoded.sub,
        ...(decoded.walletAddress !== undefined ? { walletAddress: decoded.walletAddress } : {}),
        ...(decoded.tier !== undefined ? { tier: decoded.tier } : {}),
        isOperator: decoded.sub === OPERATOR_PARTY_ID,
      };
      return;
    } catch (err) {
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
