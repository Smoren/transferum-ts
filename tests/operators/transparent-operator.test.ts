import { TransparentOperator } from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// TransparentOperator
// ═══════════════════════════════════════════════════════════════
// Transparent processor — identity function, returns input data unchanged.
// Used as a stub or for testing pipelines without transformation.

describe.each([
  ...dataProviderForTransparentOperator(),
] as Array<[unknown, unknown]>)(
  'TransparentOperator test',
  (input: unknown, expected: unknown) => {
    it('', () => {
      const operator = new TransparentOperator<unknown>();
      expect(operator.apply(input)).toEqual(expected);
    });
  },
);

/**
 * Data provider for TransparentOperator.
 * Verifies that the operator returns data unchanged for all types:
 * - Primitives (number, string)
 * - Special values (null, undefined)
 * - Complex types (objects, arrays)
 */
function dataProviderForTransparentOperator(): Array<unknown> {
  return [
    [0, 0],                    // Zero
    [1, 1],                    // Positive number
    ['test', 'test'],          // String
    [null, null],              // Null
    [undefined, undefined],    // Undefined
    [{ a: 1 }, { a: 1 }],      // Object
    [[1, 2, 3], [1, 2, 3]],    // Array
  ];
}
