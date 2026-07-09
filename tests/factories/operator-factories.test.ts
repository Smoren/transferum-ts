import {
  createTransparentOperator,
  createMapOperator,
  createFilterOperator,
  createReducerOperator,
  createGuardOperator,
  createPipelineOperator,
  createConvertTransfer,
  createPushChannelTransfer,
  createSinkTransfer,
  createTransformBridge,
  TransparentOperator,
  MapOperator,
  FilterOperator,
  ReducerOperator,
  PipelineOperator,
} from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// createTransparentOperator
// ═══════════════════════════════════════════════════════════════

describe.each([
  [0, 0],
  [1, 1],
  ['test', 'test'],
  [null, null],
  [undefined, undefined],
  [{ a: 1 }, { a: 1 }],
  [[1, 2, 3], [1, 2, 3]],
] as Array<[unknown, unknown]>)(
  'createTransparentOperator returns input unchanged test',
  (input, expected) => {
    it('', () => {
      const op = createTransparentOperator<unknown>();
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createMapOperator
// ═══════════════════════════════════════════════════════════════

describe.each([
  [0, 0],
  [1, 2],
  [5, 10],
  [-3, -6],
  [100, 200],
] as Array<[number, number]>)(
  'createMapOperator number transform test',
  (input, expected) => {
    it('', () => {
      const op = createMapOperator<number, number>((n) => n * 2);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  ['1', 1],
  ['42', 42],
  ['0', 0],
  ['-5', -5],
] as Array<[string, number]>)(
  'createMapOperator string to number test',
  (input, expected) => {
    it('', () => {
      const op = createMapOperator<string, number>((s) => parseInt(s, 10));
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe(
  'createMapOperator object transform test',
  () => {
    it('', () => {
      const op = createMapOperator<{ value: number }, number>((obj) => obj.value * 10);
      expect(op.apply({ value: 5 })).toBe(50);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createFilterOperator
// ═══════════════════════════════════════════════════════════════

describe.each([
  [[], []],
  [[1], []],
  [[2], [2]],
  [[1, 2, 3, 4], [2, 4]],
  [[2, 4, 6], [2, 4, 6]],
  [[1, 3, 5], []],
] as Array<[number[], number[]]>)(
  'createFilterOperator even numbers test',
  (input, expected) => {
    it('', () => {
      const op = createFilterOperator<number>((n) => n % 2 === 0);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [[], []],
  [[-1], []],
  [[1], [1]],
  [[-1, 0, 1, 2], [1, 2]],
  [[1, 2, 3], [1, 2, 3]],
] as Array<[number[], number[]]>)(
  'createFilterOperator positive numbers test',
  (input, expected) => {
    it('', () => {
      const op = createFilterOperator<number>((n) => n > 0);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createReducerOperator
// ═══════════════════════════════════════════════════════════════

describe.each([
  [[], undefined],
  [[1], 1],
  [[1, 2], 3],
  [[1, 2, 3], 6],
  [[-1, -2, -3], -6],
] as Array<[number[], number | undefined]>)(
  'createReducerOperator sum without default test',
  (input, expected) => {
    it('', () => {
      const op = createReducerOperator<number>((acc, curr) => acc + curr);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [[], 0],
  [[1], 1],
  [[1, 2], 3],
  [[1, 2, 3], 6],
] as Array<[number[], number]>)(
  'createReducerOperator sum with default 0 test',
  (input, expected) => {
    it('', () => {
      const op = createReducerOperator<number>((acc, curr) => acc + curr, 0);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe(
  'createReducerOperator sum with default 100 test',
  () => {
    it('', () => {
      const op = createReducerOperator<number>((acc, curr) => acc + curr, 100);
      expect(op.apply([])).toBe(100);
    });
  },
);

describe.each([
  [[], undefined],
  [[5], 5],
  [[2, 3], 6],
  [[2, 3, 4], 24],
  [[0, 1, 2], 0],
] as Array<[number[], number | undefined]>)(
  'createReducerOperator product test',
  (input, expected) => {
    it('', () => {
      const op = createReducerOperator<number>((acc, curr) => acc * curr);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createGuardOperator
// ═══════════════════════════════════════════════════════════════

describe.each([
  ['test@example.com', 'test@example.com'],
  ['user@domain.org', 'user@domain.org'],
  ['invalid', undefined],
  ['no-at-sign.com', undefined],
  ['@', '@'],
] as Array<[string, string | undefined]>)(
  'createGuardOperator email validation test',
  (input, expected) => {
    it('', () => {
      const op = createGuardOperator<string>((s) => s.includes('@'));
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [1, 1],
  [100, 100],
  [0.5, 0.5],
  [0, undefined],
  [-1, undefined],
] as Array<[number, number | undefined]>)(
  'createGuardOperator positive number test',
  (input, expected) => {
    it('', () => {
      const op = createGuardOperator<number>((n) => n > 0);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  ['test', 'test'],
  ['a', 'a'],
  ['', undefined],
] as Array<[string, string | undefined]>)(
  'createGuardOperator non-empty string test',
  (input, expected) => {
    it('', () => {
      const op = createGuardOperator<string>((s) => s.length > 0);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createPipelineOperator
// ═══════════════════════════════════════════════════════════════

describe.each([
  [0, 0],
  [1, 2],
  [5, 10],
  [-3, -6],
] as Array<[number, number]>)(
  'createPipelineOperator single operator test',
  (input, expected) => {
    it('', () => {
      const op = createPipelineOperator<number, number>([
        createMapOperator<number, number>((n) => n * 2),
      ]);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [0, 10],
  [1, 12],
  [5, 20],
  [-3, 4],
] as Array<[number, number]>)(
  'createPipelineOperator two operators chain test',
  (input, expected) => {
    it('', () => {
      const op = createPipelineOperator<number, number>([
        createMapOperator<number, number>((n) => n * 2),
        createMapOperator<number, number>((n) => n + 10),
      ]);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [0, 15],
  [1, 17],
  [5, 25],
  [-3, 9],
] as Array<[number, number]>)(
  'createPipelineOperator three operators chain test',
  (input, expected) => {
    it('', () => {
      const op = createPipelineOperator<number, number>([
        createMapOperator<number, number>((n) => n + 10),
        createMapOperator<number, number>((n) => n * 2),
        createMapOperator<number, number>((n) => n - 5),
      ]);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  ['5', 'result_10'],
  ['10', 'result_20'],
  ['0', 'result_0'],
] as Array<[string, string]>)(
  'createPipelineOperator type transformation test',
  (input, expected) => {
    it('', () => {
      const op = createPipelineOperator<string, string>([
        createMapOperator<string, number>((s) => parseInt(s, 10)),
        createMapOperator<number, number>((n) => n * 2),
        createMapOperator<number, string>((n) => `result_${n}`),
      ]);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [[1, 2, 3, 4, 5], 6],
  [[2, 4, 6], 12],
  [[1, 3, 5], 0],
  [[], 0],
] as Array<[number[], number]>)(
  'createPipelineOperator filter then reduce test',
  (input, expected) => {
    it('', () => {
      const op = createPipelineOperator<number[], number>([
        createFilterOperator<number>((n) => n % 2 === 0),
        createReducerOperator<number>((acc, curr) => acc + curr, 0),
      ]);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [0, 0],
  ['test', 'test'],
  [null, null],
  [undefined, undefined],
  [{ a: 1 }, { a: 1 }],
] as Array<[unknown, unknown]>)(
  'createPipelineOperator empty operators test',
  (input, expected) => {
    it('', () => {
      const op = createPipelineOperator<unknown, unknown>([]);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

describe.each([
  [5, 'VAL_50'],
  [10, 'VAL_100'],
  [-5, 'INVALID'],
] as Array<[number, string]>)(
  'createPipelineOperator complex chain test',
  (input, expected) => {
    it('', () => {
      const op = createPipelineOperator<number, string>([
        createMapOperator<number, number>((n) => n * 10),
        createGuardOperator<number>((n) => n > 0),
        createMapOperator<number | undefined, string>((n) =>
          n !== undefined ? `val_${n}` : 'invalid'
        ),
        createMapOperator<string, string>((s) => s.toUpperCase()),
      ]);
      expect(op.apply(input)).toEqual(expected);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Tests with direct operator creation (not via factories)
// ═══════════════════════════════════════════════════════════════

describe(
  'createMapOperator mixed with direct MapOperator test',
  () => {
    it('', () => {
      const directOp = new MapOperator<number, number>((n) => n + 1);
      const factoryOp = createMapOperator<number, number>((n) => n * 3);

      const pipeline = createPipelineOperator<number, number>([
        directOp,
        factoryOp,
      ]);

      // (5 + 1) * 3 = 18
      expect(pipeline.apply(5)).toBe(18);
    });
  },
);

describe(
  'createPipelineOperator with direct operators test',
  () => {
    it('', () => {
      const pipeline = createPipelineOperator<number[], number>([
        new FilterOperator<number>((n) => n > 2),
        new ReducerOperator<number>((acc, curr) => acc + curr, 0),
      ]);

      // [1, 2, 3, 4, 5] → filter > 2 → [3, 4, 5] → sum = 12
      expect(pipeline.apply([1, 2, 3, 4, 5])).toBe(12);
    });
  },
);

describe(
  'createGuardOperator mixed with direct TransparentOperator test',
  () => {
    it('', () => {
      const guard = createGuardOperator<number>((n) => n > 0);
      const transparent = new TransparentOperator<number>();

      const pipeline = createPipelineOperator<number, number | undefined>([
        transparent,
        guard,
      ]);

      expect(pipeline.apply(5)).toBe(5);
      expect(pipeline.apply(-1)).toBeUndefined();
    });
  },
);

describe(
  'createFilterOperator mixed with direct PipelineOperator test',
  () => {
    it('', () => {
      const filter = createFilterOperator<number>((n) => n % 2 === 0);
      const innerPipeline = new PipelineOperator<number[], number>([
        new ReducerOperator<number>((acc, curr) => acc + curr, 0),
      ]);

      const outerPipeline = createPipelineOperator<number[], number>([
        filter,
        innerPipeline,
      ]);

      // [1, 2, 3, 4] → filter even → [2, 4] → sum = 6
      expect(outerPipeline.apply([1, 2, 3, 4])).toBe(6);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Integration tests: operators + transfers + bridges
// ═══════════════════════════════════════════════════════════════

describe(
  'createMapOperator integration with ConvertTransfer test',
  () => {
    it('', () => {
      const converter = createConvertTransfer<number, string>({
        operator: createMapOperator<number, string>((n) => `val_${n}`),
      });

      const received: string[] = [];
      converter.subscribe((s) => received.push(s));
      converter.push(42);

      expect(received).toEqual(['val_42']);
    });
  },
);

describe(
  'createGuardOperator integration with ConvertTransfer test',
  () => {
    it('', () => {
      const converter = createConvertTransfer<number, number | undefined>({
        operator: createGuardOperator<number>((n) => n > 0),
      });

      const received: (number | undefined)[] = [];
      converter.subscribe((s) => received.push(s));

      converter.push(5);
      converter.push(-3);
      converter.push(10);

      expect(received).toEqual([5, 10]);
    });
  },
);

describe(
  'createPipelineOperator integration with TransformBridge test',
  () => {
    it('', () => {
      const source = createPushChannelTransfer<number>();
      const received: string[] = [];
      const target = createSinkTransfer<string>({ callback: (s) => received.push(s) });

      const bridge = createTransformBridge<number, string>({
        source,
        target,
        operator: createPipelineOperator<number, string>([
          createMapOperator<number, number>((n) => n * 2),
          createMapOperator<number, string>((n) => `result_${n}`),
        ]),
        activated: true,
      });

      source.push(21);
      source.push(0);

      expect(received).toEqual(['result_42', 'result_0']);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createFilterOperator integration with TransformBridge test',
  () => {
    it('', () => {
      const source = createPushChannelTransfer<number[]>();
      const received: number[][] = [];
      const target = createSinkTransfer<number[]>({ callback: (s) => received.push(s) });

      const bridge = createTransformBridge<number[], number[]>({
        source,
        target,
        operator: createFilterOperator<number>((n) => n > 2),
        activated: true,
      });

      source.push([1, 2, 3, 4, 5]);

      expect(received).toEqual([[3, 4, 5]]);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createReducerOperator integration with ConvertTransfer test',
  () => {
    it('', () => {
      const converter = createConvertTransfer<number[], number | undefined>({
        operator: createReducerOperator<number>((acc, curr) => acc + curr, 0),
      });

      const received: (number | undefined)[] = [];
      converter.subscribe((s) => received.push(s));

      converter.push([1, 2, 3]);
      converter.push([]);
      converter.push([10, 20]);

      expect(received).toEqual([6, 0, 30]);
    });
  },
);

describe(
  'createTransparentOperator integration with ConvertTransfer test',
  () => {
    it('', () => {
      const converter = createConvertTransfer<number, number>({
        operator: createTransparentOperator<number>(),
      });

      const received: number[] = [];
      converter.subscribe((s) => received.push(s));

      converter.push(42);
      converter.push(100);

      expect(received).toEqual([42, 100]);
    });
  },
);

describe(
  'Full pipeline with factory operators and direct operators test',
  () => {
    it('', () => {
      const source = createPushChannelTransfer<number>();
      const received: string[] = [];
      const target = createSinkTransfer<string>({ callback: (s) => received.push(s) });

      const bridge = createTransformBridge<number, string>({
        source,
        target,
        operator: createPipelineOperator<number, string>([
          new MapOperator<number, number>((n) => n + 1),
          createGuardOperator<number>((n) => n > 0),
          createMapOperator<number | undefined, string>((n) =>
            n !== undefined ? `val_${n}` : 'blocked'
          ),
        ]),
        activated: true,
      });

      source.push(5);   // 5 + 1 = 6 > 0 → "val_6"
      source.push(-10); // -10 + 1 = -9 <= 0 → "blocked"

      expect(received).toEqual(['val_6', 'blocked']);

      bridge.destroy();
      source.destroy();
    });
  },
);
