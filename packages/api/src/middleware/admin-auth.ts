import type { FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware } from './auth.js';
import { AppError } from './errorHandler.js';
import { createChildLogger } from '../config/logger.js';
import { getDb, schema } from '../db/client.js';

const log = createChildLogger('admin-auth');

// ---------------------------------------------------------------------------
// Admin role constants
// ---------------------------------------------------------------------------

const ADMIN_ROLES = ['admin'] as const;
const COMPLIANCE_ROLES = ['admin', 'compliance_officer'] as const;
const VIEWER_ROLES = ['admin', 'compliance_officer', 'viewer'] as const;

// ---------------------------------------------------------------------------
// Guard: requireAdmin — only admin role
// ---------------------------------------------------------------------------

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authMiddleware(request, reply);

  const role = request.user?.role;
  if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
    log.warn({ userId: request.user?.userId, role }, 'Admin access denied');
    throw new AppError('FORBIDDEN', 'Admin access required', 403);
  }
}

// ---------------------------------------------------------------------------
// Guard: requireCompliance — admin OR compliance_officer
// ---------------------------------------------------------------------------

export async function requireCompliance(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authMiddleware(request, reply);

  const role = request.user?.role;
  if (!role || !(COMPLIANCE_ROLES as readonly string[]).includes(role)) {
    log.warn({ userId: request.user?.userId, role }, 'Compliance access denied');
    throw new AppError('FORBIDDEN', 'Compliance or admin access required', 403);
  }
}

// ---------------------------------------------------------------------------
// Guard: requireAdminViewer — admin, compliance_officer, or viewer
// ---------------------------------------------------------------------------

export async function requireAdminViewer(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authMiddleware(request, reply);

  const role = request.user?.role;
  if (!role || !(VIEWER_ROLES as readonly string[]).includes(role)) {
    log.warn({ userId: request.user?.userId, role }, 'Admin panel access denied');
    throw new AppError('FORBIDDEN', 'Admin panel access required (admin, compliance_officer, or viewer)', 403);
  }
}

// ---------------------------------------------------------------------------
// Audit log helper — logs admin actions to admin_audit_logs table
// ---------------------------------------------------------------------------

export async function logAdminAction(
  request: FastifyRequest,
  action: string,
  targetType: string,
  targetId?: string | null,
  oldValue?: unknown,
  newValue?: unknown,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const userId = request.user?.userId;
  if (!userId) return;

  try {
    await db.insert(schema.adminAuditLogs).values({
      userId: parseInt(userId, 10) || 0,
      action,
      targetType,
      targetId: targetId ?? null,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    });
  } catch (err) {
    log.error({ err, action, targetType }, 'Failed to write admin audit log');
  }
}
