import type {
  BaseSelectorKey,
  DataFetcher,
  DataHandler,
  AsyncDataFetcher,
  DuplexTransfer,
  First,
  Last,
  InputTransfer,
  OutputTransfer,
  SelectorKey,
  CompositeDuplexTransfer,
  CompositeInputTransfer,
  CompositeOutputTransfer,
  OutputTransferDataType,
  InputTransferDataType,
  ErrorHandler,
} from "./types";

/** Write-only flow — accepts data via write(). */
export interface InputFlowInterface<T> {
  write(data: T): void;
}

/** Read-only flow — yields data via read(). */
export interface OutputFlowInterface<T> {
  read(): T | undefined;
}

/** Bidirectional flow — combines read and write. */
export interface IOFlowInterface<TInput, TOutput> extends InputFlowInterface<TInput>, OutputFlowInterface<TOutput> {}

/** Bidirectional storage with size tracking, clear, and reset. */
export interface StorageInterface<TInput, TOutput> extends IOFlowInterface<TInput, TOutput> {
  readonly size: number;
  clear(): void;
  reset(): void;
}

/** Asynchronous write-only flow — accepts data via async write(). */
export interface AsyncInputFlowInterface<T> {
  write(data: T): Promise<void>;
}

/** Asynchronous read-only flow — yields data via async read(). */
export interface AsyncOutputFlowInterface<T> {
  read(): Promise<T | undefined>;
}

/** Asynchronous bidirectional flow — combines async read and write. */
export interface AsyncIOFlowInterface<TInput, TOutput> extends AsyncInputFlowInterface<TInput>, AsyncOutputFlowInterface<TOutput> {}

/** Asynchronous bidirectional storage with async clear/reset. */
export interface AsyncStorageInterface<TInput, TOutput> extends AsyncIOFlowInterface<TInput, TOutput> {
  readonly size: number;
  clear(): Promise<void>;
  reset(): Promise<void>;
}

/** Synchronous data transformation operator — maps TInput to TOutput. */
export interface OperatorInterface<TInput, TOutput> {
  apply(data: TInput): TOutput;
}

/** Asynchronous data transformation operator — maps TInput to Promise<TOutput>. */
export interface AsyncOperatorInterface<TInput, TOutput> {
  apply(data: TInput): Promise<TOutput>;
}

/**
 * Ticker interface — an abstraction over periodic callback invocation.
 * Two implementations: RAFTicker (browser, requestAnimationFrame) and IntervalTicker (Node.js, setInterval).
 */
export interface TickerInterface {
  /** Interval in milliseconds */
  readonly interval: number;
  /** Whether the ticker is active (running) */
  readonly active: boolean;

  /** Start the ticker (with a leading-edge call) */
  start(): void;
  /** Stop the ticker */
  stop(): void;
  /** Stop and restart */
  restart(): void;
  /** Toggle state (start/stop), returns the new state */
  toggle(): boolean;
  /** Update interval on the fly (restarts the ticker if active) */
  updateInterval(delay: number): void;
}

/** Subscription handle — tracks active state and supports unsubscribe lifecycle hooks. */
export interface SubscriberInterface {
  readonly active: boolean;
  unsubscribe(): void;
  onUnsubscribe(handler: DataHandler<SubscriberInterface>): SubscriberInterface;
  offUnsubscribe(handler: DataHandler<SubscriberInterface>): SubscriberInterface;
}

/** Resource cleanup contract — destroy() releases all held resources. */
export interface DisposableInterface {
  destroy(): void;
}

/** Flow control contract — activate/deactivate/toggle with state-change subscriptions. */
export interface GateInterface {
  readonly active: boolean;
  activate(): void;
  deactivate(): void;
  toggle(): boolean;
  onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface;
}

/** Pushable contract — accepts data via push(). */
export interface PushableInterface<T> {
  push(data: T): void;
}

/** Pullable contract — yields data via pull(). */
export interface PullableInterface<T> {
  pull(): T | undefined;
}

/** Subscribable contract — registers a handler that is called on each emitted value. */
export interface SubscribableInterface<T> {
  subscribe(handler: DataHandler<T>): SubscriberInterface;
}

/** Triggerable contract — manually triggers emission of the current value to subscribers. */
export interface TriggerableInterface {
  trigger(): void;
}

/** Polling proxy contract — receives a fetcher from the upstream transfer and manages its lifecycle via set/clear. */
export interface PollingProxyInterface<T> {
  setFetcher(fetcher: DataFetcher<T>): void;
  clearFetcher(): void;
}

/** Asynchronous pushable contract — accepts data via asyncPush() returning a Promise. */
export interface AsyncPushableInterface<T> {
  asyncPush(data: T): Promise<void>;
}

/** Asynchronous pullable contract — yields data via asyncPull() returning a Promise. */
export interface AsyncPullableInterface<T> {
  asyncPull(): Promise<T | undefined>;
}

/** Asynchronous triggerable contract — triggers emission via asyncTrigger() returning a Promise. */
export interface AsyncTriggerableInterface {
  asyncTrigger(): Promise<void>;
}

/** Async polling proxy contract — receives an async fetcher from the upstream transfer and manages its lifecycle. */
export interface AsyncPollingProxyInterface<T> {
  setAsyncFetcher(fetcher: AsyncDataFetcher<T>): void;
  clearAsyncFetcher(): void;
}

/** Universal input interface — aggregates all sync and async input capabilities (push, poll, trigger, gate, async variants). */
export interface UniversalInputInterface<T> extends
  BaseTransferInterface, PushableInterface<T>, PollingProxyInterface<T>, TriggerableInterface, GateInterface,
  AsyncPushableInterface<T>, AsyncPollingProxyInterface<T>, AsyncTriggerableInterface {}

/** Universal output interface — aggregates all sync and async output capabilities (pull, subscribe, trigger, gate, async variants). */
export interface UniversalOutputInterface<T> extends
  BaseTransferInterface, PullableInterface<T>, SubscribableInterface<T>, TriggerableInterface, GateInterface,
  AsyncPullableInterface<T>, AsyncTriggerableInterface {}

/** Universal duplex interface — combines all input and output capabilities. */
export interface UniversalDuplexInterface<TInput, TOutput> extends
  UniversalInputInterface<TInput>, UniversalOutputInterface<TOutput> {}

/** Contract of capability flags — boolean properties that determine which interfaces and methods a transfer supports. */
interface CommunicationContractInterface {
  // Direction and nature of the flow
  readonly isInput: boolean;        // can act as an input
  readonly isOutput: boolean;       // can act as an output
  readonly isDuplex: boolean;       // can be both input and output simultaneously

  // Data delivery mechanics
  readonly isPollingSource: boolean;  // can periodically poll some source
  readonly isPollingProxy: boolean;   // can periodically poll some source
  readonly isPushable: boolean;       // data can be pushed into it
  readonly isPullable: boolean;       // data can be pulled from it
  readonly isSubscribable: boolean;   // can be subscribed to
  readonly isTriggerable: boolean;    // can be triggered manually
  readonly isGate: boolean;           // can be activated/deactivated

  // Asynchronous data delivery mechanics
  readonly isAsyncPushable: boolean;       // data can be pushed into it asynchronously
  readonly isAsyncPullable: boolean;       // data can be pulled from it asynchronously
  readonly isAsyncTriggerable: boolean;    // can be triggered asynchronously
  readonly isAsyncPollingProxy: boolean;   // can asynchronously poll another transfer
}

/** Base transfer interface — combines capability flags with disposable lifecycle. */
export interface BaseTransferInterface extends CommunicationContractInterface, DisposableInterface {}

/** Transfer with gate-controlled push/subscribe — data flows only when the gate is active. */
export interface GateTransferInterface<T> extends GateInterface, PushableTransferInterface<T>, SubscribableTransferInterface<T> {
  readonly isInput: true;
  readonly isOutput: true;

  readonly isPushable: true;
  readonly isSubscribable: true;
  readonly isGate: true;
}

/** Pushable transfer — input transfer that supports synchronous data push via push(). */
export interface PushableTransferInterface<T> extends PushableInterface<T>, BaseTransferInterface {
  readonly isInput: true;
  readonly isPushable: true;
}

/** Polling source transfer — fetcher is passed via config at construction time. Output-only (cannot be an input). */
export interface PollingSourceTransferInterface extends BaseTransferInterface, GateInterface {
  readonly isOutput: true;
  readonly isPollingSource: true;
  readonly isGate: true;
}

/** Polling proxy transfer — fetcher is connected from the upstream transfer in the chain. At least an input. */
export interface PollingProxyTransferInterface<T> extends PollingProxyInterface<T>, BaseTransferInterface, GateInterface {
  readonly isInput: true;
  readonly isPollingProxy: true;
}

/** Pullable transfer — output transfer that supports synchronous data extraction via pull(). */
export interface PullableTransferInterface<T> extends PullableInterface<T>, BaseTransferInterface {
  readonly isOutput: true;
  readonly isPullable: true;
}

/** Subscribable transfer — output transfer that supports reactive subscription via subscribe(). */
export interface SubscribableTransferInterface<T> extends SubscribableInterface<T>, BaseTransferInterface {
  readonly isOutput: true;
  readonly isSubscribable: true;
}

/** Triggerable transfer — transfer that supports manual emission via trigger(). */
export interface TriggerableTransferInterface extends TriggerableInterface, BaseTransferInterface {
  readonly isTriggerable: true;
}

/** Async pushable transfer — input transfer that supports asynchronous data push via asyncPush(). */
export interface AsyncPushableTransferInterface<T> extends AsyncPushableInterface<T>, BaseTransferInterface {
  readonly isInput: true;
  readonly isAsyncPushable: true;
}

/** Async pullable transfer — output transfer that supports asynchronous data extraction via asyncPull(). */
export interface AsyncPullableTransferInterface<T> extends AsyncPullableInterface<T>, BaseTransferInterface {
  readonly isOutput: true;
  readonly isAsyncPullable: true;
}

/** Async polling proxy transfer — input transfer that supports async polling of an upstream transfer via setAsyncFetcher/clearAsyncFetcher. */
export interface AsyncPollingProxyTransferInterface<T> extends AsyncPollingProxyInterface<T>, BaseTransferInterface, GateInterface {
  readonly isInput: true;
  readonly isAsyncPollingProxy: true;
}

/**
 * Input pipeline builder interface — produces a strictly input-only composite transfer.
 *
 * Pipeline structure: TStartTransfer [→ DuplexTransfer → …] → InputTransfer.
 * The start transfer must be duplex; the finish transfer is input-only (no output methods exposed).
 */
export interface InputPipelineBuilderInterface<TCurrent, TStartTransfer extends InputTransfer<any>> {
  to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): InputPipelineBuilderInterface<TNext, TStartTransfer>;

  finish<
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: InputTransfer<TCurrent>,
    options?: {
      triggerable?: TTriggerable,
      gate?: TGate,
      owned?: boolean,
    },
  ): CompositeInputTransfer<InputTransferDataType<TStartTransfer>, TStartTransfer, TTriggerable, undefined, TGate>;
}

/**
 * Output pipeline builder interface — produces a duplex composite transfer with output-only start.
 *
 * Pipeline structure: OutputTransfer [→ DuplexTransfer → …] → TFinishTransfer.
 * The start transfer must be output-only; the finish transfer is duplex. Input methods are not exposed.
 */
export interface OutputPipelineBuilderInterface {
  to(
    nextTransfer: DuplexTransfer<unknown, unknown>,
    owned?: boolean,
  ): OutputPipelineBuilderInterface;

  finish<
    TFinishTransfer extends DuplexTransfer<any, any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      gate?: TGate;
      owned?: boolean;
    },
  ): CompositeOutputTransfer<OutputTransferDataType<TFinishTransfer>, TFinishTransfer, TTriggerable, undefined, TGate>;
}

/**
 * Duplex pipeline builder interface — produces a duplex composite transfer.
 *
 * Pipeline structure: TStartTransfer [→ DuplexTransfer → …] → TFinishTransfer.
 * Both start and finish transfers are duplex; both input and output methods are exposed.
 */
export interface DuplexPipelineBuilderInterface<
  TCurrent,
  TStartTransfer extends InputTransfer<any>,
> {
  to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): DuplexPipelineBuilderInterface<TNext, TStartTransfer>;

  finish<
    TFinishTransfer extends OutputTransfer<any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      gate?: TGate;
      owned?: boolean;
    },
  ): CompositeDuplexTransfer<
    InputTransferDataType<TStartTransfer>,
    OutputTransferDataType<TFinishTransfer>,
    TStartTransfer,
    TFinishTransfer,
    TTriggerable,
    undefined,
    TGate
  >;
}

/**
 * Operator pipeline builder interface — type-safe chaining of operators
 * with tuple-based type inference. Each add() appends the output type to TFlow.
 */
export interface OperatorPipelineBuilderInterface<TFlow extends readonly unknown[]> {
  /**
   * Overload for an empty builder: accepts the first operator
   * and initializes the TFlow tuple with types [TInput, TOutput].
   */
  add<TInput, TOutput>(
    this: OperatorPipelineBuilderInterface<[]>,
    operator: OperatorInterface<TInput, TOutput>
  ): OperatorPipelineBuilderInterface<[TInput, TOutput]>;

  /**
   * Overload for a builder that already has operators:
   * strictly requires that the input of the new operator matches the output of the previous one (Last<TFlow>).
   */
  add<TNext>(
    this: OperatorPipelineBuilderInterface<TFlow>,
    operator: OperatorInterface<Last<TFlow>, TNext>
  ): OperatorPipelineBuilderInterface<[...TFlow, TNext]>;

  /**
   * Builds the final standalone PipelineOperator.
   * This method is only available if at least one operator has been added to the builder.
   */
  build(
    this: OperatorPipelineBuilderInterface<readonly [unknown, ...unknown[]]>
  ): OperatorInterface<First<TFlow>, Last<TFlow>>;
}

// ═══════════════════════════════════════════════════════════════
// Async builders
// ═══════════════════════════════════════════════════════════════

/**
 * Async input pipeline builder interface — like InputPipelineBuilderInterface,
 * but supports async triggerable and linkOnError for async-push rejection handling.
 */
export interface AsyncInputPipelineBuilderInterface<TCurrent, TStartTransfer extends InputTransfer<any>> {
  to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): AsyncInputPipelineBuilderInterface<TNext, TStartTransfer>;

  finish<
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TAsyncTriggerable extends AsyncTriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: InputTransfer<TCurrent>,
    options?: {
      triggerable?: TTriggerable;
      asyncTriggerable?: TAsyncTriggerable;
      gate?: TGate;
      owned?: boolean;
      linkOnError?: ErrorHandler;
    },
  ): CompositeInputTransfer<InputTransferDataType<TStartTransfer>, TStartTransfer, TTriggerable, TAsyncTriggerable, TGate>;
}

/**
 * Async output pipeline builder interface — like OutputPipelineBuilderInterface,
 * but supports async triggerable and linkOnError for async-push rejection handling.
 */
export interface AsyncOutputPipelineBuilderInterface {
  to(
    nextTransfer: DuplexTransfer<unknown, unknown>,
    owned?: boolean,
  ): AsyncOutputPipelineBuilderInterface;

  finish<
    TFinishTransfer extends DuplexTransfer<any, any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TAsyncTriggerable extends AsyncTriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      asyncTriggerable?: TAsyncTriggerable;
      gate?: TGate;
      owned?: boolean;
      linkOnError?: ErrorHandler;
    },
  ): CompositeOutputTransfer<OutputTransferDataType<TFinishTransfer>, TFinishTransfer, TTriggerable, TAsyncTriggerable, TGate>;
}

/**
 * Async duplex pipeline builder interface — like DuplexPipelineBuilderInterface,
 * but supports async triggerable and linkOnError for async-push rejection handling.
 */
export interface AsyncDuplexPipelineBuilderInterface<
  TCurrent,
  TStartTransfer extends InputTransfer<any>,
> {
  to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): AsyncDuplexPipelineBuilderInterface<TNext, TStartTransfer>;

  finish<
    TFinishTransfer extends OutputTransfer<any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TAsyncTriggerable extends AsyncTriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      asyncTriggerable?: TAsyncTriggerable;
      gate?: TGate;
      owned?: boolean;
      linkOnError?: ErrorHandler;
    },
  ): CompositeDuplexTransfer<
    InputTransferDataType<TStartTransfer>,
    OutputTransferDataType<TFinishTransfer>,
    TStartTransfer,
    TFinishTransfer,
    TTriggerable,
    TAsyncTriggerable,
    TGate
  >;
}

/**
 * Async operator pipeline builder interface — like OperatorPipelineBuilderInterface,
 * but accepts both sync and async operators. Async overloads are listed first to avoid
 * TOutput being inferred as Promise<TOut>.
 */
export interface AsyncOperatorPipelineBuilderInterface<TFlow extends readonly unknown[]> {
  // Async overload first: AsyncMapOperator<TIn, TOut> is structurally
  // compatible with both AsyncOperatorInterface<TIn, TOut> and
  // OperatorInterface<TIn, Promise<TOut>> — a union would infer
  // TOutput = Promise<TOut>. Separate overloads with async first
  // force TypeScript to select the correct TOutput = TOut.
  add<TInput, TOutput>(
    this: AsyncOperatorPipelineBuilderInterface<[]>,
    operator: AsyncOperatorInterface<TInput, TOutput>
  ): AsyncOperatorPipelineBuilderInterface<[TInput, TOutput]>;

  add<TInput, TOutput>(
    this: AsyncOperatorPipelineBuilderInterface<[]>,
    operator: OperatorInterface<TInput, TOutput>
  ): AsyncOperatorPipelineBuilderInterface<[TInput, TOutput]>;

  add<TNext>(
    this: AsyncOperatorPipelineBuilderInterface<TFlow>,
    operator: AsyncOperatorInterface<Last<TFlow>, TNext>
  ): AsyncOperatorPipelineBuilderInterface<[...TFlow, TNext]>;

  add<TNext>(
    this: AsyncOperatorPipelineBuilderInterface<TFlow>,
    operator: OperatorInterface<Last<TFlow>, TNext>
  ): AsyncOperatorPipelineBuilderInterface<[...TFlow, TNext]>;

  build(
    this: AsyncOperatorPipelineBuilderInterface<readonly [unknown, ...unknown[]]>
  ): AsyncOperatorInterface<First<TFlow>, Last<TFlow>>;
}

/** Bridge contract — a gated, disposable connection between two transfers. */
export interface BridgeInterface extends GateInterface, DisposableInterface {}

/** Selector bridge interface — single-active-bridge selection from a keyed map. */
export interface BridgeSelectorInterface<TMap extends Record<BaseSelectorKey, BridgeInterface>> extends BridgeInterface {
  readonly selectedKey: SelectorKey<TMap>;
  readonly selectedBridge: BridgeInterface;
  select(key: SelectorKey<TMap>): void;
}

/** Multi-selector bridge interface — multi-active-bridge selection with check/uncheck granularity. */
export interface BridgeMultiSelectorInterface<TMap extends Record<BaseSelectorKey, BridgeInterface>> extends BridgeInterface {
  readonly selectedKeys: SelectorKey<TMap>[];
  readonly selectedBridges: BridgeInterface[];
  select(keys: SelectorKey<TMap>[]): void;
  check(key: SelectorKey<TMap>): void;
  uncheck(key: SelectorKey<TMap>): void;
}
