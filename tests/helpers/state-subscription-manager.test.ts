import { StateSubscriptionManager } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager
// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager — a manager for state change subscriptions.
// Reuses ProxyReference and SubscriptionManager.
// The value (usually the owner object itself) is set once in the constructor
// and never becomes undefined, so every notify() is guaranteed
// to notify all subscribers with that value.
//
// Used to implement GateInterface.onStateChange().

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForConstructor(),
] as Array<[string]>)(
  'StateSubscriptionManager constructor initializes with value test',
  (label: string) => {
    it('', () => {
      const value = { label };
      const manager = new StateSubscriptionManager<typeof value>(value);

      // No subscribers after creation — notify() does not throw
      expect(() => manager.notify()).not.toThrow();

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing the constructor.
 */
function dataProviderForConstructor(): Array<unknown> {
  return [
    ['object'],
    ['gate'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager subscribe & notify
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForNotifySingleSubscriber(),
] as Array<[number]>)(
  'StateSubscriptionManager notify calls single subscriber with value test',
  (id: number) => {
    it('', () => {
      const value = { id };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const handler = jest.fn();

      manager.subscribe(handler);
      manager.notify();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing notify() with a single subscriber.
 */
function dataProviderForNotifySingleSubscriber(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForNotifyMultipleSubscribers(),
] as Array<[number]>)(
  'StateSubscriptionManager notify calls all subscribers test',
  (subscriberCount: number) => {
    it('', () => {
      const value = { count: subscriberCount };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const handlers = Array.from({ length: subscriberCount }, () => jest.fn());

      handlers.forEach((handler) => manager.subscribe(handler));
      manager.notify();

      handlers.forEach((handler) => {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(value);
      });

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing notify() with multiple subscribers.
 */
function dataProviderForNotifyMultipleSubscribers(): Array<unknown> {
  return [
    [2],
    [5],
  ];
}

describe.each([
  ...dataProviderForMultipleNotify(),
] as Array<[number]>)(
  'StateSubscriptionManager multiple notify calls subscriber each time test',
  (notifyCount: number) => {
    it('', () => {
      const value = { notifyCount };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const handler = jest.fn();

      manager.subscribe(handler);

      for (let i = 0; i < notifyCount; i++) {
        manager.notify();
      }

      expect(handler).toHaveBeenCalledTimes(notifyCount);
      expect(handler).toHaveBeenCalledWith(value);

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing repeated notify().
 */
function dataProviderForMultipleNotify(): Array<unknown> {
  return [
    [1],
    [3],
    [10],
  ];
}

describe(
  'StateSubscriptionManager notify without subscribers is safe test',
  () => {
    it('', () => {
      const value = { test: true };
      const manager = new StateSubscriptionManager<typeof value>(value);

      expect(() => manager.notify()).not.toThrow();

      manager.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager Unsubscribe
// ═══════════════════════════════════════════════════════════════

describe(
  'StateSubscriptionManager unsubscribe stops notifications test',
  () => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const handler = jest.fn();

      const subscriber = manager.subscribe(handler);

      manager.notify();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();

      manager.notify();
      expect(handler).toHaveBeenCalledTimes(1); // not notified after unsubscription

      manager.destroy();
    });
  },
);

describe.each([
  ...dataProviderForUnsubscribeOneOfMany(),
] as Array<[number]>)(
  'StateSubscriptionManager unsubscribe one subscriber keeps others test',
  (remainingCount: number) => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const handlers = Array.from({ length: remainingCount + 1 }, () => jest.fn());

      const subscribers = handlers.map((handler) => manager.subscribe(handler));

      // Unsubscribe the first
      subscribers[0].unsubscribe();

      manager.notify();

      // First is not notified
      expect(handlers[0]).not.toHaveBeenCalled();

      // Others are notified
      for (let i = 1; i < handlers.length; i++) {
        expect(handlers[i]).toHaveBeenCalledTimes(1);
        expect(handlers[i]).toHaveBeenCalledWith(value);
      }

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing unsubscribing one of many.
 */
function dataProviderForUnsubscribeOneOfMany(): Array<unknown> {
  return [
    [1],
    [3],
  ];
}

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager Subscriber Active State
// ═══════════════════════════════════════════════════════════════

describe(
  'StateSubscriptionManager subscriber is active after subscribe test',
  () => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);

      const subscriber = manager.subscribe(() => {});

      expect(subscriber.active).toBe(true);

      manager.destroy();
    });
  },
);

describe(
  'StateSubscriptionManager subscriber is inactive after unsubscribe test',
  () => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);

      const subscriber = manager.subscribe(() => {});

      subscriber.unsubscribe();

      expect(subscriber.active).toBe(false);

      manager.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDestroy(),
] as Array<[number]>)(
  'StateSubscriptionManager destroy unsubscribes all subscribers test',
  (subscriberCount: number) => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const subscribers = Array.from({ length: subscriberCount }, () =>
        manager.subscribe(() => {}),
      );

      subscribers.forEach((s) => expect(s.active).toBe(true));

      manager.destroy();

      subscribers.forEach((s) => expect(s.active).toBe(false));
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForDestroy(): Array<unknown> {
  return [
    [1],
    [3],
  ];
}

describe(
  'StateSubscriptionManager destroy stops future notifications test',
  () => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const handler = jest.fn();

      manager.subscribe(handler);
      manager.destroy();

      expect(() => manager.notify()).not.toThrow();
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

describe(
  'StateSubscriptionManager multiple destroy calls are safe test',
  () => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);

      expect(() => {
        manager.destroy();
        manager.destroy();
        manager.destroy();
      }).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager Value Identity
// ═══════════════════════════════════════════════════════════════

describe(
  'StateSubscriptionManager always passes the same value reference test',
  () => {
    it('', () => {
      const value = { id: 1, name: 'gate' };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const received: typeof value[] = [];

      manager.subscribe((v) => received.push(v));

      manager.notify();
      manager.notify();
      manager.notify();

      expect(received).toHaveLength(3);
      received.forEach((v) => expect(v).toBe(value));

      manager.destroy();
    });
  },
);

describe(
  'StateSubscriptionManager works with primitive values test',
  () => {
    it('', () => {
      const value = 42;
      const manager = new StateSubscriptionManager<number>(value);
      const handler = jest.fn();

      manager.subscribe(handler);
      manager.notify();

      expect(handler).toHaveBeenCalledWith(42);

      manager.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StateSubscriptionManager Subscribe After Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'StateSubscriptionManager destroy only unsubscribes existing subscribers test',
  () => {
    it('', () => {
      const value = { id: 1 };
      const manager = new StateSubscriptionManager<typeof value>(value);
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      // Subscriber before destroy
      manager.subscribe(handler1);

      manager.destroy();

      // handler1 unsubscribed via destroy
      expect(handler1).not.toHaveBeenCalled();

      // New subscriber after destroy — notify() does not throw
      const subscriber2 = manager.subscribe(handler2);
      expect(subscriber2.active).toBe(true);

      manager.notify();
      // destroy() unsubscribed only existing subscribers,
      // new subscriptions remain active
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledWith(value);
    });
  },
);
