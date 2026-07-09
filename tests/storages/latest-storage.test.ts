import { LatestStorage } from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// LatestStorage
// ═══════════════════════════════════════════════════════════════
// LatestStorage stores only the last written value.
// Each new write overwrites the previous value.
// size is always 0 (empty) or 1 (has value).

describe.each([
  ...dataProviderForLatestStorageWriteRead(),
] as Array<[unknown, unknown]>)(
  'LatestStorage write and read test',
  (input: unknown, expected: unknown) => {
    it('', () => {
      const storage = new LatestStorage<unknown>();
      storage.write(input);
      expect(storage.read()).toEqual(expected);
    });
  },
);

/**
 * Data provider for LatestStorage (basic write/read).
 * Verifies that storage works for all data types:
 * - Primitives (number, string)
 * - Special values (null)
 * - Complex types (objects, arrays)
 */
function dataProviderForLatestStorageWriteRead(): Array<unknown> {
  return [
    [1, 1],                    // Number
    ['test', 'test'],          // String
    [null, null],              // Null
    [{ a: 1 }, { a: 1 }],      // Object
    [[1, 2, 3], [1, 2, 3]],    // Array
  ];
}

describe.each([
  ...dataProviderForLatestStorageOverwrite(),
] as Array<[unknown, unknown, unknown]>)(
  'LatestStorage overwrite test',
  (first: unknown, second: unknown, expected: unknown) => {
    it('', () => {
      const storage = new LatestStorage<unknown>();
      storage.write(first);
      storage.write(second);
      expect(storage.read()).toEqual(expected);
    });
  },
);

/**
 * Data provider for LatestStorage (value overwrite).
 * Verifies that the second write completely replaces the first.
 */
function dataProviderForLatestStorageOverwrite(): Array<unknown> {
  return [
    [1, 2, 2],                  // Number is overwritten
    ['old', 'new', 'new'],      // String is overwritten
    [null, 'value', 'value'],   // Null is replaced by string
    [0, 1, 1],                  // Zero is replaced by one
  ];
}

describe.each([
  ...dataProviderForLatestStorageSize(),
] as Array<[unknown, number]>)(
  'LatestStorage size test',
  (value: unknown, expected: number) => {
    it('', () => {
      const storage = new LatestStorage<unknown>();
      expect(storage.size).toBe(0);  // Empty storage
      storage.write(value);
      expect(storage.size).toBe(expected);  // After write size = 1
    });
  },
);

/**
 * Data provider for LatestStorage (size check).
 * Verifies that size is always 1 after writing any value.
 */
function dataProviderForLatestStorageSize(): Array<unknown> {
  return [
    [1, 1],       // Number
    ['test', 1],  // String
    [null, 1],    // Null is also considered a value
    [{}, 1],      // Object
  ];
}

describe.each([
  ...dataProviderForLatestStorageClear(),
] as Array<[unknown]>)(
  'LatestStorage clear test',
  (value: unknown) => {
    it('', () => {
      const storage = new LatestStorage<unknown>();
      storage.write(value);
      storage.clear();
      expect(storage.read()).toBeUndefined();  // After clear, read returns undefined
      expect(storage.size).toBe(0);             // size becomes 0
    });
  },
);

/**
 * Data provider for LatestStorage (clearing).
 * Verifies that clear() completely empties the storage.
 */
function dataProviderForLatestStorageClear(): Array<unknown> {
  return [
    [1],        // Number
    ['test'],   // String
    [null],     // Null
    [[]],       // Array
  ];
}

describe.each([
  ...dataProviderForLatestStorageReset(),
] as Array<[unknown, unknown, unknown]>)(
  'LatestStorage reset test',
  (defaultValue: unknown, value: unknown, expected: unknown) => {
    it('', () => {
      const storage = new LatestStorage<unknown>(defaultValue);
      storage.write(value);
      storage.reset();
      expect(storage.read()).toEqual(expected);
    });
  },
);

/**
 * Data provider for LatestStorage (reset to default).
 * Verifies that reset() restores the value from the constructor.
 */
function dataProviderForLatestStorageReset(): Array<unknown> {
  return [
    [0, 5, 0],                    // Number: default=0, written=5, after reset=0
    ['default', 'new', 'default'],// String
    [null, 'value', null],        // Null as default
    [{ a: 1 }, { b: 2 }, { a: 1 }],// Object as default
  ];
}

describe.each([
  ...dataProviderForLatestStorageDefaultConstructor(),
] as Array<[unknown]>)(
  'LatestStorage default constructor value test',
  (defaultValue: unknown) => {
    it('', () => {
      const storage = new LatestStorage<unknown>(defaultValue);
      expect(storage.read()).toEqual(defaultValue);  // Initial value from constructor
      expect(storage.size).toBe(1);                   // size = 1, because value exists
    });
  },
);

/**
 * Data provider for LatestStorage (default value).
 * Verifies that the constructor with a parameter sets the initial value.
 */
function dataProviderForLatestStorageDefaultConstructor(): Array<unknown> {
  return [
    [0],        // Number
    ['default'],// String
    [null],     // Null
    [[]],       // Empty array
  ];
}
