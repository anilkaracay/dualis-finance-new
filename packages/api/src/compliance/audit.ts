import { nanoid } from 'nanoid';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { complianceAuditLog } from '../db/schema.js';
import { createChildLogger } from '../config/logger.js';
import type { ComplianceAction, ComplianceAuditCategory } from '@dualis/shared';

const log = createChildLogger('compliance-audit');

interface LogEventParams {
  userId?: string;
  actorId?: string;
  actorType: 'system' | 'admin' | 'user' | 'webhook';
  action: ComplianceAction;
  category: ComplianceAuditCategory;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logComplianceEvent(params: LogEventParams): Promise<void> {
  const db = getDb();
  if (!db) {
    log.warn({ action: params.action }, 'DB unavailable — audit event not recorded');
    return;
  }

  try {
    await db.insert(complianceAuditLog).values({
      eventId: `evt_${nanoid()}`,
      userId: params.userId ?? null,
      actorId: params.actorId ?? null,
      actorType: params.actorType,
      action: params.action,
      category: params.category,
      description: params.description,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  } catch (err) {
    log.error({ err, action: params.action }, 'Failed to write compliance audit event');
  }
}

interface QueryParams {
  userId?: string;
  action?: string;
  category?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export async function queryAuditLog(params: QueryParams) {
  const db = getDb();
  if (!db) return { entries: [], total: 0, page: 1, limit: 50 };

  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params.userId) conditions.push(eq(complianceAuditLog.userId, params.userId));
  if (params.action) conditions.push(eq(complianceAuditLog.action, params.action));
  if (params.category) conditions.push(eq(complianceAuditLog.category, params.category));
  if (params.from) conditions.push(gte(complianceAuditLog.createdAt, params.from));
  if (params.to) conditions.push(lte(complianceAuditLog.createdAt, params.to));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(complianceAuditLog)
      .where(whereClause)
      .orderBy(desc(complianceAuditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(complianceAuditLog)
      .where(whereClause),
  ]);

  return {
    entries,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}

export async function exportAuditLogCSV(filters: Omit<QueryParams, 'page' | 'limit'>): Promise<string> {
  const db = getDb();
  if (!db) return 'eventId,userId,action,actorId,actorType,category,description,createdAt\n';

  const conditions = [];
  if (filters.userId) conditions.push(eq(complianceAuditLog.userId, filters.userId));
  if (filters.action) conditions.push(eq(complianceAuditLog.action, filters.action));
  if (filters.category) conditions.push(eq(complianceAuditLog.category, filters.category));
  if (filters.from) conditions.push(gte(complianceAuditLog.createdAt, filters.from));
  if (filters.to) conditions.push(lte(complianceAuditLog.createdAt, filters.to));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const entries = await db
    .select()
    .from(complianceAuditLog)
    .where(whereClause)
    .orderBy(desc(complianceAuditLog.createdAt))
    .limit(10000);

  const header = 'eventId,userId,action,actorId,actorType,category,description,createdAt';
  const rows = entries.map((e) =>
    [e.eventId, e.userId ?? '', e.action, e.actorId ?? '', e.actorType, e.category, `"${e.description.replace(/"/g, '""')}"`, e.createdAt.toISOString()].join(','),
  );

  return [header, ...rows].join('\n');
}
