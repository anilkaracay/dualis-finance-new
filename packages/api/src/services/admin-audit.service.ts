import { desc, eq, and, gte, lte, like, sql } from 'drizzle-orm';
import { getDb, schema } from '../db/client.js';
import { createChildLogger } from '../config/logger.js';

const log = createChildLogger('admin-audit-service');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogFilters {
  userId?: number;
  action?: string;
  targetType?: string;
  search?: string;
  from?: string;
  to?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Get audit logs with filtering & pagination
// ---------------------------------------------------------------------------

export async function getAuditLogs(
  filters: AuditLogFilters,
  pagination: PaginationParams,
) {
  const db = getDb();
  if (!db) {
    return { data: [], total: 0, page: pagination.page, limit: pagination.limit };
  }

  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(schema.adminAuditLogs.userId, filters.userId));
  }
  if (filters.action) {
    conditions.push(eq(schema.adminAuditLogs.action, filters.action));
  }
  if (filters.targetType) {
    conditions.push(eq(schema.adminAuditLogs.targetType, filters.targetType));
  }
  if (filters.from) {
    conditions.push(gte(schema.adminAuditLogs.createdAt, new Date(filters.from)));
  }
  if (filters.to) {
    conditions.push(lte(schema.adminAuditLogs.createdAt, new Date(filters.to)));
  }
  if (filters.search) {
    conditions.push(like(schema.adminAuditLogs.targetId, `%${filters.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (pagination.page - 1) * pagination.limit;

  try {
    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(schema.adminAuditLogs)
        .where(where)
        .orderBy(desc(schema.adminAuditLogs.createdAt))
        .limit(pagination.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.adminAuditLogs)
        .where(where),
    ]);

    return {
      data: rows,
      total: countResult[0]?.count ?? 0,
      page: pagination.page,
      limit: pagination.limit,
    };
  } catch (err) {
    log.error({ err }, 'Failed to query audit logs');
    return { data: [], total: 0, page: pagination.page, limit: pagination.limit };
  }
}

// ---------------------------------------------------------------------------
// Get recent activity (for dashboard)
// ---------------------------------------------------------------------------

export async function getRecentActivity(limit: number = 10) {
  const db = getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select({
        id: schema.adminAuditLogs.id,
        userId: schema.adminAuditLogs.userId,
        action: schema.adminAuditLogs.action,
        targetType: schema.adminAuditLogs.targetType,
        targetId: schema.adminAuditLogs.targetId,
        createdAt: schema.adminAuditLogs.createdAt,
        adminName: schema.users.displayName,
        adminEmail: schema.users.email,
      })
      .from(schema.adminAuditLogs)
      .leftJoin(schema.users, eq(schema.adminAuditLogs.userId, schema.users.id))
      .orderBy(desc(schema.adminAuditLogs.createdAt))
      .limit(limit);

    return rows;
  } catch (err) {
    log.error({ err }, 'Failed to query recent activity');
    return [];
  }
}

// ---------------------------------------------------------------------------
// Export audit logs as CSV string
// ---------------------------------------------------------------------------

export async function exportAuditLogsCsv(filters: AuditLogFilters): Promise<string> {
  const result = await getAuditLogs(filters, { page: 1, limit: 10000 });

  const headers = ['ID', 'User ID', 'Action', 'Target Type', 'Target ID', 'IP Address', 'Created At'];
  const rows = result.data.map((row) => [
    row.id,
    row.userId,
    row.action,
    row.targetType,
    row.targetId ?? '',
    row.ipAddress ?? '',
    row.createdAt?.toISOString() ?? '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
