import { ThrottleTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer
// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer — a reactive channel with throttled emission to subscribers.
// The first push() passes immediately (leading edge), subsequent ones within
// the interval are ignored, but the last value is emitted after the interval (trailing).

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Constructor & Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'ThrottleTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new ThrottleTransfer<unknown>({ interval: 100 });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Leading Edge (immediate emission)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForThrottleLeading(),
] as Array<[number, number]>)(
  'ThrottleTransfer push emits immediately on leading edge test',
  (value: number, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      // Leading edge — immediate emission
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing leading edge.
 */
function dataProviderForThrottleLeading(): Array<unknown> {
  return [
    [0, 50],
    [1, 100],
    [42, 200],
    [-5, 10],
  ];
}

describe.each([
  ...dataProviderForThrottleMultipleSubscribers(),
] as Array<[number, number]>)(
  'ThrottleTransfer leading edge notifies all subscribers test',
  (value: number, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval });
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      transfer.subscribe(handler3);

      transfer.push(value);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(value);
      expect(handler2).toHaveBeenCalledWith(value);
      expect(handler3).toHaveBeenCalledWith(value);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing multiple subscribers.
 */
function dataProviderForThrottleMultipleSubscribers(): Array<unknown> {
  return [
    [1, 100],
    [100, 50],
  ];
}

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Throttle Window (ignores within interval)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForThrottleWindow(),
] as Array<[number, number, number]>)(
  'ThrottleTransfer ignores pushes within interval window test',
  (value1: number, value2: number, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value1);

      // Leading edge — first emission
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value1);

      // Push within the window — not emitted (saved as pending)
      transfer.push(value2);
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing throttle window.
 */
function dataProviderForThrottleWindow(): Array<unknown> {
  return [
    [1, 2, 100],
    [10, 20, 50],
    [100, 200, 200],
  ];
}

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Trailing Edge (emits pending after interval)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForThrottleTrailing(),
] as Array<[number, number, number]>)(
  'ThrottleTransfer emits pending value on trailing edge test',
  (value1: number, value2: number, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value1);

      // Leading edge
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value1);

      // Push within the window
      transfer.push(value2);
      expect(handler).toHaveBeenCalledTimes(1);

      // Wait for interval — trailing edge emits pending
      jest.advanceTimersByTime(interval);
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(2, value2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing trailing edge.
 */
function dataProviderForThrottleTrailing(): Array<unknown> {
  return [
    [1, 2, 100],
    [10, 20, 50],
    [100, 200, 200],
  ];
}

describe(
  'ThrottleTransfer no trailing emission when no pending value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);

      // Leading edge
      expect(handler).toHaveBeenCalledTimes(1);

      // Wait for interval — no pending, no trailing
      jest.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'ThrottleTransfer trailing edge starts new window test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval: 100 });
      const received: number[] = [];

      transfer.subscribe((v) => {
        if (v !== undefined) {
          received.push(v);
        }
      });

      // Leading edge
      transfer.push(1);
      expect(received).toEqual([1]);

      // Pending
      jest.advanceTimersByTime(50);
      transfer.push(2);

      // Trailing edge — emits 2, starts new window
      jest.advanceTimersByTime(50);
      expect(received).toEqual([1, 2]);

      // Wait for full interval — window closes without pending
      jest.advanceTimersByTime(100);

      // New leading edge
      transfer.push(3);
      expect(received).toEqual([1, 2, 3]);

      // Pending in the new window
      transfer.push(4);

      // Trailing edge of the new window
      jest.advanceTimersByTime(100);
      expect(received).toEqual([1, 2, 3, 4]);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Multiple Rapid Pushes
// ═══════════════════════════════════════════════════════════════

describe(
  'ThrottleTransfer multiple rapid pushes emit leading and trailing only test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval: 100 });
      const received: number[] = [];

      transfer.subscribe((v) => {
        if (v !== undefined) {
          received.push(v);
        }
      });

      // Leading
      transfer.push(1);
      jest.advanceTimersByTime(20);
      transfer.push(2);
      jest.advanceTimersByTime(20);
      transfer.push(3);
      jest.advanceTimersByTime(20);
      transfer.push(4);
      jest.advanceTimersByTime(20);
      transfer.push(5);

      expect(received).toEqual([1]);

      // Trailing — only the last pending value
      jest.advanceTimersByTime(20);
      expect(received).toEqual([1, 5]);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer State Cleared After Notification
// ═══════════════════════════════════════════════════════════════

describe(
  'ThrottleTransfer clears state after leading edge notification test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(1);

      // After the interval, a new push works as leading
      handler.mockClear();
      jest.advanceTimersByTime(100);
      transfer.push(2);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Unsubscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForThrottleUnsubscribe(),
] as Array<[number, number, number]>)(
  'ThrottleTransfer unsubscribe stops notifications test',
  (value1: number, value2: number, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval });
      const handler = jest.fn();

      const subscriber = transfer.subscribe(handler);
      transfer.push(value1);
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      transfer.push(value2);
      jest.advanceTimersByTime(interval);
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing unsubscription.
 */
function dataProviderForThrottleUnsubscribe(): Array<unknown> {
  return [
    [1, 2, 100],
    [10, 20, 50],
  ];
}

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForThrottleDestroy(),
] as Array<[number, number]>)(
  'ThrottleTransfer destroy cancels pending timer test',
  (value: number, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number>({ interval });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);
      expect(handler).toHaveBeenCalledTimes(1);

      // Push within the window (pending)
      transfer.push(999);
      transfer.destroy();

      // Trailing should not fire
      jest.advanceTimersByTime(interval);
      expect(handler).toHaveBeenCalledTimes(1);

      // Repeated destroy() should not cause errors
      expect(() => transfer.destroy()).not.toThrow();

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForThrottleDestroy(): Array<unknown> {
  return [
    [1, 100],
    [42, 50],
  ];
}

describe(
  'ThrottleTransfer destroy unsubscribes all subscribers test',
  () => {
    it('', () => {
      const transfer = new ThrottleTransfer<number>({ interval: 100 });
      const handler = jest.fn();

      const subscriber = transfer.subscribe(handler);
      transfer.destroy();

      expect(subscriber.active).toBe(false);
      expect(() => subscriber.unsubscribe()).toThrow('Subscriber is already unsubscribed');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'ThrottleTransfer does not notify on undefined value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<number | undefined>({ interval: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(undefined);

      // SubscriptionManager.sendState() ignores undefined
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'ThrottleTransfer handles null value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<null>({ interval: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(null);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(null);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe.each([
  ...dataProviderForThrottleObject(),
] as Array<[{ id: number; name: string }, number]>)(
  'ThrottleTransfer handles object value test',
  (value: { id: number; name: string }, interval: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new ThrottleTransfer<{ id: number; name: string }>({ interval });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing objects.
 */
function dataProviderForThrottleObject(): Array<unknown> {
  return [
    [{ id: 1, name: 'test' }, 100],
    [{ id: 42, name: 'answer' }, 50],
  ];
}
