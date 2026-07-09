import { IntervalTicker } from '../../src';

import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// IntervalTicker
// ═══════════════════════════════════════════════════════════════
// IntervalTicker — a wrapper over setInterval.
// Used for periodically calling callback.
//
// Key features:
// - start() starts the loop and immediately calls callback (leading edge)
// - stop() stops the loop
// - restart() restarts
// - toggle() switches state
// - updateInterval() changes interval on the fly
// - interval default = 0

// ═══════════════════════════════════════════════════════════════
// IntervalTicker Constructor
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerConstructor(),
] as Array<[number]>)(
  'IntervalTicker constructor initializes with callback and interval test',
  (interval: number) => {
    it('', () => {
      const callback = jest.fn();
      const ticker = new IntervalTicker({ callback, interval });

      // After creation, Ticker is not active
      expect(ticker.active).toBe(false);
      expect(ticker.interval).toBe(interval);
    });
  },
);

/**
 * Data provider for testing IntervalTicker constructor.
 * Verifies initial values of interval and active.
 * Note: interval=0 is not tested with fake timers (see below).
 */
function dataProviderForTickerConstructor(): Array<unknown> {
  return [
    [16],     // ~60 FPS
    [100],    // 10 times per second
    [1000],   // Once per second
  ];
}

describe.each([
  ...dataProviderForTickerDefaultInterval(),
] as Array<[]>)(
  'IntervalTicker default interval is 0 test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const ticker = new IntervalTicker({ callback });

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
// IntervalTicker Start & Stop
// ═══════════════════════════════════════════════════════════════

describe('IntervalTicker start and stop test', () => {
  it('', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    const ticker = new IntervalTicker({ callback, interval: 100 });

    // Not active before start()
    expect(ticker.active).toBe(false);

    ticker.start();

    // Active after start()
    expect(ticker.active).toBe(true);

    jest.advanceTimersByTime(1);

    // Leading edge — immediate call on start()
    expect(callback).toHaveBeenCalledTimes(1);

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
  'IntervalTicker calls callback periodically test',
  (interval: number, duration: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new IntervalTicker({ callback, interval });

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
// IntervalTicker Restart
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerRestart(),
] as Array<[number]>)(
  'IntervalTicker restart stops and starts again test',
  (interval: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new IntervalTicker({ callback, interval });

      ticker.start();
      jest.advanceTimersByTime(interval * 2);

      const callsBeforeRestart = callback.mock.calls.length;

      ticker.restart();
      jest.advanceTimersByTime(1);

      // Active after restart()
      expect(ticker.active).toBe(true);

      // Leading edge on restart() — immediate call
      expect(callback.mock.calls.length).toBe(callsBeforeRestart + 1);

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
// IntervalTicker Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerToggle(),
] as Array<[boolean, boolean]>)(
  'IntervalTicker toggle switches active state test',
  (initialState: boolean, expectedAfterToggle: boolean) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new IntervalTicker({ callback, interval: 100 });

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
// IntervalTicker Update Interval
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerUpdateInterval(),
] as Array<[number, number, number]>)(
  'IntervalTicker updateInterval changes interval and restarts test',
  (oldInterval: number, newInterval: number, duration: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new IntervalTicker({ callback, interval: oldInterval });

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
// IntervalTicker Stop Behavior
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTickerStopPreventsCalls(),
] as Array<[number, number]>)(
  'IntervalTicker stop prevents further callback calls test',
  (interval: number, extraTime: number) => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const ticker = new IntervalTicker({ callback, interval });

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
 * Data provider for testing IntervalTicker stop.
 */
function dataProviderForTickerStopPreventsCalls(): Array<unknown> {
  return [
    [50, 500],
    [100, 1000],
  ];
}

// ═══════════════════════════════════════════════════════════════
// IntervalTicker Zero Interval
// ═══════════════════════════════════════════════════════════════
// Note: setInterval(fn, 0) in Jest fake timers causes an infinite loop,
// therefore tests with interval=0 are skipped for IntervalTicker.
// In real Node.js the minimum interval is ~1-10ms, but in fake timers
// interval 0 means "always ready to execute".

// ═══════════════════════════════════════════════════════════════
// IntervalTicker Idempotency
// ═══════════════════════════════════════════════════════════════

describe('IntervalTicker start is idempotent test', () => {
  it('', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    const ticker = new IntervalTicker({ callback, interval: 100 });

    ticker.start();
    ticker.start(); // Repeated start should not create a second timer
    ticker.start();

    jest.advanceTimersByTime(1);
    ticker.start();

    // Only one leading edge call
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    // Only one periodic call, not three
    expect(callback).toHaveBeenCalledTimes(2);

    ticker.stop();
    jest.useRealTimers();
  });
});

describe('IntervalTicker stop is idempotent test', () => {
  it('', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    const ticker = new IntervalTicker({ callback, interval: 100 });

    ticker.start();
    ticker.stop();
    ticker.stop(); // Repeated stop should not cause errors
    ticker.stop();

    expect(ticker.active).toBe(false);
    expect(() => ticker.stop()).not.toThrow();

    jest.useRealTimers();
  });
});

// ═══════════════════════════════════════════════════════════════
// IntervalTicker Factory
// ═══════════════════════════════════════════════════════════════

describe('IntervalTicker factory creates ticker instance test', () => {
  it('', () => {
    const callback = jest.fn();
    const ticker = IntervalTicker.factory({ callback, interval: 100 });

    expect(ticker).toBeInstanceOf(IntervalTicker);
    expect(ticker.interval).toBe(100);
    expect(ticker.active).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// IntervalTicker Edge Cases
// ═══════════════════════════════════════════════════════════════

describe('IntervalTicker handles null value in callback test', () => {
  it('', () => {
    jest.useFakeTimers();
    const callback = jest.fn<(value: null) => void>();
    const ticker = new IntervalTicker({ callback: () => callback(null), interval: 100 });

    ticker.start();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledWith(null);

    ticker.stop();
    jest.useRealTimers();
  });
});

describe('IntervalTicker handles object value in callback test', () => {
  it('', () => {
    jest.useFakeTimers();
    const callback = jest.fn<(value: { id: number }) => void>();
    const obj = { id: 42 };
    const ticker = new IntervalTicker({ callback: () => callback(obj), interval: 100 });

    ticker.start();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledWith(obj);

    ticker.stop();
    jest.useRealTimers();
  });
});

// ═══════════════════════════════════════════════════════════════
// IntervalTicker Zero Interval (via mock to avoid fake-timer infinite loop)
// ═══════════════════════════════════════════════════════════════

describe('IntervalTicker with zero interval starts setInterval immediately test', () => {
  it('', () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval').mockReturnValue(123 as any);
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});

    const callback = jest.fn();
    const ticker = new IntervalTicker({ callback, interval: 0 });

    ticker.start();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 0);
    expect(ticker.active).toBe(true);

    ticker.stop();

    expect(clearIntervalSpy).toHaveBeenCalledWith(123);
    expect(ticker.active).toBe(false);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});

describe('IntervalTicker with zero interval executes callback via setInterval test', () => {
  it('', () => {
    const callback = jest.fn();
    // @ts-ignore
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval').mockImplementation((fn: (...args: any[]) => void) => {
      fn();
      return 123 as any;
    });
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});

    const ticker = new IntervalTicker({ callback, interval: 0 });

    ticker.start();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(ticker.active).toBe(true);

    ticker.stop();

    expect(clearIntervalSpy).toHaveBeenCalledWith(123);
    expect(ticker.active).toBe(false);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════
// IntervalTicker Update Interval When Inactive
// ═══════════════════════════════════════════════════════════════

describe('IntervalTicker updateInterval when inactive does not restart test', () => {
  it('', () => {
    const callback = jest.fn();
    const ticker = new IntervalTicker({ callback, interval: 100 });

    expect(ticker.active).toBe(false);

    ticker.updateInterval(50);

    expect(ticker.interval).toBe(50);
    expect(ticker.active).toBe(false);
  });
});

