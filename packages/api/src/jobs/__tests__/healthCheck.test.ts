import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

const mockBroadcast = vi.fn();
const mockBroadcastToParty = vi.fn();
vi.mock('../../ws/channels.js', () => ({
  channelManager: {
    broadcast: mockBroadcast,
    broadcastToParty: mockBroadcastToParty,
  },
}));

const mockEmit = vi.fn(async () => {});
vi.mock('../../notification/notification.bus.js', () => ({
  notificationBus: { emit: mockEmit },
}));

// Mock scheduler to capture handler
const registeredHandlers: Array<{ name: string; handler: () => Promise<void> }> = [];
vi.mock('../scheduler.js', () => ({
  registerJob: vi.fn((name: string, _interval: number, handler: () => Promise<void>) => {
    registeredHandlers.push({ name, handler });
  }),
}));

// Mock @dualis/shared calculateHealthFactor
let mockHF = 1.5;
vi.mock('@dualis/shared', async () => {
  const actual = await vi.importActual('@dualis/shared');
  return {
    ...actual,
    calculateHealthFactor: vi.fn(() => mockHF),
  };
});

describe('Health Check Job', () => {
  let handler: () => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    mockBroadcast.mockClear();
    mockBroadcastToParty.mockClear();
    mockEmit.mockClear();
    registeredHandlers.length = 0;

    await import('../healthCheck.job');
    handler = registeredHandlers.find((h) => h.name === 'health-check')!.handler;
  });

  it('registers the job with scheduler', () => {
    expect(registeredHandlers.some((h) => h.name === 'health-check')).toBe(true);
  });

  it('broadcasts position health for all positions', async () => {
    mockHF = 2.0; // healthy
    await handler();
    // 3 mock positions → 3 position broadcasts
    const positionBroadcasts = mockBroadcast.mock.calls.filter(
      (c: any[]) => typeof c[0] === 'string' && c[0].startsWith('position:'),
    );
    expect(positionBroadcasts.length).toBe(3);
  });

  it('does not emit notifications when HF is healthy (>= 1.5)', async () => {
    mockHF = 2.0;
    await handler();
    expect(mockBroadcastToParty).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('emits caution notification when HF < 1.5 and >= 1.2', async () => {
    mockHF = 1.3;
    await handler();
    expect(mockBroadcastToParty).toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalled();
    const emitCall = mockEmit.mock.calls[0][0] as any;
    expect(emitCall.type).toBe('HEALTH_FACTOR_CAUTION');
    expect(emitCall.severity).toBe('warning');
  });

  it('emits danger notification when HF < 1.2 and >= 1.05', async () => {
    mockHF = 1.1;
    await handler();
    expect(mockEmit).toHaveBeenCalled();
    const emitCall = mockEmit.mock.calls[0][0] as any;
    expect(emitCall.type).toBe('HEALTH_FACTOR_DANGER');
    expect(emitCall.severity).toBe('warning');
  });

  it('emits critical notification when HF < 1.05 and >= 1.0', async () => {
    mockHF = 1.02;
    await handler();
    expect(mockEmit).toHaveBeenCalled();
    const emitCall = mockEmit.mock.calls[0][0] as any;
    expect(emitCall.type).toBe('HEALTH_FACTOR_CRITICAL');
    expect(emitCall.severity).toBe('critical');
  });

  it('emits liquidation warning when HF < 1.0', async () => {
    mockHF = 0.95;
    await handler();
    // Should broadcast both health warning AND liquidation
    const liquidationBroadcasts = mockBroadcast.mock.calls.filter(
      (c: any[]) => c[0] === 'liquidations',
    );
    expect(liquidationBroadcasts.length).toBeGreaterThan(0);

    // Should emit LIQUIDATION_WARNING notification
    const liquidationEmits = mockEmit.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'LIQUIDATION_WARNING',
    );
    expect(liquidationEmits.length).toBeGreaterThan(0);
  });

  it('broadcasts liquidation payload with correct fields', async () => {
    mockHF = 0.9;
    await handler();
    const liqCall = mockBroadcast.mock.calls.find((c: any[]) => c[0] === 'liquidations');
    expect(liqCall).toBeDefined();
    const payload = liqCall![1];
    expect(payload).toHaveProperty('borrower');
    expect(payload).toHaveProperty('poolId');
    expect(payload).toHaveProperty('amount');
    expect(payload).toHaveProperty('tier');
    expect(payload).toHaveProperty('ts');
  });
});
