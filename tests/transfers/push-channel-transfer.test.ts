import { PushChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PushChannelTransfer
// ═══════════════════════════════════════════════════════════════
// PushChannelTransfer — a reactive channel with automatic emission
// to subscribers on push(). Data is not retained after emission.

// ═══════════════════════════════════════════════════════════════
// PushChannelTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'PushChannelTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new PushChannelTransfer<unknown>();

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
// PushChannelTransfer Push & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushChannelPushNotify(),
] as Array<[number]>)(
  'PushChannelTransfer push notifies subscribers immediately test',
  (value: number) => {
    it('', () => {
      const transfer = new PushChannelTransfer<number>();
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
 * Data provider for testing subscriber notification.
 */
function dataProviderForPushChannelPushNotify(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe.each([
  ...dataProviderForPushChannelMultipleSubscribers(),
] as Array<[number]>)(
  'PushChannelTransfer push notifies all subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new PushChannelTransfer<number>();
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
    });
  },
);

/**
 * Data provider for testing multiple subscribers.
 */
function dataProviderForPushChannelMultipleSubscribers(): Array<unknown> {
  return [
    [1],
    [100],
  ];
}

describe.each([
  ...dataProviderForPushChannelStateCleared(),
] as Array<[number, number]>)(
  'PushChannelTransfer clears state after push test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new PushChannelTransfer<number>();
      const received: number[] = [];

      transfer.subscribe((v) => {
        if (v !== undefined) {
          received.push(v);
        }
      });

      transfer.push(value1);
      // After push(), state is cleared, so subscription will not fire again
      transfer.push(value2);

      expect(received).toEqual([value1, value2]);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing state clearing.
 */
function dataProviderForPushChannelStateCleared(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PushChannelTransfer Unsubscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushChannelUnsubscribe(),
] as Array<[number, number]>)(
  'PushChannelTransfer unsubscribe stops notifications test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new PushChannelTransfer<number>();
      const handler = jest.fn();

      const subscriber = transfer.subscribe(handler);
      transfer.push(value1);
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      transfer.push(value2);
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing unsubscription.
 */
function dataProviderForPushChannelUnsubscribe(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PushChannelTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushChannelDestroy(),
] as Array<[number]>)(
  'PushChannelTransfer destroy cleans up test',
  (value: number) => {
    it('', () => {
      const transfer = new PushChannelTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      // After destroy(), subscription should not work
      expect(() => transfer.push(value)).not.toThrow();
      expect(handler).not.toHaveBeenCalled();

      // Repeated destroy() should not cause errors
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForPushChannelDestroy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'PushChannelTransfer destroy unsubscribes all subscribers test',
  () => {
    it('', () => {
      const transfer = new PushChannelTransfer<number>();
      const handler = jest.fn();

      const subscriber = transfer.subscribe(handler);
      transfer.destroy();

      expect(subscriber.active).toBe(false);

      // Subscriber is no longer active
      expect(() => subscriber.unsubscribe()).toThrow('Subscriber is already unsubscribed');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PushChannelTransfer Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'PushChannelTransfer does not notify on undefined value test',
  () => {
    it('', () => {
      const transfer = new PushChannelTransfer<number | undefined>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(undefined);

      // SubscriptionManager.sendState() ignores undefined
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'PushChannelTransfer handles null value test',
  () => {
    it('', () => {
      const transfer = new PushChannelTransfer<null>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(null);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(null);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForPushChannelObject(),
] as Array<[{ id: number; name: string }]>)(
  'PushChannelTransfer handles object value test',
  (value: { id: number; name: string }) => {
    it('', () => {
      const transfer = new PushChannelTransfer<{ id: number; name: string }>();
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
 * Data provider for testing objects.
 */
function dataProviderForPushChannelObject(): Array<unknown> {
  return [
    [{ id: 1, name: 'test' }],
    [{ id: 42, name: 'answer' }],
  ];
}
