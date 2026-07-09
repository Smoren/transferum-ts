import type { TickerFactory } from '../../src';
import { AsyncPollingFlowTransfer, RAFTicker } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncPollingFlowTransfer
// ═══════════════════════════════════════════════════════════════
// Output transfer with async polling from an AsyncOutputFlowInterface.
// Capabilities: isOutput, isPollingSource, isAsyncPullable, isSubscribable,
//               isAsyncTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// AsyncPollingFlowTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingFlowTransfer has correct capability flags test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
// AsyncPollingFlowTransfer asyncPull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPollingFlowPull(),
] as Array<[number | undefined]>)(
  'AsyncPollingFlowTransfer asyncPull returns flow.read result test',
  (value: number | undefined) => {
    it('', async () => {
      const flow = { read: jest.fn(async () => value) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
function dataProviderForAsyncPollingFlowPull(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
    [undefined],
  ];
}

describe(
  'AsyncPollingFlowTransfer asyncPull returns Promise test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
      });

      const result = transfer.asyncPull();
      expect(result).toBeInstanceOf(Promise);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncPollingFlowTransfer asyncTrigger & subscribe
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingFlowTransfer asyncTrigger notifies subscribers test',
  () => {
    it('', async () => {
      const flow = { read: jest.fn(async () => 42) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
  'AsyncPollingFlowTransfer asyncTrigger notifies multiple subscribers test',
  () => {
    it('', async () => {
      const flow = { read: jest.fn(async () => 42) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
  'AsyncPollingFlowTransfer asyncTrigger returns Promise test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
// AsyncPollingFlowTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPollingFlowGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'AsyncPollingFlowTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
function dataProviderForAsyncPollingFlowGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'AsyncPollingFlowTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
// AsyncPollingFlowTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingFlowTransfer asyncPull with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('flow read error');
      const onError = jest.fn();
      const flow = { read: async () => { throw error; } };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
  'AsyncPollingFlowTransfer asyncPull without onError rethrows test',
  () => {
    it('', async () => {
      const flow = { read: async () => { throw new Error('flow read error'); } };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
      });

      await expect(transfer.asyncPull()).rejects.toThrow('flow read error');

      transfer.destroy();
    });
  },
);

describe(
  'AsyncPollingFlowTransfer asyncTrigger with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('flow read error');
      const onError = jest.fn();
      const flow = { read: async () => { throw error; } };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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

// ═══════════════════════════════════════════════════════════════
// AsyncPollingFlowTransfer Custom Ticker
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingFlowTransfer uses custom tickerFactory test',
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
      const flow = { read: jest.fn(async () => 42) };

      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
  'AsyncPollingFlowTransfer destroy stops custom ticker test',
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
      const flow = { read: jest.fn(async () => 42) };

      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
// AsyncPollingFlowTransfer onStateChange
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingFlowTransfer onStateChange notifies on activate/deactivate test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 42) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
  'AsyncPollingFlowTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 42) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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

// ═══════════════════════════════════════════════════════════════
// AsyncPollingFlowTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingFlowTransfer destroy cleans up test',
  () => {
    it('', async () => {
      const flow = { read: jest.fn(async () => 42) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
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
// AsyncPollingFlowTransfer Ticker Fires & _polling Guard
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPollingFlowTransfer ticker fires calls _safeTrigger test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const flow = { read: jest.fn(async () => 42) };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
        interval: 50,
        activated: true,
      });
      const handler = jest.fn();
      transfer.subscribe(handler);

      jest.advanceTimersByTime(50);
      await Promise.resolve();

      expect(flow.read).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingFlowTransfer ticker fires without onError catches rejection test',
  () => {
    it('', async () => {
      jest.useFakeTimers();
      const flow = { read: async () => { throw new Error('ticker error'); } };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
        interval: 50,
        activated: true,
      });

      jest.advanceTimersByTime(50);
      await Promise.resolve();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'AsyncPollingFlowTransfer asyncTrigger with _polling guard skips overlap test',
  () => {
    it('', async () => {
      let resolveFirst: () => void;
      const firstCall = new Promise<void>((resolve) => { resolveFirst = resolve; });
      let callCount = 0;
      const flow = {
        read: async () => {
          callCount++;
          if (callCount === 1) {
            await firstCall;
          }
          return callCount;
        },
      };
      const transfer = new AsyncPollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
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

