import { BufferTransfer } from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// BufferTransfer
// ═══════════════════════════════════════════════════════════════
// BufferTransfer — passive buffer with push/pull mechanics.
// pull() extracts a value and clears it.

// ═══════════════════════════════════════════════════════════════
// BufferTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'BufferTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new BufferTransfer<unknown>();

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BufferTransfer Push & Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBufferPushPull(),
] as Array<[number, number]>)(
  'BufferTransfer push then pull returns value test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new BufferTransfer<number>();

      transfer.push(value1);
      expect(transfer.pull()).toBe(value1);

      transfer.push(value2);
      expect(transfer.pull()).toBe(value2);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing push/pull.
 */
function dataProviderForBufferPushPull(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

describe.each([
  ...dataProviderForBufferPullClears(),
] as Array<[number]>)(
  'BufferTransfer pull clears state test',
  (value: number) => {
    it('', () => {
      const transfer = new BufferTransfer<number>();

      transfer.push(value);
      expect(transfer.pull()).toBe(value);
      expect(transfer.pull()).toBeUndefined();
      expect(transfer.pull()).toBeUndefined();

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing clearing on pull().
 */
function dataProviderForBufferPullClears(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForBufferOverwrite(),
] as Array<[number, number, number]>)(
  'BufferTransfer push overwrites previous value test',
  (value1: number, value2: number, expected: number) => {
    it('', () => {
      const transfer = new BufferTransfer<number>();

      transfer.push(value1);
      transfer.push(value2);

      expect(transfer.pull()).toBe(expected);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing overwrite.
 */
function dataProviderForBufferOverwrite(): Array<unknown> {
  return [
    [1, 2, 2],
    [10, 20, 20],
    [0, 1, 1],
  ];
}

// ═══════════════════════════════════════════════════════════════
// BufferTransfer Initial Value
// ═══════════════════════════════════════════════════════════════

describe(
  'BufferTransfer default undefined test',
  () => {
    it('', () => {
      const transfer = new BufferTransfer<number>();

      expect(transfer.pull()).toBeUndefined();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BufferTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBufferDestroy(),
] as Array<[number]>)(
  'BufferTransfer destroy clears state test',
  (value: number) => {
    it('', () => {
      const transfer = new BufferTransfer<number>();

      transfer.push(value);
      transfer.destroy();

      expect(transfer.pull()).toBeUndefined();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForBufferDestroy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}
