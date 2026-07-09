import type { OperatorInterface, AsyncOperatorInterface } from "./interfaces";

/** Identity operator — returns data unchanged. */
export class TransparentOperator<T> implements OperatorInterface<T, T> {
  apply(data: T): T {
    return data;
  }
}

/** Transform operator — applies a mapper function to input data. */
export class MapOperator<TInput, TOutput> implements OperatorInterface<TInput, TOutput> {
  private readonly _transformer: (data: TInput) => TOutput;

  constructor(mapper: (data: TInput) => TOutput) {
    this._transformer = mapper;
  }
  apply(data: TInput): TOutput {
    return this._transformer(data);
  }
}

/** Array filter operator — filters elements by predicate, returning a new array. */
export class FilterOperator<T> implements OperatorInterface<T[], T[]> {
  private readonly _predicate: (item: T) => boolean;

  constructor(predicate: (item: T) => boolean) {
    this._predicate = predicate;
  }
  apply(data: T[]): T[] {
    return data.filter(this._predicate);
  }
}

/** Array reduce operator — reduces an array to a single value. Returns defaultValue for empty arrays. */
export class ReducerOperator<T> implements OperatorInterface<T[], T | undefined> {
  private readonly _reducer: (acc: T, curr: T) => T;
  private readonly _defaultValue?: T;

  constructor(reducer: (acc: T, curr: T) => T, defaultValue?: T) {
    this._reducer = reducer;
    this._defaultValue = defaultValue;
  }

  apply(data: T[]): T | undefined {
    if (data.length === 0) {
      return this._defaultValue;
    }
    return data.reduce(this._reducer);
  }
}

/** Validation operator — passes data through if validator returns true, otherwise returns undefined. */
export class GuardOperator<T> implements OperatorInterface<T, T | undefined> {
  private readonly _validator: (data: T) => boolean;

  constructor(validator: (data: T) => boolean) {
    this._validator = validator;
  }

  apply(data: T): T | undefined {
    return this._validator(data) ? data : undefined;
  }
}

/** Composite operator — chains multiple operators sequentially, piping output of each into the next. */
export class PipelineOperator<TInput, TOutput> implements OperatorInterface<TInput, TOutput> {
  private readonly _operators: readonly OperatorInterface<unknown, unknown>[]

  constructor(operators: OperatorInterface<unknown, unknown>[]) {
    this._operators = operators;
  }

  apply(data: TInput): TOutput {
    let current: unknown = data;
    for (const operator of this._operators) {
      current = operator.apply(current);
    }
    return current as TOutput;
  }
}

// ═══════════════════════════════════════════════════════════════
// Async operators
// ═══════════════════════════════════════════════════════════════

/**
 * Async map operator.
 * The mapper can be synchronous or asynchronous (return a Promise).
 */
export class AsyncMapOperator<TInput, TOutput> implements AsyncOperatorInterface<TInput, TOutput> {
  private readonly _transformer: (data: TInput) => Promise<TOutput> | TOutput;

  constructor(mapper: (data: TInput) => Promise<TOutput> | TOutput) {
    this._transformer = mapper;
  }

  async apply(data: TInput): Promise<TOutput> {
    return this._transformer(data);
  }
}

/**
 * Async guard operator.
 * The validator can be synchronous or asynchronous (return a Promise<boolean>).
 * Passes data through if the predicate is true, otherwise returns undefined.
 */
export class AsyncGuardOperator<T> implements AsyncOperatorInterface<T, T | undefined> {
  private readonly _validator: (data: T) => Promise<boolean> | boolean;

  constructor(validator: (data: T) => Promise<boolean> | boolean) {
    this._validator = validator;
  }

  async apply(data: T): Promise<T | undefined> {
    const valid = await this._validator(data);
    return valid ? data : undefined;
  }
}

/**
 * Async operator pipeline.
 * Accepts both synchronous (OperatorInterface) and asynchronous (AsyncOperatorInterface) operators.
 * Each step is executed via await — a sync operator is unwrapped as a no-op.
 */
export class AsyncPipelineOperator<TInput, TOutput> implements AsyncOperatorInterface<TInput, TOutput> {
  private readonly _operators: readonly (OperatorInterface<unknown, unknown> | AsyncOperatorInterface<unknown, unknown>)[];

  constructor(operators: (OperatorInterface<unknown, unknown> | AsyncOperatorInterface<unknown, unknown>)[]) {
    this._operators = operators;
  }

  async apply(data: TInput): Promise<TOutput> {
    let current: unknown = data;
    for (const operator of this._operators) {
      current = await (operator as { apply: (data: unknown) => Promise<unknown> | unknown }).apply(current);
    }
    return current as TOutput;
  }
}

