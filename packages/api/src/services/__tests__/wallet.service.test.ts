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
    verifyWalletSignature: vi.fn().mockResolvedValue(true),
    allocateParty: vi.fn().mockResolvedValue({ partyId: 'party::user_test123' }),
  }),
}));

vi.mock('nanoid', () => ({
  nanoid: (n?: number) => 'mock_' + 'x'.repeat(n ?? 21),
}));

// Mock DB
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([{
      connectionId: 'wc_mock_xxxxxxxxxxxxxxxx',
      userId: 'user1',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      walletType: 'metamask',
      custodyMode: 'self-custody',
      isPrimary: true,
      label: null,
      connectedAt: new Date(),
      lastActiveAt: new Date(),
      disconnectedAt: null,
      createdAt: new Date(),
    }]),
  }),
});

const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    }),
  }),
});

const mockSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
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
    walletNonces: { walletAddress: 'wallet_address', usedAt: 'used_at', id: 'id' },
    walletConnections: {
      connectionId: 'connection_id',
      userId: 'user_id',
      walletAddress: 'wallet_address',
      disconnectedAt: 'disconnected_at',
      isPrimary: 'is_primary',
    },
    partyMappings: {
      mappingId: 'mapping_id',
      userId: 'user_id',
      isActive: 'is_active',
    },
    users: {
      userId: 'user_id',
      partyId: 'party_id',
    },
  },
}));

// Import after mocks
import * as walletPreferencesService from '../walletPreferences.service';

describe('walletPreferences.service', () => {
  it('module exports expected functions', () => {
    expect(typeof walletPreferencesService.getPreferences).toBe('function');
    expect(typeof walletPreferencesService.updatePreferences).toBe('function');
    expect(typeof walletPreferencesService.ensureDefaultPreferences).toBe('function');
  });
});
