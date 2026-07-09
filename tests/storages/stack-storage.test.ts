import { StackStorage } from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// StackStorage
// ═══════════════════════════════════════════════════════════════
// StackStorage implements a LIFO stack (Last In, First Out).
// The last written element is read first.
// Supports an optional maxLength limit.

describe.each([
  ...dataProviderForStackStorageLifo(),
] as Array<[number[], number[]]>)(
  'StackStorage LIFO order test',
  (inputs: number[], expected: number[]) => {
    it('', () => {
      const storage = new StackStorage<number>();
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
 * Data provider for StackStorage (LIFO order).
 * Verifies that elements are read in reverse order of writing.
 */
function dataProviderForStackStorageLifo(): Array<unknown> {
  return [
    [[], []],              // Empty stack
    [[1], [1]],            // One element
    [[1, 2], [2, 1]],      // Two elements: last written = first read
    [[1, 2, 3], [3, 2, 1]],// Three elements: reverse order
    [[3, 2, 1], [1, 2, 3]],// Reverse write order → forward read order
  ];
}

describe.each([
  ...dataProviderForStackStorageSize(),
] as Array<[number[], number]>)(
  'StackStorage size test',
  (inputs: number[], expected: number) => {
    it('', () => {
      const storage = new StackStorage<number>();
      inputs.forEach((n) => storage.write(n));
      expect(storage.size).toBe(expected);
    });
  },
);

/**
 * Data provider for StackStorage (stack size).
 * Verifies that size equals the number of written elements.
 */
function dataProviderForStackStorageSize(): Array<unknown> {
  return [
    [[], 0],                // Empty stack
    [[1], 1],               // One element
    [[1, 2, 3], 3],         // Three elements
    [[1, 2, 3, 4, 5], 5],   // Five elements
  ];
}

describe.each([
  ...dataProviderForStackStorageClear(),
] as Array<[number[]]>)(
  'StackStorage clear test',
  (inputs: number[]) => {
    it('', () => {
      const storage = new StackStorage<number>();
      inputs.forEach((n) => storage.write(n));
      storage.clear();
      expect(storage.read()).toBeUndefined();  // Stack is empty
      expect(storage.size).toBe(0);             // size = 0
    });
  },
);

/**
 * Data provider for StackStorage (clearing).
 * Verifies that clear() completely empties the stack.
 */
function dataProviderForStackStorageClear(): Array<unknown> {
  return [
    [[]],           // Empty stack
    [[1]],          // One element
    [[1, 2, 3]],    // Three elements
  ];
}

describe.each([
  ...dataProviderForStackStorageMaxLength(),
] as Array<[number, number[], number]>)(
  'StackStorage maxLength limit test',
  (maxLength: number, inputs: number[], expectedSize: number) => {
    it('', () => {
      const storage = new StackStorage<number>(maxLength);
      inputs.forEach((n) => storage.write(n));
      expect(storage.size).toBe(expectedSize);
    });
  },
);

/**
 * Data provider for StackStorage (maxLength limit).
 * Verifies that the stack size does not exceed maxLength.
 * When the limit is exceeded, old elements are removed (from the beginning of the stack).
 */
function dataProviderForStackStorageMaxLength(): Array<unknown> {
  return [
    [3, [1, 2, 3], 3],              // Exactly at limit
    [3, [1, 2, 3, 4], 3],           // Exceeded by 1
    [3, [1, 2, 3, 4, 5], 3],        // Exceeded by 2
    [5, [1, 2, 3, 4, 5, 6, 7], 5],  // Exceeded by 2
    [1, [1, 2, 3, 4, 5], 1],        // Minimum limit
  ];
}

describe.each([
  ...dataProviderForStackStorageMaxLengthContent(),
] as Array<[number, number[], number[]]>)(
  'StackStorage maxLength content test',
  (maxLength: number, inputs: number[], expected: number[]) => {
    it('', () => {
      const storage = new StackStorage<number>(maxLength);
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
 * Data provider for StackStorage (contents with maxLength).
 * Verifies that when the limit is exceeded, the oldest elements are removed (from the beginning of the array).
 * The stack retains the last maxLength elements and reads them in reverse order (LIFO).
 */
function dataProviderForStackStorageMaxLengthContent(): Array<unknown> {
  return [
    [3, [1, 2, 3, 4], [4, 3, 2]],      // 1 removed, stack: [2,3,4], LIFO read: 4,3,2
    [3, [1, 2, 3, 4, 5], [5, 4, 3]],   // 1,2 removed, stack: [3,4,5], LIFO read: 5,4,3
    [2, [1, 2, 3, 4, 5], [5, 4]],      // 1,2,3 removed, stack: [4,5], LIFO read: 5,4
    [5, [1, 2, 3], [3, 2, 1]],         // No removal, LIFO read: 3,2,1
  ];
}

describe.each([
  ...dataProviderForStackStorageGetMaxLength(),
] as Array<[number | undefined, number | undefined]>)(
  'StackStorage get maxLength test',
  (maxLength: number | undefined, expected: number | undefined) => {
    it('', () => {
      const storage = new StackStorage<number>(maxLength);
      expect(storage.maxLength).toBe(expected);
    });
  },
);

/**
 * Data provider for StackStorage (maxLength getter).
 * Verifies that maxLength is returned correctly.
 */
function dataProviderForStackStorageGetMaxLength(): Array<unknown> {
  return [
    [undefined, undefined],  // No limit
    [5, 5],                  // Limit = 5
    [1, 1],                  // Minimum limit
    [100, 100],              // Large limit
  ];
}

describe.each([
  ...dataProviderForStackStorageReset(),
] as Array<[number, number[], number]>)(
  'StackStorage reset test',
  (maxLength: number, inputs: number[], expectedSize: number) => {
    it('', () => {
      const storage = new StackStorage<number>(maxLength);
      inputs.forEach((n) => storage.write(n));
      storage.reset();
      expect(storage.size).toBe(expectedSize);
    });
  },
);

/**
 * Data provider for StackStorage (reset).
 * reset() calls clear(), so size becomes 0.
 */
function dataProviderForStackStorageReset(): Array<unknown> {
  return [
    [3, [1, 2, 3], 0],
    [5, [1, 2, 3, 4, 5, 6], 0],
    [1, [1, 2], 0],
  ];
}
