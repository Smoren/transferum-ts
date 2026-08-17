import { describe, expect, it, jest } from '@jest/globals';
import {
  DefaultLinkStrategy,
  PushChannelTransfer,
  PushStoredChannelTransfer,
  SinkTransfer,
  PollingProxyTransfer,
  ReadTransfer,
  GateTransfer,
  LatestStorage,
  AsyncSinkTransfer,
  AsyncReadTransfer,
  AsyncPollingProxyTransfer,
  CompositeTransferBuilder,
} from '../../src';
import type { LinkStrategyInterface, SubscriberInterface, OutputTransfer } from '../../src';

// ═══════════════════════════════════════════════════════════════
// DefaultLinker.link()
// ═══════════════════════════════════════════════════════════════
// Tests that DefaultLinker.link() correctly delegates to the underlying
// link strategy for all 7 valid cases.

// ═══════════════════════════════════════════════════════════════
// Case 1: Subscribable → Pushable
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
] as Array<[number]>)(
  'DefaultLinker.link connects Subscribable source to Pushable target test',
  (value: number) => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const target = new SinkTransfer<number>({ callback: jest.fn() });

      const subscriber = linker.link(source, target);

      expect(subscriber.active).toBe(true);
      source.push(value);

      subscriber.unsubscribe();
      expect(subscriber.active).toBe(false);

      source.destroy();
      target.destroy();
    });
  },
);

describe.each([
  [1, 2, 3],
  [10, 20, 30],
] as Array<[number, number, number]>)(
  'DefaultLinker.link forwards multiple values from Subscribable to Pushable test',
  (v1: number, v2: number, v3: number) => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const received: number[] = [];
      const source = new PushChannelTransfer<number>();
      const target = new SinkTransfer<number>({ callback: (v) => received.push(v) });

      linker.link(source, target);

      source.push(v1);
      source.push(v2);
      source.push(v3);

      expect(received).toEqual([v1, v2, v3]);

      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 2: Pullable → PollingProxy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [99],
] as Array<[number]>)(
  'DefaultLinker.link connects Pullable source to PollingProxy target test',
  (value: number) => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const storage = new LatestStorage<number>();
      storage.write(value);
      const source = new ReadTransfer<number>({ flow: storage });
      const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isPullable).toBe(true);
      expect(source.isSubscribable).toBe(false);
      expect(poller.isPollingProxy).toBe(true);

      const received: (number | undefined)[] = [];
      poller.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linker.link(source, poller);
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

describe(
  'DefaultLinker.link Pullable to PollingProxy unsubscribe stops polling test',
  () => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const storage = new LatestStorage<number>();
      storage.write(42);
      const source = new ReadTransfer<number>({ flow: storage });
      const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

      const received: (number | undefined)[] = [];
      poller.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linker.link(source, poller);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const countBefore = received.length;
          expect(countBefore).toBeGreaterThan(0);

          subscriber.unsubscribe();

          setTimeout(() => {
            expect(received.length).toBe(countBefore);
            source.destroy();
            poller.destroy();
            resolve();
          }, 50);
        }, 50);
      });
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 3: Subscribable → PollingProxy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [100],
  [200],
] as Array<[number]>)(
  'DefaultLinker.link connects Subscribable source to PollingProxy target test',
  (value: number) => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isSubscribable).toBe(true);
      expect(poller.isPollingProxy).toBe(true);

      const received: number[] = [];
      poller.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linker.link(source, poller);
      expect(subscriber.active).toBe(true);

      source.push(value);

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

// ═══════════════════════════════════════════════════════════════
// Case 4: Subscribable → AsyncPushable
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
  [-7],
] as Array<[number]>)(
  'DefaultLinker.link connects Subscribable source to AsyncPushable target test',
  (value: number) => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const received: number[] = [];
      const target = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });

      expect(source.isSubscribable).toBe(true);
      expect(target.isAsyncPushable).toBe(true);

      const subscriber = linker.link(source, target);
      expect(subscriber.active).toBe(true);

      source.push(value);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toEqual([value]);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'DefaultLinker.link Subscribable to AsyncPushable with onError handles rejection test',
  () => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const target = new AsyncSinkTransfer<number>({
        callback: async () => { throw new Error('push error'); },
      });

      const onError = jest.fn();
      const subscriber = linker.link(source, target, { onError });

      source.push(42);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), target);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'DefaultLinker.link Subscribable to AsyncPushable unsubscribe stops data flow test',
  () => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const received: number[] = [];
      const target = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });

      const subscriber = linker.link(source, target);

      source.push(1);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      subscriber.unsubscribe();
      expect(subscriber.active).toBe(false);

      source.push(2);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toEqual([1]);

      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 5: AsyncPullable → AsyncPollingProxy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
  [-7],
] as Array<[number]>)(
  'DefaultLinker.link connects AsyncPullable source to AsyncPollingProxy target test',
  (value: number) => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const mockFlow = { read: jest.fn(async () => value) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isAsyncPullable).toBe(true);
      expect(target.isAsyncPollingProxy).toBe(true);

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linker.link(source, target);
      expect(subscriber.active).toBe(true);

      await new Promise<void>((resolve) => setTimeout(resolve, 50));

      expect(received.length).toBeGreaterThan(0);
      expect(received[0]).toBe(value);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 6: Pullable → AsyncPollingProxy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
  [-7],
] as Array<[number]>)(
  'DefaultLinker.link connects Pullable source to AsyncPollingProxy target test',
  (value: number) => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const storage = new LatestStorage<number>();
      storage.write(value);
      const source = new ReadTransfer<number>({ flow: storage });
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isPullable).toBe(true);
      expect(source.isSubscribable).toBe(false);
      expect(target.isAsyncPollingProxy).toBe(true);

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linker.link(source, target);
      expect(subscriber.active).toBe(true);

      await new Promise<void>((resolve) => setTimeout(resolve, 50));

      expect(received.length).toBeGreaterThan(0);
      expect(received[0]).toBe(value);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 7: Subscribable → AsyncPollingProxy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
  [-7],
] as Array<[number]>)(
  'DefaultLinker.link connects Subscribable source to AsyncPollingProxy target test',
  (value: number) => {
    it('', async () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isSubscribable).toBe(true);
      expect(target.isAsyncPollingProxy).toBe(true);

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linker.link(source, target);
      expect(subscriber.active).toBe(true);

      source.push(value);

      await new Promise<void>((resolve) => setTimeout(resolve, 50));

      expect(received.length).toBeGreaterThan(0);
      expect(received).toContain(value);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Error cases
// ═══════════════════════════════════════════════════════════════

describe(
  'DefaultLinker.link throws error for AsyncPullable to sync PollingProxy test',
  () => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const mockFlow = { read: jest.fn(async () => 1) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new PollingProxyTransfer<number>({ interval: 100, activated: false });

      expect(source.isAsyncPullable).toBe(true);
      expect(target.isPollingProxy).toBe(true);

      expect(() => linker.link(source, target)).toThrow(
        'Cannot link AsyncPullable source to sync PollingProxy',
      );

      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'DefaultLinker.link throws error for Pullable to Pushable test',
  () => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const storage = new LatestStorage<number>();
      const source = new ReadTransfer<number>({ flow: storage });
      const target = new SinkTransfer<number>({ callback: jest.fn() });

      expect(() => linker.link(source, target)).toThrow(
        'Cannot directly link Pullable/AsyncPullable source to Pushable/AsyncPushable target',
      );

      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'DefaultLinker.link throws error for unsupported combination test',
  () => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const storage = new LatestStorage<number>();
      const source = new ReadTransfer<number>({ flow: storage });
      const target = new ReadTransfer<number>({ flow: new LatestStorage<number>() });

      // @ts-expect-error
      expect(() => linker.link(source, target)).toThrow(
        'Unsupported transfer link combination',
      );

      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DefaultLinker.link — lifecycle
// ═══════════════════════════════════════════════════════════════

describe(
  'DefaultLinker.link subscriber is active after link and inactive after unsubscribe test',
  () => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const target = new SinkTransfer<number>({ callback: jest.fn() });

      const subscriber = linker.link(source, target);
      expect(subscriber.active).toBe(true);

      subscriber.unsubscribe();
      expect(subscriber.active).toBe(false);

      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'DefaultLinker.link returns unique subscriber each call test',
  () => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushChannelTransfer<number>();
      const target1 = new SinkTransfer<number>({ callback: jest.fn() });
      const target2 = new SinkTransfer<number>({ callback: jest.fn() });

      const sub1 = linker.link(source, target1);
      const sub2 = linker.link(source, target2);

      expect(sub1).not.toBe(sub2);
      expect(sub1.active).toBe(true);
      expect(sub2.active).toBe(true);

      sub1.unsubscribe();
      expect(sub1.active).toBe(false);
      expect(sub2.active).toBe(true);

      sub2.unsubscribe();
      source.destroy();
      target1.destroy();
      target2.destroy();
    });
  },
);

describe(
  'DefaultLinker.link multiple link calls accumulate and stop independently test',
  () => {
    it('', () => {
      const linker = new DefaultLinkStrategy();
      const source = new PushStoredChannelTransfer<number>();
      const received1: number[] = [];
      const received2: number[] = [];
      const target1 = new SinkTransfer<number>({ callback: (v) => received1.push(v) });
      const target2 = new SinkTransfer<number>({ callback: (v) => received2.push(v) });

      const sub1 = linker.link(source, target1);
      linker.link(source, target2);

      source.push(42);

      expect(received1).toEqual([42]);
      expect(received2).toEqual([42]);

      sub1.unsubscribe();

      source.push(100);

      expect(received1).toEqual([42]); // stopped after first value
      expect(received2).toEqual([42, 100]); // continues

      source.destroy();
      target1.destroy();
      target2.destroy();
    });
  },
);
