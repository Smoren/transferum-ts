import type { DisposableInterface, SubscriberInterface, TickerInterface } from "./interfaces";
import type { DataHandler } from "./types";

/** Wraps an unsubscribe callback into a managed subscription with active-state tracking and lifecycle hooks. */
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

/** Manages a set of subscribers backed by a ProxyReference — notifies all listeners on sendState(). */
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

/** Adapts a SubscriberInterface into a DisposableInterface — destroy() delegates to unsubscribe(). */
export class DisposableSubscriberAdapter implements DisposableInterface {
  private _subscriber: SubscriberInterface;

  constructor(subscriber: SubscriberInterface) {
    this._subscriber = subscriber;
  }

  destroy(): void {
    this._subscriber.unsubscribe();
  }
}

/** Mutable reference wrapper — holds a single value with clear/extract semantics. */
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
