import { AsyncGuardOperator } from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncGuardOperator
// ═══════════════════════════════════════════════════════════════
// AsyncGuardOperator — async validator. Returns data if validation
// passes (true), or undefined if it fails. The validator can be
// synchronous (return boolean) or asynchronous (return Promise<boolean>).
// apply() always returns a Promise.

// ═══════════════════════════════════════════════════════════════
// AsyncGuardOperator with sync validator
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncGuardOperatorSyncPositiveNumber(),
] as Array<[number, number | undefined]>)(
  'AsyncGuardOperator with sync validator positive number test',
  (input: number, expected: number | undefined) => {
    it('', async () => {
      const operator = new AsyncGuardOperator<number>((n) => n > 0);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncGuardOperator (sync, positive numbers).
 */
function dataProviderForAsyncGuardOperatorSyncPositiveNumber(): Array<unknown> {
  return [
    [1, 1],
    [100, 100],
    [0.5, 0.5],
    [0, undefined],
    [-1, undefined],
    [-100, undefined],
  ];
}

describe.each([
  ...dataProviderForAsyncGuardOperatorSyncEmail(),
] as Array<[string, string | undefined]>)(
  'AsyncGuardOperator with sync validator email test',
  (input: string, expected: string | undefined) => {
    it('', async () => {
      const operator = new AsyncGuardOperator<string>((s) => s.includes('@'));
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncGuardOperator (sync, email by presence of '@').
 */
function dataProviderForAsyncGuardOperatorSyncEmail(): Array<unknown> {
  return [
    ['test@example.com', 'test@example.com'],
    ['user@domain.org', 'user@domain.org'],
    ['invalid', undefined],
    ['@', '@'],
    ['test@', 'test@'],
  ];
}

describe.each([
  ...dataProviderForAsyncGuardOperatorSyncNonEmptyString(),
] as Array<[string, string | undefined]>)(
  'AsyncGuardOperator with sync validator non-empty string test',
  (input: string, expected: string | undefined) => {
    it('', async () => {
      const operator = new AsyncGuardOperator<string>((s) => s.length > 0);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncGuardOperator (sync, non-empty string).
 */
function dataProviderForAsyncGuardOperatorSyncNonEmptyString(): Array<unknown> {
  return [
    ['test', 'test'],
    ['a', 'a'],
    ['', undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncGuardOperator with async validator
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncGuardOperatorAsyncPositiveNumber(),
] as Array<[number, number | undefined]>)(
  'AsyncGuardOperator with async validator positive number test',
  (input: number, expected: number | undefined) => {
    it('', async () => {
      const operator = new AsyncGuardOperator<number>(async (n) => {
        return Promise.resolve(n > 0);
      });
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncGuardOperator (async, positive numbers).
 */
function dataProviderForAsyncGuardOperatorAsyncPositiveNumber(): Array<unknown> {
  return [
    [1, 1],
    [100, 100],
    [0, undefined],
    [-1, undefined],
  ];
}

describe.each([
  ...dataProviderForAsyncGuardOperatorAsyncEvenNumber(),
] as Array<[number, number | undefined]>)(
  'AsyncGuardOperator with async validator even number test',
  (input: number, expected: number | undefined) => {
    it('', async () => {
      const operator = new AsyncGuardOperator<number>(async (n) => {
        return Promise.resolve(n % 2 === 0);
      });
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncGuardOperator (async, even numbers).
 */
function dataProviderForAsyncGuardOperatorAsyncEvenNumber(): Array<unknown> {
  return [
    [2, 2],
    [4, 4],
    [0, 0],
    [1, undefined],
    [3, undefined],
  ];
}

describe.each([
  ...dataProviderForAsyncGuardOperatorAsyncStringLength(),
] as Array<[string, string | undefined]>)(
  'AsyncGuardOperator with async validator string length test',
  (input: string, expected: string | undefined) => {
    it('', async () => {
      const operator = new AsyncGuardOperator<string>(async (s) => {
        return Promise.resolve(s.length >= 3);
      });
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncGuardOperator (async, string length >= 3).
 */
function dataProviderForAsyncGuardOperatorAsyncStringLength(): Array<unknown> {
  return [
    ['hello', 'hello'],
    ['abc', 'abc'],
    ['ab', undefined],
    ['', undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncGuardOperator edge cases
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncGuardOperator handles null value test',
  () => {
    it('', async () => {
      const operator = new AsyncGuardOperator<null>((n) => true);
      const result = await operator.apply(null);
      expect(result).toEqual(null);
    });
  },
);

describe(
  'AsyncGuardOperator handles undefined value test',
  () => {
    it('', async () => {
      const operator = new AsyncGuardOperator<undefined>((n) => false);
      const result = await operator.apply(undefined);
      expect(result).toBeUndefined();
    });
  },
);

describe(
  'AsyncGuardOperator returns Promise from apply test',
  () => {
    it('', () => {
      const operator = new AsyncGuardOperator<number>((n) => n > 0);
      const result = operator.apply(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncGuardOperator sync validator still returns Promise test',
  () => {
    it('', () => {
      const operator = new AsyncGuardOperator<number>((n) => true);
      const result = operator.apply(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncGuardOperator async validator with delayed resolution test',
  () => {
    it('', async () => {
      const operator = new AsyncGuardOperator<number>((n) => {
        return new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(n > 10), 10);
        });
      });
      const result = await operator.apply(42);
      expect(result).toEqual(42);

      const result2 = await operator.apply(5);
      expect(result2).toBeUndefined();
    });
  },
);

describe(
  'AsyncGuardOperator async validator propagates rejection test',
  () => {
    it('', async () => {
      const operator = new AsyncGuardOperator<number>(async () => {
        throw new Error('validator error');
      });
      await expect(operator.apply(42)).rejects.toThrow('validator error');
    });
  },
);

describe(
  'AsyncGuardOperator with object value test',
  () => {
    it('', async () => {
      interface User { id: number; active: boolean }
      const operator = new AsyncGuardOperator<User>((u) => u.active);

      const activeUser: User = { id: 1, active: true };
      const inactiveUser: User = { id: 2, active: false };

      expect(await operator.apply(activeUser)).toEqual(activeUser);
      expect(await operator.apply(inactiveUser)).toBeUndefined();
    });
  },
);
