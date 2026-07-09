import { AsyncReadTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncReadTransfer
// ═══════════════════════════════════════════════════════════════
// Async read adapter for an AsyncOutputFlowInterface.
// Capabilities: isOutput, isAsyncPullable

// ═══════════════════════════════════════════════════════════════
// AsyncReadTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncReadTransfer has correct capability flags test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncReadTransfer<number>({ flow });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isAsyncPushable).toBe(false);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isAsyncPullable).toBe(true);
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
// AsyncReadTransfer asyncPull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncReadPull(),
] as Array<[number | undefined]>)(
  'AsyncReadTransfer asyncPull returns flow.read result test',
  (value: number | undefined) => {
    it('', async () => {
      const read = jest.fn(async () => value);
      const transfer = new AsyncReadTransfer<number>({ flow: { read } });

      const result = await transfer.asyncPull();

      expect(read).toHaveBeenCalledTimes(1);
      expect(result).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing asyncPull.
 */
function dataProviderForAsyncReadPull(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
    [undefined],
  ];
}

describe(
  'AsyncReadTransfer asyncPull returns Promise test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncReadTransfer<number>({ flow });
      const result = transfer.asyncPull();
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncReadTransfer asyncPull multiple calls test',
  () => {
    it('', async () => {
      let counter = 0;
      const flow = {
        read: async () => { counter++; return counter; },
      };
      const transfer = new AsyncReadTransfer<number>({ flow });

      expect(await transfer.asyncPull()).toBe(1);
      expect(await transfer.asyncPull()).toBe(2);
      expect(await transfer.asyncPull()).toBe(3);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncReadTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncReadTransfer asyncPull with onError suppresses error test',
  () => {
    it('', async () => {
      const error = new Error('read error');
      const onError = jest.fn();
      const flow = { read: async () => { throw error; } };
      const transfer = new AsyncReadTransfer<number>({ flow, onError });

      const result = await transfer.asyncPull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncReadTransfer asyncPull without onError rethrows test',
  () => {
    it('', async () => {
      const flow = { read: async () => { throw new Error('read error'); } };
      const transfer = new AsyncReadTransfer<number>({ flow });

      await expect(transfer.asyncPull()).rejects.toThrow('read error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncReadTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncReadTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = new AsyncReadTransfer<number>({ flow });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

describe(
  'AsyncReadTransfer destroy does not affect flow test',
  () => {
    it('', () => {
      const read = jest.fn(async () => 0);
      const transfer = new AsyncReadTransfer<number>({ flow: { read } });

      transfer.destroy();

      // destroy — no-op, flow remains untouched
      expect(read).not.toHaveBeenCalled();
    });
  },
);
