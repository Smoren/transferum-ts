import { RAFTicker } from '../../src';

import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// RAFTicker
// ═══════════════════════════════════════════════════════════════
// RAFTicker — a wrapper over requestAnimationFrame with interval.
// Used for periodically calling callback.
//
// Key features:
// - start() starts the loop
// - stop() stops the loop
// - restart() restarts
// - toggle() switches state
// - updateInterval() changes interval on the fly
// - Polyfills for requestAnimationFrame/cancelAnimationFrame

// ═══════════════════════════════════════════════════════════════
// Ticker Constructor
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerConstructor(),
] as Array<[number]>)(
  'Ticker constructor initializes with callback and interval test',
  (interval: number) => {
    it('', () => {
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback, interval });

      // After creation, Ticker is not active
      expect(ticker.active).toBe(false);
      expect(ticker.interval).toBe(interval);
    });
  },
);

/**
 * Data provider for testing Ticker constructor.
 * Verifies initial values of interval and active.
 */
function dataProviderForTickerConstructor(): Array<unknown> {
  return [
    [0],      // No delay
    [16],     // ~60 FPS
    [100],    // 10 times per second
    [1000],   // Once per second
  ];
}

describe.each([
  ...dataProviderForTickerDefaultInterval(),
] as Array<[]>)(
  'Ticker default interval is 0 test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback });

      // Default interval = 0
      expect(ticker.interval).toBe(0);
    });
  },
);

/**
 * Data provider for testing default interval.
 */
function dataProviderForTickerDefaultInterval(): Array<unknown> {
  return [[]];
}

// ═══════════════════════════════════════════════════════════════
// Ticker Start & Stop
// ═══════════════════════════════════════════════════════════════

describe('Ticker start and stop test', () => {
  it('', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    const ticker = new RAFTicker({ callback, interval: 100 });

    // Not active before start()
    expect(ticker.active).toBe(false);

    ticker.start();

    // Active after start()
    expect(ticker.active).toBe(true);

    // Advance time
    jest.advanceTimersByTime(250);

    ticker.stop();

    // Not active after stop()
    expect(ticker.active).toBe(false);

    jest.useRealTimers();
  });
});

describe.each([
  ...dataProviderForTickerCallbackCalls(),
] as Array<[number, number]>)(
  'Ticker calls callback periodically test',
  (interval: number, duration: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback, interval });

      ticker.start();
      jest.advanceTimersByTime(duration);
      ticker.stop();

      // Expected number of calls: 1 (leading edge) + periodic
      const expectedCalls = 1 + Math.floor(duration / interval);
      expect(callback).toHaveBeenCalledTimes(expectedCalls);

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing periodic callback calls.
 */
function dataProviderForTickerCallbackCalls(): Array<unknown> {
  return [
    [100, 500],   // 1 leading + 5 periodic = 6 calls
    [50, 200],    // 1 leading + 4 periodic = 5 calls
    [200, 1000],  // 1 leading + 5 periodic = 6 calls
  ];
}

// ═══════════════════════════════════════════════════════════════
// Ticker Restart
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerRestart(),
] as Array<[number]>)(
  'Ticker restart stops and starts again test',
  (interval: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback, interval });

      ticker.start();
      jest.advanceTimersByTime(interval * 2);

      const callsBeforeRestart = callback.mock.calls.length;

      ticker.restart();

      // Active after restart()
      expect(ticker.active).toBe(true);

      jest.advanceTimersByTime(interval * 2);

      // Callback continues to be called
      expect(callback.mock.calls.length).toBeGreaterThan(callsBeforeRestart);

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing restart().
 */
function dataProviderForTickerRestart(): Array<unknown> {
  return [
    [50],
    [100],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Ticker Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerToggle(),
] as Array<[boolean, boolean]>)(
  'Ticker toggle switches active state test',
  (initialState: boolean, expectedAfterToggle: boolean) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback, interval: 100 });

      if (initialState) {
        ticker.start();
      }

      const result = ticker.toggle();

      expect(result).toBe(expectedAfterToggle);
      expect(ticker.active).toBe(expectedAfterToggle);

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing toggle().
 * toggle() returns the new state.
 */
function dataProviderForTickerToggle(): Array<unknown> {
  return [
    [false, true],   // false → true
    [true, false],   // true → false
  ];
}

// ═══════════════════════════════════════════════════════════════
// Ticker Update Interval
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerUpdateInterval(),
] as Array<[number, number, number]>)(
  'Ticker updateInterval changes interval and restarts test',
  (oldInterval: number, newInterval: number, duration: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback, interval: oldInterval });

      ticker.start();
      jest.advanceTimersByTime(duration);

      const callsBeforeUpdate = callback.mock.calls.length;

      ticker.updateInterval(newInterval);
      jest.advanceTimersByTime(duration);

      // After update: leading edge (restart) + periodic calls
      expect(callback).toHaveBeenCalledTimes(callsBeforeUpdate + 1 + Math.floor(duration / newInterval));
      expect(ticker.interval).toBe(newInterval);

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing updateInterval().
 */
function dataProviderForTickerUpdateInterval(): Array<unknown> {
  return [
    [100, 50, 200],   // Acceleration: 100ms → 50ms
    [50, 200, 400],   // Deceleration: 50ms → 200ms
  ];
}

// ═══════════════════════════════════════════════════════════════
// Ticker Stop Behavior
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerStopPreventsCalls(),
] as Array<[number, number]>)(
  'Ticker stop prevents further callback calls test',
  (interval: number, extraTime: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback, interval });

      ticker.start();
      jest.advanceTimersByTime(interval * 3);

      const callsBeforeStop = callback.mock.calls.length;

      ticker.stop();
      jest.advanceTimersByTime(extraTime);

      // After stop(), callback is not called
      expect(callback).toHaveBeenCalledTimes(callsBeforeStop);

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing Ticker stop.
 */
function dataProviderForTickerStopPreventsCalls(): Array<unknown> {
  return [
    [50, 500],
    [100, 1000],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Ticker Zero Interval
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerZeroInterval(),
] as Array<[number, number]>)(
  'Ticker with zero interval calls callback as fast as possible test',
  (duration: number, expectedCalls: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new RAFTicker({ callback, interval: 0 });

      // Verify that interval is set to 0
      expect(ticker.interval).toBe(0);

      ticker.start();
      ticker.start(); // Repeated call does not interfere

      // Verify that Ticker is active
      expect(ticker.active).toBe(true);

      jest.advanceTimersByTime(duration);
      ticker.stop();

      // With interval 0, callback is called on every tick + once on start
      expect(callback).toHaveBeenCalledTimes(expectedCalls);

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing interval 0.
 * With zero interval, callback is called on every timer tick + once on start.
 */
function dataProviderForTickerZeroInterval(): Array<unknown> {
  return [
    [10, 11],   // 10 ticks + 1 on start = 11 calls
    [20, 21],   // 20 ticks + 1 on start = 21 calls
  ];
}

// ═══════════════════════════════════════════════════════════════
// Ticker Factory
// ═══════════════════════════════════════════════════════════════

describe('Ticker factory creates ticker instance test', () => {
  it('', () => {
    const callback = jest.fn();
    const ticker = RAFTicker.factory({ callback, interval: 100 });

    expect(ticker).toBeInstanceOf(RAFTicker);
    expect(ticker.interval).toBe(100);
    expect(ticker.active).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Ticker Idempotency & Inactive Operations
// ═══════════════════════════════════════════════════════════════

describe('Ticker start is idempotent with non-zero interval test', () => {
  it('', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    const ticker = new RAFTicker({ callback, interval: 100 });

    ticker.start();
    expect(ticker.active).toBe(true);

    // Repeated start() should return immediately — already active
    ticker.start();
    ticker.start();

    ticker.stop();
    expect(ticker.active).toBe(false);
    jest.useRealTimers();
  });
});

describe('Ticker stop when inactive is safe test', () => {
  it('', () => {
    const callback = jest.fn();
    const ticker = new RAFTicker({ callback, interval: 100 });

    expect(ticker.active).toBe(false);
    expect(() => ticker.stop()).not.toThrow();
    expect(ticker.active).toBe(false);
  });
});

describe('Ticker updateInterval when inactive does not restart test', () => {
  it('', () => {
    const callback = jest.fn();
    const ticker = new RAFTicker({ callback, interval: 100 });

    expect(ticker.active).toBe(false);

    ticker.updateInterval(50);

    expect(ticker.interval).toBe(50);
    expect(ticker.active).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Ticker Native RAF/CAF & Fallback Coverage
// ═══════════════════════════════════════════════════════════════

describe('Ticker uses native requestAnimationFrame when available test', () => {
  it('', () => {
    const origRAF = (globalThis as any).requestAnimationFrame;
    const origCAF = (globalThis as any).cancelAnimationFrame;

    const rafMock = jest.fn((cb: FrameRequestCallback) => 1);
    const cafMock = jest.fn((handle: number) => {});
    (globalThis as any).requestAnimationFrame = rafMock;
    (globalThis as any).cancelAnimationFrame = cafMock;

    jest.isolateModules(() => {
      // @ts-ignore
      const mod = require('../../src');
      const callback = jest.fn();
      const ticker = new mod.RAFTicker({ callback, interval: 16 });

      ticker.start();
      expect(rafMock).toHaveBeenCalled();

      ticker.stop();
      expect(cafMock).toHaveBeenCalled();
    });

    if (origRAF) (globalThis as any).requestAnimationFrame = origRAF;
    else delete (globalThis as any).requestAnimationFrame;
    if (origCAF) (globalThis as any).cancelAnimationFrame = origCAF;
    else delete (globalThis as any).cancelAnimationFrame;
  });
});

describe('Ticker fallback uses Date.now when performance.now unavailable test', () => {
  it('', () => {
    jest.useFakeTimers();

    const origPerfNow = globalThis.performance.now;
    globalThis.performance.now = undefined as any;

    const callback = jest.fn();
    const ticker = new RAFTicker({ callback, interval: 0 });

    ticker.start();
    jest.advanceTimersByTime(5);

    expect(callback).toHaveBeenCalled();

    ticker.stop();
    globalThis.performance.now = origPerfNow;
    jest.useRealTimers();
  });
});

// ═══════════════════════════════════════════════════════════════
// Ticker Callback Calling stop() — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe('Ticker callback calling stop() prevents re-scheduling test', () => {
  it('', () => {
    jest.useFakeTimers();
    let ticker: RAFTicker;
    const callback = jest.fn(function() {
      // Call stop() synchronously inside callback
      ticker.stop();
    });
    ticker = new RAFTicker({ callback, interval: 100 });

    ticker.start();
    expect(ticker.active).toBe(true);

    // Advance timers to trigger the callback
    jest.advanceTimersByTime(100);

    // Callback called stop(), so ticker should be inactive
    expect(ticker.active).toBe(false);

    // Further time advancement should not call callback again
    jest.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
