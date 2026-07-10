import type { TickerFactory } from '../../src';
import { AsyncIdlePollingTransfer, RAFTicker } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer
// ═══════════════════════════════════════════════════════════════
// Reactive channel with async fallback polling on idle.
// On idle (timeout), starts polling via fetcher.
// Capabilities: isInput, isOutput, isDuplex, isPushable, isSubscribable,
//               isPollingSource, isAsyncPullable, isAsyncTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isAsyncTriggerable).toBe(true);
      expect(transfer.isGate).toBe(true);
      expect(transfer.isAsyncPushable).toBe(false);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isAsyncPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer push & subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncIdlePollingPush(),
] as Array<[number]>)(
  'AsyncIdlePollingTransfer push notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing push.
 */
function dataProviderForAsyncIdlePollingPush(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'AsyncIdlePollingTransfer push notifies multiple subscribers test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      transfer.push(42);

      expect(handler1).toHaveBeenCalledWith(42);
      expect(handler2).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer asyncTrigger
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer asyncTrigger calls fetcher and notifies subscribers test',
  () => {
    it('', async () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 42,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncTrigger();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer asyncPull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncIdlePollingAsyncPull(),
] as Array<[number]>)(
  'AsyncIdlePollingTransfer asyncPull calls fetcher and returns result test',
  (value: number) => {
    it('', async () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => value,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      const result = await transfer.asyncPull();

      expect(result).toBe(value);
      // asyncPull() does not notify subscribers
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPull().
 */
function dataProviderForAsyncIdlePollingAsyncPull(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'AsyncIdlePollingTransfer asyncPull with undefined fetcher result test',
  () => {
    it('', async () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => undefined,
        timeout: 1000,
        interval: 100,
        activated: false,
      });

      expect(await transfer.asyncPull()).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer asyncPull with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => { throw error; },
        timeout: 1000,
        interval: 100,
        activated: false,
        onError,
      });

      const result = await transfer.asyncPull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncIdlePollingGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'AsyncIdlePollingTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated,
      });

      expect(transfer.active).toBe(expected);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing initial state.
 */
function dataProviderForAsyncIdlePollingGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'AsyncIdlePollingTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });

      expect(transfer.active).toBe(false);

      transfer.activate();
      expect(transfer.active).toBe(true);

      transfer.deactivate();
      expect(transfer.active).toBe(false);

      const result = transfer.toggle();
      expect(result).toBe(true);
      expect(transfer.active).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer activate is idempotent test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: true,
      });

      // Already active — repeated activate should not throw
      expect(() => transfer.activate()).not.toThrow();
      expect(transfer.active).toBe(true);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer Idle Polling (fake timers)
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer starts polling after idle timeout test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async () => 42);
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher,
        timeout: 100,
        interval: 50,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Before idle timeout — polling not started
      jest.advanceTimersByTime(50);
      expect(fetcher).not.toHaveBeenCalled();

      // After idle timeout — polling starts
      jest.advanceTimersByTime(60);
      expect(fetcher).toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer push resets idle timer test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async () => 99);
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher,
        timeout: 100,
        interval: 50,
        activated: true,
      });

      // Advance time almost to timeout
      jest.advanceTimersByTime(80);

      // Push resets the idle timer
      transfer.push(1);

      // Advance by 80 again — polling should not start
      jest.advanceTimersByTime(80);
      expect(fetcher).not.toHaveBeenCalled();

      // Advance to timeout — polling starts
      jest.advanceTimersByTime(30);
      expect(fetcher).toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer deactivate stops idle timer and polling test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async () => 42);
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher,
        timeout: 100,
        interval: 50,
        activated: true,
      });

      jest.advanceTimersByTime(110);
      expect(fetcher).toHaveBeenCalled();

      fetcher.mockClear();
      transfer.deactivate();

      jest.advanceTimersByTime(200);
      expect(fetcher).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer asyncTrigger with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => { throw error; },
        timeout: 1000,
        interval: 100,
        activated: false,
        onError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncTrigger();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer onStateChange
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer onStateChange notifies on activate/deactivate test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      transfer.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(transfer);

      transfer.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.onStateChange(handler);
      transfer.toggle();

      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      const subscriber = transfer.onStateChange(handler);
      transfer.activate();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      transfer.deactivate();
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer with initialValue
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer with initialValue test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
        initialValue: 42,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      // Subscription with initialValue — subscriber receives initial value
      // (only if state has a value at subscription time)

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer destroy cleans up test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 42,
        timeout: 100,
        interval: 50,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      expect(transfer.active).toBe(false);
      transfer.push(42);
      expect(handler).not.toHaveBeenCalled();

      expect(() => transfer.destroy()).not.toThrow();

      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer Toggle from Active & asyncTrigger when Active
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncIdlePollingTransfer toggle from active deactivates test',
  () => {
    it('', () => {
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: true,
      });

      expect(transfer.active).toBe(true);

      const result = transfer.toggle();
      expect(result).toBe(false);
      expect(transfer.active).toBe(false);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer asyncTrigger when active starts idle timer test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async () => 42);
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher,
        timeout: 100,
        interval: 50,
        activated: true,
      });
      const handler = jest.fn();
      transfer.subscribe(handler);

      // asyncTrigger() when active=true calls _doPoll and _startIdleTimer
      await transfer.asyncTrigger();

      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer _doPoll guard skips overlap test',
  () => {
    it('', async () => {
      let resolveFirst: () => void;
      const firstCall = new Promise<void>((resolve) => { resolveFirst = resolve; });
      let callCount = 0;
      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => {
          callCount++;
          if (callCount === 1) {
            await firstCall;
          }
          return callCount;
        },
        timeout: 1000,
        interval: 100,
        activated: false,
      });

      // Start first asyncTrigger (don't await — fetcher blocks on firstCall)
      const p1 = transfer.asyncTrigger();
      // The second asyncTrigger — _doPoll sees _polling=true and skips
      const p2 = transfer.asyncTrigger();

      resolveFirst!();
      await p1;
      await p2;

      expect(callCount).toBe(1);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncIdlePollingTransfer _startPolling guard skips when ticker exists test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: true,
        interval: 50,
      };
      let tickerCount = 0;
      const tickerFactory = jest.fn(() => {
        tickerCount++;
        return customTicker;
      }) as any;

      const transfer = new AsyncIdlePollingTransfer<number>({
        fetcher: async () => 42,
        timeout: 50,
        interval: 50,
        activated: true,
        tickerFactory,
      });

      // Wait for idle timeout — _startPolling creates ticker (tickerCount=1)
      jest.advanceTimersByTime(60);
      expect(tickerCount).toBe(1);

      // push() resets the idle timer (but does not stop polling)
      // because push calls _stopPolling + _startIdleTimer
      // Need to call asyncTrigger() which starts _startIdleTimer without _stopPolling
      // Actually push calls _stopPolling, which nullifies the ticker
      // asyncTrigger() does not call _stopPolling, only _startIdleTimer
      await transfer.asyncTrigger();

      // Wait for second idle timeout — _startPolling is called, but ticker already exists
      // (since asyncTrigger does not stop polling) → guard return
      jest.advanceTimersByTime(60);

      // tickerFactory should not be called a second time
      expect(tickerCount).toBe(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);
