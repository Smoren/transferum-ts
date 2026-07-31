import type { ErrorHandler } from "./types";

/**
 * Universal error handler.
 * If onError is provided — calls it and suppresses the exception.
 * If onError is not provided — rethrows the exception.
 *
 * @category Utilities
 */
export function handleError<TSource>(error: unknown, source: TSource, onError?: ErrorHandler<TSource>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (onError !== undefined) {
    onError(err, source);
  } else {
    throw err;
  }
}
