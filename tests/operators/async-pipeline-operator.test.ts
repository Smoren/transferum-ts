import {
  AsyncMapOperator,
  AsyncGuardOperator,
  AsyncPipelineOperator,
  MapOperator,
  GuardOperator,
  TransparentOperator,
} from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator
// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator — async operator pipeline.
// Accepts both synchronous (OperatorInterface) and asynchronous
// (AsyncOperatorInterface) operators. Each step is awaited.
// apply() always returns a Promise.

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator with a single operator
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPipelineOperatorSingleSync(),
] as Array<[number, number]>)(
  'AsyncPipelineOperator with single sync operator test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n * 2),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncPipelineOperator with a single sync operator.
 */
function dataProviderForAsyncPipelineOperatorSingleSync(): Array<unknown> {
  return [
    [0, 0],
    [1, 2],
    [5, 10],
    [-3, -6],
    [100, 200],
  ];
}

describe.each([
  ...dataProviderForAsyncPipelineOperatorSingleAsync(),
] as Array<[number, number]>)(
  'AsyncPipelineOperator with single async operator test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n * 3)),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider for AsyncPipelineOperator with a single async operator.
 */
function dataProviderForAsyncPipelineOperatorSingleAsync(): Array<unknown> {
  return [
    [0, 0],
    [1, 3],
    [5, 15],
    [-3, -9],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator chains of sync operators
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPipelineOperatorTwoSync(),
] as Array<[number, number]>)(
  'AsyncPipelineOperator with two sync operators chain test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, number>((n) => n + 10),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: chain of two sync operators — (input * 2) + 10.
 */
function dataProviderForAsyncPipelineOperatorTwoSync(): Array<unknown> {
  return [
    [0, 10],
    [1, 12],
    [5, 20],
    [-3, 4],
  ];
}

describe.each([
  ...dataProviderForAsyncPipelineOperatorThreeSync(),
] as Array<[number, number]>)(
  'AsyncPipelineOperator with three sync operators chain test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n + 10),
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, number>((n) => n - 5),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: chain of three sync operators — ((input + 10) * 2) - 5.
 */
function dataProviderForAsyncPipelineOperatorThreeSync(): Array<unknown> {
  return [
    [0, 15],
    [1, 17],
    [5, 25],
    [-3, 9],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator chains of async operators
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPipelineOperatorTwoAsync(),
] as Array<[number, number]>)(
  'AsyncPipelineOperator with two async operators chain test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n * 2)),
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n + 10)),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: chain of two async operators — (input * 2) + 10.
 */
function dataProviderForAsyncPipelineOperatorTwoAsync(): Array<unknown> {
  return [
    [0, 10],
    [1, 12],
    [5, 20],
    [-3, 4],
  ];
}

describe.each([
  ...dataProviderForAsyncPipelineOperatorThreeAsync(),
] as Array<[number, number]>)(
  'AsyncPipelineOperator with three async operators chain test',
  (input: number, expected: number) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n + 10)),
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n * 2)),
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n - 5)),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: chain of three async operators — ((input + 10) * 2) - 5.
 */
function dataProviderForAsyncPipelineOperatorThreeAsync(): Array<unknown> {
  return [
    [0, 15],
    [1, 17],
    [5, 25],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator mixed chains (sync + async)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPipelineOperatorMixedChain(),
] as Array<[number, string]>)(
  'AsyncPipelineOperator mixed sync and async operators chain test',
  (input: number, expected: string) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, string>([
        new MapOperator<number, number>((n) => n * 2),
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n + 1)),
        new MapOperator<number, string>((n) => `val_${n}`),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: mixed chain — sync → async → sync.
 * Result: `val_${(input * 2) + 1}`.
 */
function dataProviderForAsyncPipelineOperatorMixedChain(): Array<unknown> {
  return [
    [0, 'val_1'],
    [5, 'val_11'],
    [10, 'val_21'],
    [-3, 'val_-5'],
  ];
}

describe.each([
  ...dataProviderForAsyncPipelineOperatorMixedGuardMap(),
] as Array<[number, string]>)(
  'AsyncPipelineOperator mixed async guard and sync map test',
  (input: number, expected: string) => {
    it('', async () => {
      // Guard returns undefined on block, but the pipeline
      // does NOT stop — undefined is passed to the next operator.
      const operator = new AsyncPipelineOperator<number, string>([
        new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0)),
        new MapOperator<number | undefined, string>((n) => `val_${n}`),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: async guard (n > 0) → sync map.
 * On guard block, undefined is returned, map receives undefined → "val_undefined".
 */
function dataProviderForAsyncPipelineOperatorMixedGuardMap(): Array<unknown> {
  return [
    [1, 'val_1'],
    [42, 'val_42'],
    [0, 'val_undefined'],
    [-5, 'val_undefined'],
  ];
}

describe.each([
  ...dataProviderForAsyncPipelineOperatorSyncGuardAsyncMap(),
] as Array<[number, number]>)(
  'AsyncPipelineOperator sync guard and async map chain test',
  (input: number, expected: number) => {
    it('', async () => {
      // Guard returns undefined on block, but the pipeline
      // does NOT stop — undefined is passed to the async map.
      const operator = new AsyncPipelineOperator<number, number>([
        new GuardOperator<number>((n) => n > 0),
        new AsyncMapOperator<number | undefined, number>(async (n) => Promise.resolve((n as number) * 10)),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: sync guard (n > 0) → async map (n * 10).
 * On block: undefined * 10 = NaN.
 */
function dataProviderForAsyncPipelineOperatorSyncGuardAsyncMap(): Array<unknown> {
  return [
    [1, 10],
    [5, 50],
    [0, NaN],
    [-1, NaN],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator type transformation
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPipelineOperatorTypeTransformation(),
] as Array<[string, string]>)(
  'AsyncPipelineOperator type transformation chain test',
  (input: string, expected: string) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<string, string>([
        new AsyncMapOperator<string, number>(async (s) => Promise.resolve(parseInt(s, 10))),
        new MapOperator<number, number>((n) => n * 2),
        new AsyncMapOperator<number, string>(async (n) => Promise.resolve(`result_${n}`)),
      ]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: string → number → number → string (async + sync).
 */
function dataProviderForAsyncPipelineOperatorTypeTransformation(): Array<unknown> {
  return [
    ['5', 'result_10'],
    ['10', 'result_20'],
    ['0', 'result_0'],
    ['21', 'result_42'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator empty operators array
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForAsyncPipelineOperatorEmpty(),
] as Array<[unknown, unknown]>)(
  'AsyncPipelineOperator with empty operators array test',
  (input: unknown, expected: unknown) => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<unknown, unknown>([]);
      const result = await operator.apply(input);
      expect(result).toEqual(expected);
    });
  },
);

/**
 * Data provider: empty operators array returns data unchanged.
 */
function dataProviderForAsyncPipelineOperatorEmpty(): Array<unknown> {
  return [
    [0, 0],
    ['test', 'test'],
    [null, null],
    [undefined, undefined],
    [{ a: 1 }, { a: 1 }],
  ];
}

// ═══════════════════════════════════════════════════════════════
// AsyncPipelineOperator edge cases
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncPipelineOperator returns Promise from apply test',
  () => {
    it('', () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n + 1),
      ]);
      const result = operator.apply(42);
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncPipelineOperator handles zero value test',
  () => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n * 2),
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n + 1)),
      ]);
      const result = await operator.apply(0);
      expect(result).toEqual(1);
    });
  },
);

describe(
  'AsyncPipelineOperator identity chain test',
  () => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new TransparentOperator<number>(),
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n)),
        new TransparentOperator<number>(),
      ]);
      const result = await operator.apply(42);
      expect(result).toEqual(42);
    });
  },
);

describe(
  'AsyncPipelineOperator async operator with delayed resolution test',
  () => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new AsyncMapOperator<number, number>((n) => {
          return new Promise<number>((resolve) => {
            setTimeout(() => resolve(n * 10), 10);
          });
        }),
        new MapOperator<number, number>((n) => n + 1),
      ]);
      const result = await operator.apply(5);
      expect(result).toEqual(51);
    });
  },
);

describe(
  'AsyncPipelineOperator async operator rejection propagates test',
  () => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new AsyncMapOperator<number, number>(async () => {
          throw new Error('async step error');
        }),
        new MapOperator<number, number>((n) => n + 1),
      ]);
      await expect(operator.apply(42)).rejects.toThrow('async step error');
    });
  },
);

describe(
  'AsyncPipelineOperator sync operator rejection propagates test',
  () => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, number>([
        new MapOperator<number, number>(() => {
          throw new Error('sync step error');
        }),
        new AsyncMapOperator<number, number>(async (n) => Promise.resolve(n)),
      ]);
      await expect(operator.apply(42)).rejects.toThrow('sync step error');
    });
  },
);

describe(
  'AsyncPipelineOperator complex mixed chain test',
  () => {
    it('', async () => {
      const operator = new AsyncPipelineOperator<number, string>([
        new MapOperator<number, number>((n) => n * 10),
        new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0)),
        new AsyncMapOperator<number | undefined, string>(async (n) =>
          Promise.resolve(n !== undefined ? `val_${n}` : 'invalid'),
        ),
        new MapOperator<string, string>((s) => s.toUpperCase()),
      ]);

      expect(await operator.apply(5)).toEqual('VAL_50');
      expect(await operator.apply(10)).toEqual('VAL_100');
      expect(await operator.apply(-5)).toEqual('INVALID');
      expect(await operator.apply(0)).toEqual('INVALID');
    });
  },
);

describe(
  'AsyncPipelineOperator guard does not block chain execution test',
  () => {
    it('', async () => {
      // Guard returns undefined on block, but the pipeline
      // does NOT stop — undefined is passed further.
      const operator = new AsyncPipelineOperator<number, number>([
        new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0)),
        new AsyncMapOperator<number | undefined, number>(async (n) => Promise.resolve((n as number) * 100)),
      ]);

      expect(await operator.apply(5)).toEqual(500);
      // On block: undefined * 100 = NaN (pipeline does not stop)
      expect(await operator.apply(-1)).toEqual(NaN);
      expect(await operator.apply(0)).toEqual(NaN);
    });
  },
);
