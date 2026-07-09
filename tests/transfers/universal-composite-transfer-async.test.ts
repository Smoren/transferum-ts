import type { InputTransfer } from '../../src';
import {
  PushChannelTransfer,
  AsyncSinkTransfer,
  AsyncReadTransfer,
  AsyncPollingSourceTransfer,
  AsyncPollingProxyTransfer,
  UniversalCompositeTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer — Async Functionality
// ═══════════════════════════════════════════════════════════════
// Tests for async methods of UniversalCompositeTransfer:
// asyncPush, asyncPull, asyncTrigger, setAsyncFetcher, clearAsyncFetcher
// and corresponding capability flags.

// ═══════════════════════════════════════════════════════════════
// Async Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer has correct async capability flags from AsyncPollingProxyTransfer test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      expect(composite.isAsyncPushable).toBe(false);
      expect(composite.isAsyncPullable).toBe(true);
      expect(composite.isAsyncTriggerable).toBe(true);
      expect(composite.isAsyncPollingProxy).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer has correct async capability flags from AsyncSinkTransfer test',
  () => {
    it('', () => {
      const input = new AsyncSinkTransfer<number>({ callback: () => {} });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(composite.isAsyncPushable).toBe(true);
      expect(composite.isAsyncPullable).toBe(false);
      expect(composite.isAsyncTriggerable).toBe(false);
      expect(composite.isAsyncPollingProxy).toBe(false);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer has correct async capability flags from AsyncReadTransfer test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const output = new AsyncReadTransfer<number>({ flow });
      const input = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(composite.isAsyncPushable).toBe(false);
      expect(composite.isAsyncPullable).toBe(true);
      expect(composite.isAsyncTriggerable).toBe(false);
      expect(composite.isAsyncPollingProxy).toBe(false);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// asyncPush
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer asyncPush delegates to input test',
  () => {
    it('', async () => {
      const received: number[] = [];
      const input = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      await composite.asyncPush(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer asyncPush returns Promise test',
  () => {
    it('', () => {
      const input = new AsyncSinkTransfer<number>({ callback: () => {} });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      const result = composite.asyncPush(42);
      expect(result).toBeInstanceOf(Promise);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on asyncPush if not asyncPushable test',
  () => {
    it('', async () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      await expect(composite.asyncPush(42)).rejects.toThrow(
        'Cannot asyncPush to non-async-pushable transfer'
      );

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// asyncPull
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer asyncPull delegates to output test',
  () => {
    it('', async () => {
      const flow = { read: jest.fn(async () => 42) };
      const output = new AsyncReadTransfer<number>({ flow });
      const input = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      const result = await composite.asyncPull();
      expect(result).toBe(42);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer asyncPull returns Promise test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const output = new AsyncReadTransfer<number>({ flow });
      const input = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      const result = composite.asyncPull();
      expect(result).toBeInstanceOf(Promise);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on asyncPull if not asyncPullable test',
  () => {
    it('', async () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      await expect(composite.asyncPull()).rejects.toThrow(
        'Cannot asyncPull from non-async-pullable transfer'
      );

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// asyncTrigger
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer asyncTrigger delegates to triggerable test',
  () => {
    it('', async () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });

      const composite = new UniversalCompositeTransfer({
        input: transfer as unknown as InputTransfer<void>,
        output: transfer,
      });

      const handler = jest.fn();
      composite.subscribe(handler);

      await composite.asyncTrigger();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer asyncTrigger returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 0,
        interval: 100,
        activated: false,
      });

      const composite = new UniversalCompositeTransfer({
        input: transfer as unknown as InputTransfer<void>,
        output: transfer,
      });

      const result = composite.asyncTrigger();
      expect(result).toBeInstanceOf(Promise);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on asyncTrigger if not asyncTriggerable test',
  () => {
    it('', async () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      await expect(composite.asyncTrigger()).rejects.toThrow(
        'Cannot asyncTrigger on non-async-triggerable transfer'
      );

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// setAsyncFetcher & clearAsyncFetcher
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer setAsyncFetcher delegates to input test',
  () => {
    it('', () => {
      const input = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      const fetcher = jest.fn(async () => 42);
      composite.setAsyncFetcher(fetcher);

      // setAsyncFetcher does not call fetcher immediately
      expect(fetcher).not.toHaveBeenCalled();

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer clearAsyncFetcher delegates to input test',
  () => {
    it('', () => {
      const input = new AsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      composite.setAsyncFetcher(async () => 42);
      composite.clearAsyncFetcher();

      // After clearAsyncFetcher, isAsyncPollingProxy remains true
      expect(composite.isAsyncPollingProxy).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on setAsyncFetcher if not asyncPollingProxy test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.setAsyncFetcher(async () => 42)).toThrow(
        'Cannot setAsyncFetcher to non-async-pollable transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on clearAsyncFetcher if not asyncPollingProxy test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.clearAsyncFetcher()).toThrow(
        'Cannot clearAsyncFetcher of non-async-pollable transfer'
      );

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// _extractAsyncTriggerable from output
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer extracts asyncTriggerable from output test',
  () => {
    it('', async () => {
      // input does not have isAsyncTriggerable, output does
      const input = new PushChannelTransfer<number>();
      const output = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      // asyncTriggerable extracted from output
      expect(composite.isAsyncTriggerable).toBe(true);

      const handler = jest.fn();
      output.subscribe(handler);

      await composite.asyncTrigger();

      expect(handler).toHaveBeenCalledWith(42);

      composite.destroy();
    });
  },
);

