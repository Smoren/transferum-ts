import type {
  GateInterface,
  SubscriberInterface,
  BaseTransferInterface,
  PushableTransferInterface,
  PullableTransferInterface,
  SubscribableTransferInterface,
  TriggerableTransferInterface,
  PollingProxyTransferInterface,
  PollingSourceTransferInterface,
  DisposableInterface,
  OutputFlowInterface,
  InputFlowInterface,
  OperatorInterface,
  GateTransferInterface,
  UniversalDuplexInterface,
  UniversalInputInterface,
  UniversalOutputInterface,
  TriggerableInterface,
  TickerInterface,
  AsyncPushableInterface,
  AsyncPullableInterface,
  AsyncTriggerableInterface,
  AsyncPollingProxyInterface,
  AsyncPushableTransferInterface,
  AsyncPullableTransferInterface,
  AsyncPollingProxyTransferInterface,
  AsyncInputFlowInterface,
  AsyncOutputFlowInterface,
  AsyncOperatorInterface,
} from "./interfaces";
import type {
  DataHandler,
  DataFetcher,
  AsyncDataFetcher,
  AsyncDataHandler,
  ErrorHandler,
  TickerFactory,
} from "./types";
import type {
  PollingSourceConfig,
  BaseStateTransferConfig,
  DelayedPushChannelTransferConfig,
  DebounceTransferConfig,
  ThrottleTransferConfig,
  GateTransferConfig,
  MergeTransferConfig,
  SplitTransferConfig,
  SinkTransferConfig,
  ChannelTransferConfig,
  WriteTransferConfig,
  ReadTransferConfig,
  ConvertTransferConfig,
  StoredChannelTransferConfig,
  PollingProxyConfig,
  ConditionTransferConfig,
  PollingFlowTransferConfig,
  IdlePollingTransferConfig,
  CompositeTransferConfig,
  AsyncSinkTransferConfig,
  AsyncWriteTransferConfig,
  AsyncReadTransferConfig,
  AsyncPollingSourceConfig,
  AsyncPollingProxyConfig,
  AsyncPollingFlowTransferConfig,
  AsyncIdlePollingTransferConfig,
  AsyncConvertTransferConfig,
  AsyncConditionTransferConfig,
  AsyncStoredChannelTransferConfig,
} from "./configs";
import { ProxyReference, SubscriptionManager, StateSubscriptionManager } from "./helpers";
import { RAFTicker } from "./tickers";
import { handleError } from "./utils";

// ═══════════════════════════════════════════════════════════════
// BaseTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Base abstract class for all transfers.
 * Implements CommunicationContractInterface via boolean capability flags.
 *
 * Flags determine which methods and interfaces a specific transfer implements:
 * - isInput / isOutput — flow direction (input/output/duplex)
 * - isPushable / isPullable / isSubscribable — data delivery mechanics
 * - isTriggerable — presence of a manual trigger
 * - isGate — presence of state management (activate/deactivate)
 * - isPollingSource — presence of an external poller (polling)
 * - isPollingProxy — ability to poll another transfer (polling)
 * - isDuplex (computed) — true if isInput && isOutput
 *
 * All flags default to false. Subclasses override the needed ones to true.
 *
 * ⚠️ POTENTIAL ISSUE: Abstract destroy() without implementation in the base class.
 * Each subclass must implement destroy(), which can lead to errors
 * if the developer forgets to call super.destroy() to clean up _state.
 */
export abstract class BaseTransfer implements BaseTransferInterface {
  readonly isInput: boolean = false;
  readonly isOutput: boolean = false;
  readonly isDuplex: boolean = false;

  readonly isPushable: boolean = false;
  readonly isPullable: boolean = false;
  readonly isPollingSource: boolean = false;
  readonly isPollingProxy: boolean = false;
  readonly isSubscribable: boolean = false;
  readonly isTriggerable: boolean = false;
  readonly isGate: boolean = false;

  readonly isAsyncPushable: boolean = false;
  readonly isAsyncPullable: boolean = false;
  readonly isAsyncTriggerable: boolean = false;
  readonly isAsyncPollingProxy: boolean = false;

  public abstract destroy(): void;
}

// ═══════════════════════════════════════════════════════════════
// BaseStateTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Base class for transfers that store a value in ProxyReference.
 *
 * Provides:
 * - _state: ProxyReference<T> — reference to the current value (initialValue from config or undefined)
 * - destroy(): clears _state
 *
 * Subclasses use _state.value for writing, _state.pop() for extracting
 * with cleanup, _state.clear() for resetting without extraction.
 */
export abstract class BaseStateTransfer<T> extends BaseTransfer {
  protected readonly _state: ProxyReference<T>;

  protected constructor(config?: BaseStateTransferConfig<T>) {
    super();
    this._state = new ProxyReference(config?.initialValue);
  }

  public override destroy() {
    this._state.clear();
  }
}

// ═══════════════════════════════════════════════════════════════
// PushChannelTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive channel with automatic emission to subscribers on push().
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable
 *
 * Mechanics:
 * 1. push(data) — writes the value to _state, notifies subscribers, clears _state
 * 2. subscribe(handler) — subscribes to notifications
 * 3. destroy() — unsubscribes all subscribers, clears state
 *
 * Use cases:
 * - Fire-and-forget messaging between components
 * - Reactive events without state retention
 * - Analog of Observable with single emission per push()
 */
export class PushChannelTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<T>;

  constructor() {
    super();
    this._subscription = new SubscriptionManager(this._state);
  }

  public push(data: T): void {
    this._state.value = data;
    this._subscription.sendState();
    this._state.clear();
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// DelayedPushChannelTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive channel with delayed emission to subscribers on push().
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable
 *
 * Mechanics:
 * 1. push(data) — schedules a timer for delay ms; on expiry,
 *    writes the value to _state, notifies subscribers, clears _state
 * 2. subscribe(handler) — subscribes to notifications
 * 3. destroy() — clears all pending timers, unsubscribes subscribers, clears state
 *
 * Each push() gets its own timer — multiple push() calls
 * result in multiple delayed notifications.
 *
 * Configuration (DelayedPushChannelTransferConfig):
 * - delay: number — delay before emitting data to subscribers (ms)
 *
 * Difference from PushChannelTransfer:
 * - push() does NOT notify subscribers immediately — only after delay ms
 * - The value is captured in the timer closure, so multiple
 *   push() calls do not overwrite each other's data
 *
 * Use cases:
 * - Delayed events (e.g., debounce-like delay without suppression)
 * - Asynchronous emission with a guaranteed delay
 * - Testing reactive chains with a time shift
 */
export class DelayedPushChannelTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _delay: number;
  private _timers: Set<ReturnType<typeof setTimeout>> = new Set();

  constructor(config: DelayedPushChannelTransferConfig) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._delay = config.delay;
  }

  public push(data: T): void {
    const timer = setTimeout(() => {
      this._timers.delete(timer);
      this._state.value = data;
      this._subscription.sendState();
      this._state.clear();
    }, this._delay);
    this._timers.add(timer);
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._timers.forEach((timer) => clearTimeout(timer));
    this._timers.clear();
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// DebounceTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive channel with debounced emission to subscribers on push().
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable
 *
 * Mechanics:
 * 1. push(data) — resets the previous timer, starts a new one for delay ms
 * 2. On timer expiry — writes the last value to _state,
 *    notifies subscribers, clears _state
 * 3. subscribe(handler) — subscribes to notifications
 * 4. destroy() — clears the timer, unsubscribes subscribers, clears state
 *
 * Each new push() resets the timer — subscribers are notified only
 * after delay ms of silence following the last push().
 *
 * Configuration (DebounceTransferConfig):
 * - delay: number — silence period before emitting data (ms)
 *
 * Difference from DelayedPushChannelTransfer:
 * - Each push() resets the timer (rather than creating an independent one)
 * - Subscribers receive only the last value after a silence period
 *
 * Use cases:
 * - Debouncing user input (search, autosave)
 * - Reducing event frequency to the "last" one after a pause
 * - Replacing manual clearTimeout/setTimeout pattern
 */
export class DebounceTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _delay: number;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: DebounceTransferConfig) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._delay = config.delay;
  }

  public push(data: T): void {
    this._clearTimer();
    this._timer = setTimeout(() => {
      this._timer = null;
      this._state.value = data;
      this._subscription.sendState();
      this._state.clear();
    }, this._delay);
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._clearTimer();
    this._subscription.destroy();
    super.destroy();
  }

  private _clearTimer(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// ThrottleTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive channel with throttled emission to subscribers on push().
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable
 *
 * Mechanics:
 * 1. push(data) — if the throttle window is closed (active timer exists):
 *    the value is saved as pending but not emitted
 * 2. If the window is open (no active timer) — the value is emitted
 *    immediately (leading edge), a timer for interval ms is started
 * 3. On interval expiry — if there is a pending value, it is emitted
 *    (trailing edge) and a new window is started
 * 4. subscribe(handler) — subscribes to notifications
 * 5. destroy() — clears the timer, unsubscribes subscribers, clears state
 *
 * Leading + trailing: the first push passes immediately, the last one in the window —
 * after the interval ends. This guarantees that no value is lost
 * and the emission rate is limited to interval.
 *
 * Configuration (ThrottleTransferConfig):
 * - interval: number — minimum interval between emissions (ms)
 *
 * Use cases:
 * - Rate-limiting high-frequency events (mouse move, resize)
 * - Throttling sensor/tracking data to a fixed FPS
 * - Replacing setInterval pattern for periodic updates
 */
export class ThrottleTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _interval: number;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _pendingValue: T | undefined = undefined;
  private _hasPending: boolean = false;

  constructor(config: ThrottleTransferConfig) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._interval = config.interval;
  }

  public push(data: T): void {
    if (this._timer === null) {
    // Leading edge — emit immediately
    this._emit(data);
    this._startTimer();
    } else {
      // Within the window — save as pending
      this._pendingValue = data;
      this._hasPending = true;
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._clearTimer();
    this._subscription.destroy();
    super.destroy();
  }

  private _emit(data: T): void {
    this._state.value = data;
    this._subscription.sendState();
    this._state.clear();
  }

  private _startTimer(): void {
    this._timer = setTimeout(() => {
      this._timer = null;
      if (this._hasPending) {
        const value = this._pendingValue as T;
        this._pendingValue = undefined;
        this._hasPending = false;
        this._emit(value);
        this._startTimer();
      }
    }, this._interval);
  }

  private _clearTimer(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._pendingValue = undefined;
    this._hasPending = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive channel with last-value retention.
 * Combines push/pull/subscribe/trigger.
 *
 * Capabilities: isInput, isOutput, isPushable, isPullable, isSubscribable, isTriggerable
 *
 * Mechanics:
 * 1. push(data) — writes the value, notifies subscribers (does NOT clear _state)
 * 2. pull() — reads the current value without clearing
 * 3. subscribe(handler) — subscribes to notifications
 * 4. trigger() — manually sends the current value to subscribers
 * 5. destroy() — unsubscribes subscribers, clears state
 *
 * Difference from PushChannelTransfer:
 * - Does not clear _state after push() — the value is available for pull()
 * - Has trigger() for manual emission without changing data
 *
 * Use cases:
 * - Caching the last value with reactive updates
 * - Component state with manual synchronization capability
 * - Buffer with subscription to changes
 */
export class PushStoredChannelTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, PullableTransferInterface<T>, SubscribableTransferInterface<T>, TriggerableTransferInterface {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isPullable = true;
  override readonly isSubscribable = true;
  override readonly isTriggerable = true;

  private readonly _subscription: SubscriptionManager<T>;

  constructor(config?: BaseStateTransferConfig<T>) {
    super(config);
    this._subscription = new SubscriptionManager(this._state);
  }

  public push(data: T): void {
    this._state.value = data;
    this._subscription.sendState();
  }

  public pull(): T | undefined {
    return this._state.value;
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public trigger() {
    this._subscription.sendState();
  }

  public override destroy() {
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// BufferTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Passive buffer with push/pull mechanics (no notifications).
 *
 * Capabilities: isInput, isOutput, isPushable, isPullable
 *
 * Mechanics:
 * 1. push(data) — writes the value (overwrites the previous one)
 * 2. pull() — extracts the value WITH CLEANUP (uses _state.pop())
 *
 * Differences from PushStoredChannelTransfer:
 * - No subscription (subscribe) — only active pull()
 * - No trigger — data is not sent automatically
 * - pull() clears the buffer (pop) rather than just reading
 *
 * Use cases:
 * - One-time data transfer between processes
 * - Buffer for producer-consumer pattern without reactivity
 * - Synchronous data exchange on demand
 */
export class BufferTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, PullableTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isPullable = true;

  constructor() {
    super();
  }

  push(data: T): void {
    this._state.value = data;
  }

  pull(): T | undefined {
    return this._state.pop();
  }
}

// ═══════════════════════════════════════════════════════════════
// ManualBufferTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Buffer with manual read control via trigger().
 *
 * Capabilities: isInput, isOutput, isPushable, isPullable, isTriggerable
 *
 * Mechanics:
 * 1. push(data) — writes the value (overwrites the previous one)
 * 2. trigger() — sets the _triggered flag to true
 * 3. pull() — returns the value only if trigger() was called,
 *    otherwise returns undefined; extracts with cleanup (pop)
 *
 * Difference from BufferTransfer:
 * - pull() returns data only after trigger()
 * - Implements a "lazy" read pattern: data is ready but not yielded
 *   until explicit permission
 *
 * Use cases:
 * - Synchronizing reads with an external event
 * - Buffer with a data-readiness condition
 * - Step-by-step data processing in a pipeline
 */
export class ManualBufferTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, PullableTransferInterface<T>, TriggerableTransferInterface {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isPullable = true;
  override readonly isTriggerable = true;

  private _triggered: boolean = false;

  constructor() {
    super();
  }

  public push(data: T): void {
    this._state.value = data;
  }

  public pull(): T | undefined {
    if (!this._triggered) {
      return undefined;
    }
    this._triggered = false;
    return this._state.pop();
  }

  public trigger(): void {
    this._triggered = true;
  }
}

// ═══════════════════════════════════════════════════════════════
// ManualFlowTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive stream with manual emission control via trigger().
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable, isTriggerable
 *
 * Mechanics:
 * 1. push(data) — writes the value (without notifying subscribers)
 * 2. trigger() — notifies subscribers with the current value, clears _state
 * 3. subscribe(handler) — subscribes to notifications
 * 4. destroy() — unsubscribes subscribers, clears state
 *
 * Difference from PushChannelTransfer:
 * - push() does NOT notify subscribers automatically
 * - To send data to subscribers, trigger() must be called
 * - Separates data writing from emission
 *
 * Difference from ManualBufferTransfer:
 * - Uses subscribe() instead of pull()
 * - Notifies all subscribers on trigger(), not just one reader
 *
 * Use cases:
 * - Synchronizing emission with an external event (e.g., requestAnimationFrame)
 * - Manual control of the data emission moment
 */
export class ManualFlowTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T>, TriggerableTransferInterface {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;
  override readonly isTriggerable = true;

  private readonly _subscription: SubscriptionManager<T>;

  constructor(config?: BaseStateTransferConfig<T>) {
    super(config);
    this._subscription = new SubscriptionManager(this._state);
  }

  public push(data: T): void {
    this._state.value = data;
  }

  public trigger(): void {
    this._subscription.sendState();
    this._state.clear();
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// GateTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Transfer with state management (gate) for controlling data flow.
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable, isGate
 *
 * Mechanics:
 * 1. push(data) — writes and notifies subscribers only if active === true
 *    If the gate is closed (active === false), data is ignored
 * 2. subscribe(handler) — subscribes to notifications
 * 3. activate()/deactivate()/toggle() — control the gate state
 * 4. destroy() — deactivates the gate, unsubscribes subscribers, clears state
 *
 * Configuration (GateTransferConfig):
 * - activated: boolean — initial gate state
 * - initialValue?: T — initial value in _state
 *
 * Use cases:
 * - Blocking data flow by condition (e.g., until the user is authenticated)
 * - Enabling/disabling event processing
 * - Implementing PassBridge and other bridges
 */
export class GateTransfer<T> extends BaseStateTransfer<T> implements GateTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;
  override readonly isGate = true;

  private readonly _subscriptions: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;

  private _active: boolean;

  constructor(config: GateTransferConfig) {
    super();
    this._subscriptions = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._active = config.activated;
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscriptions.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public push(data: T): void {
    if (!this._active) {
      return;
    }
    this._state.value = data;
    this._subscriptions.sendState();
  }

  public get active(): boolean {
    return this._active;
  }

  public activate(): void {
    this._active = true;
    this._gateState.notify();
  }

  public deactivate(): void {
    this._active = false;
    this._gateState.notify();
  }

  public toggle(): boolean {
    this._active = !this._active;
    this._gateState.notify();
    return this._active;
  }

  public override destroy() {
    this._active = false;
    this._gateState.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// MergeTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Aggregator of multiple sources into a single stream (merge).
 *
 * Capabilities: isInput, isOutput, isSubscribable
 *
 * Mechanics:
 * 1. The constructor accepts config.sources: an array of SubscribableTransferInterface<T>
 * 2. Automatically subscribes to all sources
 * 3. On receiving data from any source — notifies its subscribers
 * 4. subscribe(handler) — subscribes to the merged stream
 * 5. destroy() — unsubscribes from all sources, unsubscribes its subscribers
 *
 * Configuration (MergeTransferConfig):
 * - sources: SubscribableTransferInterface<T>[] — data sources
 *
 * Difference from AggregatorTransfer (old version):
 * - The new version uses SubscriptionManager and DisposableSubscriberAdapter
 * - Implements push/pull flags, but push() is only called internally
 *
 * Use cases:
 * - Merging events from multiple sources (e.g., clicks + touch + keyboard)
 * - Multicast: one subscriber to multiple transfers
 * - Implementing BridgeAggregator
 */
export class MergeTransfer<T> extends BaseStateTransfer<T> implements SubscribableTransferInterface<T> {
  override readonly isOutput = true;

  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<T>;
  private _inputConnections: SubscriberInterface[];

  constructor(config: MergeTransferConfig<T>) {
    super({ ...config, initialValue: undefined });
    this._subscription = new SubscriptionManager(this._state);
    this._inputConnections = config.sources.map((source) => source.subscribe((data) => {
      this._push(data);
    }).onUnsubscribe((subscriber) => {
      this._inputConnections = this._inputConnections.filter((conn) => conn !== subscriber);
    }));
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy(): void {
    [...this._inputConnections].forEach((sub) => sub.unsubscribe());
    this._inputConnections = [];
    this._subscription.destroy();
    super.destroy();
  }

  private _push(data: T) {
    this._state.value = data;
    this._subscription.sendState();
    this._state.clear();
  }
}

// ═══════════════════════════════════════════════════════════════
// SplitTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Stream splitter to multiple targets (broadcast).
 *
 * Capabilities: isInput, isOutput, isPushable
 *
 * Mechanics:
 * 1. The constructor accepts config.targets: an array of PushableTransferInterface<T>
 * 2. push(data) — sends data to all targets sequentially
 * 3. destroy() — clears the targets array (does not call destroy() on targets)
 *
 * Configuration (SplitTransferConfig):
 * - targets: PushableTransferInterface<T>[] — data receivers
 *
 * Use cases:
 * - Broadcasting: one event → multiple receivers
 * - Logging + processing: same data into two different streams
 * - Implementing publish-subscribe pattern at the transfer level
 */
export class SplitTransfer<T> extends BaseTransfer implements PushableTransferInterface<T> {
  override readonly isInput = true;

  override readonly isPushable = true;

  private _targets: PushableTransferInterface<T>[];

  constructor(config: SplitTransferConfig<T>) {
    super();
    this._targets = config.targets;
  }

  public push(data: T) {
    this._targets.forEach((target) => target.push(data));
  }

  public override destroy(): void {
    this._targets = [];
  }
}

// ═══════════════════════════════════════════════════════════════
// PollingSourceTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Output transfer with internal polling of a data source.
 *
 * Capabilities: isOutput, isPollingSource, isPullable, isSubscribable, isTriggerable, isGate
 *
 * Mechanics:
 * 1. The constructor accepts config.fetcher: DataFetcher<T> — a function to retrieve data
 * 2. An internal Ticker (RAFTicker by default) calls trigger() at the specified interval
 * 3. trigger() — calls fetcher(), writes the result, notifies subscribers
 * 4. pull() — calls fetcher() directly (without writing to state)
 * 5. subscribe(handler) — subscribes to periodic updates
 * 6. activate()/deactivate()/toggle() — control polling
 * 7. destroy() — stops the ticker, unsubscribes subscribers
 *
 * Error handling:
 * - If fetcher() throws an exception in trigger() or pull(), onError is called.
 * - With onError provided, the exception is suppressed (polling continues).
 * - Without onError, the exception is rethrown.
 *
 * Configuration (PollingSourceConfig):
 * - fetcher: DataFetcher<T> — data retrieval function
 * - interval: number — polling interval (ms)
 * - activated: boolean — initial polling state
 * - tickerFactory?: TickerFactory — custom ticker factory (default: RAFTicker.factory)
 * - onError?: ErrorHandler — fetcher error handler
 *
 * Use cases:
 * - Periodic polling of an API or external source
 * - Timer emitting the current time
 * - Animation at a fixed FPS
 */
export class PollingSourceTransfer<T> extends BaseStateTransfer<T> implements PollingSourceTransferInterface, SubscribableTransferInterface<T>, PullableTransferInterface<T>, TriggerableTransferInterface, GateInterface {
  override readonly isOutput = true;

  override readonly isPollingSource = true;
  override readonly isPullable = true;
  override readonly isSubscribable = true;
  override readonly isTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _ticker: TickerInterface;
  private readonly _fetcher: DataFetcher<T>;
  private readonly _onError?: ErrorHandler;

  constructor(config: PollingSourceConfig<T>) {
    super({ ...config, initialValue: undefined });

    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._fetcher = config.fetcher;
    this._onError = config.onError;

    this._ticker = (config.tickerFactory ?? RAFTicker.factory)({
      callback: () => this.trigger(),
      interval: config.interval,
    });

    if (config.activated) {
      this._ticker.start();
    }
  }

  public pull(): T | undefined {
    try {
      return this._fetcher();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public trigger(): void {
    try {
      this._state.value = this._fetcher();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    }
  }

  public get active(): boolean {
    return this._ticker.active;
  }

  public activate(): void {
    this._ticker.start();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._ticker.stop();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._ticker.toggle();
    this._gateState.notify();
    return result;
  }

  public override destroy(): void {
    this._ticker.stop();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// PollingProxyTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Duplex transfer with polling that receives its fetcher from the previous node in the chain.
 *
 * Capabilities: isInput, isOutput, isPollingSource, isPollingProxy, isPullable, isSubscribable, isTriggerable, isGate
 *
 * Mechanics:
 * 1. The constructor accepts config (interval, activated), but NOT a fetcher
 * 2. setFetcher(fetcher) — sets the fetcher from the previous transfer,
 *    creates a Ticker via tickerFactory, starts polling if active
 * 3. clearFetcher() — stops the Ticker, clears the fetcher
 * 4. trigger() — calls fetcher(), notifies subscribers (if active)
 * 5. pull() — calls fetcher() directly (if active and fetcher is set)
 * 6. activate()/deactivate()/toggle() — control polling and state
 * 7. destroy() — stops polling, clears the fetcher, unsubscribes subscribers
 *
 * Error handling:
 * - If fetcher() throws an exception in trigger() or pull(), onError is called.
 * - With onError provided, the exception is suppressed (polling continues).
 * - Without onError, the exception is rethrown.
 * - The 'Fetcher is not defined' error is always rethrown (this is not a fetcher runtime error).
 *
 * Difference from PollingSourceTransfer:
 * - Fetcher is NOT set in the constructor, but via setFetcher()
 * - Has isInput = true (duplex, can be an intermediate link)
 * - pull()/trigger() without a fetcher throws an Error
 * - pull()/trigger() without active — returns undefined / is ignored
 *
 * Configuration (PollingProxyConfig):
 * - interval: number — polling interval (ms)
 * - activated: boolean — initial polling state
 * - tickerFactory?: TickerFactory — custom ticker factory (default: RAFTicker.factory)
 * - onError?: ErrorHandler — fetcher error handler
 *
 * Use cases:
 * - Intermediate polling node in a transfer chain
 * - Adapter between a pull-source and a subscribe-consumer
 * - Periodic reading from a buffer with emission into a stream
 */
export class PollingProxyTransfer<T> extends BaseStateTransfer<T> implements PollingProxyTransferInterface<T>, PollingSourceTransferInterface, SubscribableTransferInterface<T>, PullableTransferInterface<T>, TriggerableTransferInterface, GateInterface {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPollingProxy = true;
  override readonly isPollingSource = true;
  override readonly isPullable = true;
  override readonly isSubscribable = true;
  override readonly isTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _interval: number;
  private readonly _tickerFactory: TickerFactory;
  private readonly _onError?: ErrorHandler;

  private _active: boolean;
  private _ticker: TickerInterface | undefined;
  private _fetcher: DataFetcher<T> | undefined;

  constructor(config: PollingProxyConfig) {
    super({ ...config, initialValue: undefined });
    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._active = config.activated;
    this._interval = config.interval;
    this._tickerFactory = config.tickerFactory ?? RAFTicker.factory;
    this._onError = config.onError;
  }

  public pull(): T | undefined {
    if (!this._active) {
      return;
    }
    if (this._fetcher === undefined) {
      throw new Error('Fetcher is not defined');
    }
    try {
      return this._fetcher();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public trigger() {
    if (!this._active) {
      return;
    }
    if (this._fetcher === undefined) {
      throw new Error('Fetcher is not defined');
    }

    try {
      this._state.value = this._fetcher();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    }
  }

  public setFetcher(fetcher: DataFetcher<T>): void {
    this.clearFetcher();
    this._fetcher = fetcher;

    this._ticker = this._tickerFactory({
      callback: () => this.trigger(),
      interval: this._interval,
    });

    if (this._active) {
      this._ticker.start();
    }
  }

  public clearFetcher() {
    if (this._ticker === undefined) {
      return;
    }
    this._ticker.stop();
    this._ticker = undefined;
    this._fetcher = undefined;
  }

  public get active(): boolean {
    return this._active;
  }

  public activate(): void {
    this._ticker?.start();
    this._active = true;
    this._gateState.notify();
  }

  public deactivate(): void {
    this._ticker?.stop();
    this._active = false;
    this._gateState.notify();
  }

  public toggle(): boolean {
    this._ticker?.toggle();
    this._active = !this._active;
    this._gateState.notify();
    return this._active;
  }

  public override destroy(): void {
    this._active = false;
    this.clearFetcher();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// ChannelTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Output channel with external management via setup/destroy callbacks.
 *
 * Capabilities: isOutput, isSubscribable
 *
 * Mechanics:
 * 1. The constructor accepts config with callbacks:
 *    - setup(emit) — called immediately, receives the emit(data) function
 *    - destroy() — cleanup function (called on transfer destroy)
 * 2. setup() should call emit(data) to send data to subscribers
 * 3. subscribe(handler) — subscribes to notifications
 * 4. destroy() — calls config.destroy(), unsubscribes subscribers
 *
 * Error handling:
 * - onSetupError — for errors in setup() (constructor)
 * - onEmitError — for errors in emit() (when sending data to subscribers)
 * - onDestroyError — for errors in destroy()
 * - With the corresponding handler provided, the exception is suppressed.
 * - Without a handler, the exception is rethrown.
 *
 * Configuration (ChannelTransferConfig):
 * - setup: (emit: DataHandler<T>) => void — channel initialization
 * - destroy: () => void — channel cleanup
 * - onSetupError?: ErrorHandler — setup() error handler
 * - onEmitError?: ErrorHandler — emit() error handler
 * - onDestroyError?: ErrorHandler — destroy() error handler
 *
 * Difference from StoredChannelTransfer:
 * - No pull() — only reactive subscription
 * - No trigger() — emission only via external emit()
 * - _state does not store a value for reading (cleared after sendState)
 *
 * Use cases:
 * - Integration with external event sources (WebSocket, DOM events)
 * - Adapting legacy API to pipeline
 * - Custom data sources with their own logic
 */
export class ChannelTransfer<T> extends BaseStateTransfer<T> implements SubscribableTransferInterface<T> {
  override readonly isOutput = true;

  override readonly isSubscribable = true;

  protected readonly _emit: DataHandler<T>;
  protected readonly _destroy: () => void;
  protected readonly _onSetupError?: ErrorHandler;
  protected readonly _onEmitError?: ErrorHandler;
  protected readonly _onDestroyError?: ErrorHandler;

  private readonly _subscription: SubscriptionManager<T>;

  constructor(config: ChannelTransferConfig<T>) {
    super({ ...config, initialValue: undefined });
    this._subscription = new SubscriptionManager(this._state);
    this._onSetupError = config.onSetupError;
    this._onEmitError = config.onEmitError;
    this._onDestroyError = config.onDestroyError;

    this._destroy = config.destroy;
    this._emit = (data: T) => {
      this._state.value = data;
      try {
        this._subscription.sendState();
      } catch (e) {
        handleError(e, this._onEmitError);
      }
      this._state.clear();
    };

    try {
      config.setup(this._emit);
    } catch (e) {
      handleError(e, this._onSetupError);
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._subscription.destroy();
    try {
      this._destroy();
    } catch (e) {
      handleError(e, this._onDestroyError);
    }
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Output channel with last-value retention and external management.
 *
 * Capabilities: isOutput, isPullable, isTriggerable, isSubscribable
 *
 * Mechanics:
 * 1. The constructor accepts config with setup/destroy callbacks (like ChannelTransfer)
 * 2. setup() calls emit(data), which writes the value to _state and calls trigger()
 * 3. trigger() — notifies subscribers with the current value (without clearing _state)
 * 4. pull() — reads the current value without clearing
 * 5. subscribe(handler) — subscribes to notifications
 * 6. destroy() — calls config.destroy(), unsubscribes subscribers
 *
 * Error handling:
 * - onSetupError — for errors in setup() (constructor)
 * - onEmitError — for errors in emit() (when sending data to subscribers)
 * - onDestroyError — for errors in destroy()
 * - With the corresponding handler provided, the exception is suppressed.
 * - Without a handler, the exception is rethrown.
 *
 * Configuration (StoredChannelTransferConfig):
 * - setup: (emit: DataHandler<T>) => void — channel initialization
 * - destroy: () => void — channel cleanup
 * - initialValue?: T — initial value in _state
 * - onSetupError?: ErrorHandler — setup() error handler
 * - onEmitError?: ErrorHandler — emit() error handler
 * - onDestroyError?: ErrorHandler — destroy() error handler
 *
 * Difference from ChannelTransfer:
 * - Retains the last value (pull() is available)
 * - Has trigger() for re-emitting the current value
 * - emit() calls trigger() instead of sendState() + clear()
 *
 * Use cases:
 * - Integration with external sources with caching
 * - Channel with the ability to re-read the last value
 * - Storing state from an external source
 */
export class StoredChannelTransfer<T> extends BaseStateTransfer<T> implements SubscribableTransferInterface<T>, PullableTransferInterface<T>, TriggerableTransferInterface {
  override readonly isOutput = true;

  override readonly isPullable = true;
  override readonly isTriggerable = true;
  override readonly isSubscribable = true;

  protected readonly _emit: DataHandler<T>;
  protected readonly _destroy: () => void;
  protected readonly _onSetupError?: ErrorHandler;
  protected readonly _onEmitError?: ErrorHandler;
  protected readonly _onDestroyError?: ErrorHandler;

  private readonly _subscription: SubscriptionManager<T>;

  constructor(config: StoredChannelTransferConfig<T>) {
    super(config);
    this._subscription = new SubscriptionManager(this._state);
    this._onSetupError = config.onSetupError;
    this._onEmitError = config.onEmitError;
    this._onDestroyError = config.onDestroyError;
    this._destroy = config.destroy;
    this._emit = (data: T) => {
      this._state.value = data;
      this.trigger();
    };

    try {
      config.setup(this._emit);
    } catch (e) {
      handleError(e, this._onSetupError);
    }
  }

  public pull(): T | undefined {
    return this._state.value;
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public trigger() {
    try {
      this._subscription.sendState();
    } catch (e) {
      handleError(e, this._onEmitError);
    }
  }

  public override destroy() {
    this._subscription.destroy();
    try {
      this._destroy();
    } catch (e) {
      handleError(e, this._onDestroyError);
    }
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// SinkTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Terminal destination (sink) — calls a callback on receiving data.
 *
 * Capabilities: isInput, isPushable
 *
 * Mechanics:
 * 1. The constructor accepts config.callback: DataHandler<T>
 * 2. push(data) — calls callback(data)
 * 3. destroy() — inherited from BaseStateTransfer, clears _state
 *
 * Configuration (SinkTransferConfig):
 * - callback: DataHandler<T> — incoming data handler
 * - initialValue?: T — initial value (unused)
 *
 * Difference from CallbackTransfer (old version):
 * - The new version inherits from BaseStateTransfer (has _state)
 * - But _state is not used in push() — data goes directly to callback
 * - Does not implement isOutput (input only)
 *
 * Use cases:
 * - Logging: writing data to console/file
 * - Side effects: sending metrics, analytics
 * - Finalization: saving the result to storage
 */
export class SinkTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T> {
  override readonly isInput = true;

  override readonly isPushable = true;

  private readonly _callback: DataHandler<T>;

  constructor(config: SinkTransferConfig<T>) {
    super({ ...config, initialValue: undefined });
    this._callback = config.callback;
  }

  push(data: T): void {
    this._callback(data);
  }
}

// ═══════════════════════════════════════════════════════════════
// WriteTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Write adapter for an arbitrary InputFlowInterface (e.g., Storage).
 *
 * Capabilities: isInput, isPushable
 *
 * Mechanics:
 * 1. The constructor accepts config.flow: InputFlowInterface<T>
 * 2. push(data) — calls flow.write(data)
 * 3. destroy() — does nothing (does not own the flow)
 *
 * Error handling:
 * - If flow.write() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed. Without onError — rethrown.
 *
 * Configuration (WriteTransferConfig):
 * - flow: InputFlowInterface<T> — target flow with a write() method
 * - onError?: ErrorHandler — error handler
 *
 * Use cases:
 * - Writing data to Storage (LatestStorage, QueueStorage, StackStorage)
 * - Adapting an arbitrary object with write() to pipeline
 * - Finalization: saving the result to external storage
 */
export class WriteTransfer<T> extends BaseTransfer implements PushableTransferInterface<T> {
  override readonly isInput = true;

  override readonly isPushable = true;

  private readonly _flow: InputFlowInterface<T>;
  private readonly _onError?: ErrorHandler;

  constructor(config: WriteTransferConfig<T>) {
    super();
    this._flow = config.flow;
    this._onError = config.onError;
  }

  public push(data: T): void {
    try {
      this._flow.write(data);
    } catch (e) {
      handleError(e, this._onError);
    }
  }

  public override destroy() {
    // Nothing to do
  }
}

// ═══════════════════════════════════════════════════════════════
// ReadTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Read adapter for an arbitrary OutputFlowInterface (e.g., Storage).
 *
 * Capabilities: isOutput, isPullable
 *
 * Mechanics:
 * 1. The constructor accepts config.flow: OutputFlowInterface<T>
 * 2. pull() — returns flow.read()
 * 3. destroy() — does nothing (does not own the flow)
 *
 * Error handling:
 * - If flow.read() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed, pull() returns undefined.
 * - Without onError, the exception is rethrown.
 *
 * Configuration (ReadTransferConfig):
 * - flow: OutputFlowInterface<T> — target flow with a read() method
 * - onError?: ErrorHandler — error handler
 *
 * Use cases:
 * - Reading data from Storage (LatestStorage, QueueStorage, StackStorage)
 * - Adapting an arbitrary object with read() to pipeline
 * - Data source for polling transfers
 */
export class ReadTransfer<T> extends BaseTransfer implements PullableTransferInterface<T> {
  override readonly isOutput = true;

  override readonly isPullable = true;

  private readonly _flow: OutputFlowInterface<T>;
  private readonly _onError?: ErrorHandler;

  constructor(config: ReadTransferConfig<T>) {
    super();
    this._flow = config.flow;
    this._onError = config.onError;
  }

  public pull(): T | undefined {
    try {
      return this._flow.read();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public override destroy() {
    // Nothing to do
  }
}

// ═══════════════════════════════════════════════════════════════
// ConvertTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Converter transfer: transforms input data via an Operator and
 * sends the result to subscribers.
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable
 *
 * Mechanics:
 * 1. The constructor accepts config.operator: OperatorInterface<TInput, TOutput>
 * 2. push(data: TInput) — applies operator.apply(data), notifies subscribers,
 *    clears _state
 * 3. subscribe(handler) — subscribes to transformed data
 * 4. destroy() — unsubscribes subscribers, clears _state
 * 5. If the operator returns undefined, subscribers are not notified
 *
 * Error handling:
 * - If operator.apply() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed, subscribers are not notified.
 * - Without onError, the exception is rethrown.
 *
 * Configuration (ConvertTransferConfig):
 * - operator: OperatorInterface<TInput, TOutput> — data transformer
 * - onError?: ErrorHandler — error handler
 *
 * Difference from OperatorTransfer (old version):
 * - The new version's push() automatically notifies subscribers
 * - Has no trigger() — emission happens immediately on push()
 * - Has no pull() — the result is not stored after emission
 *
 * Use cases:
 * - Type transformation in a stream (e.g., string → number)
 * - Filtering via GuardOperator (undefined blocks emission)
 * - Real-time data mapping
 * - Implementing TransformBridge
 */
export class ConvertTransfer<TInput, TOutput> extends BaseStateTransfer<TOutput> implements PushableTransferInterface<TInput>, SubscribableTransferInterface<TOutput> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<TOutput>;
  private readonly _operator: OperatorInterface<TInput, TOutput | undefined>;
  private readonly _onError?: ErrorHandler;

  constructor(config: ConvertTransferConfig<TInput, TOutput>) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._operator = config.operator;
    this._onError = config.onError;
  }

  public push(data: TInput): void {
    try {
      this._state.value = this._operator.apply(data);
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    }
  }

  public subscribe(handler: DataHandler<TOutput>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Transfer with conditional filtering on input and output.
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable
 *
 * Mechanics:
 * 1. The constructor accepts config with two predicates:
 *    - shouldAccept(data) — input filter (if false, data is ignored)
 *    - shouldEmit(state) — output filter (if false, data remains in state)
 * 2. push(data) — checks shouldAccept, if true — writes to state, calls trigger()
 * 3. trigger() — checks shouldEmit, if true — notifies subscribers and clears state
 * 4. subscribe(handler) — subscribes to notifications
 * 5. destroy() — unsubscribes subscribers, clears state
 *
 * Error handling:
 * - If shouldAccept or shouldEmit throws an exception, onError is called.
 * - With onError provided, the exception is suppressed.
 *
 * Configuration (ConditionTransferConfig):
 * - shouldAccept?: (data: T) => boolean — input filter (default: always true)
 * - shouldEmit?: (state: T | undefined) => boolean — output filter (default: always true)
 * - onError?: ErrorHandler — error handler
 *
 * Use cases:
 * - Filtering data by value (e.g., only even numbers)
 * - Blocking duplicates (shouldEmit checks the previous value)
 * - Throttling/debouncing via time-based conditions
 * - Validating data before forwarding
 */
export class ConditionTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _shouldAccept: (incomingData: T) => boolean;
  private readonly _shouldEmit: (currentState: T | undefined) => boolean;
  private readonly _onError?: ErrorHandler;

  constructor(config: ConditionTransferConfig<T>) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._shouldAccept = config.shouldAccept ?? (() => true);
    this._shouldEmit = config.shouldEmit ?? (() => true);
    this._onError = config.onError;
  }

  public push(data: T): void {
    try {
      // If the input condition is not met, data is ignored
      if (!this._shouldAccept(data)) {
        return;
      }
    } catch (e) {
      handleError(e, this._onError);
      return;
    }

    // Save data to state
    this._state.value = data;

    // Try to forward
    this.trigger();
  }

  public trigger(): void {
    try {
      // If the output condition is not met, data stays inside
      if (!this._shouldEmit(this._state.value)) {
        return;
      }
    } catch (e) {
      handleError(e, this._onError);
      return;
    }

    // Notify subscribers and clear state
    this._subscription.sendState();
    this._state.clear();
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// PollingFlowTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Output transfer with polling from OutputFlowInterface (e.g., Storage).
 *
 * Capabilities: isOutput, isPollingSource, isPullable, isSubscribable, isTriggerable, isGate
 *
 * Mechanics:
 * 1. The constructor accepts config.flow: OutputFlowInterface<T> and config.interval
 * 2. An internal Ticker (RAFTicker by default) calls trigger() at the specified interval
 * 3. trigger() — calls flow.read(), writes the result, notifies subscribers
 * 4. pull() — calls flow.read() directly (without writing to state)
 * 5. subscribe(handler) — subscribes to periodic updates
 * 6. activate()/deactivate()/toggle() — control polling
 * 7. destroy() — stops the ticker, unsubscribes subscribers
 *
 * Error handling:
 * - If flow.read() throws an exception in trigger() or pull(), onError is called.
 * - With onError provided, the exception is suppressed.
 *
 * Configuration (PollingFlowTransferConfig):
 * - flow: OutputFlowInterface<T> — data source with a read() method
 * - interval: number — polling interval (ms)
 * - activated: boolean — initial polling state
 * - tickerFactory?: TickerFactory — custom ticker factory (default: RAFTicker.factory)
 * - onError?: ErrorHandler — error handler
 *
 * Difference from PollingSourceTransfer:
 * - Uses FlowInterface instead of DataFetcher
 * - Convenient for working with Storage (LatestStorage, QueueStorage, StackStorage)
 *
 * Use cases:
 * - Periodic reading from storage
 * - Polling state from shared storage
 * - Integration with external sources via FlowInterface
 */
export class PollingFlowTransfer<T> extends BaseStateTransfer<T> implements PollingSourceTransferInterface, SubscribableTransferInterface<T>, PullableTransferInterface<T>, TriggerableTransferInterface, GateInterface {
  override readonly isOutput = true;

  override readonly isPollingSource = true;
  override readonly isPullable = true;
  override readonly isSubscribable = true;
  override readonly isTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _flow: OutputFlowInterface<T>;
  private readonly _ticker: TickerInterface;
  private readonly _onError?: ErrorHandler;

  constructor(config: PollingFlowTransferConfig<T>) {
    super({ ...config, initialValue: undefined });

    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._flow = config.flow;
    this._onError = config.onError;

    this._ticker = (config.tickerFactory ?? RAFTicker.factory)({
      callback: () => this.trigger(),
      interval: config.interval,
    });

    if (config.activated) {
      this._ticker.start();
    }
  }

  public pull(): T | undefined {
    try {
      return this._flow.read();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public trigger(): void {
    try {
      this._state.value = this._flow.read();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    }
  }

  public get active(): boolean {
    return this._ticker.active;
  }

  public activate(): void {
    this._ticker.start();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._ticker.stop();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._ticker.toggle();
    this._gateState.notify();
    return result;
  }

  public override destroy(): void {
    this._ticker.stop();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// IdlePollingTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive channel with fallback polling on idle incoming data.
 *
 * Capabilities: isInput, isOutput, isPushable, isSubscribable, isPollingSource, isTriggerable, isGate
 *
 * Mechanics:
 * 1. push(data) — writes the value, notifies subscribers, clears _state,
 *    resets the idle timer and stops polling if it was active
 * 2. If no data arrived via push() for longer than timeout ms — an internal
 *    Ticker (via tickerFactory) starts, periodically polling the fetcher at interval
 * 3. trigger() — manually calls the fetcher and notifies subscribers, restarts the idle timer
 * 4. subscribe(handler) — subscribes to notifications
 * 5. activate()/deactivate()/toggle() — control idle monitoring
 * 6. destroy() — stops timers, unsubscribes subscribers, clears state
 *
 * Error handling:
 * - If fetcher() throws an exception in trigger() or during polling, onError is called.
 * - With onError provided, the exception is suppressed (polling continues).
 * - Without onError, the exception is rethrown.
 *
 * Configuration (IdlePollingTransferConfig):
 * - fetcher: DataFetcher<T> — data retrieval function for idle polling
 * - timeout: number — idle time (ms) before polling starts
 * - interval: number — fetcher polling interval (ms)
 * - activated: boolean — initial idle monitoring state
 * - initialValue?: T — initial value in _state
 * - tickerFactory?: TickerFactory — custom ticker factory (default: RAFTicker.factory)
 * - onError?: ErrorHandler — fetcher error handler
 *
 * Use cases:
 * - Refreshing data from an API when the external source stops sending events
 * - Heartbeat / keep-alive mechanism: polling on absence of incoming data
 * - Fallback data source when the main stream is idle
 */
export class IdlePollingTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T>, TriggerableTransferInterface, PollingSourceTransferInterface, GateInterface {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;
  override readonly isPollingSource = true;
  override readonly isTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _timeout: number;
  private readonly _interval: number;
  private readonly _fetcher: DataFetcher<T>;
  private readonly _onError?: ErrorHandler;
  private readonly _tickerFactory: TickerFactory;

  private _active: boolean;
  private _idleTimer: ReturnType<typeof setTimeout> | null = null;
  private _ticker: TickerInterface | null = null;

  constructor(config: IdlePollingTransferConfig<T>) {
    super(config);
    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._timeout = config.timeout;
    this._interval = config.interval;
    this._fetcher = config.fetcher;
    this._onError = config.onError;
    this._tickerFactory = config.tickerFactory ?? RAFTicker.factory;
    this._active = config.activated;

    if (this._active) {
      this._startIdleTimer();
    }
  }

  public push(data: T): void {
    this._state.value = data;
    this._subscription.sendState();
    this._state.clear();

    if (this._active) {
      this._stopPolling();
      this._startIdleTimer();
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public trigger(): void {
    this._poll();
    if (this._active) {
      this._startIdleTimer();
    }
  }

  public get active(): boolean {
    return this._active;
  }

  public activate(): void {
    if (this._active) {
      return;
    }
    this._active = true;
    this._startIdleTimer();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._active = false;
    this._clearIdleTimer();
    this._stopPolling();
    this._gateState.notify();
  }

  public toggle(): boolean {
    if (this._active) {
      this.deactivate();
      return false;
    }
    this.activate();
    return true;
  }

  public override destroy(): void {
    this._active = false;
    this._clearIdleTimer();
    this._stopPolling();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }

  private _startIdleTimer(): void {
    this._clearIdleTimer();
    this._idleTimer = setTimeout(() => {
      this._idleTimer = null;
      this._startPolling();
    }, this._timeout);
  }

  private _clearIdleTimer(): void {
    if (this._idleTimer !== null) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  private _startPolling(): void {
    if (this._ticker !== null) {
      return;
    }
    this._ticker = this._tickerFactory({
      callback: () => this._poll(),
      interval: this._interval,
    });
    this._ticker.start();
  }

  private _stopPolling(): void {
    if (this._ticker !== null) {
      this._ticker.stop();
      this._ticker = null;
    }
  }

  private _poll(): void {
    try {
      this._state.value = this._fetcher();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncSinkTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Asynchronous terminal sink — calls a callback on receiving data.
 *
 * Capabilities: isInput, isAsyncPushable
 *
 * Mechanics:
 * 1. The constructor accepts config.callback: AsyncDataHandler<T>
 * 2. asyncPush(data) — calls await callback(data)
 * 3. destroy() — inherited from BaseStateTransfer, clears _state
 *
 * Configuration (AsyncSinkTransferConfig):
 * - callback: AsyncDataHandler<T> — incoming data handler (sync or async)
 *
 * Use cases:
 * - Asynchronous logging to file/database
 * - Side effects with async API (fetch, IndexedDB)
 */
export class AsyncSinkTransfer<T> extends BaseStateTransfer<T> implements AsyncPushableTransferInterface<T> {
  override readonly isInput = true;

  override readonly isAsyncPushable = true;

  private readonly _callback: AsyncDataHandler<T>;

  constructor(config: AsyncSinkTransferConfig<T>) {
    super({ ...config, initialValue: undefined });
    this._callback = config.callback;
  }

  async asyncPush(data: T): Promise<void> {
    await this._callback(data);
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncWriteTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Asynchronous write adapter for AsyncInputFlowInterface.
 *
 * Capabilities: isInput, isAsyncPushable
 *
 * Mechanics:
 * 1. The constructor accepts config.flow: AsyncInputFlowInterface<T>
 * 2. asyncPush(data) — calls await flow.write(data)
 * 3. destroy() — does nothing (does not own the flow)
 *
 * Error handling:
 * - If flow.write() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed. Without onError — rethrown.
 *
 * Configuration (AsyncWriteTransferConfig):
 * - flow: AsyncInputFlowInterface<T> — target flow with async write()
 * - onError?: ErrorHandler — error handler
 *
 * Use cases:
 * - Writing data to async storage (IndexedDB, API)
 * - Adapting an arbitrary object with async write() to pipeline
 */
export class AsyncWriteTransfer<T> extends BaseTransfer implements AsyncPushableTransferInterface<T> {
  override readonly isInput = true;

  override readonly isAsyncPushable = true;

  private readonly _flow: AsyncInputFlowInterface<T> | InputFlowInterface<T>;
  private readonly _onError?: ErrorHandler;

  constructor(config: AsyncWriteTransferConfig<T>) {
    super();
    this._flow = config.flow;
    this._onError = config.onError;
  }

  public async asyncPush(data: T): Promise<void> {
    try {
      await this._flow.write(data);
    } catch (e) {
      handleError(e, this._onError);
    }
  }

  public override destroy() {
    // Nothing to do
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncReadTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Asynchronous read adapter for AsyncOutputFlowInterface.
 *
 * Capabilities: isOutput, isAsyncPullable
 *
 * Mechanics:
 * 1. The constructor accepts config.flow: AsyncOutputFlowInterface<T>
 * 2. asyncPull() — returns await flow.read()
 * 3. destroy() — does nothing (does not own the flow)
 *
 * Error handling:
 * - If flow.read() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed, asyncPull() returns undefined.
 * - Without onError, the exception is rethrown.
 *
 * Configuration (AsyncReadTransferConfig):
 * - flow: AsyncOutputFlowInterface<T> — target flow with async read()
 * - onError?: ErrorHandler — error handler
 *
 * Use cases:
 * - Reading data from async storage (IndexedDB, API)
 * - Data source for async-polling transfers
 */
export class AsyncReadTransfer<T> extends BaseTransfer implements AsyncPullableTransferInterface<T> {
  override readonly isOutput = true;

  override readonly isAsyncPullable = true;

  private readonly _flow: AsyncOutputFlowInterface<T> | OutputFlowInterface<T>;
  private readonly _onError?: ErrorHandler;

  constructor(config: AsyncReadTransferConfig<T>) {
    super();
    this._flow = config.flow;
    this._onError = config.onError;
  }

  public async asyncPull(): Promise<T | undefined> {
    try {
      return await this._flow.read();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public override destroy() {
    // Nothing to do
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncPollingSourceTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Output transfer with asynchronous internal polling of a data source.
 *
 * Capabilities: isOutput, isPollingSource, isAsyncPullable, isSubscribable, isAsyncTriggerable, isGate
 *
 * Mechanics:
 * 1. The constructor accepts config.fetcher: AsyncDataFetcher<T>
 * 2. An internal Ticker calls _safeTrigger() — a fire-and-forget wrapper over asyncTrigger()
 * 3. asyncTrigger() — calls await fetcher(), writes the result, notifies subscribers
 * 4. asyncPull() — calls await fetcher() directly (without writing to state)
 * 5. The _polling flag prevents overlapping calls with a slow fetcher
 * 6. activate()/deactivate()/toggle() — control polling via the ticker
 *
 * Error handling:
 * - If fetcher() throws an exception in asyncTrigger() or asyncPull(), onError is called.
 * - With onError provided, the exception is suppressed (polling continues).
 * - Without onError, the exception is rethrown from asyncPull()/asyncTrigger().
 * - The ticker calls _safeTrigger() with .catch() — unhandled rejection is impossible.
 *
 * Configuration (AsyncPollingSourceConfig):
 * - fetcher: AsyncDataFetcher<T> — async data retrieval function
 * - interval: number — polling interval (ms)
 * - activated: boolean — initial polling state
 * - tickerFactory?: TickerFactory — custom ticker factory
 * - onError?: ErrorHandler — fetcher error handler
 */
export class AsyncPollingSourceTransfer<T> extends BaseStateTransfer<T> implements PollingSourceTransferInterface, SubscribableTransferInterface<T>, AsyncPullableTransferInterface<T>, AsyncTriggerableInterface, GateInterface {
  override readonly isOutput = true;

  override readonly isPollingSource = true;
  override readonly isAsyncPullable = true;
  override readonly isSubscribable = true;
  override readonly isAsyncTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _ticker: TickerInterface;
  private readonly _fetcher: AsyncDataFetcher<T>;
  private readonly _onError?: ErrorHandler;
  private _polling: boolean = false;

  constructor(config: AsyncPollingSourceConfig<T>) {
    super({ ...config, initialValue: undefined });

    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._fetcher = config.fetcher;
    this._onError = config.onError;

    this._ticker = (config.tickerFactory ?? RAFTicker.factory)({
      callback: () => this._safeTrigger(),
      interval: config.interval,
    });

    if (config.activated) {
      this._ticker.start();
    }
  }

  public async asyncPull(): Promise<T | undefined> {
    try {
      return await this._fetcher();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public async asyncTrigger(): Promise<void> {
    if (this._polling) {
      return;
    }
    this._polling = true;
    try {
      this._state.value = await this._fetcher();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    } finally {
      this._polling = false;
    }
  }

  private _safeTrigger(): void {
    this.asyncTrigger().catch(() => {
      // Error already handled in asyncTrigger via handleError.
      // If onError is not set, handleError rethrew — caught here
      // to prevent unhandled promise rejection from the ticker.
    });
  }

  public get active(): boolean {
    return this._ticker.active;
  }

  public activate(): void {
    this._ticker.start();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._ticker.stop();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._ticker.toggle();
    this._gateState.notify();
    return result;
  }

  public override destroy(): void {
    this._ticker.stop();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncPollingFlowTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Output transfer with asynchronous polling from AsyncOutputFlowInterface.
 *
 * Capabilities: isOutput, isPollingSource, isAsyncPullable, isSubscribable, isAsyncTriggerable, isGate
 *
 * Mechanics are analogous to AsyncPollingSourceTransfer, but the source is
 * AsyncOutputFlowInterface<T> (async read()) instead of AsyncDataFetcher<T>.
 *
 * Configuration (AsyncPollingFlowTransferConfig):
 * - flow: AsyncOutputFlowInterface<T> — data source with async read()
 * - interval, activated, tickerFactory, onError — same as in AsyncPollingSourceTransfer
 */
export class AsyncPollingFlowTransfer<T> extends BaseStateTransfer<T> implements PollingSourceTransferInterface, SubscribableTransferInterface<T>, AsyncPullableTransferInterface<T>, AsyncTriggerableInterface, GateInterface {
  override readonly isOutput = true;

  override readonly isPollingSource = true;
  override readonly isAsyncPullable = true;
  override readonly isSubscribable = true;
  override readonly isAsyncTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _flow: AsyncOutputFlowInterface<T>;
  private readonly _ticker: TickerInterface;
  private readonly _onError?: ErrorHandler;
  private _polling: boolean = false;

  constructor(config: AsyncPollingFlowTransferConfig<T>) {
    super({ ...config, initialValue: undefined });

    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._flow = config.flow;
    this._onError = config.onError;

    this._ticker = (config.tickerFactory ?? RAFTicker.factory)({
      callback: () => this._safeTrigger(),
      interval: config.interval,
    });

    if (config.activated) {
      this._ticker.start();
    }
  }

  public async asyncPull(): Promise<T | undefined> {
    try {
      return await this._flow.read();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public async asyncTrigger(): Promise<void> {
    if (this._polling) {
      return;
    }
    this._polling = true;
    try {
      this._state.value = await this._flow.read();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    } finally {
      this._polling = false;
    }
  }

  private _safeTrigger(): void {
    this.asyncTrigger().catch(() => {
      // Error already handled in asyncTrigger via handleError.
    });
  }

  public get active(): boolean {
    return this._ticker.active;
  }

  public activate(): void {
    this._ticker.start();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._ticker.stop();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._ticker.toggle();
    this._gateState.notify();
    return result;
  }

  public override destroy(): void {
    this._ticker.stop();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncPollingProxyTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Duplex transfer with asynchronous polling that receives its fetcher from the previous node.
 *
 * Capabilities: isInput, isOutput, isDuplex, isAsyncPollingProxy, isPollingSource,
 *              isAsyncPullable, isSubscribable, isAsyncTriggerable, isGate
 *
 * Mechanics:
 * 1. The constructor accepts config (interval, activated), but NOT a fetcher
 * 2. setAsyncFetcher(fetcher) — sets the async fetcher, creates a Ticker, starts if active
 * 3. clearAsyncFetcher() — stops the Ticker, clears the fetcher
 * 4. asyncTrigger() — calls await fetcher(), notifies subscribers (if active)
 * 5. asyncPull() — calls await fetcher() directly (if active and fetcher is set)
 * 6. The _polling flag prevents overlapping
 * 7. activate()/deactivate()/toggle() — control polling
 *
 * Error handling:
 * - If fetcher() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed. Without onError — rethrown.
 * - The 'Async fetcher is not defined' error is always rethrown.
 * - The ticker calls _safeTrigger() with .catch() — unhandled rejection is impossible.
 *
 * Configuration (AsyncPollingProxyConfig):
 * - interval: number — polling interval (ms)
 * - activated: boolean — initial polling state
 * - tickerFactory?: TickerFactory
 * - onError?: ErrorHandler
 */
export class AsyncPollingProxyTransfer<T> extends BaseStateTransfer<T> implements AsyncPollingProxyTransferInterface<T>, PollingSourceTransferInterface, SubscribableTransferInterface<T>, AsyncPullableTransferInterface<T>, AsyncTriggerableInterface, GateInterface {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isAsyncPollingProxy = true;
  override readonly isPollingSource = true;
  override readonly isAsyncPullable = true;
  override readonly isSubscribable = true;
  override readonly isAsyncTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _interval: number;
  private readonly _tickerFactory: TickerFactory;
  private readonly _onError?: ErrorHandler;

  private _active: boolean;
  private _ticker: TickerInterface | undefined;
  private _fetcher: AsyncDataFetcher<T> | undefined;
  private _polling: boolean = false;

  constructor(config: AsyncPollingProxyConfig) {
    super({ ...config, initialValue: undefined });
    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._active = config.activated;
    this._interval = config.interval;
    this._tickerFactory = config.tickerFactory ?? RAFTicker.factory;
    this._onError = config.onError;
  }

  public async asyncPull(): Promise<T | undefined> {
    if (!this._active) {
      return undefined;
    }
    if (this._fetcher === undefined) {
      throw new Error('Async fetcher is not defined');
    }
    try {
      return await this._fetcher();
    } catch (e) {
      handleError(e, this._onError);
      return undefined;
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public async asyncTrigger(): Promise<void> {
    if (!this._active) {
      return;
    }
    if (this._fetcher === undefined) {
      throw new Error('Async fetcher is not defined');
    }
    if (this._polling) {
      return;
    }
    this._polling = true;
    try {
      this._state.value = await this._fetcher();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    } finally {
      this._polling = false;
    }
  }

  private _safeTrigger(): void {
    this.asyncTrigger().catch(() => {
      // Error already handled in asyncTrigger via handleError.
    });
  }

  public setAsyncFetcher(fetcher: AsyncDataFetcher<T>): void {
    this.clearAsyncFetcher();
    this._fetcher = fetcher;

    this._ticker = this._tickerFactory({
      callback: () => this._safeTrigger(),
      interval: this._interval,
    });

    if (this._active) {
      this._ticker.start();
    }
  }

  public clearAsyncFetcher(): void {
    if (this._ticker === undefined) {
      return;
    }
    this._ticker.stop();
    this._ticker = undefined;
    this._fetcher = undefined;
  }

  public get active(): boolean {
    return this._active;
  }

  public activate(): void {
    this._ticker?.start();
    this._active = true;
    this._gateState.notify();
  }

  public deactivate(): void {
    this._ticker?.stop();
    this._active = false;
    this._gateState.notify();
  }

  public toggle(): boolean {
    this._ticker?.toggle();
    this._active = !this._active;
    this._gateState.notify();
    return this._active;
  }

  public override destroy(): void {
    this._active = false;
    this.clearAsyncFetcher();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncIdlePollingTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Reactive channel with asynchronous fallback polling on idle.
 *
 * Capabilities: isInput, isOutput, isDuplex, isPushable, isSubscribable,
 *              isPollingSource, isTriggerable, isGate
 *
 * Mechanics:
 * 1. push(data) — synchronously writes, notifies, clears, resets the idle timer
 * 2. trigger() — synchronously starts _safePoll() (fire-and-forget async)
 * 3. If no data arrived for longer than timeout ms — polling starts via Ticker
 * 4. The ticker calls _safePoll() — async fetcher in the background
 * 5. On push — polling stops, the idle timer resets
 * 6. The _polling flag prevents overlapping
 *
 * Note: push and trigger are synchronous (like in the sync version),
 * but the fetcher is asynchronous. Results arrive via sync subscription.
 *
 * Error handling:
 * - If fetcher() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed. Without onError — rethrown from _doPoll.
 * - _safePoll() calls _doPoll().catch() — unhandled rejection is impossible.
 *
 * Configuration (AsyncIdlePollingTransferConfig):
 * - fetcher: AsyncDataFetcher<T> — async data retrieval function for idle polling
 * - timeout: number — idle time (ms) before polling starts
 * - interval: number — fetcher polling interval (ms)
 * - activated: boolean — initial idle monitoring state
 * - initialValue?: T
 * - tickerFactory?: TickerFactory
 * - onError?: ErrorHandler
 */
export class AsyncIdlePollingTransfer<T> extends BaseStateTransfer<T> implements PushableTransferInterface<T>, SubscribableTransferInterface<T>, TriggerableTransferInterface, PollingSourceTransferInterface, GateInterface {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isPushable = true;
  override readonly isSubscribable = true;
  override readonly isPollingSource = true;
  override readonly isTriggerable = true;
  override readonly isGate = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _gateState: StateSubscriptionManager<GateInterface>;
  private readonly _timeout: number;
  private readonly _interval: number;
  private readonly _fetcher: AsyncDataFetcher<T>;
  private readonly _onError?: ErrorHandler;
  private readonly _tickerFactory: TickerFactory;

  private _active: boolean;
  private _idleTimer: ReturnType<typeof setTimeout> | null = null;
  private _ticker: TickerInterface | null = null;
  private _polling: boolean = false;

  constructor(config: AsyncIdlePollingTransferConfig<T>) {
    super(config);
    this._subscription = new SubscriptionManager(this._state);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._timeout = config.timeout;
    this._interval = config.interval;
    this._fetcher = config.fetcher;
    this._onError = config.onError;
    this._tickerFactory = config.tickerFactory ?? RAFTicker.factory;
    this._active = config.activated;

    if (this._active) {
      this._startIdleTimer();
    }
  }

  public push(data: T): void {
    this._state.value = data;
    this._subscription.sendState();
    this._state.clear();

    if (this._active) {
      this._stopPolling();
      this._startIdleTimer();
    }
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public trigger(): void {
    this._safePoll();
    if (this._active) {
      this._startIdleTimer();
    }
  }

  public get active(): boolean {
    return this._active;
  }

  public activate(): void {
    if (this._active) {
      return;
    }
    this._active = true;
    this._startIdleTimer();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._active = false;
    this._clearIdleTimer();
    this._stopPolling();
    this._gateState.notify();
  }

  public toggle(): boolean {
    if (this._active) {
      this.deactivate();
      return false;
    }
    this.activate();
    return true;
  }

  public override destroy(): void {
    this._active = false;
    this._clearIdleTimer();
    this._stopPolling();
    this._subscription.destroy();
    this._gateState.destroy();
    super.destroy();
  }

  private _startIdleTimer(): void {
    this._clearIdleTimer();
    this._idleTimer = setTimeout(() => {
      this._idleTimer = null;
      this._startPolling();
    }, this._timeout);
  }

  private _clearIdleTimer(): void {
    if (this._idleTimer !== null) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  private _startPolling(): void {
    if (this._ticker !== null) {
      return;
    }
    this._ticker = this._tickerFactory({
      callback: () => this._safePoll(),
      interval: this._interval,
    });
    this._ticker.start();
  }

  private _stopPolling(): void {
    if (this._ticker !== null) {
      this._ticker.stop();
      this._ticker = null;
    }
  }

  private _safePoll(): void {
    this._doPoll().catch(() => {
      // Error already handled in _doPoll via handleError.
    });
  }

  private async _doPoll(): Promise<void> {
    if (this._polling) {
      return;
    }
    this._polling = true;
    try {
      this._state.value = await this._fetcher();
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    } finally {
      this._polling = false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncConvertTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Async converter transfer: transforms input data via an AsyncOperator
 * and sends the result to subscribers.
 *
 * Capabilities: isInput, isOutput, isDuplex, isAsyncPushable, isSubscribable
 *
 * Mechanics:
 * 1. The constructor accepts config.operator: AsyncOperatorInterface<TInput, TOutput | undefined>
 * 2. asyncPush(data) — applies await operator.apply(data), notifies subscribers, clears _state
 * 3. subscribe(handler) — subscribes to transformed data (sync)
 * 4. If the operator returns undefined — subscribers are not notified
 *
 * Error handling:
 * - If operator.apply() throws an exception, onError is called.
 * - With onError provided, the exception is suppressed. Without onError — rethrown.
 *
 * Configuration (AsyncConvertTransferConfig):
 * - operator: AsyncOperatorInterface<TInput, TOutput | undefined>
 * - onError?: ErrorHandler
 */
export class AsyncConvertTransfer<TInput, TOutput> extends BaseStateTransfer<TOutput> implements AsyncPushableTransferInterface<TInput>, SubscribableTransferInterface<TOutput> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isAsyncPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<TOutput>;
  private readonly _operator: AsyncOperatorInterface<TInput, TOutput | undefined>;
  private readonly _onError?: ErrorHandler;

  constructor(config: AsyncConvertTransferConfig<TInput, TOutput>) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._operator = config.operator;
    this._onError = config.onError;
  }

  public async asyncPush(data: TInput): Promise<void> {
    try {
      this._state.value = await this._operator.apply(data);
      this._subscription.sendState();
      this._state.clear();
    } catch (e) {
      handleError(e, this._onError);
    }
  }

  public subscribe(handler: DataHandler<TOutput>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncConditionTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Transfer with asynchronous conditional filtering on input and output.
 *
 * Capabilities: isInput, isOutput, isDuplex, isAsyncPushable, isSubscribable
 *
 * Mechanics:
 * 1. shouldAccept(data) — async input filter (if false, data is ignored)
 * 2. shouldEmit(state) — async output filter (if false, data remains in state)
 * 3. asyncPush(data) — await shouldAccept → write → await shouldEmit → sendState + clear
 * 4. Predicates can be sync or async (return Promise<boolean> | boolean)
 *
 * Error handling:
 * - If shouldAccept or shouldEmit throws an exception, onError is called.
 * - With onError provided, the exception is suppressed.
 *
 * Configuration (AsyncConditionTransferConfig):
 * - shouldAccept?: (data: T) => Promise<boolean> | boolean
 * - shouldEmit?: (state: T | undefined) => Promise<boolean> | boolean
 * - onError?: ErrorHandler
 */
export class AsyncConditionTransfer<T> extends BaseStateTransfer<T> implements AsyncPushableTransferInterface<T>, SubscribableTransferInterface<T> {
  override readonly isInput = true;
  override readonly isOutput = true;
  override readonly isDuplex = true;

  override readonly isAsyncPushable = true;
  override readonly isSubscribable = true;

  private readonly _subscription: SubscriptionManager<T>;
  private readonly _shouldAccept: (incomingData: T) => Promise<boolean> | boolean;
  private readonly _shouldEmit: (currentState: T | undefined) => Promise<boolean> | boolean;
  private readonly _onError?: ErrorHandler;

  constructor(config: AsyncConditionTransferConfig<T>) {
    super();
    this._subscription = new SubscriptionManager(this._state);
    this._shouldAccept = config.shouldAccept ?? (() => true);
    this._shouldEmit = config.shouldEmit ?? (() => true);
    this._onError = config.onError;
  }

  public async asyncPush(data: T): Promise<void> {
    try {
      if (!await this._shouldAccept(data)) {
        return;
      }
    } catch (e) {
      handleError(e, this._onError);
      return;
    }

    this._state.value = data;

    try {
      if (!await this._shouldEmit(this._state.value)) {
        return;
      }
    } catch (e) {
      handleError(e, this._onError);
      return;
    }

    this._subscription.sendState();
    this._state.clear();
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public override destroy() {
    this._subscription.destroy();
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncStoredChannelTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Output channel with value retention, external management, and async interface.
 *
 * Capabilities: isOutput, isSubscribable, isAsyncPullable, isAsyncTriggerable
 *
 * Mechanics:
 * 1. setup(emit) / destroy() — sync, like in StoredChannelTransfer
 * 2. emit(data) — sync, writes the value, calls asyncTrigger (fire-and-forget)
 * 3. asyncPull() — returns the current value (trivially async)
 * 4. asyncTrigger() — notifies subscribers (trivially async)
 * 5. subscribe(handler) — sync subscription
 *
 * Note: setup/emit/subscribe are synchronous (subscription remains sync),
 * but pull/trigger are async for integration with async pipelines.
 *
 * Configuration (AsyncStoredChannelTransferConfig):
 * - setup: (emit: DataHandler<T>) => void
 * - destroy: () => void
 * - initialValue?: T
 * - onSetupError?, onEmitError?, onDestroyError?: ErrorHandler
 */
export class AsyncStoredChannelTransfer<T> extends BaseStateTransfer<T> implements SubscribableTransferInterface<T>, AsyncPullableTransferInterface<T>, AsyncTriggerableInterface {
  override readonly isOutput = true;

  override readonly isSubscribable = true;
  override readonly isAsyncPullable = true;
  override readonly isAsyncTriggerable = true;

  protected readonly _emit: DataHandler<T>;
  protected readonly _destroy: () => void;
  protected readonly _onSetupError?: ErrorHandler;
  protected readonly _onEmitError?: ErrorHandler;
  protected readonly _onDestroyError?: ErrorHandler;

  private readonly _subscription: SubscriptionManager<T>;

  constructor(config: AsyncStoredChannelTransferConfig<T>) {
    super(config);
    this._subscription = new SubscriptionManager(this._state);
    this._onSetupError = config.onSetupError;
    this._onEmitError = config.onEmitError;
    this._onDestroyError = config.onDestroyError;
    this._destroy = config.destroy;
    this._emit = (data: T) => {
      this._state.value = data;
      this._safeTrigger();
    };

    try {
      config.setup(this._emit);
    } catch (e) {
      handleError(e, this._onSetupError);
    }
  }

  public async asyncPull(): Promise<T | undefined> {
    return this._state.value;
  }

  public subscribe(handler: DataHandler<T>): SubscriberInterface {
    return this._subscription.subscribe(handler);
  }

  public async asyncTrigger(): Promise<void> {
    try {
      this._subscription.sendState();
    } catch (e) {
      handleError(e, this._onEmitError);
    }
  }

  private _safeTrigger(): void {
    this.asyncTrigger().catch(() => {
      // Error already handled in asyncTrigger via handleError.
    });
  }

  public override destroy() {
    this._subscription.destroy();
    try {
      this._destroy();
    } catch (e) {
      handleError(e, this._onDestroyError);
    }
    super.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer
// ═══════════════════════════════════════════════════════════════
/**
 * Universal composite transfer — combines input and output transfers
 * into a single duplex interface with automatic extraction of additional capabilities.
 *
 * Capabilities: depend on the provided input/output (determined dynamically via flags)
 *
 * Mechanics:
 * 1. The constructor accepts config with required input/output and optional:
 *    - triggerable?: TriggerableInterface — explicit object for trigger()
 *    - gate?: GateInterface — explicit object for active control
 *    - owned?: DisposableInterface[] — resources to clean up on destroy()
 * 2. Automatically extracts triggerable and gate by priority:
 *    - Priority 1: config.triggerable / config.gate (explicit)
 *    - Priority 2: config.input (if it has the corresponding flag)
 *    - Priority 3: config.output (if it has the corresponding flag)
 * 3. Delegates input/output methods:
 *    - push(data) → _input.push(data)
 *    - pull() → _output.pull()
 *    - subscribe(handler) → _output.subscribe(handler)
 *    - trigger() → _triggerable.trigger()
 *    - setFetcher/clearFetcher() → _input.setFetcher/clearFetcher()
 *    - activate/deactivate/toggle/active → _gate.*
 * 4. All methods check capabilities via flags before calling
 * 5. destroy() — cleans up all owned resources
 *
 * Triggerable/gate extraction priorities:
 * - If config.triggerable is specified — it is used
 * - Otherwise if config.input.isTriggerable — input is used
 * - Otherwise if config.output.isTriggerable — output is used
 * - Otherwise undefined (trigger() will throw an error)
 *
 * Configuration (CompositeTransferConfig):
 * - input: InputTransfer<TInput> — input transfer
 * - output: OutputTransfer<TOutput> — output transfer
 * - triggerable?: TriggerableInterface — explicit triggerable (optional)
 * - gate?: GateInterface — explicit gate (optional)
 * - owned?: DisposableInterface[] — managed resources (optional)
 *
 * Use cases:
 * - Composing separate input and output transfers into a single interface
 * - Adapting legacy transfers to the new flag-based architecture
 * - Building complex pipelines with automatic capability management
 * - Encapsulating multiple resources into a single managed object
 *
 * @example
 * // Basic usage with automatic extraction
 * const transfer = new PushStoredChannelTransfer<number>();
 * const composite = new UniversalCompositeTransfer({
 *   input: transfer,
 *   output: transfer,
 *   owned: [transfer],
 * });
 *
 * composite.push(42);
 * // Delegates input.push()
 *
 * composite.subscribe(console.log);
 * // Delegates output.subscribe()
 *
 * composite.trigger();
 * // Delegates triggerable.trigger()
 *
 * composite.destroy();
 * // Cleans up owned resources
 *
 * @example
 * // Explicit triggerable and gate
 * const input = new PushChannelTransfer<number>();
 * const output = new PushChannelTransfer<number>();
 * const gate = new GateTransfer<number>({ activated: true, initialValue: 0 });
 * const composite = new UniversalCompositeTransfer({
 *   input,
 *   output,
 *   gate, // Explicitly specify gate
 *   owned: [gate],
 * });
 */
export class UniversalCompositeTransfer<TInput, TOutput> implements UniversalDuplexInterface<TInput, TOutput> {
  private readonly _input: UniversalInputInterface<TInput>;
  private readonly _output: UniversalOutputInterface<TOutput>;
  private readonly _triggerable?: TriggerableInterface;
  private readonly _asyncTriggerable?: AsyncTriggerableInterface;
  private readonly _gate?: GateInterface;
  private _owned: readonly DisposableInterface[];

  constructor(config: CompositeTransferConfig<TInput, TOutput>) {
    this._input = config.input as UniversalInputInterface<TInput>;
    this._output = config.output as UniversalOutputInterface<TOutput>;
    this._triggerable = this._extractTriggerable(config);
    this._asyncTriggerable = this._extractAsyncTriggerable(config);
    this._gate = this._extractGate(config);
    this._owned = config.owned ?? [];
  }

  /**
   * Sends data to the input transfer.
   * @param data Data to send
   * @throws Error if isPushable === false
   */
  public push(data: TInput): void {
    if (!this.isPushable) {
      throw new Error("Cannot push to non-pushable transfer");
    }
    this._input.push(data);
  }

  /**
   * Extracts data from the output transfer.
   * @returns Data or undefined if no data
   * @throws Error if isPullable === false
   */
  public pull(): TOutput | undefined {
    if (!this.isPullable) {
      throw new Error("Cannot pull from non-pullable transfer");
    }
    return this._output.pull();
  }

  /**
   * Subscribes to output transfer notifications.
   * @param handler Notification handler
   * @returns SubscriberInterface for subscription management
   * @throws Error if isSubscribable === false
   */
  public subscribe(handler: DataHandler<TOutput>): SubscriberInterface {
    if (!this.isSubscribable) {
      throw new Error("Cannot subscribe on non-subscribable transfer");
    }
    return this._output.subscribe(handler);
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    if (this._gate === undefined) {
      throw new Error("Cannot subscribe to state of non-gate transfer");
    }
    return this._gate.onStateChange(handler);
  }

  /**
   * Manual trigger to send data to subscribers.
   * @throws Error if _triggerable === undefined (isTriggerable === false)
   */
  public trigger() {
    if (this._triggerable === undefined) {
      throw new Error("Cannot trigger on non-triggerable transfer");
    }
    this._triggerable.trigger();
  }

  /**
   * Sets the fetcher for polling.
   * @param fetcher Data retrieval function
   * @throws Error if isPollingProxy === false
   */
  public setFetcher(fetcher: DataFetcher<TInput>) {
    if (!this.isPollingProxy) {
      throw new Error("Cannot set fetcher to non-pollable transfer");
    }
    this._input.setFetcher(fetcher);
  }

  /**
   * Clears the fetcher for polling.
   * @throws Error if isPollingProxy === false
   */
  public clearFetcher() {
    if (!this.isPollingProxy) {
      throw new Error("Cannot clear fetcher of non-pollable transfer");
    }
    this._input.clearFetcher();
  }

  /**
   * Asynchronously sends data to the input transfer.
   * @throws Error if isAsyncPushable === false
   */
  public async asyncPush(data: TInput): Promise<void> {
    if (!this.isAsyncPushable) {
      throw new Error("Cannot asyncPush to non-async-pushable transfer");
    }
    await (this._input as AsyncPushableInterface<TInput>).asyncPush(data);
  }

  /**
   * Asynchronously extracts data from the output transfer.
   * @throws Error if isAsyncPullable === false
   */
  public async asyncPull(): Promise<TOutput | undefined> {
    if (!this.isAsyncPullable) {
      throw new Error("Cannot asyncPull from non-async-pullable transfer");
    }
    return (this._output as AsyncPullableInterface<TOutput>).asyncPull();
  }

  /**
   * Asynchronous manual trigger.
   * @throws Error if _asyncTriggerable === undefined (isAsyncTriggerable === false)
   */
  public async asyncTrigger(): Promise<void> {
    if (this._asyncTriggerable === undefined) {
      throw new Error("Cannot asyncTrigger on non-async-triggerable transfer");
    }
    await this._asyncTriggerable.asyncTrigger();
  }

  /**
   * Sets the async fetcher for polling.
   * @throws Error if isAsyncPollingProxy === false
   */
  public setAsyncFetcher(fetcher: AsyncDataFetcher<TInput>): void {
    if (!this.isAsyncPollingProxy) {
      throw new Error("Cannot setAsyncFetcher to non-async-pollable transfer");
    }
    (this._input as AsyncPollingProxyInterface<TInput>).setAsyncFetcher(fetcher);
  }

  /**
   * Clears the async fetcher.
   * @throws Error if isAsyncPollingProxy === false
   */
  public clearAsyncFetcher(): void {
    if (!this.isAsyncPollingProxy) {
      throw new Error("Cannot clearAsyncFetcher of non-async-pollable transfer");
    }
    (this._input as AsyncPollingProxyInterface<TInput>).clearAsyncFetcher();
  }

  /**
   * Checks the gate state (active/inactive).
   * @returns true if the gate is active
   * @throws Error if _gate === undefined (isGate === false)
   */
  public get active(): boolean {
    if (this._gate === undefined) {
      throw new Error("Cannot check active state of non-gate transfer");
    }
    return this._gate.active;
  }

  /**
   * Activates the gate (enables data flow).
   * @throws Error if _gate === undefined (isGate === false)
   */
  public activate(): void {
    if (this._gate === undefined) {
      throw new Error("Cannot activate non-gate transfer");
    }
    this._gate.activate();
  }

  /**
   * Deactivates the gate (blocks data flow).
   * @throws Error if _gate === undefined (isGate === false)
   */
  public deactivate(): void {
    if (this._gate === undefined) {
      throw new Error("Cannot deactivate non-gate transfer");
    }
    this._gate.deactivate();
  }

  /**
   * Toggles the gate state.
   * @returns The new gate state
   * @throws Error if _gate === undefined (isGate === false)
   */
  public toggle(): boolean {
    if (this._gate === undefined) {
      throw new Error("Cannot toggle non-gate transfer");
    }
    return this._gate.toggle();
  }

  /**
   * Cleans up all owned resources.
   * Calls destroy() on each resource in the owned array.
   */
  public destroy(): void {
    this._owned.forEach((resource) => resource.destroy());
    this._owned = [];
  }

  /**
   * Flag: whether the transfer is an input.
   * Delegated from _input.isInput.
   */
  public get isInput(): boolean {
    return this._input.isInput;
  }

  /**
   * Flag: whether the transfer is an output.
   * Delegated from _output.isOutput.
   */
  public get isOutput(): boolean {
    return this._output.isOutput;
  }

  /**
   * Flag: whether the transfer is duplex (both input and output).
   * Computed as isInput && isOutput.
   */
  public get isDuplex(): boolean {
    return this.isInput && this.isOutput;
  }

  /**
   * Flag: whether the transfer is a polling data source.
   * Delegated from _output.isPollingSource.
   */
  public get isPollingSource(): boolean {
    return this._output.isPollingSource;
  }

  /**
   * Flag: whether the transfer can poll other transfers.
   * Delegated from _input.isPollingProxy.
   */
  public get isPollingProxy(): boolean {
    return this._input.isPollingProxy;
  }

  /**
   * Flag: whether the transfer supports sending data via push().
   * Delegated from _input.isPushable.
   */
  public get isPushable(): boolean {
    return this._input.isPushable;
  }

  /**
   * Flag: whether the transfer supports extracting data via pull().
   * Delegated from _output.isPullable.
   */
  public get isPullable(): boolean {
    return this._output.isPullable;
  }

  /**
   * Flag: whether the transfer supports subscription via subscribe().
   * Delegated from _output.isSubscribable.
   */
  public get isSubscribable(): boolean {
    return this._output.isSubscribable;
  }

  /**
   * Flag: whether the transfer supports a manual trigger via trigger().
   * true if _triggerable !== undefined.
   */
  public get isTriggerable(): boolean {
    return this._triggerable !== undefined;
  }

  /**
   * Flag: whether the transfer supports flow control via gate.
   * true if _gate !== undefined.
   */
  public get isGate(): boolean {
    return this._gate !== undefined;
  }

  /**
   * Flag: whether the transfer supports async data push via asyncPush().
   * Delegated from _input.isAsyncPushable.
   */
  public get isAsyncPushable(): boolean {
    return this._input.isAsyncPushable;
  }

  /**
   * Flag: whether the transfer supports async data extraction via asyncPull().
   * Delegated from _output.isAsyncPullable.
   */
  public get isAsyncPullable(): boolean {
    return this._output.isAsyncPullable;
  }

  /**
   * Flag: whether the transfer supports async manual trigger via asyncTrigger().
   * true if _asyncTriggerable !== undefined.
   */
  public get isAsyncTriggerable(): boolean {
    return this._asyncTriggerable !== undefined;
  }

  /**
   * Flag: whether the transfer can asynchronously poll another transfer.
   * Delegated from _input.isAsyncPollingProxy.
   */
  public get isAsyncPollingProxy(): boolean {
    return this._input.isAsyncPollingProxy;
  }

  /**
   * Extracts TriggerableInterface from the configuration.
   * Priorities:
   * 1. config.triggerable (explicit)
   * 2. config.input (if input.isTriggerable === true)
   * 3. config.output (if output.isTriggerable === true)
   * 4. undefined (if nothing found)
   */
  private _extractTriggerable(config: CompositeTransferConfig<TInput, TOutput>): TriggerableInterface | undefined {
    if (config.triggerable !== undefined) {
      return config.triggerable;
    }
    if (config.input.isTriggerable) {
      return config.input as UniversalInputInterface<TInput>;
    }
    if (config.output.isTriggerable) {
      return config.output as UniversalOutputInterface<TInput>;
    }
    return undefined;
  }

  /**
   * Extracts GateInterface from the configuration.
   * Priorities:
   * 1. config.gate (explicit)
   * 2. config.input (if input.isGate === true)
   * 3. config.output (if output.isGate === true)
   * 4. undefined (if nothing found)
   */
  private _extractGate(config: CompositeTransferConfig<TInput, TOutput>): GateInterface | undefined {
    if (config.gate !== undefined) {
      return config.gate;
    }
    if (config.input.isGate) {
      return config.input as UniversalInputInterface<TInput>;
    }
    if (config.output.isGate) {
      return config.output as UniversalOutputInterface<TInput>;
    }
    return undefined;
  }

  /**
   * Extracts AsyncTriggerableInterface from the configuration.
   * Priorities:
   * 1. config.asyncTriggerable (explicit)
   * 2. config.input (if input.isAsyncTriggerable === true)
   * 3. config.output (if output.isAsyncTriggerable === true)
   * 4. undefined (if nothing found)
   */
  private _extractAsyncTriggerable(config: CompositeTransferConfig<TInput, TOutput>): AsyncTriggerableInterface | undefined {
    if (config.asyncTriggerable !== undefined) {
      return config.asyncTriggerable;
    }
    if (config.input.isAsyncTriggerable) {
      return config.input as UniversalInputInterface<TInput>;
    }
    if (config.output.isAsyncTriggerable) {
      return config.output as UniversalOutputInterface<TInput>;
    }
    return undefined;
  }
}
