import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse, AuthSession, AuthUser, WalletNonceResponse } from '@dualis/shared';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
import { checkBruteForce, recordFailedAttempt, resetBruteForce } from '../security/brute-force.js';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const registerRetailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(256).optional(),
});

const registerInstitutionalSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  companyName: z.string().min(1).max(256),
  repFirstName: z.string().min(1).max(256),
  repLastName: z.string().min(1).max(256),
  repTitle: z.string().min(1).max(256),
});

const loginEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const walletNonceSchema = z.object({
  walletAddress: z.string().min(10).max(256),
});

const walletVerifySchema = z.object({
  walletAddress: z.string().min(10).max(256),
  signature: z.string().min(1),
  nonce: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const linkWalletSchema = z.object({
  walletAddress: z.string().min(10).max(256),
  signature: z.string().min(1),
  nonce: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // ─── GET /auth/csrf-token — get CSRF token for state-changing requests ──
  fastify.get('/auth/csrf-token', async (_request, reply) => {
    const token = reply.generateCsrf?.();
    return reply.status(200).send({ data: { csrfToken: token ?? null } });
  });

  // POST /auth/register/retail
  fastify.post('/auth/register/retail', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const parsed = registerRetailSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid registration data', 400, parsed.error.flatten());
    }

    const result = await authService.registerRetail(
      parsed.data.email,
      parsed.data.password,
      parsed.data.displayName,
      request,
    );

    const response: ApiResponse<AuthSession> = { data: result };
    return reply.status(201).send(response);
  });

  // POST /auth/register/institutional
  fastify.post('/auth/register/institutional', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const parsed = registerInstitutionalSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid registration data', 400, parsed.error.flatten());
    }

    const result = await authService.registerInstitutional(
      parsed.data.email,
      parsed.data.password,
      parsed.data.companyName,
      parsed.data.repFirstName,
      parsed.data.repLastName,
      parsed.data.repTitle,
      request,
    );

    const response: ApiResponse<AuthSession & { institutionId: string }> = { data: result };
    return reply.status(201).send(response);
  });

  // POST /auth/login
  fastify.post('/auth/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const parsed = loginEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid login data', 400, parsed.error.flatten());
    }

    // Brute force check: ip:email combination
    const bfIdentifier = `${request.ip}:${parsed.data.email.toLowerCase()}`;
    const bfCheck = await checkBruteForce(bfIdentifier);
    if (!bfCheck.allowed) {
      throw new AppError(
        'RATE_LIMITED',
        'Too many failed attempts. Please try again later.',
        429,
        { retryAfter: bfCheck.retryAfterSeconds },
      );
    }

    try {
      const result = await authService.loginWithEmail(
        parsed.data.email,
        parsed.data.password,
        request,
      );

      // Successful login — reset brute force counter
      await resetBruteForce(bfIdentifier);

      const response: ApiResponse<AuthSession> = { data: result };
      return reply.status(200).send(response);
    } catch (err) {
      // Record failed attempt for brute force tracking (only for credential errors)
      if (err instanceof AppError && err.code === 'INVALID_CREDENTIALS') {
        await recordFailedAttempt(bfIdentifier);
      }
      throw err;
    }
  });

  // POST /auth/wallet/nonce
  fastify.post('/auth/wallet/nonce', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const parsed = walletNonceSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid wallet address', 400, parsed.error.flatten());
    }

    const result = await authService.generateWalletNonce(parsed.data.walletAddress);

    const response: ApiResponse<WalletNonceResponse> = { data: result };
    return reply.status(200).send(response);
  });

  // POST /auth/wallet/verify
  fastify.post('/auth/wallet/verify', async (request, reply) => {
    const parsed = walletVerifySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid wallet verification data', 400, parsed.error.flatten());
    }

    const result = await authService.loginWithWallet(
      parsed.data.walletAddress,
      parsed.data.signature,
      parsed.data.nonce,
      request,
    );

    const response: ApiResponse<AuthSession & { isNewUser: boolean }> = { data: result };
    return reply.status(200).send(response);
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const parsed = refreshTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Refresh token required', 400, parsed.error.flatten());
    }

    const result = await authService.refreshSession(parsed.data.refreshToken, request);

    const response: ApiResponse<AuthSession> = { data: result };
    return reply.status(200).send(response);
  });

  // POST /auth/logout (auth required)
  fastify.post(
    '/auth/logout',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      // Try to invalidate by refresh token from body, otherwise logout all
      const body = request.body as { refreshToken?: string } | undefined;
      if (body?.refreshToken) {
        await authService.logoutByRefreshToken(body.refreshToken);
      } else if (request.user?.userId) {
        await authService.logoutAll(request.user.userId);
      }

      return reply.status(200).send({ data: { success: true } });
    },
  );

  // GET /auth/me (auth required)
  fastify.get(
    '/auth/me',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const user = await authService.getUserById(userId);
      if (!user) {
        throw new AppError('NOT_FOUND', 'User not found', 404);
      }

      const response: ApiResponse<AuthUser> = { data: user };
      return reply.status(200).send(response);
    },
  );

  // POST /auth/verify-email
  fastify.post('/auth/verify-email', {
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const parsed = verifyEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Token required', 400, parsed.error.flatten());
    }

    const result = await authService.verifyEmail(parsed.data.token);

    const response: ApiResponse<typeof result> = { data: result };
    return reply.status(200).send(response);
  });

  // POST /auth/forgot-password
  fastify.post('/auth/forgot-password', {
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Email required', 400, parsed.error.flatten());
    }

    const result = await authService.requestPasswordReset(parsed.data.email);

    const response: ApiResponse<typeof result> = { data: result };
    return reply.status(200).send(response);
  });

  // POST /auth/reset-password
  fastify.post('/auth/reset-password', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid reset data', 400, parsed.error.flatten());
    }

    const result = await authService.resetPassword(parsed.data.token, parsed.data.newPassword);

    const response: ApiResponse<typeof result> = { data: result };
    return reply.status(200).send(response);
  });

  // POST /auth/link-wallet (auth required)
  fastify.post(
    '/auth/link-wallet',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const parsed = linkWalletSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid wallet data', 400, parsed.error.flatten());
      }

      const userId = request.user?.userId;
      if (!userId) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const result = await authService.linkWallet(
        userId,
        parsed.data.walletAddress,
        parsed.data.signature,
        parsed.data.nonce,
      );

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // ─── GET /auth/sessions — list active sessions for current user ─────
  fastify.get(
    '/auth/sessions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const sessions = await authService.getUserSessions(userId);
      return reply.status(200).send({ data: sessions });
    },
  );

  // ─── DELETE /auth/sessions/:sessionId — revoke single session ───────
  fastify.delete(
    '/auth/sessions/:sessionId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      const { sessionId } = request.params as { sessionId: string };
      await authService.revokeSession(userId, sessionId);
      return reply.status(200).send({ data: { success: true } });
    },
  );

  // ─── POST /auth/revoke-all-sessions — revoke all sessions ──────────
  fastify.post(
    '/auth/revoke-all-sessions',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const userId = request.user?.userId;
      if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

      await authService.logoutAll(userId);
      return reply.status(200).send({ data: { success: true } });
    },
  );
}
