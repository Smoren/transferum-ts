import { AsyncWriteTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncWriteTransfer
// ═══════════════════════════════════════════════════════════════
// Async write adapter for an AsyncInputFlowInterface.
// Capabilities: isInput, isAsyncPushable

// ═══════════════════════════════════════════════════════════════
// AsyncWriteTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncWriteTransfer has correct capability flags test',
  () => {
    it('', () => {
      const flow = { write: jest.fn(async () => {}) };
      const transfer = new AsyncWriteTransfer<number>({ flow });

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
// AsyncWriteTransfer asyncPush
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncWritePush(),
] as Array<[number]>)(
  'AsyncWriteTransfer asyncPush calls flow.write test',
  (value: number) => {
    it('', async () => {
      const write = jest.fn(async (_) => {});
      const transfer = new AsyncWriteTransfer<number>({ flow: { write } });

      await transfer.asyncPush(value);

      expect(write).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPush.
 */
function dataProviderForAsyncWritePush(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'AsyncWriteTransfer asyncPush returns Promise test',
  () => {
    it('', () => {
      const flow = { write: jest.fn(async () => {}) };
      const transfer = new AsyncWriteTransfer<number>({ flow });
      const result = transfer.asyncPush(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncWriteTransfer asyncPush multiple values test',
  () => {
    it('', async () => {
      const received: number[] = [];
      const flow = { write: async (data: number) => { received.push(data); } };
      const transfer = new AsyncWriteTransfer<number>({ flow });

      await transfer.asyncPush(1);
      await transfer.asyncPush(2);
      await transfer.asyncPush(3);

      expect(received).toEqual([1, 2, 3]);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncWriteTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncWriteTransfer asyncPush with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('write error');
      const onError = jest.fn();
      const flow = { write: async () => { throw error; } };
      const transfer = new AsyncWriteTransfer<number>({ flow, onError });

      await transfer.asyncPush(42);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncWriteTransfer asyncPush without onError rethrows test',
  () => {
    it('', async () => {
      const flow = { write: async () => { throw new Error('write error'); } };
      const transfer = new AsyncWriteTransfer<number>({ flow });

      await expect(transfer.asyncPush(42)).rejects.toThrow('write error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncWriteTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncWriteTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const flow = { write: jest.fn(async () => {}) };
      const transfer = new AsyncWriteTransfer<number>({ flow });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

describe(
  'AsyncWriteTransfer destroy does not affect flow test',
  () => {
    it('', async () => {
      const write = jest.fn(async () => {});
      const transfer = new AsyncWriteTransfer<number>({ flow: { write } });

      transfer.destroy();

      // destroy — no-op, flow remains untouched
      expect(write).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncWriteTransfer Backpressure — maxConcurrency
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncWriteTransfer maxConcurrency=1 processes sequentially when not awaited test',
  () => {
    it('', async () => {
      const order: number[] = [];
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => { resolveFirst = resolve; });

      const flow = {
        write: async (n: number) => {
          if (n === 1) await firstPromise;
          order.push(n);
        },
      };
      const transfer = new AsyncWriteTransfer<number>({
        flow,
        maxConcurrency: 1,
      });

      transfer.asyncPush(1);  // starts (blocked on firstPromise)
      transfer.asyncPush(2);  // at capacity → buffered
      transfer.asyncPush(3);  // at capacity → buffered

      expect(order).toEqual([]);

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(order).toEqual([1, 2, 3]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncWriteTransfer maxConcurrency=2 processes in parallel test',
  () => {
    it('', async () => {
      const order: string[] = [];
      let resolveA: () => void;
      let resolveB: () => void;
      const promiseA = new Promise<void>((resolve) => { resolveA = resolve; });
      const promiseB = new Promise<void>((resolve) => { resolveB = resolve; });

      const flow = {
        write: async (n: number) => {
          if (n === 1) { order.push('start-1'); await promiseA; order.push('end-1'); }
          else if (n === 2) { order.push('start-2'); await promiseB; order.push('end-2'); }
          else { order.push(`start-${n}`); order.push(`end-${n}`); }
        },
      };
      const transfer = new AsyncWriteTransfer<number>({
        flow,
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
  'AsyncWriteTransfer default maxConcurrency=Infinity processes all in parallel test',
  () => {
    it('', async () => {
      const order: number[] = [];
      let resolveAll: () => void;
      const allPromise = new Promise<void>((resolve) => { resolveAll = resolve; });

      const flow = {
        write: async (n: number) => {
          await allPromise;
          order.push(n);
        },
      };
      const transfer = new AsyncWriteTransfer<number>({ flow });

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
// AsyncWriteTransfer Backpressure — bufferSize & onBufferOverflow
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncWriteTransfer bufferSize=0 drops excess data test',
  () => {
    it('', async () => {
      const overflowed: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const flow = {
        write: async (n: number) => {
          if (n === 1) await taskPromise;
        },
      };
      const transfer = new AsyncWriteTransfer<number>({
        flow,
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
  'AsyncWriteTransfer bufferSize=1 drops when full test',
  () => {
    it('', async () => {
      const overflowed: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const flow = {
        write: async (n: number) => {
          if (n === 1) await taskPromise;
        },
      };
      const transfer = new AsyncWriteTransfer<number>({
        flow,
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
  'AsyncWriteTransfer error frees slot for next buffered item test',
  () => {
    it('', async () => {
      const received: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const flow = {
        write: async (n: number) => {
          if (n === 1) { await taskPromise; throw new Error('fail'); }
          received.push(n);
        },
      };
      const transfer = new AsyncWriteTransfer<number>({
        flow,
        maxConcurrency: 1,
        bufferSize: 1,
        onError: () => {},
      });

      transfer.asyncPush(1);  // starts (blocked, will fail)
      transfer.asyncPush(2);  // queued

      resolveTask!();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 1 failed (error suppressed), 2 processed from buffer
      expect(received).toEqual([2]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncWriteTransfer bufferSize=0 without onBufferOverflow silently drops test',
  () => {
    it('', async () => {
      const received: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const flow = {
        write: async (n: number) => {
          if (n === 1) await taskPromise;
          received.push(n);
        },
      };
      const transfer = new AsyncWriteTransfer<number>({
        flow,
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
      expect(received).toEqual([1]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncWriteTransfer destroy clears buffer test',
  () => {
    it('', async () => {
      const received: number[] = [];
      let resolveTask: () => void;
      const taskPromise = new Promise<void>((resolve) => { resolveTask = resolve; });

      const flow = {
        write: async (n: number) => {
          if (n === 1) await taskPromise;
          received.push(n);
        },
      };
      const transfer = new AsyncWriteTransfer<number>({
        flow,
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
      expect(received).not.toContain(2);
      expect(received).not.toContain(3);
    });
  },
);

