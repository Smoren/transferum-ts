import type { SubscriberInterface } from "../../src";
import { Subscriber, DisposableSubscriberAdapter, SubscriptionManager, ProxyReference } from '../../src';

import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// Subscriber
// ═══════════════════════════════════════════════════════════════
// Subscriber — a wrapper over the unsubscribe function.
// Provides a unified interface for managing subscriptions.
//
// Key features:
// - Stores the active state (active)
// - Provides an unsubscribe() method for unsubscription
// - Guarantees a single unsubscribe call (idempotency)
// - Delegates the call to the external unsubscribe function

// ═══════════════════════════════════════════════════════════════
// Subscriber Constructor & Active State
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForConstructorActive(),
] as Array<[]>)(
  'Subscriber constructor initializes as active test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      // After creation, the subscriber is active
      expect(subscriber.active).toBe(true);
    });
  },
);

/**
 * Data provider for testing initial state.
 * Subscriber is always created active.
 */
function dataProviderForConstructorActive(): Array<unknown> {
  return [
    [],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Subscriber Unsubscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForUnsubscribe(),
] as Array<[]>)(
  'Subscriber unsubscribe calls the provided callback test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      subscriber.unsubscribe();

      // Unsubscribe function called exactly once
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  },
);

/**
 * Data provider for testing unsubscribe callback invocation.
 * Verifies that the passed unsubscribe function is called.
 */
function dataProviderForUnsubscribe(): Array<unknown> {
  return [
    [],
  ];
}

describe.each([
  ...dataProviderForUnsubscribeSetsInactive(),
] as Array<[]>)(
  'Subscriber unsubscribe sets active to false test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      // Active before unsubscribe
      expect(subscriber.active).toBe(true);

      subscriber.unsubscribe();

      // Not active after unsubscribe
      expect(subscriber.active).toBe(false);
    });
  },
);

/**
 * Data provider for testing state after unsubscribe.
 * Verifies that active becomes false after unsubscribe().
 */
function dataProviderForUnsubscribeSetsInactive(): Array<unknown> {
  return [
    [],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Subscriber Idempotency
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForMultipleUnsubscribe(),
] as Array<[number]>)(
  'Subscriber multiple unsubscribe calls callback only once test',
  (callCount: number) => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      subscriber.unsubscribe();

      // Multiple unsubscribe() calls
      for (let i = 0; i < callCount; i++) {
        expect(() => subscriber.unsubscribe()).toThrow('Subscriber is already unsubscribed');
      }

      // Callback called only once (idempotency)
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  },
);

/**
 * Data provider for testing unsubscribe() idempotency.
 * Verifies that repeated calls do not invoke the callback again.
 */
function dataProviderForMultipleUnsubscribe(): Array<unknown> {
  return [
    [2],  // Two calls
    [5],  // Five calls
    [10], // Ten calls
  ];
}

describe.each([
  ...dataProviderForActiveAfterMultipleUnsubscribe(),
] as Array<[number]>)(
  'Subscriber remains inactive after multiple unsubscribe calls test',
  (callCount: number) => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      subscriber.unsubscribe();

      // Multiple unsubscribe() calls
      for (let i = 0; i < callCount; i++) {
        expect(() => subscriber.unsubscribe()).toThrow('Subscriber is already unsubscribed');
      }

      // Remains inactive
      expect(subscriber.active).toBe(false);
    });
  },
);

/**
 * Data provider for testing state after multiple unsubscribes.
 * Verifies that active remains false after repeated calls.
 */
function dataProviderForActiveAfterMultipleUnsubscribe(): Array<unknown> {
  return [
    [2],
    [5],
    [10],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Subscriber Edge Cases
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForEmptyCallback(),
] as Array<[]>)(
  'Subscriber works with no-op callback test',
  () => {
    it('', () => {
      const noop = () => {};
      const subscriber = new Subscriber(noop);

      // Unsubscribe does not cause errors
      expect(() => subscriber.unsubscribe()).not.toThrow();
      expect(subscriber.active).toBe(false);
    });
  },
);

/**
 * Data provider for testing with empty callback.
 * Verifies that Subscriber works with a no-op function.
 */
function dataProviderForEmptyCallback(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForThrowingCallback(),
] as Array<[string]>)(
  'Subscriber propagates errors from callback test',
  (errorMessage: string) => {
    it('', () => {
      const throwingCallback = () => {
        throw new Error(errorMessage);
      };
      const subscriber = new Subscriber(throwingCallback);

      // Error from callback is rethrown
      expect(() => subscriber.unsubscribe()).toThrow(errorMessage);
    });
  },
);

/**
 * Data provider for testing error rethrowing.
 * Verifies that errors from callback are not swallowed.
 */
function dataProviderForThrowingCallback(): Array<unknown> {
  return [
    ['Test error'],
    ['Unsubscribe failed'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// DisposableSubscriberAdapter
// ═══════════════════════════════════════════════════════════════
// DisposableSubscriberAdapter — an adapter from SubscriberInterface → DisposableInterface.
// Allows using Subscriber in a context where Disposable is expected.
//
// Key feature:
// - destroy() delegates the call to subscriber.unsubscribe()

describe.each([
  ...dataProviderForAdapterDestroy(),
] as Array<[]>)(
  'DisposableSubscriberAdapter destroy calls unsubscribe test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);
      const adapter = new DisposableSubscriberAdapter(subscriber);

      adapter.destroy();

      // Adapter delegates the unsubscribe() call
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  },
);

/**
 * Data provider for testing the adapter.
 * Verifies that destroy() calls unsubscribe() on Subscriber.
 */
function dataProviderForAdapterDestroy(): Array<unknown> {
  return [
    [],
  ];
}

describe.each([
  ...dataProviderForAdapterActiveState(),
] as Array<[]>)(
  'DisposableSubscriberAdapter does not expose active state test',
  () => {
    it('', () => {
      const subscriber = new Subscriber(() => {});
      const adapter = new DisposableSubscriberAdapter(subscriber);

      // Before destroy(), Subscriber is active
      expect(subscriber.active).toBe(true);

      adapter.destroy();

      // After destroy(), Subscriber is not active
      expect(subscriber.active).toBe(false);
    });
  },
);

/**
 * Data provider for testing Subscriber state via the adapter.
 * Verifies that the adapter correctly changes the Subscriber state.
 */
function dataProviderForAdapterActiveState(): Array<unknown> {
  return [
    [],
  ];
}

describe.each([
  ...dataProviderForAdapterMultipleDestroy(),
] as Array<[number]>)(
  'DisposableSubscriberAdapter multiple destroy calls are idempotent test',
  (callCount: number) => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);
      const adapter = new DisposableSubscriberAdapter(subscriber);

      adapter.destroy();

      // Multiple destroy() calls
      for (let i = 0; i < callCount; i++) {
        expect(() => adapter.destroy()).toThrow('Subscriber is already unsubscribed');
      }

      // unsubscribe() called only once (via Subscriber)
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  },
);

/**
 * Data provider for testing adapter idempotency.
 * Verifies that multiple destroy() calls are safe.
 */
function dataProviderForAdapterMultipleDestroy(): Array<unknown> {
  return [
    [2],
    [5],
    [10],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Subscriber onUnsubscribe / offUnsubscribe
// ═══════════════════════════════════════════════════════════════
// Subscriber.onUnsubscribe() — registers a callback that is called
// on unsubscribe(). Allows reacting to unsubscription.

describe.each([
  ...dataProviderForOnUnsubscribe(),
] as Array<[]>)(
  'Subscriber onUnsubscribe registers a handler test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const handler = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      subscriber.onUnsubscribe(handler);
      subscriber.unsubscribe();

      // Handler is called on unsubscribe()
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(subscriber);
    });
  },
);

/**
 * Data provider for testing onUnsubscribe.
 */
function dataProviderForOnUnsubscribe(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForOnUnsubscribeMultipleHandlers(),
] as Array<[number]>)(
  'Subscriber onUnsubscribe calls all registered handlers test',
  (handlerCount: number) => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const handlers = Array.from({ length: handlerCount }, () => jest.fn());
      const subscriber = new Subscriber(unsubscribeMock);

      handlers.forEach((handler) => subscriber.onUnsubscribe(handler));
      subscriber.unsubscribe();

      // All handlers called
      handlers.forEach((handler) => {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(subscriber);
      });
    });
  },
);

/**
 * Data provider for testing multiple handlers.
 */
function dataProviderForOnUnsubscribeMultipleHandlers(): Array<unknown> {
  return [
    [2],
    [3],
    [5],
  ];
}

describe.each([
  ...dataProviderForOffUnsubscribe(),
] as Array<[]>)(
  'Subscriber offUnsubscribe removes a handler test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const handler = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      subscriber.onUnsubscribe(handler);
      subscriber.offUnsubscribe(handler);
      subscriber.unsubscribe();

      // Handler not called, because it was removed
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

/**
 * Data provider for testing offUnsubscribe.
 */
function dataProviderForOffUnsubscribe(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForOnUnsubscribeAfterOff(),
] as Array<[]>)(
  'Subscriber offUnsubscribe prevents handler from being called test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);

      subscriber.onUnsubscribe(handler1);
      subscriber.onUnsubscribe(handler2);
      subscriber.offUnsubscribe(handler1);
      subscriber.unsubscribe();

      // Only handler2 called
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  },
);

/**
 * Data provider for testing offUnsubscribe with multiple handlers.
 */
function dataProviderForOnUnsubscribeAfterOff(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForOnUnsubscribeHandlerReceivesSubscriber(),
] as Array<[]>)(
  'Subscriber onUnsubscribe handler receives the subscriber instance test',
  () => {
    it('', () => {
      const unsubscribeMock = jest.fn();
      const subscriber = new Subscriber(unsubscribeMock);
      let receivedSubscriber: SubscriberInterface | null = null;

      subscriber.onUnsubscribe((sub) => {
        receivedSubscriber = sub;
      });

      subscriber.unsubscribe();

      // Handler received the same subscriber
      expect(receivedSubscriber).toBe(subscriber);
    });
  },
);

/**
 * Data provider for testing passing subscriber to handler.
 */
function dataProviderForOnUnsubscribeHandlerReceivesSubscriber(): Array<unknown> {
  return [[]];
}

// ═══════════════════════════════════════════════════════════════
// SubscriptionManager
// ═══════════════════════════════════════════════════════════════
// SubscriptionManager — manages subscriptions to ProxyReference state.
// Provides subscribe(), sendState(), and destroy() methods.

describe.each([
  ...dataProviderForSubscriptionManagerSubscribe(),
] as Array<[]>)(
  'SubscriptionManager subscribe adds a listener test',
  () => {
    it('', () => {
      const ref = new ProxyReference<number>(42);
      const manager = new SubscriptionManager(ref);
      const handler = jest.fn();

      const subscriber = manager.subscribe(handler);

      expect(subscriber.active).toBe(true);

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing subscribe.
 */
function dataProviderForSubscriptionManagerSubscribe(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForSubscriptionManagerSendState(),
] as Array<[number]>)(
  'SubscriptionManager sendState notifies all listeners test',
  (value: number) => {
    it('', () => {
      const ref = new ProxyReference<number>(value);
      const manager = new SubscriptionManager(ref);
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      manager.subscribe(handler1);
      manager.subscribe(handler2);

      manager.sendState();

      expect(handler1).toHaveBeenCalledWith(value);
      expect(handler2).toHaveBeenCalledWith(value);

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing sendState.
 */
function dataProviderForSubscriptionManagerSendState(): Array<unknown> {
  return [
    [1],
    [42],
    [100],
  ];
}

describe.each([
  ...dataProviderForSubscriptionManagerSendStateUndefined(),
] as Array<[]>)(
  'SubscriptionManager sendState returns false when value is undefined test',
  () => {
    it('', () => {
      const ref = new ProxyReference<number>(undefined);
      const manager = new SubscriptionManager(ref);
      const handler = jest.fn();

      manager.subscribe(handler);

      const result = manager.sendState();

      expect(result).toBe(false);
      expect(handler).not.toHaveBeenCalled();

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing sendState with undefined.
 */
function dataProviderForSubscriptionManagerSendStateUndefined(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForSubscriptionManagerSendStateNoListeners(),
] as Array<[]>)(
  'SubscriptionManager sendState returns false when no listeners test',
  () => {
    it('', () => {
      const ref = new ProxyReference<number>(42);
      const manager = new SubscriptionManager(ref);

      const result = manager.sendState();

      expect(result).toBe(false);

      manager.destroy();
    });
  },
);

/**
 * Data provider for testing sendState without listeners.
 */
function dataProviderForSubscriptionManagerSendStateNoListeners(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForSubscriptionManagerDestroy(),
] as Array<[]>)(
  'SubscriptionManager destroy unsubscribes all subscribers test',
  () => {
    it('', () => {
      const ref = new ProxyReference<number>(42);
      const manager = new SubscriptionManager(ref);
      const subscriber1 = manager.subscribe(() => {});
      const subscriber2 = manager.subscribe(() => {});

      expect(subscriber1.active).toBe(true);
      expect(subscriber2.active).toBe(true);

      manager.destroy();

      expect(subscriber1.active).toBe(false);
      expect(subscriber2.active).toBe(false);
    });
  },
);

/**
 * Data provider for testing destroy.
 */
function dataProviderForSubscriptionManagerDestroy(): Array<unknown> {
  return [[]];
}

// ═══════════════════════════════════════════════════════════════
// ProxyReference
// ═══════════════════════════════════════════════════════════════
// ProxyReference — a wrapper over a value with clear() and pop() methods.

describe.each([
  ...dataProviderForProxyReferenceInitialValue(),
] as Array<[number | undefined]>)(
  'ProxyReference initializes with given value test',
  (initialValue: number | undefined) => {
    it('', () => {
      const ref = new ProxyReference<number>(initialValue);

      expect(ref.value).toBe(initialValue);
    });
  },
);

/**
 * Data provider for testing initial value.
 */
function dataProviderForProxyReferenceInitialValue(): Array<unknown> {
  return [
    [1],
    [undefined],
    [0],
    [42],
  ];
}

describe.each([
  ...dataProviderForProxyReferenceClear(),
] as Array<[]>)(
  'ProxyReference clear sets value to undefined test',
  () => {
    it('', () => {
      const ref = new ProxyReference<number>(42);

      ref.clear();

      expect(ref.value).toBe(undefined);
    });
  },
);

/**
 * Data provider for testing clear().
 */
function dataProviderForProxyReferenceClear(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForProxyReferencePop(),
] as Array<[number]>)(
  'ProxyReference pop returns value and clears it test',
  (value: number) => {
    it('', () => {
      const ref = new ProxyReference<number>(value);

      const popped = ref.pop();

      expect(popped).toBe(value);
      expect(ref.value).toBe(undefined);
    });
  },
);

/**
 * Data provider for testing pop().
 */
function dataProviderForProxyReferencePop(): Array<unknown> {
  return [
    [1],
    [42],
    [0],
  ];
}

describe.each([
  ...dataProviderForProxyReferencePopUndefined(),
] as Array<[]>)(
  'ProxyReference pop returns undefined when value is undefined test',
  () => {
    it('', () => {
      const ref = new ProxyReference<number>(undefined);

      const popped = ref.pop();

      expect(popped).toBe(undefined);
      expect(ref.value).toBe(undefined);
    });
  },
);

/**
 * Data provider for testing pop() with undefined.
 */
function dataProviderForProxyReferencePopUndefined(): Array<unknown> {
  return [[]];
}
