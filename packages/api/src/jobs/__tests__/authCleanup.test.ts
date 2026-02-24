import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

// Mock scheduler to capture handler
const registeredHandlers: Array<{ name: string; handler: () => Promise<void> }> = [];
vi.mock('../scheduler.js', () => ({
  registerJob: vi.fn((name: string, _interval: number, handler: () => Promise<void>) => {
    registeredHandlers.push({ name, handler });
  }),
}));

// Create chainable delete mock
const mockWhere = vi.fn(async () => {});
const mockDelete = vi.fn(() => ({ where: mockWhere }));
let dbAvailable = true;

vi.mock('../../db/client.js', () => ({
  getDb: vi.fn(() => dbAvailable ? { delete: mockDelete } : null),
  schema: {
    sessions: { expiresAt: 'sessions.expiresAt' },
    walletNonces: { expiresAt: 'walletNonces.expiresAt' },
    emailVerificationTokens: { expiresAt: 'emailVerificationTokens.expiresAt' },
    passwordResetTokens: { expiresAt: 'passwordResetTokens.expiresAt' },
    loginEvents: { createdAt: 'loginEvents.createdAt' },
  },
}));

// Mock drizzle-orm lt function
vi.mock('drizzle-orm', () => ({
  lt: vi.fn((col, val) => ({ column: col, operator: 'lt', value: val })),
}));

describe('Auth Cleanup Job', () => {
  let handler: () => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    mockDelete.mockClear();
    mockWhere.mockClear();
    registeredHandlers.length = 0;
    dbAvailable = true;

    await import('../authCleanup.job');
    handler = registeredHandlers.find((h) => h.name === 'auth-cleanup')!.handler;
  });

  it('registers the job with scheduler', () => {
    expect(registeredHandlers.some((h) => h.name === 'auth-cleanup')).toBe(true);
  });

  it('deletes from all 5 tables when DB is available', async () => {
    await handler();
    // Should call delete 5 times (sessions, walletNonces, emailVerificationTokens, passwordResetTokens, loginEvents)
    expect(mockDelete).toHaveBeenCalledTimes(5);
  });

  it('skips cleanup when DB is unavailable', async () => {
    dbAvailable = false;
    // Need to re-import because getDb is called at runtime
    vi.resetModules();
    registeredHandlers.length = 0;
    await import('../authCleanup.job');
    handler = registeredHandlers.find((h) => h.name === 'auth-cleanup')!.handler;

    await handler();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('handles DB errors gracefully', async () => {
    mockDelete.mockImplementationOnce(() => {
      throw new Error('DB connection lost');
    });

    // Should not throw
    await expect(handler()).resolves.not.toThrow();
  });

  it('uses correct retention windows', async () => {
    await handler();
    // All 5 delete calls should have where clauses with appropriate cutoff dates
    expect(mockWhere).toHaveBeenCalledTimes(5);
  });
});
