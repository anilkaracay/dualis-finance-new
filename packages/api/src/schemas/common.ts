import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const assetParamSchema = z.object({
  asset: z.string().min(1).max(20),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const dateRangeQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
