import { DebounceTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer
// ═══════════════════════════════════════════════════════════════
// DebounceTransfer — reactive channel with debounced delivery to subscribers.
// Each push() resets the previous timer; subscribers are notified
// only after delay ms of silence following the last push().

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer Constructor & Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'DebounceTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new DebounceTransfer<unknown>({ delay: 100 });

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
// DebounceTransfer Push & Subscribe (debounced notification)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDebounceNotify(),
] as Array<[number, number]>)(
  'DebounceTransfer push notifies subscribers after delay test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number>({ delay });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      // Before the delay elapses, the subscriber is not called
      expect(handler).not.toHaveBeenCalled();

      jest.advanceTimersByTime(delay - 1);
      expect(handler).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing debounced notification.
 */
function dataProviderForDebounceNotify(): Array<unknown> {
  return [
    [0, 50],
    [1, 100],
    [42, 200],
    [-5, 10],
  ];
}

describe.each([
  ...dataProviderForDebounceMultipleSubscribers(),
] as Array<[number, number]>)(
  'DebounceTransfer push notifies all subscribers after delay test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number>({ delay });
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      transfer.subscribe(handler3);

      transfer.push(value);
      jest.advanceTimersByTime(delay);

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
function dataProviderForDebounceMultipleSubscribers(): Array<unknown> {
  return [
    [1, 100],
    [100, 50],
  ];
}

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer Reset on New Push (core debounce behavior)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDebounceReset(),
] as Array<[number, number, number]>)(
  'DebounceTransfer resets timer on new push and emits only last value test',
  (value1: number, value2: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number>({ delay });
      const handler = jest.fn();

      transfer.subscribe(handler);

      transfer.push(value1);
      jest.advanceTimersByTime(delay / 2);

      // Timer reset by new push
      transfer.push(value2);
      jest.advanceTimersByTime(delay / 2);

      // delay/2 + delay/2 = delay elapsed, but the timer was reset
      expect(handler).not.toHaveBeenCalled();

      jest.advanceTimersByTime(delay / 2);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing timer reset.
 */
function dataProviderForDebounceReset(): Array<unknown> {
  return [
    [1, 2, 100],
    [10, 20, 50],
    [100, 200, 200],
  ];
}

describe(
  'DebounceTransfer multiple rapid pushes emit only last value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number>({ delay: 100 });
      const received: number[] = [];

      transfer.subscribe((v) => {
        if (v !== undefined) {
          received.push(v);
        }
      });

      transfer.push(1);
      jest.advanceTimersByTime(50);
      transfer.push(2);
      jest.advanceTimersByTime(50);
      transfer.push(3);
      jest.advanceTimersByTime(50);
      transfer.push(4);
      jest.advanceTimersByTime(50);

      // Every 50 ms a new push reset the timer — no emission
      expect(received).toEqual([]);

      // Waiting the full delay after the last push
      jest.advanceTimersByTime(50);
      expect(received).toEqual([4]);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer State Cleared After Notification
// ═══════════════════════════════════════════════════════════════

describe(
  'DebounceTransfer clears state after debounced notification test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number>({ delay: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);
      jest.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(1);

      // New push after emission works normally
      handler.mockClear();
      transfer.push(2);
      jest.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(2);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer Unsubscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDebounceUnsubscribe(),
] as Array<[number, number, number]>)(
  'DebounceTransfer unsubscribe stops debounced notifications test',
  (value1: number, value2: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number>({ delay });
      const handler = jest.fn();

      const subscriber = transfer.subscribe(handler);
      transfer.push(value1);
      jest.advanceTimersByTime(delay);
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      transfer.push(value2);
      jest.advanceTimersByTime(delay);
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing unsubscribe.
 */
function dataProviderForDebounceUnsubscribe(): Array<unknown> {
  return [
    [1, 2, 100],
    [10, 20, 50],
  ];
}

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDebounceDestroy(),
] as Array<[number, number]>)(
  'DebounceTransfer destroy cancels pending timer test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number>({ delay });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);
      transfer.destroy();

      // Timer cancelled — subscriber not called
      jest.advanceTimersByTime(delay);
      expect(handler).not.toHaveBeenCalled();

      // Repeated destroy() should not throw
      expect(() => transfer.destroy()).not.toThrow();

      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForDebounceDestroy(): Array<unknown> {
  return [
    [1, 100],
    [42, 50],
  ];
}

describe(
  'DebounceTransfer destroy unsubscribes all subscribers test',
  () => {
    it('', () => {
      const transfer = new DebounceTransfer<number>({ delay: 100 });
      const handler = jest.fn();

      const subscriber = transfer.subscribe(handler);
      transfer.destroy();

      expect(subscriber.active).toBe(false);
      expect(() => subscriber.unsubscribe()).toThrow('Subscriber is already unsubscribed');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'DebounceTransfer does not notify on undefined value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<number | undefined>({ delay: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(undefined);
      jest.advanceTimersByTime(100);

      // SubscriptionManager.sendState() ignores undefined
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe(
  'DebounceTransfer handles null value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<null>({ delay: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(null);
      jest.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(null);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

describe.each([
  ...dataProviderForDebounceObject(),
] as Array<[{ id: number; name: string }, number]>)(
  'DebounceTransfer handles object value test',
  (value: { id: number; name: string }, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DebounceTransfer<{ id: number; name: string }>({ delay });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);
      jest.advanceTimersByTime(delay);

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
function dataProviderForDebounceObject(): Array<unknown> {
  return [
    [{ id: 1, name: 'test' }, 100],
    [{ id: 42, name: 'answer' }, 50],
  ];
}
