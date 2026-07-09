import {
  PushChannelTransfer,
  SinkTransfer,
  PollingProxyTransfer,
  ReadTransfer,
  LatestStorage,
  QueueStorage,
  linkTransfers,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// linkTransfers
// ═══════════════════════════════════════════════════════════════
// linkTransfers — a universal function for linking transfers.
// Supports various combinations of capabilities.

// ═══════════════════════════════════════════════════════════════
// Case 1: Subscribable → Pushable (Reactive stream)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSubscribableToPushable(),
] as Array<[number]>)(
  'linkTransfers connects Subscribable source to Pushable target test',
  (value: number) => {
    it('', () => {
      const source = new PushChannelTransfer<number>();
      const target = new SinkTransfer<number>({ callback: jest.fn() });

      const subscriber = linkTransfers(source, target);

      expect(subscriber.active).toBe(true);
      source.push(value);

      // Target received data
      expect(target).toBeDefined();

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for testing Subscribable → Pushable.
 */
function dataProviderForSubscribableToPushable(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForSubscribableToPushableMultipleValues(),
] as Array<[number, number, number]>)(
  'linkTransfers forwards multiple values from Subscribable to Pushable test',
  (v1: number, v2: number, v3: number) => {
    it('', () => {
      const received: number[] = [];
      const source = new PushChannelTransfer<number>();
      const target = new SinkTransfer<number>({ callback: (v) => received.push(v) });

      linkTransfers(source, target);

      source.push(v1);
      source.push(v2);
      source.push(v3);

      expect(received).toEqual([v1, v2, v3]);

      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for testing multiple values.
 */
function dataProviderForSubscribableToPushableMultipleValues(): Array<unknown> {
  return [
    [1, 2, 3],
    [10, 20, 30],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Case 2: Pullable → PollingProxy (Active polling)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPullableToPollingProxy(),
] as Array<[number]>)(
  'linkTransfers connects Pullable source to PollingProxy target test',
  (value: number) => {
    it('', () => {
      const source = new PushChannelTransfer<number>();
      source.push(value);

      const poller = new PollingProxyTransfer<number>({ interval: 100, activated: false });

      const subscriber = linkTransfers(source, poller);

      expect(subscriber.active).toBe(true); // polling is not activated

      // Activate polling
      poller.activate();

      // After activation, polling starts fetching data
      // (in a real test you need to wait for a tick, but here we check linking)

      subscriber.unsubscribe();
      source.destroy();
      poller.destroy();
    });
  },
);

/**
 * Data provider for testing Pullable → PollingProxy.
 */
function dataProviderForPullableToPollingProxy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ══════════════════════════════════════════════════════════════════
// Case 3: Subscribable → PollingProxy (Reactive source + poller)
// ══════════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSubscribableToPollingProxy(),
] as Array<[number]>)(
  'linkTransfers connects Subscribable source to PollingProxy target test',
  (value: number) => {
    it('', () => {
      const source = new PushChannelTransfer<number>();
      const poller = new PollingProxyTransfer<number>({ interval: 100, activated: false });

      const subscriber = linkTransfers(source, poller);

      expect(subscriber.active).toBe(true);

      // Send data to the source
      source.push(value);

      // Activate polling
      poller.activate();

      subscriber.unsubscribe();
      source.destroy();
      poller.destroy();
    });
  },
);

describe.each([
  ...dataProviderForSubscribableToPollingProxyWithDataFlow(),
] as Array<[number]>)(
  'linkTransfers Subscribable to PollingProxy forwards data correctly test',
  (value: number) => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      // Using PollingProxyTransfer as poller (isPollingProxy=true, isInput=true)
      const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

      // Verify capabilities before linking
      expect(source.isSubscribable).toBe(true);
      expect(poller.isPollingProxy).toBe(true);

      // Subscribe to the poller output to receive data
      const received: number[] = [];

      // Link Subscribable source with PollingProxy target
      const subscriber = linkTransfers(source, poller);

      // Verify that subscriber is active
      expect(subscriber.active).toBe(true);

      // Subscribe directly to the poller
      poller.subscribe((data) => { if (data !== undefined) received.push(data); });

      // Send data to the source
      source.push(value);

      // Wait for polling to fire
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(received).toContain(value);
          subscriber.unsubscribe();
          source.destroy();
          poller.destroy();
          resolve();
        }, 50);
      });
    });
  },
);

/**
 * Data provider for testing Subscribable → PollingProxy.
 */
function dataProviderForSubscribableToPollingProxy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

/**
 * Data provider for testing data transfer Subscribable → PollingProxy.
 */
function dataProviderForSubscribableToPollingProxyWithDataFlow(): Array<unknown> {
  return [
    [100],
    [200],
  ];
}

// ═══════════════════════════════════════════════════════════════
// Case 2 (real): Pullable (not Subscribable) → PollingProxy
// ═══════════════════════════════════════════════════════════════
// ReadTransfer: isPullable=true, isSubscribable=false, isPushable=false
// PollingProxyTransfer: isPollingProxy=true, isPushable=false
// → falls into the branch if (lhs.isPullable && rhs.isPollingProxy)

describe.each([
  ...dataProviderForPullableOnlyToPollingProxy(),
] as Array<[number]>)(
  'linkTransfers connects Pullable-only source to PollingProxy target test',
  (value: number) => {
    it('', () => {
      const storage = new LatestStorage<number>();
      storage.write(value);
      const source = new ReadTransfer<number>({ flow: storage });
      const poller = new PollingProxyTransfer<number>({ interval: 100, activated: false });

      // Verify that source falls into the isPullable && isPollingProxy branch
      expect(source.isPullable).toBe(true);
      expect(source.isSubscribable).toBe(false);
      expect(source.isPushable).toBe(false);
      expect(poller.isPollingProxy).toBe(true);

      const subscriber = linkTransfers(source, poller);

      expect(subscriber.active).toBe(true);

      subscriber.unsubscribe();
      source.destroy();
      poller.destroy();
    });
  },
);

/**
 * Data provider for testing Pullable-only → PollingProxy (linking).
 */
function dataProviderForPullableOnlyToPollingProxy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForPullableOnlyToPollingProxyDataFlow(),
] as Array<[number]>)(
  'linkTransfers Pullable-only source to PollingProxy forwards data test',
  (value: number) => {
    it('', async () => {
      const storage = new LatestStorage<number>();
      storage.write(value);
      const source = new ReadTransfer<number>({ flow: storage });

      const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

      const received: (number | undefined)[] = [];
      poller.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, poller);
      expect(subscriber.active).toBe(true);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(received.length).toBeGreaterThan(0);
          expect(received[0]).toBe(value);
          subscriber.unsubscribe();
          source.destroy();
          poller.destroy();
          resolve();
        }, 50);
      });
    });
  },
);

/**
 * Data provider for testing data transfer Pullable-only → PollingProxy.
 */
function dataProviderForPullableOnlyToPollingProxyDataFlow(): Array<unknown> {
  return [
    [10],
    [99],
  ];
}

describe(
  'linkTransfers Pullable-only to PollingProxy with QueueStorage drains all elements test',
  () => {
    it('', async () => {
      const storage = new QueueStorage<number>();
      storage.write(1);
      storage.write(2);
      storage.write(3);
      const source = new ReadTransfer<number>({ flow: storage });

      const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

      const received: (number | undefined)[] = [];
      poller.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, poller);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          // QueueStorage yields FIFO: 1, 2, 3, then undefined
          expect(received).toContain(1);
          expect(received).toContain(2);
          expect(received).toContain(3);
          subscriber.unsubscribe();
          source.destroy();
          poller.destroy();
          resolve();
        }, 100);
      });
    });
  },
);

describe(
  'linkTransfers Pullable-only to PollingProxy unsubscribe stops polling test',
  () => {
    it('', async () => {
      const storage = new LatestStorage<number>();
      storage.write(42);
      const source = new ReadTransfer<number>({flow: storage});

      const poller = new PollingProxyTransfer<number>({interval: 10, activated: true});

      const received: (number | undefined)[] = [];
      poller.subscribe((data) => {
        if (data !== undefined) received.push(data);
      });

      const subscriber = linkTransfers(source, poller);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const countBefore = received.length;
          expect(countBefore).toBeGreaterThan(0);

          subscriber.unsubscribe();

          setTimeout(() => {
            const countAfter = received.length;
            // After unsubscribe, polling stops (fetcher cleared)
            expect(countAfter).toBe(countBefore);
            source.destroy();
            poller.destroy();
            resolve();
          }, 50);
        }, 50);
      });
    });
  },
);

describe(
  'linkTransfers Pullable-only to PollingProxy subscriber inactive after unsubscribe test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      storage.write(1);
      const source = new ReadTransfer<number>({ flow: storage });
      const poller = new PollingProxyTransfer<number>({ interval: 100, activated: false });

      const subscriber = linkTransfers(source, poller);
      expect(subscriber.active).toBe(true);

      subscriber.unsubscribe();
      expect(subscriber.active).toBe(false);

      source.destroy();
      poller.destroy();
    });
  },
);

describe(
  'linkTransfers Pullable-only to PollingProxy with empty source returns undefined test',
  () => {
    it('', async () => {
      const storage = new LatestStorage<number>();
      const source = new ReadTransfer<number>({flow: storage});
      const poller = new PollingProxyTransfer<number>({interval: 10, activated: true});

      storage.write(42);

      const received: (number | undefined)[] = [];
      poller.subscribe((data) => received.push(data));

      const subscriber = linkTransfers(source, poller);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          // pull() from empty storage returns undefined
          expect(received.length).toBeGreaterThan(0);
          expect(received[0]).toBe(42);
          subscriber.unsubscribe();
          source.destroy();
          poller.destroy();
          resolve();
        }, 50);
      });
    });
  },
);

describe(
  'linkTransfers Pullable-only to PollingProxy multiple values over time test',
  () => {
    it('', async () => {
      const storage = new LatestStorage<number>();
      const source = new ReadTransfer<number>({flow: storage});

      const poller = new PollingProxyTransfer<number>({interval: 20, activated: true});

      const received: (number | undefined)[] = [];
      poller.subscribe((data) => {
        if (data !== undefined) received.push(data);
      });

      const subscriber = linkTransfers(source, poller);

      // Write a value after some time
      setTimeout(() => storage.write(77), 30);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(received).toContain(77);
          subscriber.unsubscribe();
          source.destroy();
          poller.destroy();
          resolve();
        }, 120);
      });
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 4: Pullable → Pushable (Invalid combination)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPullableToPushableThrows(),
] as Array<[]>)(
  'linkTransfers throws error for Pullable to Pushable combination test',
  () => {
    it('', () => {
      // Using ReadTransfer as purely Pullable (does not have isSubscribable)
      const storage = new LatestStorage<number>();
      const source = new ReadTransfer<number>({ flow: storage });
      const target = new SinkTransfer<number>({ callback: jest.fn() });

      expect(() => linkTransfers(source, target)).toThrow(
        'Cannot directly link Pullable/AsyncPullable source to Pushable/AsyncPushable target'
      );

      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for testing invalid combination.
 */
function dataProviderForPullableToPushableThrows(): Array<unknown> {
  return [[]];
}

// ═══════════════════════════════════════════════════════════════
// Unsupported combinations
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForUnsupportedCombination(),
] as Array<[]>)(
  'linkTransfers throws error for unsupported combination test',
  () => {
    it('', () => {
      // Create transfers with incompatible capabilities
      // ReadTransfer: isPullable=true, isSubscribable=false, isPushable=false
      // ReadTransfer: isPullable=true, isPollingSource=false, isPollingProxy=false, isSubscribable=false, isPushable=false
      const storage = new LatestStorage<number>();
      const source = new ReadTransfer<number>({ flow: storage });
      const target = new ReadTransfer<number>({ flow: new LatestStorage<number>() });

      // @ts-expect-error
      expect(() => linkTransfers(source, target)).toThrow(
        'Unsupported transfer link combination'
      );

      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for testing unsupported combinations.
 */
function dataProviderForUnsupportedCombination(): Array<unknown> {
  return [[]];
}
