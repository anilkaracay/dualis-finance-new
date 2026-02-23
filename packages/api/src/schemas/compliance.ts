import { z } from 'zod';

export const approveRejectSchema = z.object({
  reason: z.string().min(1).max(1000).optional(),
});

export const rejectKYCSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const sanctionsUpdateSchema = z.object({
  source: z.string().min(1).max(100).optional(),
});

export const blockUserSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const riskReassessSchema = z.object({
  reason: z.string().min(1).max(1000).optional(),
});
