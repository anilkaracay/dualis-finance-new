import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ApiResponse } from '@dualis/shared';
import { requireAdmin, requireAdminViewer, requireCompliance, logAdminAction } from '../middleware/admin-auth.js';
import { AppError } from '../middleware/errorHandler.js';
import * as userService from '../services/admin-user.service.js';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export async function adminUserRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /admin/users — list users
  fastify.get(
    '/admin/users',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const filters: { status?: string; role?: string; search?: string } = {};
      if (query.status) filters.status = query.status;
      if (query.role) filters.role = query.role;
      if (query.search) filters.search = query.search;

      const result = userService.listUsers(filters, { page, limit });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/users/:userId — user detail
  fastify.get(
    '/admin/users/:userId',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const user = userService.getUserById(userId);
      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      const response: ApiResponse<typeof user> = { data: user };
      return reply.status(200).send(response);
    },
  );

  // PUT /admin/users/:userId/role — change user role
  fastify.put(
    '/admin/users/:userId/role',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const bodySchema = z.object({ role: z.string().min(1) });
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid role', 400, parsed.error.flatten());
      }

      const result = userService.changeUserRole(userId, parsed.data.role);
      if (!result) throw new AppError('NOT_FOUND', 'User not found', 404);

      await logAdminAction(request, 'user.change_role', 'user', userId, { role: result.oldRole }, { role: result.newRole });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/users/:userId/suspend
  fastify.post(
    '/admin/users/:userId/suspend',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const bodySchema = z.object({ reason: z.string().min(1).max(500) });
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Reason required', 400, parsed.error.flatten());
      }

      const user = userService.suspendUser(userId, parsed.data.reason);
      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      await logAdminAction(request, 'user.suspend', 'user', userId, { status: 'active' }, { status: 'suspended', reason: parsed.data.reason });

      const response: ApiResponse<typeof user> = { data: user };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/users/:userId/unsuspend
  fastify.post(
    '/admin/users/:userId/unsuspend',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const user = userService.unsuspendUser(userId);
      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      await logAdminAction(request, 'user.unsuspend', 'user', userId, { status: 'suspended' }, { status: 'active' });

      const response: ApiResponse<typeof user> = { data: user };
      return reply.status(200).send(response);
    },
  );

  // POST /admin/users/:userId/blacklist
  fastify.post(
    '/admin/users/:userId/blacklist',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const bodySchema = z.object({ reason: z.string().min(1).max(500) });
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Reason required', 400, parsed.error.flatten());
      }

      const user = userService.blacklistUser(userId, parsed.data.reason);
      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      await logAdminAction(request, 'user.blacklist', 'user', userId, { status: 'active' }, { status: 'blacklisted', reason: parsed.data.reason });

      const response: ApiResponse<typeof user> = { data: user };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/users/:userId/positions
  fastify.get(
    '/admin/users/:userId/positions',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const user = userService.getUserById(userId);
      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const result = userService.getUserPositions(userId, { page, limit });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/users/:userId/transactions
  fastify.get(
    '/admin/users/:userId/transactions',
    { preHandler: [requireAdminViewer] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const user = userService.getUserById(userId);
      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      const query = request.query as Record<string, string>;
      const { page, limit } = paginationSchema.parse(query);
      const result = userService.getUserTransactions(userId, { page, limit });

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );

  // GET /admin/users/:userId/documents
  fastify.get(
    '/admin/users/:userId/documents',
    { preHandler: [requireCompliance] },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const user = userService.getUserById(userId);
      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      const docs = userService.getUserDocuments(userId);
      const response: ApiResponse<typeof docs> = { data: docs };
      return reply.status(200).send(response);
    },
  );

  // PUT /admin/users/:userId/documents/:docId
  fastify.put(
    '/admin/users/:userId/documents/:docId',
    { preHandler: [requireCompliance] },
    async (request, reply) => {
      const { userId, docId } = request.params as { userId: string; docId: string };
      const bodySchema = z.object({ status: z.enum(['approved', 'rejected']) });
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid status', 400, parsed.error.flatten());
      }

      const reviewedBy = request.user?.userId ?? 'unknown';
      const result = userService.updateDocumentStatus(
        userId,
        docId,
        parsed.data.status,
        reviewedBy,
      );
      if (!result) throw new AppError('NOT_FOUND', 'Document not found', 404);

      await logAdminAction(
        request,
        parsed.data.status === 'approved' ? 'user.approve_doc' : 'user.reject_doc',
        'document',
        docId,
        { status: result.oldStatus },
        { status: result.newStatus },
      );

      const response: ApiResponse<typeof result> = { data: result };
      return reply.status(200).send(response);
    },
  );
}
