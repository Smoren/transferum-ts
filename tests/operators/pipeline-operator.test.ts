import {
  TransparentOperator,
  MapOperator,
  FilterOperator,
  ReducerOperator,
  GuardOperator,
  PipelineOperator,
} from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PipelineOperator
// ═══════════════════════════════════════════════════════════════
// PipelineOperator — composes multiple processors into a chain.
// Applies processors sequentially: output of one → input of the next.
// Used for complex data transformations in a pipeline.
//
// Key features:
// - Sequential application of processors
// - Support for type transformation at each stage
// - Early termination on undefined
// - Composition of processors of different types

// ═══════════════════════════════════════════════════════════════
// PipelineOperator Constructor & Single Operator
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPipelineOperatorSingle(),
] as Array<[number, number]>)(
  'PipelineOperator with single operator test',
  (input: number, expected: number) => {
    it('', () => {
      const operator = new PipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n * 2),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with a single processor.
 * Verifies that a pipeline with a single processor works correctly.
 */
function dataProviderForPipelineOperatorSingle(): Array<unknown> {
  return [
    [0, 0],        // 0 * 2 = 0
    [1, 2],        // 1 * 2 = 2
    [5, 10],       // 5 * 2 = 10
    [-3, -6],      // -3 * 2 = -6
    [100, 200],    // 100 * 2 = 200
  ];
}

// ═══════════════════════════════════════════════════════════════
// PipelineOperator Multiple Operators Chain
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPipelineOperatorTwoOperators(),
] as Array<[number, number]>)(
  'PipelineOperator with two operators chain test',
  (input: number, expected: number) => {
    it('', () => {
      // Chain: multiply by 2 → add 10
      const operator = new PipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, number>((n) => n + 10),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with two processors.
 * Verifies the chain: (input * 2) + 10
 */
function dataProviderForPipelineOperatorTwoOperators(): Array<unknown> {
  return [
    [0, 10],     // (0 * 2) + 10 = 10
    [1, 12],     // (1 * 2) + 10 = 12
    [5, 20],     // (5 * 2) + 10 = 20
    [-3, 4],     // (-3 * 2) + 10 = 4
    [100, 210],  // (100 * 2) + 10 = 210
  ];
}

describe.each([
  ...dataProviderForPipelineOperatorThreeOperators(),
] as Array<[number, number]>)(
  'PipelineOperator with three operators chain test',
  (input: number, expected: number) => {
    it('', () => {
      // Chain: add 10 → multiply by 2 → subtract 5
      const operator = new PipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n + 10),
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, number>((n) => n - 5),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with three processors.
 * Verifies the chain: ((input + 10) * 2) - 5
 */
function dataProviderForPipelineOperatorThreeOperators(): Array<unknown> {
  return [
    [0, 15],     // ((0 + 10) * 2) - 5 = 15
    [1, 17],     // ((1 + 10) * 2) - 5 = 17
    [5, 25],     // ((5 + 10) * 2) - 5 = 25
    [-3, 9],     // ((-3 + 10) * 2) - 5 = 9
    [10, 35],    // ((10 + 10) * 2) - 5 = 35
  ];
}

describe.each([
  ...dataProviderForPipelineOperatorManyOperators(),
] as Array<[number, number]>)(
  'PipelineOperator with many operators chain test',
  (input: number, expected: number) => {
    it('', () => {
      const operator = new PipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n + 1),
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, number>((n) => n - 1),
        new MapOperator<number, number>((n) => Math.floor(n / 2)),
        new MapOperator<number, number>((n) => n + 10),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with many processors.
 * Verifies a chain of 5 processors.
 */
function dataProviderForPipelineOperatorManyOperators(): Array<unknown> {
  return [
    [0, 10],
    [1, 11],
    [5, 15],
    [10, 20],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PipelineOperator Type Transformation
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPipelineOperatorTypeTransformation(),
] as Array<[string, string]>)(
  'PipelineOperator type transformation chain test',
  (input: string, expected: string) => {
    it('', () => {
      // Chain: string → number → string
      const operator = new PipelineOperator<string, string>([
        new MapOperator<string, number>((s) => parseInt(s, 10)),
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, string>((n) => `result_${n}`),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with type transformation.
 * Verifies the chain: string → number → string
 */
function dataProviderForPipelineOperatorTypeTransformation(): Array<unknown> {
  return [
    ['5', 'result_10'],      // 5 * 2 = 10
    ['10', 'result_20'],     // 10 * 2 = 20
    ['0', 'result_0'],       // 0 * 2 = 0
    ['21', 'result_42'],     // 21 * 2 = 42
  ];
}

describe.each([
  ...dataProviderForPipelineOperatorObjectTransformation(),
] as Array<[{ name: string; age: number }, string]>)(
  'PipelineOperator object transformation chain test',
  (input: { name: string; age: number }, expected: string) => {
    it('', () => {
      // Chain: object → string
      const operator = new PipelineOperator<{ name: string; age: number }, string>([
        new MapOperator<{ name: string; age: number }, string>(
          (obj) => `${obj.name}_${obj.age}`
        ),
        new MapOperator<string, string>((s) => s.toUpperCase()),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with object transformation.
 * Verifies the chain: object → string → uppercase
 */
function dataProviderForPipelineOperatorObjectTransformation(): Array<unknown> {
  return [
    [{ name: 'alice', age: 30 }, 'ALICE_30'],
    [{ name: 'bob', age: 25 }, 'BOB_25'],
    [{ name: 'charlie', age: 35 }, 'CHARLIE_35'],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PipelineOperator Filter + Transform
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPipelineOperatorFilterTransform(),
] as Array<[number[], number]>)(
  'PipelineOperator filter then transform test',
  (input: number[], expected: number) => {
    it('', () => {
      // Chain: filter even → sum
      const operator = new PipelineOperator<number[], number>([
        new FilterOperator<number>((n) => n % 2 === 0),
        new ReducerOperator<number>((acc, curr) => acc + curr, 0),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with filter and transform.
 * Verifies the chain: filter even → sum
 */
function dataProviderForPipelineOperatorFilterTransform(): Array<unknown> {
  return [
    [[1, 2, 3, 4, 5], 6],      // Even: [2, 4], sum: 6
    [[2, 4, 6], 12],           // All even, sum: 12
    [[1, 3, 5], 0],            // No even numbers, sum: 0
    [[], 0],                   // Empty array, sum: 0
    [[0, 1, 2], 2],            // With zero (0 is even), sum: 2
  ];
}

describe.each([
  ...dataProviderForPipelineOperatorGuardTransform(),
] as Array<[string, string | undefined]>)(
  'PipelineOperator guard then transform test',
  (input: string, expected: string | undefined) => {
    it('', () => {
      const operator = new PipelineOperator<string, string | undefined>([
        new GuardOperator<string | undefined>((s): s is string => s !== undefined && s.includes('@')),
        new MapOperator<string | undefined, string | undefined>((s) => s !== undefined ? s.toUpperCase() : undefined),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with guard and transform.
 * Verifies the chain: email validation → uppercase
 */
function dataProviderForPipelineOperatorGuardTransform(): Array<unknown> {
  return [
    ['test@example.com', 'TEST@EXAMPLE.COM'],
    ['user@domain.org', 'USER@DOMAIN.ORG'],
    ['invalid', undefined],
    ['no-at.com', undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PipelineOperator Empty Operators Array
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPipelineOperatorEmpty(),
] as Array<[unknown, unknown]>)(
  'PipelineOperator with empty operators array test',
  (input: unknown, expected: unknown) => {
    it('', () => {
      // Empty pipeline returns input data unchanged
      const operator = new PipelineOperator<unknown, unknown>([]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with an empty operators array.
 * Verifies that an empty pipeline returns input data unchanged.
 */
function dataProviderForPipelineOperatorEmpty(): Array<unknown> {
  return [
    [0, 0],                    // Number
    ['test', 'test'],          // String
    [null, null],              // Null
    [undefined, undefined],    // Undefined
    [{ a: 1 }, { a: 1 }],      // Object
    [[1, 2, 3], [1, 2, 3]],    // Array
  ];
}

// ═══════════════════════════════════════════════════════════════
// PipelineOperator Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineOperator handles zero value test',
  () => {
    it('', () => {
      const operator = new PipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, number>((n) => n + 1),
      ]);
      expect(operator.apply(0)).toEqual(1);  // (0 * 2) + 1 = 1
    });
  },
);

describe.each([
  ...dataProviderForPipelineOperatorNegativeValue(),
] as Array<[number, number]>)(
  'PipelineOperator handles negative value test',
  (input: number, expected: number) => {
    it('', () => {
      const operator = new PipelineOperator<number, number>([
        new MapOperator<number, number>((n) => n * 2),
        new MapOperator<number, number>((n) => n - 5),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with negative values.
 * Verifies that negative numbers are processed correctly.
 */
function dataProviderForPipelineOperatorNegativeValue(): Array<unknown> {
  return [
    [-1, -7],     // (-1 * 2) - 5 = -7
    [-10, -25],   // (-10 * 2) - 5 = -25
    [-100, -205], // (-100 * 2) - 5 = -205
  ];
}

describe.each([
  ...dataProviderForPipelineOperatorIdentityChain(),
] as Array<[number, number]>)(
  'PipelineOperator identity chain test',
  (input: number, expected: number) => {
    it('', () => {
      // Chain of identity operators
      const operator = new PipelineOperator<number, number>([
        new TransparentOperator<number>(),
        new TransparentOperator<number>(),
        new TransparentOperator<number>(),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with an identity chain.
 * Verifies that a chain of identity operators does not modify data.
 */
function dataProviderForPipelineOperatorIdentityChain(): Array<unknown> {
  return [
    [0, 0],
    [1, 1],
    [100, 100],
    [-50, -50],
  ];
}

describe.each([
  ...dataProviderForPipelineOperatorComplexChain(),
] as Array<[number, string]>)(
  'PipelineOperator complex transformation chain test',
  (input: number, expected: string) => {
    it('', () => {
      const operator = new PipelineOperator<number, string>([
        new MapOperator<number, number>((n) => n * 10),
        new GuardOperator<number>((n) => n > 0),
        new MapOperator<number | undefined, string>((n) => n !== undefined ? `val_${n}` : 'invalid'),
        new MapOperator<string, string>((s) => s.toUpperCase()),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with a complex chain.
 * Verifies a combination of different operator types.
 */
function dataProviderForPipelineOperatorComplexChain(): Array<unknown> {
  return [
    [5, 'VAL_50'],
    [10, 'VAL_100'],
    [1, 'VAL_10'],
    [-5, 'INVALID'],
  ];
}

describe.each([
  ...dataProviderForPipelineOperatorGuardBlocksChain(),
] as Array<[number, undefined]>)(
  'PipelineOperator guard blocks chain execution test',
  (input: number, expected: undefined) => {
    it('', () => {
      const operator = new PipelineOperator<number, undefined>([
        new MapOperator<number, number>((n) => n * 10),
        new GuardOperator<number>((n) => n > 0),
        new MapOperator<number | undefined, undefined>((n) => n !== undefined ? `val_${n}` as unknown as undefined : undefined),
      ]);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for PipelineOperator with guard blocking.
 * Verifies that a guard blocks the execution of subsequent operators.
 */
function dataProviderForPipelineOperatorGuardBlocksChain(): Array<unknown> {
  return [
    [-5, undefined],
    [-10, undefined],
    [0, undefined],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PipelineOperator Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe('PipelineOperator data validation pipeline test', () => {
  it('', () => {
    interface UserData { name: string; email: string; age: number }
    interface ValidUserData { name: string; email: string; age: number; isAdult: boolean }

    const operator = new PipelineOperator<UserData, ValidUserData | undefined>([
      new GuardOperator<UserData | undefined>((data): data is UserData => data !== undefined && data.name.length > 0),
      new GuardOperator<UserData | undefined>((data): data is UserData => data !== undefined && data.email.includes('@')),
      new GuardOperator<UserData | undefined>((data): data is UserData => data !== undefined && data.age >= 0),
      new MapOperator<UserData | undefined, ValidUserData | undefined>((data) => {
        if (data === undefined) return undefined;
        return {
          ...data,
          isAdult: data.age >= 18,
        };
      }),
    ]);

    const validUser: UserData = { name: 'Alice', email: 'alice@example.com', age: 25 };
    const invalidUser: UserData = { name: '', email: 'invalid', age: -5 };

    expect(operator.apply(validUser)).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      age: 25,
      isAdult: true,
    });

    expect(operator.apply(invalidUser)).toBeUndefined();
  });
});

describe('PipelineOperator numeric computation pipeline test', () => {
  it('', () => {
    const operator = new PipelineOperator<number, number>([
      new MapOperator<number, number>((n) => n + 100),
      new MapOperator<number, number>((n) => n * 2),
      new MapOperator<number, number>((n) => n - 50),
      new MapOperator<number, number>((n) => Math.floor(n / 2)),
    ]);

    expect(operator.apply(50)).toBe(125);
    expect(operator.apply(0)).toBe(75);
    expect(operator.apply(100)).toBe(175);
  });
});

describe('PipelineOperator string applying pipeline test', () => {
  it('', () => {
    const operator = new PipelineOperator<string, string | undefined>([
      new MapOperator<string, string>((s) => s.trim()),
      new MapOperator<string, string>((s) => s.toLowerCase()),
      new GuardOperator<string>((s) => s.length > 0),
      new MapOperator<string | undefined, string>((s) => s !== undefined ? `hello_${s}` : 'empty'),
    ]);

    expect(operator.apply('  ALICE  ')).toBe('hello_alice');
    expect(operator.apply('  BOB  ')).toBe('hello_bob');
    expect(operator.apply('   ')).toBe('empty');
  });
});

