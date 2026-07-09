import type { TickerFactory } from '../../src';
import { AsyncPollingSourceTransfer, RAFTicker, IntervalTicker } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer
// ═══════════════════════════════════════════════════════════════
// Output transfer with async internal polling of a data source.
// Capabilities: isOutput, isPollingSource, isAsyncPullable, isSubscribable,
//               isAsyncTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingSourceTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 0,
        interval: 100,
        activated: false,
      });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isAsyncPushable).toBe(false);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isAsyncPollingProxy).toBe(false);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isAsyncTriggerable).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer asyncPull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPollingSourcePull(),
] as Array<[number]>)(
  'AsyncPollingSourceTransfer asyncPull returns fetcher result test',
  (value: number) => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => value,
        interval: 100,
        activated: false,
      });

      const result = await transfer.asyncPull();
      expect(result).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPull.
 */
function dataProviderForAsyncPollingSourcePull(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'AsyncPollingSourceTransfer asyncPull returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 0,
        interval: 100,
        activated: false,
      });

      const result = transfer.asyncPull();
      expect(result).toBeInstanceOf(Promise);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer asyncPull returns undefined from fetcher test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => undefined,
        interval: 100,
        activated: false,
      });

      const result = await transfer.asyncPull();
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer asyncTrigger & subscribe
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingSourceTransfer asyncTrigger notifies subscribers test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
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

describe(
  'AsyncPollingSourceTransfer asyncTrigger notifies multiple subscribers test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      await transfer.asyncTrigger();

      expect(handler1).toHaveBeenCalledWith(42);
      expect(handler2).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer asyncTrigger returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 0,
        interval: 100,
        activated: false,
      });

      const result = transfer.asyncTrigger();
      expect(result).toBeInstanceOf(Promise);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPollingSourceGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'AsyncPollingSourceTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 0,
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
function dataProviderForAsyncPollingSourceGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'AsyncPollingSourceTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 0,
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

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingSourceTransfer asyncPull with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => { throw error; },
        interval: 100,
        activated: false,
        onError,
      });

      const result = await transfer.asyncPull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer asyncPull without onError rethrows test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => { throw new Error('fetcher error'); },
        interval: 100,
        activated: false,
      });

      await expect(transfer.asyncPull()).rejects.toThrow('fetcher error');

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer asyncTrigger with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => { throw error; },
        interval: 100,
        activated: false,
        onError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncTrigger();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer asyncTrigger without onError rethrows test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => { throw new Error('fetcher error'); },
        interval: 100,
        activated: false,
      });

      await expect(transfer.asyncTrigger()).rejects.toThrow('fetcher error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer Custom Ticker
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingSourceTransfer uses custom tickerFactory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: true,
        interval: 100,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: true,
        tickerFactory,
      });

      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer inactive does not start ticker test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: false,
        interval: 100,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
        tickerFactory,
      });

      expect(customTicker.start).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer destroy stops custom ticker test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        updateInterval: jest.fn(),
        active: true,
        interval: 100,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: true,
        tickerFactory,
      });

      transfer.destroy();
      expect(customTicker.stop).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer onStateChange
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingSourceTransfer onStateChange notifies on activate/deactivate test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
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
  'AsyncPollingSourceTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
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
  'AsyncPollingSourceTransfer onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
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
// AsyncPollingSourceTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingSourceTransfer destroy cleans up test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      expect(transfer.active).toBe(false);
      await transfer.asyncTrigger();
      expect(handler).not.toHaveBeenCalled();

      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer Ticker Fires & _polling Guard
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingSourceTransfer ticker fires calls _safeTrigger test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn(async () => 42);
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher,
        interval: 50,
        activated: true,
      });
      const handler = jest.fn();
      transfer.subscribe(handler);

      // Advance time — ticker fires, calls _safeTrigger → asyncTrigger
      jest.advanceTimersByTime(50);
      await Promise.resolve(); // flush microtasks
      jest.advanceTimersByTime(50);
      await Promise.resolve();

      expect(fetcher).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer ticker fires without onError catches rejection test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => { throw new Error('ticker error'); },
        interval: 50,
        activated: true,
      });

      // Ticker fires, _safeTrigger catches rejection
      jest.advanceTimersByTime(50);
      await Promise.resolve();

      // Should not cause an unhandled rejection
      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingSourceTransfer asyncTrigger with _polling guard skips overlap test',
  () => {
    it('', async () => {
      let resolveFirst: () => void;
      const firstCall = new Promise<void>((resolve) => { resolveFirst = resolve; });
      let callCount = 0;
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => {
          callCount++;
          if (callCount === 1) {
            await firstCall;
          }
          return callCount;
        },
        interval: 100,
        activated: false,
      });

      // Start the first asyncTrigger (will not complete until resolveFirst is called)
      const first = transfer.asyncTrigger();
      // The second asyncTrigger should see _polling=true and return immediately
      await transfer.asyncTrigger();

      // Complete the first
      resolveFirst!();
      await first;

      expect(callCount).toBe(1);

      transfer.destroy();
    });
  },
);

