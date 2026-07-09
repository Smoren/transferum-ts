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
      expect(onError).toHaveBeenCalledWith(error);
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
