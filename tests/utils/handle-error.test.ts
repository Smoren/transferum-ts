import { handleError } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// handleError
// ═══════════════════════════════════════════════════════════════
// handleError — a universal error handler.
// If onError is provided — calls it and suppresses the exception.
// If onError is not provided — rethrows the exception.

describe.each([
  ...dataProviderForHandleErrorThrowsWithoutOnError(),
] as Array<[string]>)(
  'handleError throws error when onError is not provided test',
  (errorMessage: string) => {
    it('', () => {
      const error = new Error(errorMessage);

      expect(() => handleError(error)).toThrow(errorMessage);
    });
  },
);

/**
 * Data provider for testing error rethrowing.
 */
function dataProviderForHandleErrorThrowsWithoutOnError(): Array<unknown> {
  return [
    ['Test error'],
    ['Something went wrong'],
  ];
}

describe.each([
  ...dataProviderForHandleErrorCallsOnError(),
] as Array<[string]>)(
  'handleError calls onError when provided test',
  (errorMessage: string) => {
    it('', () => {
      const error = new Error(errorMessage);
      const onError = jest.fn();

      expect(() => handleError(error, onError)).not.toThrow();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
    });
  },
);

/**
 * Data provider for testing onError invocation.
 */
function dataProviderForHandleErrorCallsOnError(): Array<unknown> {
  return [
    ['Test error'],
    ['Something went wrong'],
  ];
}

describe.each([
  ...dataProviderForHandleErrorSuppressesException(),
] as Array<[]>)(
  'handleError suppresses exception when onError is provided test',
  () => {
    it('', () => {
      const error = new Error('Test error');
      const onError = jest.fn();

      // Exception suppressed
      expect(() => handleError(error, onError)).not.toThrow();
    });
  },
);

/**
 * Data provider for testing exception suppression.
 */
function dataProviderForHandleErrorSuppressesException(): Array<unknown> {
  return [[]];
}

describe.each([
  ...dataProviderForHandleErrorConvertsNonErrorToError(),
] as Array<[string]>)(
  'handleError converts non-Error to Error test',
  (errorValue: string) => {
    it('', () => {
      const onError = jest.fn();

      handleError(errorValue, onError);

      expect(onError).toHaveBeenCalledTimes(1);
      const calledError = onError.mock.calls[0][0];
      expect(calledError).toBeInstanceOf(Error);
      expect((calledError as Error).message).toBe(errorValue);
    });
  },
);

/**
 * Data provider for testing conversion of non-Error to Error.
 */
function dataProviderForHandleErrorConvertsNonErrorToError(): Array<unknown> {
  return [
    ['String error'],
    ['Another error'],
  ];
}

describe.each([
  ...dataProviderForHandleErrorWithNumber(),
] as Array<[number]>)(
  'handleError converts number to Error test',
  (errorCode: number) => {
    it('', () => {
      const onError = jest.fn();

      handleError(errorCode, onError);

      expect(onError).toHaveBeenCalledTimes(1);
      const calledError = onError.mock.calls[0][0];
      expect(calledError).toBeInstanceOf(Error);
      expect((calledError as Error).message).toBe(String(errorCode));
    });
  },
);

/**
 * Data provider for testing conversion of a number to Error.
 */
function dataProviderForHandleErrorWithNumber(): Array<unknown> {
  return [
    [404],
    [500],
  ];
}

describe.each([
  ...dataProviderForHandleErrorThrowsNonError(),
] as Array<[string]>)(
  'handleError throws Error when non-Error passed without onError test',
  (errorValue: string) => {
    it('', () => {
      expect(() => handleError(errorValue)).toThrow(errorValue);
    });
  },
);

/**
 * Data provider for testing rethrowing of non-Error.
 */
function dataProviderForHandleErrorThrowsNonError(): Array<unknown> {
  return [
    ['String error without handler'],
    ['Another error without handler'],
  ];
}

