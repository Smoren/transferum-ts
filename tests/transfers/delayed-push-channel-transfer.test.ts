import { DelayedPushChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer
// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer — reactive channel with delayed delivery
// to subscribers on push(). Each push() schedules its own timer;
// when it fires, the data is delivered to subscribers.

// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer Constructor & Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'DelayedPushChannelTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new DelayedPushChannelTransfer<unknown>({ delay: 100 });

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
// DelayedPushChannelTransfer Push & Subscribe (delayed notification)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDelayedPushNotify(),
] as Array<[number, number]>)(
  'DelayedPushChannelTransfer push notifies subscribers after delay test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number>({ delay });
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
 * Data provider for testing delayed notification.
 */
function dataProviderForDelayedPushNotify(): Array<unknown> {
  return [
    [0, 50],
    [1, 100],
    [42, 200],
    [-5, 10],
  ];
}

describe.each([
  ...dataProviderForDelayedMultipleSubscribers(),
] as Array<[number, number]>)(
  'DelayedPushChannelTransfer push notifies all subscribers after delay test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number>({ delay });
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
function dataProviderForDelayedMultipleSubscribers(): Array<unknown> {
  return [
    [1, 100],
    [100, 50],
  ];
}

// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer Multiple Pushes (independent timers)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDelayedMultiplePushes(),
] as Array<[number, number, number]>)(
  'DelayedPushChannelTransfer multiple pushes produce independent notifications test',
  (value1: number, value2: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number>({ delay });
      const received: number[] = [];

      transfer.subscribe((v) => {
        if (v !== undefined) {
          received.push(v);
        }
      });

      transfer.push(value1);
      transfer.push(value2);
      jest.advanceTimersByTime(delay);

      expect(received).toEqual([value1, value2]);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

/**
 * Data provider for testing multiple push().
 */
function dataProviderForDelayedMultiplePushes(): Array<unknown> {
  return [
    [1, 2, 100],
    [10, 20, 50],
  ];
}

describe(
  'DelayedPushChannelTransfer pushes at different times produce separate notifications test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number>({ delay: 100 });
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

      // 50 ms after first push — first timer fired (100 ms)
      expect(received).toEqual([1]);

      jest.advanceTimersByTime(50);

      // 50 ms after second push — second timer fired (100 ms)
      expect(received).toEqual([1, 2]);

      transfer.destroy();
      jest.useRealTimers();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer State Cleared After Notification
// ═══════════════════════════════════════════════════════════════

describe(
  'DelayedPushChannelTransfer clears state after delayed notification test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number>({ delay: 100 });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);
      jest.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(1);

      // State cleared after delivery — repeated trigger will not emit
      // (this transfer has no trigger(), but _state is cleared)
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
// DelayedPushChannelTransfer Unsubscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDelayedUnsubscribe(),
] as Array<[number, number, number]>)(
  'DelayedPushChannelTransfer unsubscribe stops delayed notifications test',
  (value1: number, value2: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number>({ delay });
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
function dataProviderForDelayedUnsubscribe(): Array<unknown> {
  return [
    [1, 2, 100],
    [10, 20, 50],
  ];
}

// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDelayedDestroy(),
] as Array<[number, number]>)(
  'DelayedPushChannelTransfer destroy cancels pending timers test',
  (value: number, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number>({ delay });
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
function dataProviderForDelayedDestroy(): Array<unknown> {
  return [
    [1, 100],
    [42, 50],
  ];
}

describe(
  'DelayedPushChannelTransfer destroy unsubscribes all subscribers test',
  () => {
    it('', () => {
      const transfer = new DelayedPushChannelTransfer<number>({ delay: 100 });
      const handler = jest.fn();

      const subscriber = transfer.subscribe(handler);
      transfer.destroy();

      expect(subscriber.active).toBe(false);
      expect(() => subscriber.unsubscribe()).toThrow('Subscriber is already unsubscribed');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'DelayedPushChannelTransfer does not notify on undefined value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<number | undefined>({ delay: 100 });
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
  'DelayedPushChannelTransfer handles null value test',
  () => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<null>({ delay: 100 });
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
  ...dataProviderForDelayedObject(),
] as Array<[{ id: number; name: string }, number]>)(
  'DelayedPushChannelTransfer handles object value test',
  (value: { id: number; name: string }, delay: number) => {
    it('', () => {
      jest.useFakeTimers();

      const transfer = new DelayedPushChannelTransfer<{ id: number; name: string }>({ delay });
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
function dataProviderForDelayedObject(): Array<unknown> {
  return [
    [{ id: 1, name: 'test' }, 100],
    [{ id: 42, name: 'answer' }, 50],
  ];
}
