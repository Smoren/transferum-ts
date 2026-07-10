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
