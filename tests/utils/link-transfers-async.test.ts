import {
  PushChannelTransfer,
  SinkTransfer,
  PollingProxyTransfer,
  ReadTransfer,
  LatestStorage,
  AsyncSinkTransfer,
  AsyncReadTransfer,
  AsyncPollingProxyTransfer,
  linkTransfers,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// linkTransfers — Async cases
// ═══════════════════════════════════════════════════════════════
// Tests for async linkTransfers strategies (cases 4-9).
// Sync cases (1-3) are covered in link-transfers.test.ts.

// ═══════════════════════════════════════════════════════════════
// Case 4: Subscribable → AsyncPushable (Reactive stream + async-push)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSubscribableToAsyncPushable(),
] as Array<[number]>)(
  'linkTransfers connects Subscribable source to AsyncPushable target test',
  (value: number) => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const received: number[] = [];
      const target = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });

      expect(source.isSubscribable).toBe(true);
      expect(target.isAsyncPushable).toBe(true);
      expect(target.isPushable).toBe(false);

      const subscriber = linkTransfers(source, target);
      expect(subscriber.active).toBe(true);

      source.push(value);

      // asyncPush executes asynchronously — waiting for microtask
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toEqual([value]);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for Subscribable → AsyncPushable.
 */
function dataProviderForSubscribableToAsyncPushable(): Array<unknown> {
  return [
    [1],
    [42],
    [-7],
  ];
}

describe(
  'linkTransfers Subscribable to AsyncPushable forwards multiple values test',
  () => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const received: number[] = [];
      const target = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });

      linkTransfers(source, target);

      source.push(1);
      source.push(2);
      source.push(3);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toEqual([1, 2, 3]);

      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'linkTransfers Subscribable to AsyncPushable unsubscribe stops data flow test',
  () => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const received: number[] = [];
      const target = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });

      const subscriber = linkTransfers(source, target);

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

describe(
  'linkTransfers Subscribable to AsyncPushable rejection suppressed without onError test',
  () => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const target = new AsyncSinkTransfer<number>({
        callback: async () => { throw new Error('push error'); },
      });

      // Without onError — rejection is suppressed by .catch()
      const subscriber = linkTransfers(source, target);
      expect(subscriber.active).toBe(true);

      // Should not cause an unhandled rejection
      source.push(42);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      // Subscription remains active
      expect(subscriber.active).toBe(true);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'linkTransfers Subscribable to AsyncPushable rejection calls onError test',
  () => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const target = new AsyncSinkTransfer<number>({
        callback: async () => { throw new Error('push error'); },
      });

      const onError = jest.fn();
      const subscriber = linkTransfers(source, target, { onError });

      source.push(42);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), target);
      expect((onError.mock.calls[0][0] as Error).message).toBe('push error');

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'linkTransfers Subscribable to AsyncPushable non-Error rejection wrapped to Error test',
  () => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const target = new AsyncSinkTransfer<number>({
        callback: async () => { throw 'string error'; },
      });

      const onError = jest.fn();
      const subscriber = linkTransfers(source, target, { onError });

      source.push(42);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), target);
      expect((onError.mock.calls[0][0] as Error).message).toBe('string error');

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 5: AsyncPullable → AsyncPollingProxy (Active async-polling)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPullableToAsyncPollingProxy(),
] as Array<[number]>)(
  'linkTransfers connects AsyncPullable source to AsyncPollingProxy target test',
  (value: number) => {
    it('', async () => {
      const mockFlow = { read: jest.fn(async () => value) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isAsyncPullable).toBe(true);
      expect(source.isPullable).toBe(false);
      expect(source.isSubscribable).toBe(false);
      expect(target.isAsyncPollingProxy).toBe(true);
      expect(target.isPollingProxy).toBe(false);

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, target);
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

/**
 * Data provider for AsyncPullable → AsyncPollingProxy.
 */
function dataProviderForAsyncPullableToAsyncPollingProxy(): Array<unknown> {
  return [
    [1],
    [42],
    [-7],
  ];
}

describe(
  'linkTransfers AsyncPullable to AsyncPollingProxy unsubscribe stops polling test',
  () => {
    it('', async () => {
      const mockFlow = { read: jest.fn(async () => 42) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, target);

      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      const countBefore = received.length;
      expect(countBefore).toBeGreaterThan(0);

      subscriber.unsubscribe();

      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      const countAfter = received.length;
      expect(countAfter).toBe(countBefore);

      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'linkTransfers AsyncPullable to AsyncPollingProxy subscriber inactive after unsubscribe test',
  () => {
    it('', () => {
      const mockFlow = { read: jest.fn(async () => 1) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new AsyncPollingProxyTransfer<number>({ interval: 100, activated: false });

      const subscriber = linkTransfers(source, target);
      expect(subscriber.active).toBe(true);

      subscriber.unsubscribe();
      expect(subscriber.active).toBe(false);

      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 6: Pullable → AsyncPollingProxy (Sync-pull wrapped in an async-fetcher)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPullableToAsyncPollingProxy(),
] as Array<[number]>)(
  'linkTransfers connects Pullable source to AsyncPollingProxy target test',
  (value: number) => {
    it('', async () => {
      const storage = new LatestStorage<number>();
      storage.write(value);
      const source = new ReadTransfer<number>({ flow: storage });
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isPullable).toBe(true);
      expect(source.isSubscribable).toBe(false);
      expect(source.isAsyncPullable).toBe(false);
      expect(target.isAsyncPollingProxy).toBe(true);

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, target);
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

/**
 * Data provider for Pullable → AsyncPollingProxy.
 */
function dataProviderForPullableToAsyncPollingProxy(): Array<unknown> {
  return [
    [1],
    [42],
    [-7],
  ];
}

describe(
  'linkTransfers Pullable to AsyncPollingProxy unsubscribe stops polling test',
  () => {
    it('', async () => {
      const storage = new LatestStorage<number>();
      storage.write(42);
      const source = new ReadTransfer<number>({ flow: storage });
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, target);

      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      const countBefore = received.length;
      expect(countBefore).toBeGreaterThan(0);

      subscriber.unsubscribe();

      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      expect(received.length).toBe(countBefore);

      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 7: Subscribable → AsyncPollingProxy (Subscription + buffer + async-fetcher)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSubscribableToAsyncPollingProxy(),
] as Array<[number]>)(
  'linkTransfers connects Subscribable source to AsyncPollingProxy target test',
  (value: number) => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      expect(source.isSubscribable).toBe(true);
      expect(source.isPullable).toBe(false);
      expect(target.isAsyncPollingProxy).toBe(true);
      expect(target.isPushable).toBe(false);
      expect(target.isPollingProxy).toBe(false);

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, target);
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

/**
 * Data provider for Subscribable → AsyncPollingProxy.
 */
function dataProviderForSubscribableToAsyncPollingProxy(): Array<unknown> {
  return [
    [1],
    [42],
    [-7],
  ];
}

describe(
  'linkTransfers Subscribable to AsyncPollingProxy unsubscribe stops data flow test',
  () => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const target = new AsyncPollingProxyTransfer<number>({ interval: 10, activated: true });

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, target);

      source.push(1);
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      const countBefore = received.length;
      expect(countBefore).toBeGreaterThan(0);

      subscriber.unsubscribe();

      source.push(2);
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      expect(received.length).toBe(countBefore);

      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'linkTransfers Subscribable to AsyncPollingProxy buffers last value test',
  () => {
    it('', async () => {
      const source = new PushChannelTransfer<number>();
      const target = new AsyncPollingProxyTransfer<number>({ interval: 20, activated: false });

      const received: (number | undefined)[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      const subscriber = linkTransfers(source, target);

      // Sending values before activating polling
      source.push(10);
      source.push(20);
      source.push(30);

      // Activating polling — the poller will pick up the last value (30)
      target.activate();

      await new Promise<void>((resolve) => setTimeout(resolve, 60));

      expect(received).toContain(30);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Case 8: AsyncPullable → sync-PollingProxy (Error — sync-poller cannot await)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPullableToSyncPollingProxyThrows(),
] as Array<[]>)(
  'linkTransfers throws error for AsyncPullable to sync PollingProxy test',
  () => {
    it('', () => {
      const mockFlow = { read: jest.fn(async () => 1) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new PollingProxyTransfer<number>({ interval: 100, activated: false });

      expect(source.isAsyncPullable).toBe(true);
      expect(target.isPollingProxy).toBe(true);
      expect(target.isAsyncPollingProxy).toBe(false);

      expect(() => linkTransfers(source, target)).toThrow(
        'Cannot link AsyncPullable source to sync PollingProxy'
      );

      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for error AsyncPullable → sync-PollingProxy.
 */
function dataProviderForAsyncPullableToSyncPollingProxyThrows(): Array<unknown> {
  return [[]];
}

// ═══════════════════════════════════════════════════════════════
// Case 9: AsyncPullable → Pushable (Error — needs Bridge/Triggerable)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPullableToPushableThrows(),
] as Array<[]>)(
  'linkTransfers throws error for AsyncPullable to Pushable test',
  () => {
    it('', () => {
      const mockFlow = { read: jest.fn(async () => 1) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new SinkTransfer<number>({ callback: jest.fn() });

      expect(source.isAsyncPullable).toBe(true);
      expect(target.isPushable).toBe(true);

      expect(() => linkTransfers(source, target)).toThrow(
        'Cannot directly link Pullable/AsyncPullable source to Pushable/AsyncPushable target'
      );

      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for error AsyncPullable → Pushable.
 */
function dataProviderForAsyncPullableToPushableThrows(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForAsyncPullableToAsyncPushableThrows(),
] as Array<[]>)(
  'linkTransfers throws error for AsyncPullable to AsyncPushable test',
  () => {
    it('', () => {
      const mockFlow = { read: jest.fn(async () => 1) };
      const source = new AsyncReadTransfer<number>({ flow: mockFlow });
      const target = new AsyncSinkTransfer<number>({ callback: jest.fn() as any });

      expect(source.isAsyncPullable).toBe(true);
      expect(target.isAsyncPushable).toBe(true);

      expect(() => linkTransfers(source, target)).toThrow(
        'Cannot directly link Pullable/AsyncPullable source to Pushable/AsyncPushable target'
      );

      source.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for error AsyncPullable → AsyncPushable.
 */
function dataProviderForAsyncPullableToAsyncPushableThrows(): Array<unknown> {
  return [[]];
}
