import type { TickerFactory, DataFetcher } from '../../src';
import { PollingProxyTransfer, IntervalTicker } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer
// ═══════════════════════════════════════════════════════════════
// Duplex transfer with polling that receives a fetcher from the previous node.
// Capabilities: isInput, isOutput, isPollingProxy, isPullable, isSubscribable, isTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingProxyTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isPollingProxy).toBe(true);
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
// PollingProxyTransfer Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForChainPull(),
] as Array<[number]>)(
  'PollingProxyTransfer pull returns fetcher result test',
  (value: number) => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setFetcher(() => value);

      expect(transfer.pull()).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing pull().
 */
function dataProviderForChainPull(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'PollingProxyTransfer pull without active returns undefined test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      transfer.setFetcher(() => 42);

      expect(transfer.pull()).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'PollingProxyTransfer pull without fetcher throws test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      expect(() => transfer.pull()).toThrow('Fetcher is not defined');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer Trigger & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForChainTrigger(),
] as Array<[number]>)(
  'PollingProxyTransfer trigger notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });
      const handler = jest.fn();

      transfer.setFetcher(() => value);
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
function dataProviderForChainTrigger(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'PollingProxyTransfer trigger without active does nothing test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.setFetcher(() => 42);
      transfer.subscribe(handler);
      transfer.trigger();

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'PollingProxyTransfer trigger without fetcher throws test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      expect(() => transfer.trigger()).toThrow('Fetcher is not defined');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer SetFetcher & ClearFetcher
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingProxyTransfer setFetcher starts ticker if active test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setFetcher(() => 42);

      expect(transfer.active).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'PollingProxyTransfer clearFetcher stops ticker test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setFetcher(() => 42);
      expect(transfer.active).toBe(true);

      transfer.clearFetcher();

      expect(transfer.active).toBe(true); // _active stays true, but ticker stops

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForChainGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'PollingProxyTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
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
function dataProviderForChainGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'PollingProxyTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
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
// PollingProxyTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingProxyTransfer destroy cleans up test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });
      const handler = jest.fn();

      transfer.setFetcher(() => 42);
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
// PollingProxyTransfer Error Handling
// ═══════════════════════════════════════════════════════════════
// Using jest.useFakeTimers() to prevent asynchronous calls
// of the ticker that may cause a throwing fetcher before sync checks.

describe(
  'PollingProxyTransfer trigger with onError suppresses error test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        onError,
      });
      const handler = jest.fn();

      transfer.setFetcher(() => { throw error; });
      transfer.subscribe(handler);
      transfer.trigger();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingProxyTransfer trigger without onError rethrows test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const error = new Error('fetcher error');
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setFetcher(() => { throw error; });

      expect(() => transfer.trigger()).toThrow('fetcher error');

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingProxyTransfer pull with onError suppresses error test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        onError,
      });

      transfer.setFetcher(() => { throw error; });

      const result = transfer.pull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingProxyTransfer pull without onError rethrows test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
      });

      transfer.setFetcher(() => { throw new Error('fetcher error'); });

      expect(() => transfer.pull()).toThrow('fetcher error');

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer Custom Ticker
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingProxyTransfer uses custom tickerFactory test',
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

      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory,
      });

      transfer.setFetcher(jest.fn() as DataFetcher<number>);

      expect(tickerFactory).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingProxyTransfer with IntervalTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory: IntervalTicker.factory,
      });

      transfer.setFetcher(() => 42);
      transfer.subscribe((data) => {
        if (data !== undefined) callback();
      });

      jest.advanceTimersByTime(0);

      // Leading edge — first call on setFetcher (if active)
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time — polling should call fetcher
      jest.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingProxyTransfer setFetcher uses stored tickerFactory test',
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

      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory,
      });

      transfer.setFetcher(() => 42);

      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'PollingProxyTransfer clearFetcher stops custom ticker test',
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

      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory,
      });

      transfer.setFetcher(() => 42);
      transfer.clearFetcher();

      expect(customTicker.stop).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer Gate with ticker set
// ═══════════════════════════════════════════════════════════════

describe(
  'PollingProxyTransfer toggle with ticker set calls ticker toggle test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const customTicker = {
        start: jest.fn(),
        stop: jest.fn(),
        restart: jest.fn(),
        toggle: jest.fn().mockReturnValue(false),
        updateInterval: jest.fn(),
        active: false,
        interval: 100,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = new PollingProxyTransfer<number>({
        interval: 100,
        activated: true,
        tickerFactory,
      });

      transfer.setFetcher(() => 42);

      const result = transfer.toggle();

      expect(customTicker.toggle).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
      expect(transfer.active).toBe(false);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer onStateChange()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'PollingProxyTransfer onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
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
  'PollingProxyTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
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
  'PollingProxyTransfer onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
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
  'PollingProxyTransfer onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const transfer = new PollingProxyTransfer<number>({
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

