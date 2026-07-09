import {
  TransparentOperator,
  MapOperator,
  FilterOperator,
  ReducerOperator,
  GuardOperator,
  PipelineOperator,
  OperatorPipelineBuilder,
} from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder
// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder — fluent API for building processor chains.
// Provides type-safe construction of PipelineOperator via the add() method.
//
// Key features:
// - Type-safe addition of processors (output of previous = input of next)
// - Support for overloads for the first and subsequent processors
// - The build() method returns a ready PipelineOperator
// - Immutability: each add() creates a new builder instance
//
// Configuration:
// - TFlow: tuple of types [TInput, TStep1, TStep2, ..., TOutput]
// - The first add() sets the initial and final type
// - Subsequent add() require the input to match Last<TFlow>
//
// Mechanism:
// 1. OperatorPipelineBuilder.create() creates an empty builder
// 2. add(operator) adds a processor to the chain
// 3. build() creates a PipelineOperator from the accumulated processors

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Constructor & Create
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBuilderCreate(),
] as Array<[]>)(
  'OperatorPipelineBuilder create returns empty builder test',
  () => {
    it('', () => {
      const builder = OperatorPipelineBuilder.create();
      expect(builder).toBeDefined();
    });
  },
);

/**
 * Data provider for testing empty builder creation.
 */
function dataProviderForBuilderCreate(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForBuilderInitialState(),
] as Array<[number]>)(
  'OperatorPipelineBuilder initial state test',
  (value: number) => {
    it('', () => {
      const builder = OperatorPipelineBuilder.create();
      const pipeline = builder
        .add(new MapOperator<number, number>((n) => n * 2))
        .build();

      expect(pipeline.apply(value)).toEqual(value * 2);
    });
  },
);

/**
 * Data provider for testing initial builder state.
 */
function dataProviderForBuilderInitialState(): Array<unknown> {
  return [
    [0],
    [1],
    [10],
    [-5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Single Operator
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBuilderSingleOperator(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder with single operator test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n * 2))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with a single processor.
 */
function dataProviderForBuilderSingleOperator(): Array<unknown> {
  return [
    [0, 0],
    [1, 2],
    [5, 10],
    [-3, -6],
    [100, 200],
  ];
}

describe.each([
  ...dataProviderForBuilderSingleTransparentOperator(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder with single transparent operator test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new TransparentOperator<number>())
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with a transparent processor.
 */
function dataProviderForBuilderSingleTransparentOperator(): Array<unknown> {
  return [
    [0, 0],
    [1, 1],
    [10, 10],
    [-5, -5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Multiple Operators Chain
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBuilderTwoOperators(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder with two operators chain test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n * 2))
        .add(new MapOperator<number, number>((n) => n + 10))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with two processors.
 * Verifies the chain: (input * 2) + 10
 */
function dataProviderForBuilderTwoOperators(): Array<unknown> {
  return [
    [0, 10],
    [1, 12],
    [5, 20],
    [-3, 4],
    [100, 210],
  ];
}

describe.each([
  ...dataProviderForBuilderThreeOperators(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder with three operators chain test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n + 10))
        .add(new MapOperator<number, number>((n) => n * 2))
        .add(new MapOperator<number, number>((n) => n - 5))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with three processors.
 * Verifies the chain: ((input + 10) * 2) - 5
 */
function dataProviderForBuilderThreeOperators(): Array<unknown> {
  return [
    [0, 15],
    [1, 17],
    [5, 25],
    [-3, 9],
    [10, 35],
  ];
}

describe.each([
  ...dataProviderForBuilderManyOperators(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder with many operators chain test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n + 1))
        .add(new MapOperator<number, number>((n) => n * 2))
        .add(new MapOperator<number, number>((n) => n - 1))
        .add(new MapOperator<number, number>((n) => Math.floor(n / 2)))
        .add(new MapOperator<number, number>((n) => n + 10))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with many processors.
 */
function dataProviderForBuilderManyOperators(): Array<unknown> {
  return [
    [0, 10],
    [1, 11],
    [5, 15],
    [10, 20],
  ];
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Type Transformation
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBuilderTypeTransformation(),
] as Array<[string, string]>)(
  'OperatorPipelineBuilder type transformation chain test',
  (input: string, expected: string) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<string, number>((s) => parseInt(s, 10)))
        .add(new MapOperator<number, number>((n) => n * 2))
        .add(new MapOperator<number, string>((n) => `result_${n}`))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with type transformation.
 */
function dataProviderForBuilderTypeTransformation(): Array<unknown> {
  return [
    ['5', 'result_10'],
    ['10', 'result_20'],
    ['0', 'result_0'],
    ['21', 'result_42'],
  ];
}

describe.each([
  ...dataProviderForBuilderObjectTransformation(),
] as Array<[{ name: string; age: number }, string]>)(
  'OperatorPipelineBuilder object transformation chain test',
  (input: { name: string; age: number }, expected: string) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<{ name: string; age: number }, string>(
          (obj) => `${obj.name}_${obj.age}`
        ))
        .add(new MapOperator<string, string>((s) => s.toUpperCase()))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with object transformation.
 */
function dataProviderForBuilderObjectTransformation(): Array<unknown> {
  return [
    [{ name: 'alice', age: 30 }, 'ALICE_30'],
    [{ name: 'bob', age: 25 }, 'BOB_25'],
    [{ name: 'charlie', age: 35 }, 'CHARLIE_35'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Mixed Operator Types
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBuilderFilterThenReduce(),
] as Array<[number[], number]>)(
  'OperatorPipelineBuilder filter then reduce chain test',
  (input: number[], expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new FilterOperator<number>((n) => n % 2 === 0))
        .add(new ReducerOperator<number>((acc, curr) => acc + curr, 0))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with filter and reducer.
 */
function dataProviderForBuilderFilterThenReduce(): Array<unknown> {
  return [
    [[1, 2, 3, 4, 5], 6],
    [[2, 4, 6], 12],
    [[1, 3, 5], 0],
    [[], 0],
    [[0, 1, 2], 2],
  ];
}

describe.each([
  ...dataProviderForBuilderMultipleFilters(),
] as Array<[number[], number[]]>)(
  'OperatorPipelineBuilder multiple filters chain test',
  (input: number[], expected: number[]) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new FilterOperator<number>((n) => n > 0))
        .add(new FilterOperator<number>((n) => n % 2 === 0))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with multiple filters.
 */
function dataProviderForBuilderMultipleFilters(): Array<unknown> {
  return [
    [[-2, -1, 0, 1, 2, 3, 4], [2, 4]],
    [[1, 3, 5], []],
    [[2, 4, 6], [2, 4, 6]],
    [[], []],
  ];
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Builder Immutability
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBuilderImmutability(),
] as Array<[number, number, number]>)(
  'OperatorPipelineBuilder immutability test',
  (input: number, expected1: number, expected2: number) => {
    it('', () => {
      const builder1 = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n * 2));

      const builder2 = builder1.add(new MapOperator<number, number>((n) => n + 10));

      const pipeline1 = builder1.build();
      const pipeline2 = builder2.build();

      expect(pipeline1.apply(input)).toEqual(expected1);
      expect(pipeline2.apply(input)).toEqual(expected2);
    });
  },
);

/**
 * Data provider for testing builder immutability.
 */
function dataProviderForBuilderImmutability(): Array<unknown> {
  return [
    [5, 10, 20],
    [0, 0, 10],
    [10, 20, 30],
  ];
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Edge Cases
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForBuilderZeroValue(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder handles zero value test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n * 2))
        .add(new MapOperator<number, number>((n) => n + 1))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with zero value.
 */
function dataProviderForBuilderZeroValue(): Array<unknown> {
  return [
    [0, 1],
  ];
}

describe.each([
  ...dataProviderForBuilderNegativeValue(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder handles negative value test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n * 2))
        .add(new MapOperator<number, number>((n) => n - 5))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with negative values.
 */
function dataProviderForBuilderNegativeValue(): Array<unknown> {
  return [
    [-1, -7],
    [-10, -25],
    [-100, -205],
  ];
}

describe.each([
  ...dataProviderForBuilderIdentityChain(),
] as Array<[number, number]>)(
  'OperatorPipelineBuilder identity chain test',
  (input: number, expected: number) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new TransparentOperator<number>())
        .add(new TransparentOperator<number>())
        .add(new TransparentOperator<number>())
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with identity chain.
 */
function dataProviderForBuilderIdentityChain(): Array<unknown> {
  return [
    [0, 0],
    [1, 1],
    [100, 100],
    [-50, -50],
  ];
}

describe.each([
  ...dataProviderForBuilderComplexChain(),
] as Array<[number, string]>)(
  'OperatorPipelineBuilder complex transformation chain test',
  (input: number, expected: string) => {
    it('', () => {
      const pipeline = OperatorPipelineBuilder
        .create()
        .add(new MapOperator<number, number>((n) => n * 10))
        .add(new GuardOperator<number>((n) => n > 0))
        .add(new MapOperator<number | undefined, string>((n) => n !== undefined ? `val_${n}` : 'invalid'))
        .add(new MapOperator<string, string>((s) => s.toUpperCase()))
        .build();

      expect(pipeline.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for testing builder with a complex chain.
 */
function dataProviderForBuilderComplexChain(): Array<unknown> {
  return [
    [5, 'VAL_50'],
    [10, 'VAL_100'],
    [1, 'VAL_10'],
    [-5, 'INVALID'],  // Guard blocks, but Converter handles undefined
  ];
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe('OperatorPipelineBuilder data validation pipeline test', () => {
  it('', () => {
    interface UserData { name: string; email: string; age: number }
    interface ValidUserData { name: string; email: string; age: number; isAdult: boolean }

    const pipeline = OperatorPipelineBuilder
      .create()
      .add(new GuardOperator<UserData | undefined>((data): data is UserData => data !== undefined && data.name.length > 0))
      .add(new GuardOperator<UserData | undefined>((data): data is UserData => data !== undefined && data.email.includes('@')))
      .add(new GuardOperator<UserData | undefined>((data): data is UserData => data !== undefined && data.age >= 0))
      .add(new MapOperator<UserData | undefined, ValidUserData | undefined>((data) => {
        if (data === undefined) return undefined;
        return {
          ...data,
          isAdult: data.age >= 18,
        };
      }))
      .build();

    const validUser: UserData = { name: 'Alice', email: 'alice@example.com', age: 25 };
    const invalidUser: UserData = { name: '', email: 'invalid', age: -5 };

    expect(pipeline.apply(validUser)).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      age: 25,
      isAdult: true,
    });

    expect(pipeline.apply(invalidUser)).toBeUndefined();
  });
});

describe('OperatorPipelineBuilder numeric computation pipeline test', () => {
  it('', () => {
    const pipeline = OperatorPipelineBuilder
      .create()
      .add(new MapOperator<number, number>((n) => n + 100))
      .add(new MapOperator<number, number>((n) => n * 2))
      .add(new MapOperator<number, number>((n) => n - 50))
      .add(new MapOperator<number, number>((n) => Math.floor(n / 2)))
      .build();

    expect(pipeline.apply(50)).toBe(125);
    expect(pipeline.apply(0)).toBe(75);
    expect(pipeline.apply(100)).toBe(175);
  });
});

describe('OperatorPipelineBuilder string applying pipeline test', () => {
  it('', () => {
    const pipeline = OperatorPipelineBuilder
      .create()
      .add(new MapOperator<string, string>((s) => s.trim()))
      .add(new MapOperator<string, string>((s) => s.toLowerCase()))
      .add(new GuardOperator<string>((s) => s.length > 0))
      .add(new MapOperator<string | undefined, string>((s) => s !== undefined ? `hello_${s}` : 'empty'))
      .build();

    expect(pipeline.apply('  ALICE  ')).toBe('hello_alice');
    expect(pipeline.apply('  BOB  ')).toBe('hello_bob');
    expect(pipeline.apply('   ')).toBe('empty');
  });
});

describe('OperatorPipelineBuilder array applying pipeline test', () => {
  it('', () => {
    const pipeline = OperatorPipelineBuilder
      .create()
      .add(new FilterOperator<number>((n) => n > 0))
      .add(new FilterOperator<number>((n) => n % 2 === 0))
      .add(new MapOperator<number[], number>((arr) => arr[0] ?? 0))
      .build();

    expect(pipeline.apply([-2, -1, 0, 1, 2, 3, 4])).toBe(2);
    expect(pipeline.apply([1, 3, 5])).toBe(0);
    expect(pipeline.apply([2, 4, 6])).toBe(2);
    expect(pipeline.apply([])).toBe(0);
  });
});

describe('OperatorPipelineBuilder reusable pipeline test', () => {
  it('', () => {
    const numberPipeline = OperatorPipelineBuilder
      .create()
      .add(new MapOperator<number, number>((n) => n * 2))
      .add(new MapOperator<number, number>((n) => n + 1))
      .build();

    expect(numberPipeline.apply(1)).toBe(3);
    expect(numberPipeline.apply(2)).toBe(5);
    expect(numberPipeline.apply(3)).toBe(7);
    expect(numberPipeline.apply(10)).toBe(21);
  });
});

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder Comparison with PipelineOperator
// ═══════════════════════════════════════════════════════════════

describe('OperatorPipelineBuilder vs PipelineOperator direct construction test', () => {
  it('', () => {
    const operators = [
      new MapOperator<number, number>((n) => n * 2),
      new MapOperator<number, number>((n) => n + 10),
    ];

    const viaBuilder = OperatorPipelineBuilder
      .create()
      .add(new MapOperator<number, number>((n) => n * 2))
      .add(new MapOperator<number, number>((n) => n + 10))
      .build();

    const viaDirect = new PipelineOperator<number, number>(operators);

    expect(viaBuilder.apply(5)).toBe(viaDirect.apply(5));
    expect(viaBuilder.apply(10)).toBe(viaDirect.apply(10));
    expect(viaBuilder.apply(0)).toBe(viaDirect.apply(0));
  });
});
