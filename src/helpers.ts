import type { DisposableInterface, SubscriberInterface } from "./interfaces";
import type { DataHandler } from "./types";

/**
 * Wraps an unsubscribe callback into a managed subscription with active-state tracking and lifecycle hooks.
 * @category Helpers
 */
export class Subscriber implements SubscriberInterface {
  private readonly _unsubscribe: (subscriber: SubscriberInterface) => void;
  private readonly _onUnsubscribeHandlers: Set<DataHandler<SubscriberInterface>> = new Set();
  private _active: boolean = true;

  constructor(unsubscribe: (subscriber: SubscriberInterface) => void) {
    this._unsubscribe = unsubscribe;
  }

  get active(): boolean {
    return this._active;
  }

  public unsubscribe(): void {
    if (!this._active) {
      throw new Error('Subscriber is already unsubscribed');
    }

    this._unsubscribe(this);

    for (const handler of this._onUnsubscribeHandlers) {
      handler(this);
    }
    this._onUnsubscribeHandlers.clear();

    this._active = false;
  }

  public onUnsubscribe(handler: DataHandler<SubscriberInterface>): SubscriberInterface {
    this._onUnsubscribeHandlers.add(handler);
    return this;
  }

  public offUnsubscribe(handler: DataHandler<SubscriberInterface>): SubscriberInterface {
    this._onUnsubscribeHandlers.delete(handler);
    return this;
  }
}

/**
 * Manages a set of subscribers backed by a ProxyReference — notifies all listeners on sendState().
 * @category Helpers
 */
export class SubscriptionManager<T> implements DisposableInterface {
  private _state: ProxyReference<T>;

  protected _listeners: Set<DataHandler<T>> = new Set<DataHandler<T>>();
  protected _subscribers: Set<SubscriberInterface> = new Set<SubscriberInterface>();

  constructor(valueRef: ProxyReference<T>) {
    this._state = valueRef;
  }

  public sendState(): boolean {
    if (this._state.value === undefined || this._listeners.size === 0) {
      return false;
    }

    const value = this._state.value;
    this._listeners.forEach((handler) => handler(value));

    return true;
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    const subscriber = new Subscriber((subscriber) => {
      this._listeners.delete(handler);
      this._subscribers.delete(subscriber);
    });
    this._listeners.add(handler);
    this._subscribers.add(subscriber);
    return subscriber;
  }

  public destroy() {
    this._subscribers.forEach((subscriber) => {
      subscriber.unsubscribe();
    });
  }
}

/**
 * Subscription manager for object state changes.
 *
 * Reuses ProxyReference and SubscriptionManager from helpers.ts.
 * The value (usually the owner object itself) is set once in the constructor
 * and never becomes undefined, so every notify() is guaranteed to
 * notify all subscribers with that value.
 *
 * Used to implement GateInterface.onStateChange().
 *
 * @category Helpers
 */
export class StateSubscriptionManager<T> implements DisposableInterface {
  private readonly _ref: ProxyReference<T>;
  private readonly _manager: SubscriptionManager<T>;

  constructor(value: T) {
    this._ref = new ProxyReference(value);
    this._manager = new SubscriptionManager(this._ref);
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._manager.subscribe(handler);
  }

  public notify(): void {
    this._manager.sendState();
  }

  public destroy(): void {
    this._manager.destroy();
  }
}

/**
 * Adapts a SubscriberInterface into a DisposableInterface — destroy() delegates to unsubscribe().
 * @category Helpers
 */
export class DisposableSubscriberAdapter implements DisposableInterface {
  private _subscriber: SubscriberInterface;

  constructor(subscriber: SubscriberInterface) {
    this._subscriber = subscriber;
  }

  destroy(): void {
    this._subscriber.unsubscribe();
  }
}

/**
 * Mutable reference wrapper — holds a single value with clear/extract semantics.
 * @category Helpers
 */
export class ProxyReference<T> {
  public value: T | undefined;

  constructor(initialValue?: T) {
    this.value = initialValue;
  }

  clear(): void {
    this.value = undefined;
  }

  pop(): T | undefined {
    const value = this.value;
    this.value = undefined;
    return value;
  }
}

// ═══════════════════════════════════════════════════════════════
// Sequence Guard helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Ordered result queue for parallel-then-emit patterns.
 *
 * Used by AsyncConvertTransfer and AsyncConditionTransfer when
 * maxConcurrency > 1. Multiple async operations run in
 * parallel, but their results are emitted to subscribers strictly in
 * arrival order: a result with a higher sequence number waits in the
 * queue until all lower-numbered results have been emitted.
 *
 * Mechanics:
 * - nextSeq() — assigns a monotonically increasing sequence number
 * - submit(seq, value) — stores a completed result
 * - drain(handler) — emits all consecutively-numbered results starting
 *   from the expected sequence number
 * - clear() — discards all pending results (used on destroy)
 *
 * @category Helpers
 */
export class PendingResultQueue<T> {
  private _nextSeq: number = 0;
  private _expectedSeq: number = 0;
  private _pending: Map<number, T> = new Map();

  /** Assigns the next sequence number for a new operation. */
  public nextSeq(): number {
    return this._nextSeq++;
  }

  /** Stores a completed result indexed by its sequence number. */
  public submit(seq: number, value: T): void {
    this._pending.set(seq, value);
  }

  /**
   * Emits all consecutively-numbered results starting from the expected
   * sequence number. Stops at the first gap (a not-yet-completed operation).
   */
  public drain(handler: (value: T) => void): void {
    while (this._pending.has(this._expectedSeq)) {
      const value = this._pending.get(this._expectedSeq) as T;
      this._pending.delete(this._expectedSeq);
      this._expectedSeq++;
      handler(value);
    }
  }

  /** Discards all pending results and resets sequence counters. */
  public clear(): void {
    this._pending.clear();
    this._nextSeq = 0;
    this._expectedSeq = 0;
  }
}

/**
 * Sequential async task executor for ordered side-effect patterns.
 *
 * Used by AsyncSinkTransfer and AsyncWriteTransfer when the `ordered`
 * config option is enabled. Tasks are queued and executed one at a time
 * in submission order, regardless of their internal async duration.
 *
 * Mechanics:
 * - submit(task) — appends an async task to a promise chain
 * - reset() — discards the chain (used on destroy)
 *
 * Error handling:
 * - Tasks are responsible for their own error handling (via handleError).
 * - The chain wraps each task in .catch(() => undefined) so that a
 *   throwing task does not break the chain for subsequent tasks.
 *
 * @category Helpers
 */
export class OrderedExecutor {
  private _chain: Promise<void> = Promise.resolve();
  private _generation: number = 0;

  /**
   * Appends an async task to the sequential execution chain.
   * Returns a promise that resolves/rejects with the task's own outcome.
   * The chain itself never rejects (errors are caught) so subsequent
   * tasks always run.
   */
  public submit(task: () => Promise<void>): Promise<void> {
    const gen = this._generation;
    const result = this._chain.then(async () => {
      if (gen !== this._generation) return;
      await task();
    });
    // Chain continues even if this task fails
    this._chain = result.catch(() => undefined);
    return result;
  }

  /** Resets the executor, discarding any pending (not yet started) tasks. */
  public reset(): void {
    this._generation++;
    this._chain = Promise.resolve();
  }
}
