import { z } from 'zod';

/**
 * Notification preference update — nested shape matching UserNotificationPreferences.
 * All fields are optional for partial updates.
 */
export const updatePreferencesSchema = z.object({
  channels: z.object({
    inApp: z.boolean().optional(),
    email: z.boolean().optional(),
    webhook: z.boolean().optional(),
  }).optional(),
  financial: z.object({
    enabled: z.boolean().optional(),
    hfCautionThreshold: z.number().min(1.01).max(10).optional(),
    hfDangerThreshold: z.number().min(1.01).max(10).optional(),
    hfCriticalThreshold: z.number().min(1.001).max(10).optional(),
    interestMilestones: z.boolean().optional(),
    rateChanges: z.boolean().optional(),
  }).optional(),
  auth: z.object({
    enabled: z.boolean().optional(),
    newLoginAlerts: z.boolean().optional(),
  }).optional(),
  governance: z.object({
    enabled: z.boolean().optional(),
  }).optional(),
  digest: z.object({
    enabled: z.boolean().optional(),
    frequency: z.enum(['daily', 'weekly']).optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  }).optional(),
}).strict();

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  severity: z.string().optional(),
  unread: z.enum(['true', 'false']).optional(),
});

export const testNotificationSchema = z.object({
  channel: z.enum(['in_app', 'email', 'webhook']).default('in_app'),
});
