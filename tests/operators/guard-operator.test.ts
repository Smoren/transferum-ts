import { GuardOperator } from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// GuardOperator
// ═══════════════════════════════════════════════════════════════
// Guard — a data validator. Returns data if validation passes,
// or undefined if validation fails. Used for filtering
// invalid data in a pipeline.

describe.each([
  ...dataProviderForGuardOperatorValidEmail(),
] as Array<[string, string | undefined]>)(
  'GuardOperator valid email test',
  (input: string, expected: string | undefined) => {
    it('', () => {
      const operator = new GuardOperator<string>((s) => s.includes('@'));
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for GuardOperator (email validation by presence of '@').
 * Verifies:
 * - Valid emails
 * - Invalid strings (without '@')
 * - Boundary cases (only '@', '@' at end)
 */
function dataProviderForGuardOperatorValidEmail(): Array<unknown> {
  return [
    ['test@example.com', 'test@example.com'],  // Valid email
    ['user@domain.org', 'user@domain.org'],    // Valid email
    ['invalid', undefined],                     // No '@'
    ['no-at-sign.com', undefined],              // No '@'
    ['@', '@'],                                 // Only '@' (valid by predicate)
    ['test@', 'test@'],                         // '@' at end (valid by predicate)
  ];
}

describe.each([
  ...dataProviderForGuardOperatorPositiveNumber(),
] as Array<[number, number | undefined]>)(
  'GuardOperator positive number test',
  (input: number, expected: number | undefined) => {
    it('', () => {
      const operator = new GuardOperator<number>((n) => n > 0);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for GuardOperator (positive numbers validation).
 * Verifies:
 * - Positive integers and decimals
 * - Zero (not positive)
 * - Negative numbers
 */
function dataProviderForGuardOperatorPositiveNumber(): Array<unknown> {
  return [
    [1, 1],           // Positive integer
    [100, 100],       // Large positive
    [0.5, 0.5],       // Positive decimal
    [0, undefined],   // Zero → invalid
    [-1, undefined],  // Negative
    [-100, undefined],// Large negative
  ];
}

describe.each([
  ...dataProviderForGuardOperatorNonEmptyString(),
] as Array<[string, string | undefined]>)(
  'GuardOperator non-empty string test',
  (input: string, expected: string | undefined) => {
    it('', () => {
      const operator = new GuardOperator<string>((s) => s.length > 0);
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for GuardOperator (non-empty string validation).
 * Verifies:
 * - Regular strings
 * - Empty string
 */
function dataProviderForGuardOperatorNonEmptyString(): Array<unknown> {
  return [
    ['test', 'test'],  // Regular string
    ['a', 'a'],        // Single character
    ['', undefined],   // Empty string → invalid
  ];
}
