import { AsyncConditionTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer
// ═══════════════════════════════════════════════════════════════
// Transfer with async conditional filtering on input (shouldAccept)
// and output (shouldEmit). Predicates can be sync or async.
// Capabilities: isInput, isOutput, isDuplex, isAsyncPushable, isSubscribable

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConditionTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new AsyncConditionTransfer<number>({});

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
// AsyncConditionTransfer without predicates (passes everything by default)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncConditionNoPredicates(),
] as Array<[number]>)(
  'AsyncConditionTransfer without predicates passes all data test',
  (value: number) => {
    it('', async () => {
      const transfer = new AsyncConditionTransfer<number>({});
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing without predicates.
 */
function dataProviderForAsyncConditionNoPredicates(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer shouldAccept (sync)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncConditionShouldAcceptSync(),
] as Array<[number, number | undefined]>)(
  'AsyncConditionTransfer sync shouldAccept filters data test',
  (input: number, expected: number | undefined) => {
    it('', async () => {
      const transfer = new AsyncConditionTransfer<number>({
        shouldAccept: (n) => n > 0,
      });
      const received: (number | undefined)[] = [];
      transfer.subscribe((data) => { received.push(data); });

      await transfer.asyncPush(input);

      if (expected === undefined) {
        expect(received).toEqual([]);
      } else {
        expect(received).toEqual([expected]);
      }

      transfer.destroy();
    });
  },
);

/**
 * Data provider for shouldAccept (sync, n > 0).
 */
function dataProviderForAsyncConditionShouldAcceptSync(): Array<unknown> {
  return [
    [1, 1],
    [42, 42],
    [0, undefined],
    [-5, undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer shouldAccept (async)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncConditionShouldAcceptAsync(),
] as Array<[number, number | undefined]>)(
  'AsyncConditionTransfer async shouldAccept filters data test',
  (input: number, expected: number | undefined) => {
    it('', async () => {
      const transfer = new AsyncConditionTransfer<number>({
        shouldAccept: async (n) => Promise.resolve(n > 0),
      });
      const received: (number | undefined)[] = [];
      transfer.subscribe((data) => { received.push(data); });

      await transfer.asyncPush(input);

      if (expected === undefined) {
        expect(received).toEqual([]);
      } else {
        expect(received).toEqual([expected]);
      }

      transfer.destroy();
    });
  },
);

/**
 * Data provider for shouldAccept (async, n > 0).
 */
function dataProviderForAsyncConditionShouldAcceptAsync(): Array<unknown> {
  return [
    [1, 1],
    [42, 42],
    [0, undefined],
    [-5, undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer shouldEmit (sync)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncConditionShouldEmitSync(),
] as Array<[number, number | undefined]>)(
  'AsyncConditionTransfer sync shouldEmit controls output test',
  (input: number, expected: number | undefined) => {
    it('', async () => {
      const transfer = new AsyncConditionTransfer<number>({
        shouldEmit: (state) => state !== undefined && state < 100,
      });
      const received: (number | undefined)[] = [];
      transfer.subscribe((data) => { received.push(data); });

      await transfer.asyncPush(input);

      if (expected === undefined) {
        expect(received).toEqual([]);
      } else {
        expect(received).toEqual([expected]);
      }

      transfer.destroy();
    });
  },
);

/**
 * Data provider for shouldEmit (sync, state < 100).
 */
function dataProviderForAsyncConditionShouldEmitSync(): Array<unknown> {
  return [
    [50, 50],
    [99, 99],
    [100, undefined],
    [200, undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer shouldEmit (async)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncConditionShouldEmitAsync(),
] as Array<[number, number | undefined]>)(
  'AsyncConditionTransfer async shouldEmit controls output test',
  (input: number, expected: number | undefined) => {
    it('', async () => {
      const transfer = new AsyncConditionTransfer<number>({
        shouldEmit: async (state) => Promise.resolve(state !== undefined && state < 100),
      });
      const received: (number | undefined)[] = [];
      transfer.subscribe((data) => { received.push(data); });

      await transfer.asyncPush(input);

      if (expected === undefined) {
        expect(received).toEqual([]);
      } else {
        expect(received).toEqual([expected]);
      }

      transfer.destroy();
    });
  },
);

/**
 * Data provider for shouldEmit (async, state < 100).
 */
function dataProviderForAsyncConditionShouldEmitAsync(): Array<unknown> {
  return [
    [50, 50],
    [100, undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer shouldAccept + shouldEmit combined
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConditionTransfer combined shouldAccept and shouldEmit test',
  () => {
    it('', async () => {
      const transfer = new AsyncConditionTransfer<number>({
        shouldAccept: (n) => n > 0,         // Only positive
        shouldEmit: (state) => state! < 50, // And less than 50
      });
      const received: (number | undefined)[] = [];
      transfer.subscribe((data) => { received.push(data); });

      await transfer.asyncPush(10);   // passes both → emit
      await transfer.asyncPush(100);  // shouldAccept true, shouldEmit false → no emit
      await transfer.asyncPush(-5);   // shouldAccept false → no emit
      await transfer.asyncPush(49);   // passes both → emit

      expect(received).toEqual([10, 49]);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConditionTransfer asyncPush returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncConditionTransfer<number>({});
      const result = transfer.asyncPush(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConditionTransfer shouldAccept error with onAcceptError suppresses test',
  () => {
    it('', async () => {
      const onAcceptError = jest.fn();
      const transfer = new AsyncConditionTransfer<number>({
        shouldAccept: () => { throw new Error('accept error'); },
        onAcceptError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(42);

      expect(onAcceptError).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConditionTransfer shouldEmit error with onEmitError suppresses test',
  () => {
    it('', async () => {
      const onEmitError = jest.fn();
      const transfer = new AsyncConditionTransfer<number>({
        shouldEmit: () => {
          throw new Error('emit error');
        },
        onEmitError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(42);

      expect(onEmitError).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncConditionTransfer shouldEmit error with onEmitError suppresses test',
  () => {
    it('', async () => {
      const onEmitError = jest.fn();
      const transfer = new AsyncConditionTransfer<number>({
        shouldEmit: () => { throw new Error('emit error'); },
        onEmitError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(42);

      expect(onEmitError).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncConditionTransfer destroy stops notifications test',
  () => {
    it('', async () => {
      const transfer = new AsyncConditionTransfer<number>({});
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      await transfer.asyncPush(42);

      expect(handler).not.toHaveBeenCalled();
    });
  },
);

describe(
  'AsyncConditionTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const transfer = new AsyncConditionTransfer<number>({});

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);
