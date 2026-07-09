import { FilterOperator } from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// FilterOperator
// ═══════════════════════════════════════════════════════════════
// Filter — keeps only array elements that satisfy the predicate.
// Returns a new array with the filtered elements.

describe.each([
  ...dataProviderForFilterOperatorEven(),
] as Array<[number[], number[]]>)(
  'FilterOperator even numbers test',
  (input: number[], expected: number[]) => {
    it('', () => {
      const operator = new FilterOperator<number>((n) => n % 2 === 0);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for FilterOperator (even numbers filter).
 * Verifies filtering:
 * - Empty array
 * - Array with no matching elements
 * - Array with all matching elements
 * - Mixed array
 */
function dataProviderForFilterOperatorEven(): Array<unknown> {
  return [
    [[], []],                           // Empty array → empty result
    [[1], []],                          // No even numbers
    [[2], [2]],                         // Single even number
    [[1, 2, 3, 4], [2, 4]],             // Mixed array
    [[2, 4, 6], [2, 4, 6]],             // All even
    [[1, 3, 5], []],                    // All odd
    [[0, 1, 2, 3, 4, 5], [0, 2, 4]],    // With zero (0 is even)
  ];
}

describe.each([
  ...dataProviderForFilterOperatorPositive(),
] as Array<[number[], number[]]>)(
  'FilterOperator positive numbers test',
  (input: number[], expected: number[]) => {
    it('', () => {
      const operator = new FilterOperator<number>((n) => n > 0);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for FilterOperator (positive numbers filter).
 * Verifies filtering:
 * - Negative numbers
 * - Zero (not positive)
 * - Positive numbers
 */
function dataProviderForFilterOperatorPositive(): Array<unknown> {
  return [
    [[], []],                  // Empty array
    [[-1], []],                // Negative
    [[1], [1]],                // Positive
    [[-1, 0, 1, 2], [1, 2]],  // Mixed with zero
    [[1, 2, 3], [1, 2, 3]],   // All positive
    [[-5, -3, -1], []],        // All negative
  ];
}
