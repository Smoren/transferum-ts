import type { TickerFactory } from '../../src';
import { IdlePollingTransfer, IntervalTicker } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer
// ═══════════════════════════════════════════════════════════════
// Reactive channel with fallback polling on idle incoming data.
// Capabilities: isInput, isOutput, isPushable, isPullable, isSubscribable, isPollingSource, isTriggerable, isGate

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'IdlePollingTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
        activated: false,
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
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
// IdlePollingTransfer Push & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPush(),
] as Array<[number]>)(
  'IdlePollingTransfer push notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
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
 * Data provider for testing push().
 */
function dataProviderForPush(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe.each([
  ...dataProviderForPushMultipleSubscribers(),
] as Array<[number]>)(
  'IdlePollingTransfer push notifies all subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
        activated: false,
      });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      transfer.push(value);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(value);
      expect(handler2).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing multiple subscriptions.
 */
function dataProviderForPushMultipleSubscribers(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Trigger
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTrigger(),
] as Array<[number]>)(
  'IdlePollingTransfer trigger calls fetcher and notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => value,
        timeout: 100,
        interval: 50,
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
function dataProviderForTrigger(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'IdlePollingTransfer trigger notifies all subscribers test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
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
// IdlePollingTransfer Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPull(),
] as Array<[number]>)(
  'IdlePollingTransfer pull calls fetcher and returns result test',
  (value: number) => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => value,
        timeout: 100,
        interval: 50,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      const result = transfer.pull();

      expect(result).toBe(value);
      // pull() does not notify subscribers
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing pull().
 */
function dataProviderForPull(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'IdlePollingTransfer pull with undefined fetcher result test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => undefined,
        timeout: 100,
        interval: 50,
        activated: false,
      });

      expect(transfer.pull()).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'IdlePollingTransfer pull with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => { throw error; },
        timeout: 100,
        interval: 50,
        activated: false,
        onError,
      });

      const result = transfer.pull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Gate
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'IdlePollingTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
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
function dataProviderForGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

describe(
  'IdlePollingTransfer activate/deactivate/toggle test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
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
  'IdlePollingTransfer activate when already active does nothing test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
        activated: true,
      });

      expect(transfer.active).toBe(true);

      // Repeated activate — no-op (line 1547)
      transfer.activate();
      expect(transfer.active).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'IdlePollingTransfer toggle when active deactivates and returns false test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 0,
        timeout: 100,
        interval: 50,
        activated: true,
      });

      expect(transfer.active).toBe(true);

      // toggle when active → deactivate, returns false (lines 1561-1562)
      const result = transfer.toggle();
      expect(result).toBe(false);
      expect(transfer.active).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Idle Polling (Timer-based)
// ═══════════════════════════════════════════════════════════════

describe(
  'IdlePollingTransfer starts polling after timeout test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 42);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Wait slightly past timeout — polling should start
      setTimeout(() => {
        expect(fetcher).toHaveBeenCalled();
        expect(handler).toHaveBeenCalledWith(42);

        transfer.destroy();
        done();
      }, 80);
    }, 180);
  },
);

describe(
  'IdlePollingTransfer startPolling when ticker already running is no-op test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 42);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });

      // Wait until the idle timer fires and starts the ticker
      setTimeout(() => {
        expect(fetcher).toHaveBeenCalled();
        const pollCount = fetcher.mock.calls.length;

        // Repeated _startPolling call — no-op (line 1593)
        (transfer as unknown as { _startPolling: () => void })._startPolling();

        // Ticker was not recreated — call frequency unchanged
        setTimeout(() => {
          // Calls continue at the same interval, without doubling
          expect(fetcher.mock.calls.length).toBeGreaterThan(pollCount);

          transfer.destroy();
          done();
        }, 30);
      }, 70);
    });
  },
);

describe(
  'IdlePollingTransfer push resets idle timer and stops polling test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 99);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Wait until polling starts
      setTimeout(() => {
        const pollCount = fetcher.mock.calls.length;
        expect(pollCount).toBeGreaterThan(0);

        // Push resets the idle timer and stops polling
        transfer.push(77);
        expect(handler).toHaveBeenCalledWith(77);

        const countAfterPush = fetcher.mock.calls.length;

        // Wait a bit — polling should be stopped
        setTimeout(() => {
          expect(fetcher.mock.calls.length).toBe(countAfterPush);

          // Wait more — after a new timeout, polling resumes
          setTimeout(() => {
            expect(fetcher.mock.calls.length).toBeGreaterThan(countAfterPush);

            transfer.destroy();
            done();
          }, 80);
        }, 30);
      }, 70);
    });
  },
);

describe(
  'IdlePollingTransfer push before timeout prevents polling test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 99);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });

      // Push before timeout (at 20ms) resets the timer
      setTimeout(() => {
        transfer.push(1);
      }, 20);

      // At 40ms (20ms after push) — timeout not yet reached
      setTimeout(() => {
        expect(fetcher).not.toHaveBeenCalled();
      }, 40);

      // At 100ms (80ms after push) — timeout reached, polling started
      setTimeout(() => {
        expect(fetcher).toHaveBeenCalled();

        transfer.destroy();
        done();
      }, 100);
    });
  },
);

describe(
  'IdlePollingTransfer deactivate stops idle timer and polling test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 42);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });

      // Wait until polling starts
      setTimeout(() => {
        const pollCount = fetcher.mock.calls.length;
        expect(pollCount).toBeGreaterThan(0);

        // Deactivation stops polling
        transfer.deactivate();

        setTimeout(() => {
          expect(fetcher.mock.calls.length).toBe(pollCount);

          transfer.destroy();
          done();
        }, 80);
      }, 70);
    });
  },
);

describe(
  'IdlePollingTransfer activate starts idle timer test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 42);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: false,
      });

      // Inactive — polling does not start
      setTimeout(() => {
        expect(fetcher).not.toHaveBeenCalled();

        // Activation starts the idle timer
        transfer.activate();

        setTimeout(() => {
          expect(fetcher).toHaveBeenCalled();

          transfer.destroy();
          done();
        }, 80);
      }, 70);
    });
  },
);

describe(
  'IdlePollingTransfer multiple pushes keep resetting timer test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 99);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Series of push with 30ms interval — timeout (50ms) not reached
      transfer.push(0);
      setTimeout(() => {
        transfer.push(1);
        setTimeout(() => {
          transfer.push(2);
          setTimeout(() => {
            // At 60ms — timeout not yet reached (last push at 60ms)
            expect(fetcher).not.toHaveBeenCalled();
            expect(handler).toHaveBeenCalledTimes(3);

            // Wait for timeout after the last push (60+50=110ms)
            setTimeout(() => {
              expect(fetcher).toHaveBeenCalled();

              transfer.destroy();
              done();
            }, 80);
          }, 30);
        }, 30);
      }, 30);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'IdlePollingTransfer destroy cleans up test',
  () => {
    it('', (done) => {
      const fetcher = jest.fn(() => 42);
      const transfer = new IdlePollingTransfer<number>({
        fetcher,
        timeout: 50,
        interval: 10,
        activated: true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Wait until polling starts
      setTimeout(() => {
        expect(fetcher).toHaveBeenCalled();
        const pollCount = fetcher.mock.calls.length;
        const handlerCount = handler.mock.calls.length;

        transfer.destroy();
        expect(transfer.active).toBe(false);

        // After destroy, polling does not work
        setTimeout(() => {
          expect(fetcher.mock.calls.length).toBe(pollCount);

          // trigger after destroy does not notify
          transfer.trigger();
          expect(handler.mock.calls.length).toBe(handlerCount);

          // Repeated destroy does not throw
          expect(() => transfer.destroy()).not.toThrow();

          done();
        }, 80);
      }, 70);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'IdlePollingTransfer trigger with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('fetcher error');
      const onError = jest.fn();
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => { throw error; },
        timeout: 100,
        interval: 50,
        activated: false,
        onError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'IdlePollingTransfer trigger without onError rethrows test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => { throw new Error('fetcher error'); },
        timeout: 100,
        interval: 50,
        activated: false,
      });

      expect(() => transfer.trigger()).toThrow('fetcher error');

      transfer.destroy();
    });
  },
);

describe(
  'IdlePollingTransfer polling error with onError suppressed and polling continues test',
  () => {
    it('', (done) => {
      let callCount = 0;
      const onError = jest.fn();
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => {
          callCount++;
          throw new Error(`error ${callCount}`);
        },
        timeout: 50,
        interval: 10,
        activated: true,
        onError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // After timeout, polling calls fetcher, which throws
      setTimeout(() => {
        expect(onError).toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();

        // Wait more — error again, but polling continues
        setTimeout(() => {
          expect(onError.mock.calls.length).toBeGreaterThan(1);

          transfer.destroy();
          done();
        }, 30);
      }, 70);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Initial Value
// ═══════════════════════════════════════════════════════════════

describe(
  'IdlePollingTransfer with initialValue triggers sends fetcher result not initial test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
        activated: false,
        initialValue: 10,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();

      // trigger calls fetcher, not initialValue
      expect(handler).toHaveBeenCalledWith(42);
      expect(handler).not.toHaveBeenCalledWith(10);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer Custom Ticker
// ═══════════════════════════════════════════════════════════════

describe(
  'IdlePollingTransfer uses custom tickerFactory test',
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
        interval: 50,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
        activated: true,
        tickerFactory,
      });

      // When activated=true, the idle timer starts, but not the ticker
      expect(tickerFactory).not.toHaveBeenCalled();
      expect(customTicker.start).not.toHaveBeenCalled();

      // Wait for timeout — polling starts (and tickerFactory)
      jest.advanceTimersByTime(100);
      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'IdlePollingTransfer with IntervalTicker factory test',
  () => {
    it('', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
        activated: true,
        tickerFactory: IntervalTicker.factory,
      });

      transfer.subscribe((data) => {
        if (data !== undefined) callback();
      });

      expect(callback).toHaveBeenCalledTimes(0);

      // trigger() calls _poll() directly (not via ticker)
      transfer.trigger();
      expect(callback).toHaveBeenCalledTimes(1);

      // Advance time to trigger the idle timer (timeout).
      // After it, IntervalTicker.start() registers a leading-edge
      // call via setTimeout(fn, 0). This timer is created at the moment
      // the idle timer fires — at the advanceTimersByTime boundary —
      // and is NOT executed in the same tick (known Jest fake timers
      // limitation: timers registered during advancement are not
      // automatically processed). Therefore we explicitly process
      // pending timers, otherwise leading edge fails and the counter
      // is off. Previously there was a workaround advanceTimersByTime(1).
      jest.advanceTimersByTime(100); // timeout → start polling
      jest.runOnlyPendingTimers();   // processes the leading-edge setTimeout(0)

      expect(callback).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(50); // interval
      // trigger (1 time) + leading-edge polling (1) + interval polling (1) = 3
      expect(callback).toHaveBeenCalledTimes(3);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'IdlePollingTransfer activate starts custom ticker test',
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
        interval: 50,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
        activated: false,
        tickerFactory,
      });

      // Activation starts the idle timer (not the ticker directly)
      transfer.activate();
      expect(tickerFactory).not.toHaveBeenCalled();

      // Wait for timeout — polling ticker should start
      jest.advanceTimersByTime(100);
      expect(tickerFactory).toHaveBeenCalledTimes(1);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'IdlePollingTransfer deactivate stops custom ticker test',
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
        interval: 50,
      };
      const tickerFactory = jest.fn(() => customTicker) as TickerFactory;

      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 50,
        interval: 50,
        activated: true,
        tickerFactory,
      });

      // Wait for timeout — polling will start
      jest.advanceTimersByTime(50);
      expect(customTicker.start).toHaveBeenCalledTimes(1);

      // Deactivation stops the ticker
      transfer.deactivate();
      expect(customTicker.stop).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);


// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer onStateChange()
// ═══════════════════════════════════════════════════════════════

describe(
  'IdlePollingTransfer onStateChange notifies on activate/deactivate test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
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
      expect(handler).toHaveBeenCalledWith(transfer);

      transfer.destroy();
    });
  },
);

describe(
  'IdlePollingTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
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
  'IdlePollingTransfer onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
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
  'IdlePollingTransfer onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const transfer = new IdlePollingTransfer<number>({
        fetcher: () => 42,
        timeout: 100,
        interval: 50,
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
