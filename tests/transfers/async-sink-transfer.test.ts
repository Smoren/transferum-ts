import { AsyncSinkTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer
// ═══════════════════════════════════════════════════════════════
// Async terminal sink — invokes a callback upon receiving data.
// Capabilities: isInput, isAsyncPushable

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncSinkTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new AsyncSinkTransfer<number>({
        callback: () => {},
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(false);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isAsyncPushable).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isAsyncPullable).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isAsyncPollingProxy).toBe(false);
      expect(transfer.isSubscribable).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isAsyncTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer asyncPush with sync callback
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncSinkPushSync(),
] as Array<[number]>)(
  'AsyncSinkTransfer asyncPush with sync callback test',
  (value: number) => {
    it('', async () => {
      const callback = jest.fn() as any;
      const transfer = new AsyncSinkTransfer<number>({ callback });

      await transfer.asyncPush(value);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPush with sync callback.
 */
function dataProviderForAsyncSinkPushSync(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer asyncPush with async callback
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncSinkPushAsync(),
] as Array<[number]>)(
  'AsyncSinkTransfer asyncPush with async callback test',
  (value: number) => {
    it('', async () => {
      const callback = jest.fn(async (v: number) => { await Promise.resolve(); });
      const transfer = new AsyncSinkTransfer<number>({ callback });

      await transfer.asyncPush(value);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPush with async callback.
 */
function dataProviderForAsyncSinkPushAsync(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'AsyncSinkTransfer asyncPush returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncSinkTransfer<number>({ callback: () => {} });
      const result = transfer.asyncPush(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncSinkTransfer asyncPush multiple values test',
  () => {
    it('', async () => {
      const received: number[] = [];
      const transfer = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });

      await transfer.asyncPush(1);
      await transfer.asyncPush(2);
      await transfer.asyncPush(3);

      expect(received).toEqual([1, 2, 3]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer asyncPush propagates rejection test',
  () => {
    it('', async () => {
      const transfer = new AsyncSinkTransfer<number>({
        callback: async () => { throw new Error('callback error'); },
      });

      await expect(transfer.asyncPush(42)).rejects.toThrow('callback error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncSinkTransfer asyncPush with onError suppresses Error test',
  () => {
    it('', async () => {
      const onError = jest.fn();
      const transfer = new AsyncSinkTransfer<number>({
        callback: async () => { throw new Error('callback error'); },
        onError,
      });

      await expect(transfer.asyncPush(42)).resolves.toBeUndefined();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), transfer);
      expect((onError.mock.calls[0][0] as Error).message).toBe('callback error');

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer asyncPush with onError wraps non-Error test',
  () => {
    it('', async () => {
      const onError = jest.fn();
      const transfer = new AsyncSinkTransfer<number>({
        callback: async () => { throw 'string error'; },
        onError,
      });

      await expect(transfer.asyncPush(42)).resolves.toBeUndefined();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error), transfer);
      expect((onError.mock.calls[0][0] as Error).message).toBe('string error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncSinkTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const transfer = new AsyncSinkTransfer<number>({ callback: () => {} });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer Complex Data Types
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncSinkTransfer asyncPush with object test',
  () => {
    it('', async () => {
      const callback = jest.fn() as any;
      const transfer = new AsyncSinkTransfer<{ x: number; y: number }>({ callback });

      await transfer.asyncPush({ x: 1, y: 2 });

      expect(callback).toHaveBeenCalledWith({ x: 1, y: 2 });

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer asyncPush with string test',
  () => {
    it('', async () => {
      const callback = jest.fn() as any;
      const transfer = new AsyncSinkTransfer<string>({ callback });

      await transfer.asyncPush('hello');

      expect(callback).toHaveBeenCalledWith('hello');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer Backpressure — maxConcurrency
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncSinkTransfer maxConcurrency=1 processes sequentially when not awaited test',
  () => {
    it('', async () => {
      const order: number[] = [];
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => { resolveFirst = resolve; });

      const callback = async (n: number) => {
        if (n === 1) await firstPromise;
        order.push(n);
      };
      const transfer = new AsyncSinkTransfer<number>({
        callback,
        maxConcurrency: 1,
      });

      // Fire-and-forget: all three asyncPush called without await
      transfer.asyncPush(1);  // starts processing (blocked on firstPromise)
      transfer.asyncPush(2);  // at capacity → buffered
      transfer.asyncPush(3);  // at capacity → buffered

      expect(order).toEqual([]);

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // All processed sequentially: 1, then 2 (from buffer), then 3 (from buffer)
      expect(order).toEqual([1, 2, 3]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer maxConcurrency=2 processes in parallel test',
  () => {
    it('', async () => {
      const order: string[] = [];
      let resolveA: () => void;
      let resolveB: () => void;
      const promiseA = new Promise<void>((resolve) => { resolveA = resolve; });
      const promiseB = new Promise<void>((resolve) => { resolveB = resolve; });

      const callback = async (n: number) => {
        if (n === 1) { order.push('start-1'); await promiseA; order.push('end-1'); }
        else if (n === 2) { order.push('start-2'); await promiseB; order.push('end-2'); }
        else { order.push(`start-${n}`); order.push(`end-${n}`); }
      };
      const transfer = new AsyncSinkTransfer<number>({
        callback,
        maxConcurrency: 2,
      });

      transfer.asyncPush(1);  // starts (blocked on A)
      transfer.asyncPush(2);  // starts (blocked on B) — parallel
      transfer.asyncPush(3);  // at capacity → buffered

      expect(order).toEqual(['start-1', 'start-2']);

      resolveB!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 2 finished, 3 started and finished (sync after B resolves)
      expect(order).toEqual(['start-1', 'start-2', 'end-2', 'start-3', 'end-3']);

      resolveA!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['start-1', 'start-2', 'end-2', 'start-3', 'end-3', 'end-1']);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer default maxConcurrency=Infinity processes all in parallel test',
  () => {
    it('', async () => {
      const order: number[] = [];
      let resolveAll: () => void;
      const allPromise = new Promise<void>((resolve) => { resolveAll = resolve; });

      const callback = async (n: number) => {
        await allPromise;
        order.push(n);
      };
      const transfer = new AsyncSinkTransfer<number>({ callback });

      transfer.asyncPush(1);
      transfer.asyncPush(2);
      transfer.asyncPush(3);

      // None completed yet — all running in parallel
      expect(order).toEqual([]);

      resolveAll!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual([1, 2, 3]);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer Backpressure — bufferSize & onBufferOverflow
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncSinkTransfer bufferSize=0 drops excess data test',
  () => {
    it('', async () => {
      const overflowed: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const callback = async (n: number) => {
        if (n === 1) await taskPromise;
      };
      const transfer = new AsyncSinkTransfer<number>({
        callback,
        maxConcurrency: 1,
        bufferSize: 0,
        onBufferOverflow: (data) => overflowed.push(data),
      });

      transfer.asyncPush(1);  // starts (blocked)
      transfer.asyncPush(2);  // at capacity, buffer size 0 → dropped
      transfer.asyncPush(3);  // dropped

      expect(overflowed).toEqual([2, 3]);

      resolveTask!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer bufferSize=2 drops when full test',
  () => {
    it('', async () => {
      const overflowed: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const callback = async (n: number) => {
        if (n === 1) await taskPromise;
      };
      const transfer = new AsyncSinkTransfer<number>({
        callback,
        maxConcurrency: 1,
        bufferSize: 2,
        onBufferOverflow: (data) => overflowed.push(data),
      });

      transfer.asyncPush(1);  // starts (blocked)
      transfer.asyncPush(2);  // queued (buffer: [2])
      transfer.asyncPush(3);  // queued (buffer: [2, 3])
      transfer.asyncPush(4);  // buffer full → dropped

      expect(overflowed).toEqual([4]);

      resolveTask!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer error frees slot for next buffered item test',
  () => {
    it('', async () => {
      const results: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const callback = async (n: number) => {
        if (n === 1) { await taskPromise; throw new Error('fail'); }
        results.push(n);
      };
      const transfer = new AsyncSinkTransfer<number>({
        callback,
        maxConcurrency: 1,
        bufferSize: 1,
        onError: () => {},
      });

      transfer.asyncPush(1);  // starts (blocked, will fail)
      transfer.asyncPush(2);  // queued

      resolveTask!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 1 failed (error suppressed), 2 processed from buffer
      expect(results).toEqual([2]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncSinkTransfer destroy clears buffer test',
  () => {
    it('', async () => {
      const received: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const callback = async (n: number) => {
        if (n === 1) await taskPromise;
        received.push(n);
      };
      const transfer = new AsyncSinkTransfer<number>({
        callback,
        maxConcurrency: 1,
        bufferSize: 10,
      });

      transfer.asyncPush(1);  // starts (blocked)
      transfer.asyncPush(2);  // queued
      transfer.asyncPush(3);  // queued

      transfer.destroy();

      resolveTask!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // After destroy, buffered items should not be processed
      // (1 may have completed if destroy happened after resolve, but 2 and 3 should not)
      expect(received).not.toContain(2);
      expect(received).not.toContain(3);
    });
  },
);

