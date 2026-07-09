import type { StorageInterface } from "./interfaces";

/** Storage that keeps only the latest written value, overwriting the previous one. */
export class LatestStorage<T> implements StorageInterface<T, T> {
  private _value?: T;
  private readonly _defaultValue?: T;

  constructor(defaultValue?: T) {
    this._defaultValue = defaultValue;
    this._value = defaultValue;
  }

  get size(): number {
    return this._value !== undefined ? 1 : 0;
  }

  write(data: T): void {
    this._value = data;
  }

  read(): T | undefined {
    return this._value;
  }

  clear(): void {
    this._value = undefined;
  }

  reset(): void {
    this._value = this._defaultValue;
  }
}

/** FIFO queue storage — read() removes and returns the oldest element. Supports optional max length. */
export class QueueStorage<T> implements StorageInterface<T, T> {
  private _queue: T[] = [];
  private readonly _maxLength?: number;

  constructor(maxLength?: number) {
    this._maxLength = maxLength;
  }

  get size(): number {
    return this._queue.length;
  }

  get maxLength(): number | undefined {
    return this._maxLength;
  }

  write(data: T): void {
    // If the limit is reached, remove the oldest element
    if (this._maxLength !== undefined && this._queue.length >= this._maxLength) {
      this._queue.shift();
    }
    this._queue.push(data);
  }

  read(): T | undefined {
    return this._queue.length > 0 ? this._queue.shift() : undefined;
  }

  clear(): void {
    this._queue = [];
  }

  reset() {
    this.clear();
  }
}

/** LIFO stack storage — read() removes and returns the most recently added element. Supports optional max length. */
export class StackStorage<T> implements StorageInterface<T, T> {
  private _stack: T[] = [];
  private readonly _maxLength?: number;

  constructor(maxLength?: number) {
    this._maxLength = maxLength;
  }

  get size(): number {
    return this._stack.length;
  }

  get maxLength(): number | undefined {
    return this._maxLength;
  }

  write(data: T): void {
    // If the limit is reached, remove the oldest element (from the bottom of the stack)
    if (this._maxLength !== undefined && this._stack.length >= this._maxLength) {
      this._stack.shift();
    }
    this._stack.push(data);
  }

  read(): T | undefined {
    return this._stack.length > 0 ? this._stack.pop() : undefined;
  }

  clear(): void {
    this._stack = [];
  }

  reset() {
    this.clear();
  }
}
