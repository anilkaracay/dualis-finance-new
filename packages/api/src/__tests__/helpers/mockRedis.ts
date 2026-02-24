import { vi } from 'vitest';

export function createMockRedis() {
  const store = new Map<string, string>();
  const ttls = new Map<string, number>();

  return {
    _store: store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string, ...args: unknown[]) => {
      store.set(key, value);
      if (args[0] === 'EX' && typeof args[1] === 'number') {
        ttls.set(key, Date.now() + args[1] * 1000);
      }
      return 'OK';
    }),
    del: vi.fn(async (...keys: string[]) => {
      let count = 0;
      for (const key of keys) {
        if (store.delete(key)) count++;
        ttls.delete(key);
      }
      return count;
    }),
    incr: vi.fn(async (key: string) => {
      const val = parseInt(store.get(key) ?? '0', 10) + 1;
      store.set(key, String(val));
      return val;
    }),
    expire: vi.fn(async (_key: string, _seconds: number) => 1),
    exists: vi.fn(async (key: string) => (store.has(key) ? 1 : 0)),
    scan: vi.fn(async (_cursor: string, _match: string, pattern: string, _count: string, _countVal: number) => {
      const matchingKeys: string[] = [];
      const regexPattern = pattern.replace(/\*/g, '.*');
      for (const key of store.keys()) {
        if (new RegExp(`^${regexPattern}$`).test(key)) {
          matchingKeys.push(key);
        }
      }
      return ['0', matchingKeys];
    }),
    ping: vi.fn(async () => 'PONG'),
  };
}

export function resetMockRedis(mock: ReturnType<typeof createMockRedis>) {
  mock._store.clear();
  vi.clearAllMocks();
}
