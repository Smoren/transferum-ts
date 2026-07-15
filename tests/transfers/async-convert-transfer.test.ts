import { AsyncConvertTransfer, AsyncMapOperator, AsyncGuardOperator } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer
// ═══════════════════════════════════════════════════════════════
// Async converter transfer: transforms input data via
// AsyncOperator and sends the result to subscribers.
// Capabilities: isInput, isOutput, isDuplex, isAsyncPushable, isSubscribable

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConvertTransfer has correct capability flags test',
  () => {
    it('', () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());
      const transfer = new AsyncConvertTransfer<number, string>({ operator });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isAsyncPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isAsyncPullable).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isAsyncPollingProxy).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isAsyncTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer asyncPush & subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncConvertPush(),
] as Array<[number, string]>)(
  'AsyncConvertTransfer asyncPush transforms and notifies subscribers test',
  (input: number, expected: string) => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());
      const transfer = new AsyncConvertTransfer<number, string>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(input);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expected);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPush with transformation.
 */
function dataProviderForAsyncConvertPush(): Array<unknown> {
  return [
    [0, '0'],
    [1, '1'],
    [42, '42'],
    [-5, '-5'],
  ];
}

describe(
  'AsyncConvertTransfer asyncPush returns Promise test',
  () => {
    it('', () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());
      const transfer = new AsyncConvertTransfer<number, string>({ operator });
      const result = transfer.asyncPush(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncConvertTransfer asyncPush notifies multiple subscribers test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, number>(async (n) => n * 2);
      const transfer = new AsyncConvertTransfer<number, number>({ operator });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      await transfer.asyncPush(21);

      expect(handler1).toHaveBeenCalledWith(42);
      expect(handler2).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConvertTransfer with AsyncGuardOperator passes valid data test',
  () => {
    it('', async () => {
      const operator = new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0));
      const transfer = new AsyncConvertTransfer<number, number>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(42);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConvertTransfer with AsyncGuardOperator blocks invalid data test',
  () => {
    it('', async () => {
      const operator = new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0));
      const transfer = new AsyncConvertTransfer<number, number>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(-1);

      // Guard returns undefined → sendState() does not notify subscribers
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConvertTransfer asyncPush with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('operator error');
      const onError = jest.fn();
      const operator = new AsyncMapOperator<number, string>(async () => { throw error; });
      const transfer = new AsyncConvertTransfer<number, string>({ operator, onError });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(42);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConvertTransfer asyncPush without onError rethrows test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, string>(async () => { throw new Error('operator error'); });
      const transfer = new AsyncConvertTransfer<number, string>({ operator });

      await expect(transfer.asyncPush(42)).rejects.toThrow('operator error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConvertTransfer destroy stops notifications test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());
      const transfer = new AsyncConvertTransfer<number, string>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      await transfer.asyncPush(42);

      expect(handler).not.toHaveBeenCalled();
    });
  },
);

describe(
  'AsyncConvertTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());
      const transfer = new AsyncConvertTransfer<number, string>({ operator });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer Backpressure — maxConcurrency
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConvertTransfer maxConcurrency=1 processes sequentially when not awaited test',
  () => {
    it('', async () => {
      const order: number[] = [];
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => { resolveFirst = resolve; });

      const operator = {
        apply: async (n: number) => {
          if (n === 1) await firstPromise;
          order.push(n);
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({
        operator,
        maxConcurrency: 1,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      transfer.asyncPush(1);  // starts (blocked)
      transfer.asyncPush(2);  // at capacity → buffered
      transfer.asyncPush(3);  // at capacity → buffered

      expect(order).toEqual([]);

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual([1, 2, 3]);
      expect(handler).toHaveBeenCalledTimes(3);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConvertTransfer maxConcurrency=2 processes in parallel test',
  () => {
    it('', async () => {
      const order: string[] = [];
      let resolveA: () => void;
      let resolveB: () => void;
      const promiseA = new Promise<void>((resolve) => { resolveA = resolve; });
      const promiseB = new Promise<void>((resolve) => { resolveB = resolve; });

      const operator = {
        apply: async (n: number) => {
          if (n === 1) { order.push('start-1'); await promiseA; order.push('end-1'); }
          else if (n === 2) { order.push('start-2'); await promiseB; order.push('end-2'); }
          else { order.push(`start-${n}`); order.push(`end-${n}`); }
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({
        operator,
        maxConcurrency: 2,
      });

      transfer.asyncPush(1);  // starts (blocked on A)
      transfer.asyncPush(2);  // starts (blocked on B) — parallel
      transfer.asyncPush(3);  // at capacity → buffered

      expect(order).toEqual(['start-1', 'start-2']);

      resolveB!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['start-1', 'start-2', 'end-2', 'start-3', 'end-3']);

      resolveA!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual(['start-1', 'start-2', 'end-2', 'start-3', 'end-3', 'end-1']);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConvertTransfer default maxConcurrency=Infinity processes all in parallel test',
  () => {
    it('', async () => {
      const order: number[] = [];
      let resolveAll: () => void;
      const allPromise = new Promise<void>((resolve) => { resolveAll = resolve; });

      const operator = {
        apply: async (n: number) => {
          await allPromise;
          order.push(n);
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({ operator });

      transfer.asyncPush(1);
      transfer.asyncPush(2);
      transfer.asyncPush(3);

      expect(order).toEqual([]);

      resolveAll!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual([1, 2, 3]);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer Backpressure — bufferSize & onBufferOverflow
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConvertTransfer bufferSize=0 drops excess data test',
  () => {
    it('', async () => {
      const overflowed: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const operator = {
        apply: async (n: number) => {
          if (n === 1) await taskPromise;
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({
        operator,
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
  'AsyncConvertTransfer bufferSize=1 drops when full test',
  () => {
    it('', async () => {
      const overflowed: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const operator = {
        apply: async (n: number) => {
          if (n === 1) await taskPromise;
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({
        operator,
        maxConcurrency: 1,
        bufferSize: 1,
        onBufferOverflow: (data) => overflowed.push(data),
      });

      transfer.asyncPush(1);  // starts (blocked)
      transfer.asyncPush(2);  // queued (buffer: [2])
      transfer.asyncPush(3);  // buffer full → dropped

      expect(overflowed).toEqual([3]);

      resolveTask!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConvertTransfer error frees slot for next buffered item test',
  () => {
    it('', async () => {
      const results: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const operator = {
        apply: async (n: number) => {
          if (n === 1) { await taskPromise; throw new Error('fail'); }
          results.push(n);
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({
        operator,
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
  'AsyncConvertTransfer bufferSize=0 without onBufferOverflow silently drops test',
  () => {
    it('', async () => {
      const results: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => {
        resolveTask = resolve;
      });

      const operator = {
        apply: async (n: number) => {
          if (n === 1) await taskPromise;
          results.push(n);
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({
        operator,
        maxConcurrency: 1,
        bufferSize: 0,
        // no onBufferOverflow — data silently dropped
      });

      transfer.asyncPush(1);  // starts (blocked)
      transfer.asyncPush(2);  // at capacity, buffer size 0 → silently dropped
      transfer.asyncPush(3);  // silently dropped

      resolveTask!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Only 1 processed, 2 and 3 dropped
      expect(results).toEqual([1]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConvertTransfer destroy clears buffer test',
  () => {
    it('', async () => {
      const results: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const operator = {
        apply: async (n: number) => {
          if (n === 1) await taskPromise;
          results.push(n);
          return n;
        },
      };
      const transfer = new AsyncConvertTransfer<number, number>({
        operator,
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
      expect(results).not.toContain(2);
      expect(results).not.toContain(3);
    });
  },
);

