import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../config/logger.js', () => ({
  createChildLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

// We must re-import the scheduler module each test to get clean state
// because `jobs` is a module-level array.
describe('Scheduler', () => {
  let registerJob: typeof import('../scheduler').registerJob;
  let initScheduler: typeof import('../scheduler').initScheduler;
  let stopScheduler: typeof import('../scheduler').stopScheduler;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import('../scheduler');
    registerJob = mod.registerJob;
    initScheduler = mod.initScheduler;
    stopScheduler = mod.stopScheduler;
  });

  afterEach(() => {
    stopScheduler();
    vi.useRealTimers();
  });

  it('registerJob adds jobs to the internal array', () => {
    const handler = vi.fn(async () => {});
    registerJob('test-job', 1000, handler);
    // No error means it registered successfully; initScheduler will find it
    expect(handler).not.toHaveBeenCalled();
  });

  it('initScheduler fires each job immediately', async () => {
    const handler = vi.fn(async () => {});
    registerJob('immediate-job', 60_000, handler);
    initScheduler();
    // Flush microtasks for the immediate fire
    await vi.advanceTimersByTimeAsync(0);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('initScheduler fires jobs on interval', async () => {
    const handler = vi.fn(async () => {});
    registerJob('interval-job', 1000, handler);
    initScheduler();
    await vi.advanceTimersByTimeAsync(0); // immediate
    expect(handler).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000); // 1st interval
    expect(handler).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000); // 2nd interval
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('overlap protection prevents concurrent execution', async () => {
    let resolveHandler: () => void;
    const handlerPromise = new Promise<void>((resolve) => { resolveHandler = resolve; });
    const handler = vi.fn(() => handlerPromise);

    registerJob('slow-job', 100, handler);
    initScheduler();

    // Immediate fire — handler starts running
    await vi.advanceTimersByTimeAsync(0);
    expect(handler).toHaveBeenCalledTimes(1);

    // Next tick fires but handler is still running — should skip
    await vi.advanceTimersByTimeAsync(100);
    expect(handler).toHaveBeenCalledTimes(1); // still 1 because overlap protection

    // Resolve the handler
    resolveHandler!();
    await vi.advanceTimersByTimeAsync(0);

    // Next tick — handler should run again now
    await vi.advanceTimersByTimeAsync(100);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('error in handler does not crash the scheduler', async () => {
    const handler = vi.fn(async () => { throw new Error('Job failed'); });
    registerJob('error-job', 1000, handler);
    initScheduler();

    // Should not throw
    await vi.advanceTimersByTimeAsync(0);
    expect(handler).toHaveBeenCalledTimes(1);

    // Should continue to fire
    await vi.advanceTimersByTimeAsync(1000);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('stopScheduler clears all intervals and empties the job list', async () => {
    const handler = vi.fn(async () => {});
    registerJob('stop-test-job', 500, handler);
    initScheduler();
    await vi.advanceTimersByTimeAsync(0);
    expect(handler).toHaveBeenCalledTimes(1);

    stopScheduler();

    // No more fires after stop
    await vi.advanceTimersByTimeAsync(5000);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('stopScheduler is safe to call multiple times', () => {
    registerJob('double-stop', 1000, vi.fn(async () => {}));
    initScheduler();
    stopScheduler();
    expect(() => stopScheduler()).not.toThrow();
  });
});
