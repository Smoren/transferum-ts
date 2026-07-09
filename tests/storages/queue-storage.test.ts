import { QueueStorage, StackStorage } from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// QueueStorage
// ═══════════════════════════════════════════════════════════════
// QueueStorage implements a FIFO queue (First In, First Out).
// The first written element is read first.
// Supports an optional maxLength limit.

describe.each([
  ...dataProviderForQueueStorageFifo(),
] as Array<[number[], number[]]>)(
  'QueueStorage FIFO order test',
  (inputs: number[], expected: number[]) => {
    it('', () => {
      const storage = new QueueStorage<number>();
      inputs.forEach((n) => storage.write(n));

      const results: number[] = [];
      let value: number | undefined;
      while ((value = storage.read()) !== undefined) {
        results.push(value);
      }

      expect(results).toEqual(expected);
    });
  },
);

/**
 * Data provider for QueueStorage (FIFO order).
 * Verifies that elements are read in the same order they were written.
 */
function dataProviderForQueueStorageFifo(): Array<unknown> {
  return [
    [[], []],              // Empty queue
    [[1], [1]],            // One element
    [[1, 2], [1, 2]],      // Two elements: first written = first read
    [[1, 2, 3], [1, 2, 3]],// Three elements
    [[3, 2, 1], [3, 2, 1]],// Reverse write order
  ];
}

describe.each([
  ...dataProviderForQueueStorageSize(),
] as Array<[number[], number]>)(
  'QueueStorage size test',
  (inputs: number[], expected: number) => {
    it('', () => {
      const storage = new QueueStorage<number>();
      inputs.forEach((n) => storage.write(n));
      expect(storage.size).toBe(expected);
    });
  },
);

/**
 * Data provider for QueueStorage (queue size).
 * Verifies that size equals the number of written elements.
 */
function dataProviderForQueueStorageSize(): Array<unknown> {
  return [
    [[], 0],                // Empty queue
    [[1], 1],               // One element
    [[1, 2, 3], 3],         // Three elements
    [[1, 2, 3, 4, 5], 5],   // Five elements
  ];
}

describe.each([
  ...dataProviderForQueueStorageClear(),
] as Array<[number[]]>)(
  'QueueStorage clear test',
  (inputs: number[]) => {
    it('', () => {
      const storage = new QueueStorage<number>();
      inputs.forEach((n) => storage.write(n));
      storage.clear();
      expect(storage.read()).toBeUndefined();  // Queue is empty
      expect(storage.size).toBe(0);             // size = 0
    });
  },
);

/**
 * Data provider for QueueStorage (clearing).
 * Verifies that clear() completely empties the queue.
 */
function dataProviderForQueueStorageClear(): Array<unknown> {
  return [
    [[]],           // Empty queue
    [[1]],          // One element
    [[1, 2, 3]],    // Three elements
  ];
}

describe.each([
  ...dataProviderForQueueStorageMaxLength(),
] as Array<[number, number[], number]>)(
  'QueueStorage maxLength limit test',
  (maxLength: number, inputs: number[], expectedSize: number) => {
    it('', () => {
      const storage = new QueueStorage<number>(maxLength);
      inputs.forEach((n) => storage.write(n));
      expect(storage.size).toBe(expectedSize);
    });
  },
);

/**
 * Data provider for QueueStorage (maxLength limit).
 * Verifies that the queue size does not exceed maxLength.
 * When the limit is exceeded, old elements are removed.
 */
function dataProviderForQueueStorageMaxLength(): Array<unknown> {
  return [
    [3, [1, 2, 3], 3],              // Exactly at limit
    [3, [1, 2, 3, 4], 3],           // Exceeded by 1
    [3, [1, 2, 3, 4, 5], 3],        // Exceeded by 2
    [5, [1, 2, 3, 4, 5, 6, 7], 5],  // Exceeded by 2
    [1, [1, 2, 3, 4, 5], 1],        // Minimum limit
  ];
}

describe.each([
  ...dataProviderForQueueStorageMaxLengthContent(),
] as Array<[number, number[], number[]]>)(
  'QueueStorage maxLength content test',
  (maxLength: number, inputs: number[], expected: number[]) => {
    it('', () => {
      const storage = new QueueStorage<number>(maxLength);
      inputs.forEach((n) => storage.write(n));

      const results: number[] = [];
      let value: number | undefined;
      while ((value = storage.read()) !== undefined) {
        results.push(value);
      }

      expect(results).toEqual(expected);
    });
  },
);

/**
 * Data provider for QueueStorage (contents with maxLength).
 * Verifies that when the limit is exceeded, the oldest elements are removed (from the beginning).
 * The queue retains the last maxLength elements.
 */
function dataProviderForQueueStorageMaxLengthContent(): Array<unknown> {
  return [
    [3, [1, 2, 3, 4], [2, 3, 4]],      // 1 removed (oldest)
    [3, [1, 2, 3, 4, 5], [3, 4, 5]],   // 1, 2 removed
    [2, [1, 2, 3, 4, 5], [4, 5]],      // 1, 2, 3 removed
    [5, [1, 2, 3], [1, 2, 3]],         // No removal (limit not reached)
  ];
}

describe.each([
  ...dataProviderForQueueStorageGetMaxLength(),
] as Array<[number | undefined, number | undefined]>)(
  'QueueStorage get maxLength test',
  (maxLength: number | undefined, expected: number | undefined) => {
    it('', () => {
      const storage = new QueueStorage<number>(maxLength);
      expect(storage.maxLength).toBe(expected);
    });
  },
);

/**
 * Data provider for QueueStorage (maxLength getter).
 * Verifies that maxLength is returned correctly.
 */
function dataProviderForQueueStorageGetMaxLength(): Array<unknown> {
  return [
    [undefined, undefined],  // No limit
    [5, 5],                  // Limit = 5
    [1, 1],                  // Minimum limit
    [100, 100],              // Large limit
  ];
}

describe.each([
  ...dataProviderForQueueStorageReset(),
] as Array<[number, number[], number]>)(
  'QueueStorage reset test',
  (maxLength: number, inputs: number[], expectedSize: number) => {
    it('', () => {
      const storage = new QueueStorage<number>(maxLength);
      inputs.forEach((n) => storage.write(n));
      storage.reset();
      expect(storage.size).toBe(expectedSize);
    });
  },
);

/**
 * Data provider for QueueStorage (reset).
 * reset() calls clear(), so size becomes 0.
 */
function dataProviderForQueueStorageReset(): Array<unknown> {
  return [
    [3, [1, 2, 3], 0],
    [5, [1, 2, 3, 4, 5, 6], 0],
    [1, [1, 2], 0],
  ];
}
