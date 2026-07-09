import { MapOperator } from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// MapOperator
// ═══════════════════════════════════════════════════════════════
// Converter — applies a transformation function to input data.
// Used to change the type or value of data in a pipeline.

describe.each([
  ...dataProviderForMapOperator(),
] as Array<[number, number]>)(
  'ConverterOperator test',
  (input: number, expected: number) => {
    it('', () => {
      const operator = new MapOperator<number, number>((n) => n * 2);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for ConverterOperator (multiply by 2).
 * Verifies transformation correctness:
 * - Boundary values (0, negatives)
 * - Typical values
 * - Large numbers
 */
function dataProviderForMapOperator(): Array<unknown> {
  return [
    [0, 0],        // 0 * 2 = 0
    [1, 2],        // Basic case
    [2, 4],        // Positive number
    [5, 10],       // Average value
    [-3, -6],      // Negative number
    [100, 200],    // Large number
  ];
}

describe.each([
  ...dataProviderForConverterOperatorStringToNumber(),
] as Array<[string, number]>)(
  'ConverterOperator string to number test',
  (input: string, expected: number) => {
    it('', () => {
      const operator = new MapOperator<string, number>((s) => parseInt(s, 10));
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for ConverterOperator (string → number).
 * Verifies conversion of strings to numbers:
 * - Valid numeric strings
 * - Negative numbers in strings
 * - Boundary values
 */
function dataProviderForConverterOperatorStringToNumber(): Array<unknown> {
  return [
    ['1', 1],      // Simple number
    ['42', 42],    // Two-digit number
    ['0', 0],      // Zero in string
    ['-5', -5],    // Negative number
    ['100', 100],  // Three-digit number
  ];
}
