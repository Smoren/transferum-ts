import type { TickerFactory, AsyncDataFetcher } from '../../src';
import { AsyncPollingProxyTransfer, IntervalTicker } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer
// ═══════════════════════════════════════════════════════════════
// Duplex transfer with async polling that receives a fetcher from the previous node.
// Capabilities: isInput, isOutput, isDuplex, isAsyncPollingProxy, isPollingSource,
//               isAsyncPullable, isSubscribable, isAsyncTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingProxyTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isAsyncPollingProxy).toBe(true);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isAsyncTriggerable).toBe(true);
      expect(transfer.isGate).toBe(true);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isTriggerable).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer asyncPull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPollingProxyPull(),
] as Array<[number]>)(
  'AsyncPollingProxyTransfer asyncPull returns fetcher result test',
  (value: number) => {
    it('', async () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setAsyncFetcher(async () => value);

      const result = await transfer.asyncPull();
      expect(result).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPull.
 */
function dataProviderForAsyncPollingProxyPull(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'AsyncPollingProxyTransfer asyncPull returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setAsyncFetcher(async () => 42);
      const result = transfer.asyncPull();
      expect(result).toBeInstanceOf(Promise);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingProxyTransfer asyncPull without active returns undefined test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      transfer.setAsyncFetcher(async () => 42);

      const result = await transfer.asyncPull();
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingProxyTransfer asyncPull without fetcher throws test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      await expect(transfer.asyncPull()).rejects.toThrow('Async fetcher is not defined');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer asyncTrigger & subscribe
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingProxyTransfer asyncTrigger notifies subscribers test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });
      const handler = jest.fn();

      transfer.setAsyncFetcher(async () => 42);
      transfer.subscribe(handler);
      await transfer.asyncTrigger();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingProxyTransfer asyncTrigger without active does nothing test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.setAsyncFetcher(async () => 42);
      transfer.subscribe(handler);
      await transfer.asyncTrigger();

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingProxyTransfer asyncTrigger without fetcher throws test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      await expect(transfer.asyncTrigger()).rejects.toThrow('Async fetcher is not defined');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer setAsyncFetcher & clearAsyncFetcher
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingProxyTransfer setAsyncFetcher starts ticker if active test',
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

      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory,
      });

      transfer.setAsyncFetcher(async () => 42);

      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingProxyTransfer clearAsyncFetcher stops ticker test',
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

      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory,
      });

      transfer.setAsyncFetcher(async () => 42);
      transfer.clearAsyncFetcher();

      expect(customTicker.stop).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPollingProxyGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'AsyncPollingProxyTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
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
function dataProviderForAsyncPollingProxyGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'AsyncPollingProxyTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
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
// AsyncPollingProxyTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingProxyTransfer asyncPull with onError suppresses error test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        onError,
      });

      transfer.setAsyncFetcher(async () => { throw error; });

      const result = await transfer.asyncPull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingProxyTransfer asyncTrigger with onError suppresses error test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        onError,
      });
      const handler = jest.fn();

      transfer.setAsyncFetcher(async () => { throw error; });
      transfer.subscribe(handler);
      await transfer.asyncTrigger();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer onStateChange
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingProxyTransfer onStateChange notifies on activate/deactivate test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
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
  'AsyncPollingProxyTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
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
  'AsyncPollingProxyTransfer onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
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
// AsyncPollingProxyTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingProxyTransfer destroy cleans up test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });
      const handler = jest.fn();

      transfer.setAsyncFetcher(async () => 42);
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
// AsyncPollingProxyTransfer _polling Guard
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingProxyTransfer asyncTrigger with _polling guard skips overlap test',
  () => {
    it('', async () => {
      let resolveFirst: () => void;
      const firstCall = new Promise<void>((resolve) => { resolveFirst = resolve; });
      let callCount = 0;
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setAsyncFetcher(async () => {
        callCount++;
        if (callCount === 1) {
          await firstCall;
        }
        return callCount;
      });

      const first = transfer.asyncTrigger();
      await transfer.asyncTrigger();

      resolveFirst!();
      await first;

      expect(callCount).toBe(1);

      transfer.destroy();
    });
  },
);

