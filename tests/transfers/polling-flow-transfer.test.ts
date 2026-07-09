import type { TickerFactory } from '../../src';
import {
  LatestStorage,
  QueueStorage,
  StackStorage,
  PollingFlowTransfer,
  IntervalTicker,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer
// ═══════════════════════════════════════════════════════════════
// Output transfer with polling from an OutputFlowInterface (e.g., Storage).
// Capabilities: isOutput, isPollingSource, isPullable, isSubscribable, isTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingFlowTransfer has correct capability flags test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPollingFlowPull(),
] as Array<[typeof LatestStorage, number | undefined, number | undefined]>)(
  'PollingFlowTransfer pull returns flow value test',
  (StorageClass, value, expected) => {
    it('', () => {
      const storage = new StorageClass<number>();
      if (value !== undefined) {
        storage.write(value);
      }
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });

      const result = transfer.pull();

      expect(result).toBe(expected);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing pull().
 * [StorageClass, value, expected]
 */
function dataProviderForPollingFlowPull(): Array<unknown> {
  return [
    [LatestStorage, 42, 42],
    [LatestStorage, 0, 0],
    [LatestStorage, undefined, undefined],
    [QueueStorage, 42, 42],
    [QueueStorage, 0, 0],
    [QueueStorage, undefined, undefined],
    [StackStorage, 42, 42],
    [StackStorage, 0, 0],
    [StackStorage, undefined, undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer Trigger & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPollingFlowTrigger(),
] as Array<[number]>)(
  'PollingFlowTransfer trigger notifies subscribers test',
  (value: number) => {
    it('', () => {
      const storage = new LatestStorage<number>();
      storage.write(value);
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing trigger().
 */
function dataProviderForPollingFlowTrigger(): Array<unknown> {
  return [
    [1],
    [42],
    [-5],
  ];
}

describe(
  'PollingFlowTransfer trigger with empty storage does not notify test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'PollingFlowTransfer multiple subscribers receive same value test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      storage.write(42);
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      transfer.trigger();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(42);
      expect(handler2).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPollingFlowGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'PollingFlowTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
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
function dataProviderForPollingFlowGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'PollingFlowTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
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
// PollingFlowTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingFlowTransfer destroy cleans up test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      storage.write(42);
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      expect(transfer.active).toBe(false);
      transfer.trigger();
      expect(handler).not.toHaveBeenCalled();

      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingFlowTransfer trigger with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('read error');
      const onError = jest.fn();
      const flow = {
        read: () => { throw error; },
      };
      const transfer = new PollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
        onError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'PollingFlowTransfer trigger without onError rethrows test',
  () => {
    it('', () => {
      const flow = {
        read: () => { throw new Error('read error'); },
      };
      const transfer = new PollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
      });

      // Error is rethrown when onError is not provided
      expect(() => transfer.trigger()).toThrow('read error');

      transfer.destroy();
    });
  },
);

describe(
  'PollingFlowTransfer pull with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('read error');
      const onError = jest.fn();
      const flow = {
        read: () => { throw error; },
      };
      const transfer = new PollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
        onError,
      });

      const result = transfer.pull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'PollingFlowTransfer pull without onError rethrows test',
  () => {
    it('', () => {
      const flow = {
        read: () => { throw new Error('read error'); },
      };
      const transfer = new PollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
      });

      // Error is rethrown when onError is not provided
      expect(() => transfer.pull()).toThrow('read error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer Different Storage Types
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingFlowTransfer with QueueStorage shifts values test',
  () => {
    it('', () => {
      const storage = new QueueStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.write(3);
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();
      transfer.trigger();
      transfer.trigger();

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenNthCalledWith(1, 1);
      expect(handler).toHaveBeenNthCalledWith(2, 2);
      expect(handler).toHaveBeenNthCalledWith(3, 3);

      transfer.destroy();
    });
  },
);

describe(
  'PollingFlowTransfer with StackStorage pops values test',
  () => {
    it('', () => {
      const storage = new StackStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.write(3);
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();
      transfer.trigger();
      transfer.trigger();

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenNthCalledWith(1, 3);
      expect(handler).toHaveBeenNthCalledWith(2, 2);
      expect(handler).toHaveBeenNthCalledWith(3, 1);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer Custom Ticker
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingFlowTransfer uses custom tickerFactory test',
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

      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
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
  'PollingFlowTransfer with IntervalTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const storage = new LatestStorage<number>();
      storage.write(42);

      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: true,
        tickerFactory: IntervalTicker.factory,
      });

      transfer.subscribe((data) => {
        if (data !== undefined) callback();
      });

      jest.advanceTimersByTime(0);

      // Leading edge
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingFlowTransfer inactive doesn\'t start custom ticker test',
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

      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
        tickerFactory,
      });

      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingFlowTransfer destroy stops custom ticker test',
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

      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
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
// PollingFlowTransfer onStateChange()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'PollingFlowTransfer onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: initialState,
      });
      const handler = jest.fn();

      transfer.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      transfer.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(transfer);

      transfer.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(transfer);

      transfer.destroy();
    });
  },
);

describe(
  'PollingFlowTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.onStateChange(handler);
      transfer.toggle();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(transfer);

      transfer.destroy();
    });
  },
);

describe(
  'PollingFlowTransfer onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
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

describe(
  'PollingFlowTransfer onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new PollingFlowTransfer<number>({
        flow: storage,
        interval: 100,
        activated: false,
      });
      let receivedGate: any = null;

      transfer.onStateChange((g) => { receivedGate = g; });
      transfer.activate();

      expect(receivedGate).toBe(transfer);
      expect(receivedGate.active).toBe(true);

      transfer.destroy();
    });
  },
);
