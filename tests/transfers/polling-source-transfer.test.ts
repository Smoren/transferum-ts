import type { TickerFactory } from '../../src';
import { PollingSourceTransfer, RAFTicker } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PollingSourceTransfer
// ═══════════════════════════════════════════════════════════════
// Output transfer with internal polling of a data source.
// Capabilities: isOutput, isPollingSource, isPullable, isSubscribable, isTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// PollingSourceTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingSourceTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 0,
        interval: 100,
        activated: false,
      });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingSourceTransfer Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPollingPull(),
] as Array<[number]>)(
  'PollingSourceTransfer pull returns fetcher result test',
  (value: number) => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => value,
        interval: 100,
        activated: false,
      });

      expect(transfer.pull()).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing pull().
 */
function dataProviderForPollingPull(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PollingSourceTransfer Trigger & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPollingTrigger(),
] as Array<[number]>)(
  'PollingSourceTransfer trigger notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => value,
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
function dataProviderForPollingTrigger(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForPollingMultipleSubscribers(),
] as Array<[number]>)(
  'PollingSourceTransfer trigger notifies all subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => value,
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
      expect(handler1).toHaveBeenCalledWith(value);
      expect(handler2).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing multiple subscribers.
 */
function dataProviderForPollingMultipleSubscribers(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PollingSourceTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPollingGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'PollingSourceTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 0,
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
function dataProviderForPollingGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'PollingSourceTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 0,
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
// PollingSourceTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingSourceTransfer destroy cleans up test',
  () => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
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
// PollingSourceTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingSourceTransfer trigger with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => { throw error; },
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
  'PollingSourceTransfer trigger without onError rethrows test',
  () => {
    it('', () => {
      const error = new Error('fetcher error');
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => { throw error; },
        interval: 100,
        activated: false,
      });

      expect(() => transfer.trigger()).toThrow('fetcher error');

      transfer.destroy();
    });
  },
);

describe(
  'PollingSourceTransfer pull with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => { throw error; },
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
  'PollingSourceTransfer pull without onError rethrows test',
  () => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => { throw new Error('fetcher error'); },
        interval: 100,
        activated: false,
      });

      expect(() => transfer.pull()).toThrow('fetcher error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingSourceTransfer Custom Ticker
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingSourceTransfer uses custom tickerFactory test',
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

      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
        interval: 100,
        activated: true,
        tickerFactory,
      });

      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(tickerFactory).toHaveBeenCalledWith({
        callback: expect.any(Function),
        interval: 100,
      });
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingSourceTransfer with RAFTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
        interval: 100,
        activated: true,
        tickerFactory: RAFTicker.factory,
      });

      transfer.subscribe((data) => {
        if (data !== undefined) callback();
      });

      jest.advanceTimersByTime(10);
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time — polling should call fetcher
      jest.advanceTimersByTime(90);
      expect(callback).toHaveBeenCalledTimes(2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  "PollingSourceTransfer inactive doesn't start custom ticker test",
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

      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
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
  'PollingSourceTransfer destroy stops custom ticker test',
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

      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
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
// PollingSourceTransfer subscribeState()
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSubscribeStateActivateDeactivate(),
] as Array<[boolean]>)(
  'PollingSourceTransfer subscribeState notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
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

function dataProviderForSubscribeStateActivateDeactivate(): Array<unknown> {
  return [[true], [false]];
}

describe(
  'PollingSourceTransfer subscribeState notifies on toggle test',
  () => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
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
  'PollingSourceTransfer subscribeState unsubscribe stops notifications test',
  () => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
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
  'PollingSourceTransfer subscribeState handler receives GateInterface test',
  () => {
    it('', () => {
      const transfer = new PollingSourceTransfer<number>({
        fetcher: () => 42,
        interval: 100,
        activated: false,
      });
      let receivedGate: any = null;

      transfer.onStateChange((g) => { receivedGate = g; });
      transfer.activate();

      expect(receivedGate).toBe(transfer);
      expect(receivedGate.active).toBe(true);
      expect(typeof receivedGate.activate).toBe('function');

      transfer.destroy();
    });
  },
);

