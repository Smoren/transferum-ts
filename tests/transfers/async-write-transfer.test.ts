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
      expect(onError).toHaveBeenCalledWith(error);

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
