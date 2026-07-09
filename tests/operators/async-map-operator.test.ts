import { AsyncMapOperator } from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncMapOperator
// ═══════════════════════════════════════════════════════════════
// AsyncMapOperator — async converter. Applies a transform function
// to input data. The mapper can be synchronous (return a value directly)
// or asynchronous (return a Promise).
// apply() always returns a Promise.

// ═══════════════════════════════════════════════════════════════
// AsyncMapOperator with sync mapper
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncMapOperatorSyncMapper(),
] as Array<[number, number]>)(
  'AsyncMapOperator with sync mapper test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, number>((n) => n * 2);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncMapOperator with a sync mapper (multiply by 2).
 * Verifies the correctness of the transformation:
 * - Boundary values (0, negatives)
 * - Typical values
 * - Large numbers
 */
function dataProviderForAsyncMapOperatorSyncMapper(): Array<unknown> {
  return [
    [0, 0],
    [1, 2],
    [5, 10],
    [-3, -6],
    [100, 200],
  ];
}

describe.each([
  ...dataProviderForAsyncMapOperatorSyncStringMapper(),
] as Array<[string, number]>)(
  'AsyncMapOperator with sync mapper string to number test',
  (input: string, expected: number) => {
    it('', async () => {
      const operator = new AsyncMapOperator<string, number>((s) => parseInt(s, 10));
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncMapOperator (string → number, sync mapper).
 */
function dataProviderForAsyncMapOperatorSyncStringMapper(): Array<unknown> {
  return [
    ['1', 1],
    ['42', 42],
    ['0', 0],
    ['-5', -5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncMapOperator with async mapper
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncMapOperatorAsyncMapper(),
] as Array<[number, number]>)(
  'AsyncMapOperator with async mapper test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, number>(async (n) => {
        return Promise.resolve(n * 3);
      });
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncMapOperator with an async mapper (multiply by 3).
 */
function dataProviderForAsyncMapOperatorAsyncMapper(): Array<unknown> {
  return [
    [0, 0],
    [1, 3],
    [5, 15],
    [-3, -9],
    [100, 300],
  ];
}

describe.each([
  ...dataProviderForAsyncMapOperatorAsyncStringMapper(),
] as Array<[string, string]>)(
  'AsyncMapOperator with async mapper string transformation test',
  (input: string, expected: string) => {
    it('', async () => {
      const operator = new AsyncMapOperator<string, string>(async (s) => {
        return Promise.resolve(s.toUpperCase());
      });
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncMapOperator (async uppercase).
 */
function dataProviderForAsyncMapOperatorAsyncStringMapper(): Array<unknown> {
  return [
    ['hello', 'HELLO'],
    ['world', 'WORLD'],
    ['test', 'TEST'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncMapOperator type transformation
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncMapOperatorTypeTransformation(),
] as Array<[number, string]>)(
  'AsyncMapOperator type transformation number to string test',
  (input: number, expected: string) => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, string>((n) => `val_${n}`);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncMapOperator (number → string).
 */
function dataProviderForAsyncMapOperatorTypeTransformation(): Array<unknown> {
  return [
    [0, 'val_0'],
    [42, 'val_42'],
    [-1, 'val_-1'],
  ];
}

describe.each([
  ...dataProviderForAsyncMapOperatorObjectTransformation(),
] as Array<[{ id: number; name: string }, string]>)(
  'AsyncMapOperator object transformation test',
  (input: { id: number; name: string }, expected: string) => {
    it('', async () => {
      const operator = new AsyncMapOperator<{ id: number; name: string }, string>(
        (obj) => `${obj.name}_${obj.id}`,
      );
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncMapOperator (object → string).
 */
function dataProviderForAsyncMapOperatorObjectTransformation(): Array<unknown> {
  return [
    [{ id: 1, name: 'test' }, 'test_1'],
    [{ id: 42, name: 'answer' }, 'answer_42'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncMapOperator edge cases
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncMapOperator handles null value test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<null, string>((n) => 'is_null');
      const result = await operator.apply(null);
      expect(result).toEqual('is_null');
    });
  },
);

describe(
  'AsyncMapOperator handles undefined value test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<undefined, string>((n) => 'is_undefined');
      const result = await operator.apply(undefined);
      expect(result).toEqual('is_undefined');
    });
  },
);

describe(
  'AsyncMapOperator async mapper with delayed resolution test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, number>((n) => {
        return new Promise<number>((resolve) => {
          setTimeout(() => resolve(n * 10), 10);
        });
      });
      const result = await operator.apply(5);
      expect(result).toEqual(50);
    });
  },
);

describe(
  'AsyncMapOperator returns Promise from apply test',
  () => {
    it('', () => {
      const operator = new AsyncMapOperator<number, number>((n) => n + 1);
      const result = operator.apply(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncMapOperator sync mapper still returns Promise test',
  () => {
    it('', () => {
      const operator = new AsyncMapOperator<number, number>((n) => n + 1);
      // Even a sync mapper — apply returns a Promise
      const result = operator.apply(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncMapOperator async mapper propagates rejection test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, number>(async () => {
        throw new Error('mapper error');
      });
      await expect(operator.apply(42)).rejects.toThrow('mapper error');
    });
  },
);
