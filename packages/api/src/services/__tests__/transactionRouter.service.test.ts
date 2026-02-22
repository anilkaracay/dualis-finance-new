import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../canton/partylayer.js', () => ({
  getPartyLayerProvider: () => ({
    submitCommand: vi.fn().mockResolvedValue({
      transactionId: 'tx_test123',
      commandId: 'cmd_test456',
    }),
    prepareSigningPayload: vi.fn().mockResolvedValue({
      payload: 'deadbeef',
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    }),
    submitSignedPayload: vi.fn().mockResolvedValue({
      transactionId: 'tx_signed789',
    }),
  }),
}));

vi.mock('nanoid', () => ({
  nanoid: (n?: number) => 'mock_' + 'x'.repeat(n ?? 21),
}));

vi.mock('../walletPreferences.service.js', () => ({
  getPreferences: vi.fn().mockResolvedValue({
    userId: 'user1',
    defaultWalletConnectionId: null,
    signingThreshold: '1000',
    routingMode: 'auto',
    autoDisconnectMinutes: 30,
    showTransactionConfirm: true,
    updatedAt: new Date().toISOString(),
  }),
}));

vi.mock('../partyMapping.service.js', () => ({
  resolvePartyId: vi.fn().mockResolvedValue('party::user_test123'),
}));

const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([]),
  }),
});

const mockSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          offset: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
});

const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    }),
  }),
});

vi.mock('../../db/client.js', () => ({
  getDb: () => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }),
  schema: {
    transactionLogs: {
      transactionLogId: 'transaction_log_id',
      userId: 'user_id',
      createdAt: 'created_at',
    },
  },
}));

import { routeTransaction } from '../transactionRouter.service';

describe('transactionRouter.service', () => {
  it('routes low-value transactions via proxy in auto mode', async () => {
    const result = await routeTransaction('user1', {
      templateId: 'Dualis.Test:Transfer',
      choiceName: 'Execute',
      argument: { amount: 100 },
      amountUsd: '500', // Below threshold of 1000
    });

    expect(result.routingMode).toBe('proxy');
    expect(result.requiresWalletSign).toBe(false);
    expect(result.status).toBe('submitted');
    expect(result.txHash).toBe('tx_test123');
  });

  it('routes high-value transactions via wallet-sign in auto mode', async () => {
    const result = await routeTransaction('user1', {
      templateId: 'Dualis.Test:Transfer',
      choiceName: 'Execute',
      argument: { amount: 5000 },
      amountUsd: '5000', // Above threshold of 1000
    });

    expect(result.routingMode).toBe('wallet-sign');
    expect(result.requiresWalletSign).toBe(true);
    expect(result.status).toBe('pending');
    expect(result.signingPayload).toBe('deadbeef');
  });

  it('respects forceRoutingMode override', async () => {
    const result = await routeTransaction('user1', {
      templateId: 'Dualis.Test:Transfer',
      choiceName: 'Execute',
      argument: { amount: 100 },
      amountUsd: '500', // Below threshold
      forceRoutingMode: 'wallet-sign', // But force wallet-sign
    });

    expect(result.routingMode).toBe('wallet-sign');
    expect(result.requiresWalletSign).toBe(true);
  });

  it('defaults to proxy when no amountUsd is provided', async () => {
    const result = await routeTransaction('user1', {
      templateId: 'Dualis.Test:Transfer',
      choiceName: 'Execute',
      argument: { action: 'test' },
      // No amountUsd
    });

    expect(result.routingMode).toBe('proxy');
    expect(result.requiresWalletSign).toBe(false);
  });
});
