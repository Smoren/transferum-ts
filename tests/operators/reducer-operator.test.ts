import { ReducerOperator } from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ReducerOperator
// ═══════════════════════════════════════════════════════════════
// Reducer — aggregates an array into a single value using a fold function.
// Returns undefined for an empty array without a default value.

describe.each([
  ...dataProviderForReducerOperatorSum(),
] as Array<[number[], number | undefined]>)(
  'ReducerOperator sum test',
  (input: number[], expected: number | undefined) => {
    it('', () => {
      const operator = new ReducerOperator<number>((acc, curr) => acc + curr);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for ReducerOperator (sum without default).
 * Verifies folding:
 * - Empty array → undefined
 * - Single-element array
 * - Multi-element array
 * - Negative numbers
 * - Zeros
 */
function dataProviderForReducerOperatorSum(): Array<unknown> {
  return [
    [[], undefined],         // Empty array without default → undefined
    [[1], 1],                // Single element
    [[1, 2], 3],             // Two elements
    [[1, 2, 3], 6],          // Three elements
    [[1, 2, 3, 4], 10],      // Four elements
    [[-1, -2, -3], -6],      // Negative numbers
    [[0, 0, 0], 0],          // All zeros
  ];
}

describe.each([
  ...dataProviderForReducerOperatorSumWithDefault(),
] as Array<[number[], number]>)(
  'ReducerOperator sum with default value test',
  (input: number[], expected: number) => {
    it('', () => {
      const operator = new ReducerOperator<number>((acc, curr) => acc + curr, 0);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for ReducerOperator (sum with default = 0).
 * Verifies that the default is used only for an empty array.
 */
function dataProviderForReducerOperatorSumWithDefault(): Array<unknown> {
  return [
    [[], 0],       // Empty array → default (0)
    [[1], 1],      // Single element → element sum
    [[1, 2], 3],   // Two elements → regular sum
    [[1, 2, 3], 6],// Three elements → regular sum
  ];
}

describe(
  'ReducerOperator sum with default value 100 test',
  () => {
    it('', () => {
      const operator = new ReducerOperator<number>((acc, curr) => acc + curr, 100);
      expect(operator.apply([])).toEqual(100);  // Empty array returns default = 100
    });
  },
);

describe.each([
  ...dataProviderForReducerOperatorProduct(),
] as Array<[number[], number | undefined]>)(
  'ReducerOperator product test',
  (input: number[], expected: number | undefined) => {
    it('', () => {
      const operator = new ReducerOperator<number>((acc, curr) => acc * curr);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for ReducerOperator (product).
 * Verifies the fold by multiplication:
 * - Empty array → undefined
 * - Array with zero → 0
 * - Regular numbers
 */
function dataProviderForReducerOperatorProduct(): Array<unknown> {
  return [
    [[], undefined],       // Empty array → undefined
    [[5], 5],              // Single element
    [[2, 3], 6],           // Two elements: 2*3=6
    [[2, 3, 4], 24],       // Three elements: 2*3*4=24
    [[1, 2, 3, 4], 24],    // Four elements
    [[0, 1, 2], 0],        // With zero → product = 0
  ];
}
