import type {
  BridgeInterface,
  InputFlowInterface,
  OperatorInterface,
  OutputFlowInterface,
  PushableTransferInterface,
  TriggerableInterface,
  SubscribableTransferInterface,
  DisposableInterface,
  GateInterface,
  AsyncInputFlowInterface,
  AsyncOutputFlowInterface,
  AsyncOperatorInterface,
  AsyncTriggerableInterface,
  BaseTransferInterface,
} from "./interfaces";
import type {
  BaseSelectorKey,
  DuplexTransfer,
  ErrorHandler,
  InputTransfer,
  OutputTransfer,
  SelectorKey,
  DataFetcher,
  DataHandler,
  AsyncDataHandler,
  AsyncDataFetcher,
  TickerCallback,
  TickerFactory,
} from "./types";
import type {
  AsyncConditionTransfer,
  AsyncConvertTransfer,
  AsyncIdlePollingTransfer,
  AsyncPollingFlowTransfer,
  AsyncPollingProxyTransfer,
  AsyncPollingSourceTransfer,
  AsyncReadTransfer,
  AsyncSinkTransfer,
  AsyncStoredChannelTransfer,
  AsyncWriteTransfer,
  ChannelTransfer,
  ConditionTransfer,
  ConvertTransfer,
  IdlePollingTransfer,
  PollingFlowTransfer,
  PollingProxyTransfer,
  PollingSourceTransfer,
  ReadTransfer,
  SinkTransfer,
  StoredChannelTransfer,
  WriteTransfer,
} from "./transfers";

/** Configuration for Ticker — callback and optional interval (ms). */
export type TickerConfig = {
  readonly callback: TickerCallback;
  readonly interval?: number;
}

/** Configuration for gate-enabled transfers — initial active state. */
export type GateConfig = {
  activated: boolean;
}

/** Shared error-handling config — optional onError callback. */
export type ErrorHandlingConfig<TSource> = {
  readonly onError?: ErrorHandler<TSource>;
}

/** Shared backpressure configuration — concurrency limit, buffer size, and overflow callback. */
export type BackpressureConfig<T> = {
  readonly maxConcurrency?: number;  // default: Infinity (no limit — backward compatible)
  readonly bufferSize?: number;      // default: Infinity
  readonly onBufferOverflow?: DataHandler<T>;
}

/** Configuration for BaseStateTransfer — optional initial value. */
export type BaseStateTransferConfig<T> = {
  initialValue?: T;
}

/** Configuration for DelayedPushChannelTransfer — delay before emitting data (ms). */
export type DelayedPushChannelTransferConfig = {
  readonly delay: number;
}

/** Configuration for DebounceTransfer — silence period before emitting data (ms). */
export type DebounceTransferConfig = {
  readonly delay: number;
}

/** Configuration for ThrottleTransfer — minimum interval between emissions (ms). */
export type ThrottleTransferConfig = {
  readonly interval: number;
}

/** Alias for GateConfig — used by GateTransfer. */
export type GateTransferConfig = GateConfig;

/** Configuration for MergeTransfer — array of subscribable sources to merge. */
export type MergeTransferConfig<T> = {
  sources: SubscribableTransferInterface<T>[];
}

/** Configuration for SplitTransfer — array of pushable targets to broadcast to. */
export type SplitTransferConfig<T> = {
  targets: PushableTransferInterface<T>[];
}

/** Configuration for polling proxy transfers — interval, gate state, optional ticker factory and error handler. */
export type PollingProxyTransferConfig<T> = GateConfig & ErrorHandlingConfig<PollingProxyTransfer<T>> & {
  readonly interval: number;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for PollingSourceTransfer — polling proxy config plus a sync fetcher. */
export type PollingSourceTransferConfig<T> = GateConfig & ErrorHandlingConfig<PollingSourceTransfer<T>> & {
  readonly interval: number;
  readonly fetcher: DataFetcher<T>;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for SinkTransfer — callback invoked on each incoming data, with optional error handler. */
export type SinkTransferConfig<T> = ErrorHandlingConfig<SinkTransfer<T>> & {
  readonly callback: DataHandler<T>;
}

/** Configuration for ChannelTransfer — external setup/destroy callbacks with per-stage error handlers. */
export type ChannelTransferConfig<T> = ErrorHandlingConfig<ChannelTransfer<T>> & {
  readonly setup: (emit: DataHandler<T>) => void;
  readonly destroy: () => void;
  readonly onDestroyError?: ErrorHandler<ChannelTransfer<T>>;
}

/** Configuration for StoredChannelTransfer — channel config plus optional initial value. */
export type StoredChannelTransferConfig<T> = BaseStateTransferConfig<T> & ErrorHandlingConfig<StoredChannelTransfer<T>> & {
  readonly setup: (emit: DataHandler<T>) => void;
  readonly destroy: () => void;
  readonly onDestroyError?: ErrorHandler<StoredChannelTransfer<T>>;
}

/** Configuration for WriteTransfer — target flow with write() and optional error handler. */
export type WriteTransferConfig<T> = ErrorHandlingConfig<WriteTransfer<T>> & {
  readonly flow: InputFlowInterface<T>;
}

/** Configuration for ReadTransfer — source flow with read() and optional error handler. */
export type ReadTransferConfig<T> = ErrorHandlingConfig<ReadTransfer<T>> & {
  readonly flow: OutputFlowInterface<T>;
}

/** Configuration for ConvertTransfer — operator for data transformation and optional error handler. */
export type ConvertTransferConfig<TInput, TOutput> = ErrorHandlingConfig<ConvertTransfer<TInput, TOutput>> & {
  readonly operator: OperatorInterface<TInput, TOutput | undefined>;
}

/** Configuration for ConditionTransfer — optional input/output predicates and per-stage error handlers. */
export type ConditionTransferConfig<T> = {
  readonly shouldAccept?: (incomingData: T) => boolean;
  readonly shouldEmit?: (currentState: T | undefined) => boolean;
  readonly onAcceptError?: ErrorHandler<ConditionTransfer<T>>;
  readonly onEmitError?: ErrorHandler<ConditionTransfer<T>>;
}

/** Configuration for PollingFlowTransfer — polling proxy config plus an output flow source. */
export type PollingFlowTransferConfig<T> = GateConfig & ErrorHandlingConfig<PollingFlowTransfer<T>> &  {
  readonly interval: number;
  readonly flow: OutputFlowInterface<T>;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for IdlePollingTransfer — fetcher, idle timeout, polling interval, gate state, and optional initial value. */
export type IdlePollingTransferConfig<T> = BaseStateTransferConfig<T> & ErrorHandlingConfig<IdlePollingTransfer<T>> & GateConfig & {
  readonly interval: number;
  readonly fetcher: DataFetcher<T>;
  readonly timeout: number;
  readonly tickerFactory?: TickerFactory;
}

// ═══════════════════════════════════════════════════════════════
// Async configs
// ═══════════════════════════════════════════════════════════════

/** Configuration for async polling proxy transfers — interval, gate state, optional ticker factory and error handler. */
export type AsyncPollingProxyTransferConfig<T> = GateConfig & ErrorHandlingConfig<AsyncPollingProxyTransfer<T>> & {
  readonly interval: number;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for AsyncPollingSourceTransfer — async polling config plus an async fetcher. */
export type AsyncPollingSourceTransferConfig<T> = GateConfig & ErrorHandlingConfig<AsyncPollingSourceTransfer<T>> & {
  readonly interval: number;
  readonly fetcher: AsyncDataFetcher<T>;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for AsyncPollingFlowTransfer — async polling config plus an async output flow source. */
export type AsyncPollingFlowTransferConfig<T> = GateConfig & ErrorHandlingConfig<AsyncPollingFlowTransfer<T>> & {
  readonly interval: number;
  readonly flow: AsyncOutputFlowInterface<T>;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for AsyncIdlePollingTransfer — async fetcher, idle timeout, polling interval, gate state, and optional initial value. */
export type AsyncIdlePollingTransferConfig<T> = BaseStateTransferConfig<T> & ErrorHandlingConfig<AsyncIdlePollingTransfer<T>> & GateConfig & {
  readonly interval: number;
  readonly fetcher: AsyncDataFetcher<T>;
  readonly timeout: number;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for AsyncSinkTransfer — sync or async callback invoked on each incoming data, with optional error handler and backpressure. */
export type AsyncSinkTransferConfig<T> = ErrorHandlingConfig<AsyncSinkTransfer<T>> & BackpressureConfig<T> & {
  readonly callback: AsyncDataHandler<T> | DataHandler<T>;
}

/** Configuration for AsyncWriteTransfer — async or sync target flow with write(), optional error handler and backpressure. */
export type AsyncWriteTransferConfig<T> = ErrorHandlingConfig<AsyncWriteTransfer<T>> & BackpressureConfig<T> & {
  readonly flow: AsyncInputFlowInterface<T> | InputFlowInterface<T>;
}

/** Configuration for AsyncReadTransfer — async or sync source flow with read() and optional error handler. */
export type AsyncReadTransferConfig<T> = ErrorHandlingConfig<AsyncReadTransfer<T>> & {
  readonly flow: AsyncOutputFlowInterface<T> | OutputFlowInterface<T>;
}

/** Configuration for AsyncConvertTransfer — async operator for data transformation, optional error handler and backpressure. */
export type AsyncConvertTransferConfig<TInput, TOutput> = ErrorHandlingConfig<AsyncConvertTransfer<TInput, TOutput>> & BackpressureConfig<TInput> & {
  readonly operator: AsyncOperatorInterface<TInput, TOutput | undefined>;
}

/** Configuration for AsyncConditionTransfer — optional sync/async input/output predicates, per-stage error handlers and backpressure. */
export type AsyncConditionTransferConfig<T> = BackpressureConfig<T> & {
  readonly shouldAccept?: (incomingData: T) => Promise<boolean> | boolean;
  readonly shouldEmit?: (currentState: T | undefined) => Promise<boolean> | boolean;
  readonly onAcceptError?: ErrorHandler<AsyncConditionTransfer<T>>;
  readonly onEmitError?: ErrorHandler<AsyncConditionTransfer<T>>;
}

/** Configuration for AsyncStoredChannelTransfer — channel config with async pull/trigger interface plus optional initial value. */
export type AsyncStoredChannelTransferConfig<T> = BaseStateTransferConfig<T> & ErrorHandlingConfig<AsyncStoredChannelTransfer<T>> & {
  readonly setup: (emit: DataHandler<T>) => void;
  readonly destroy: () => void;
  readonly onDestroyError?: ErrorHandler<AsyncStoredChannelTransfer<T>>;
}

/** Configuration for UniversalCompositeTransfer — combines input/output transfers with optional explicit trigger/gate and owned resources. */
export type CompositeTransferConfig<TInput, TOutput> = {
  readonly input: InputTransfer<TInput>;
  readonly output: OutputTransfer<TOutput>;
  readonly triggerable?: TriggerableInterface;
  readonly asyncTriggerable?: AsyncTriggerableInterface;
  readonly gate?: GateInterface;
  readonly owned?: readonly DisposableInterface[];
}

/** Configuration for PassBridge — source, target, and initial gate state. */
export type PassBridgeConfig<T> = {
  readonly source: OutputTransfer<T>;
  readonly target: InputTransfer<T>;
  readonly activated: boolean;
}

/** Configuration for TransformBridge — source, target, sync operator, and initial gate state. */
export type TransformBridgeConfig<TInput, TOutput> = {
  readonly source: OutputTransfer<TInput>;
  readonly target: InputTransfer<TOutput>;
  readonly operator: OperatorInterface<TInput, TOutput>;
  readonly activated: boolean;
}

/** Configuration for TransferBridge — source, target, intermediate duplex transfer, ownership flag, and initial gate state. */
export type TransferBridgeConfig<TInput, TOutput> = {
  readonly source: OutputTransfer<TInput>;
  readonly target: InputTransfer<TOutput>;
  readonly middle: DuplexTransfer<TInput, TOutput>;
  readonly middleOwned: boolean;
  readonly activated: boolean;
}

/** Configuration for BridgeAggregator — bridges array, initial gate state, and ownership flag. */
export type BridgeAggregatorConfig = {
  readonly bridges: BridgeInterface[];
  readonly activated: boolean;
  readonly owned: boolean;
}

/** Configuration for BridgeSelector — bridge map, initial selected key, gate state, and ownership flag. */
export type BridgeSelectorConfig<TMap extends Record<BaseSelectorKey, BridgeInterface>> = {
  readonly bridges: TMap;
  readonly initialKey: SelectorKey<TMap>;
  readonly activated: boolean;
  readonly owned: boolean;
};

/** Configuration for BridgeMultiSelector — bridge map, initial selected keys, gate state, and ownership flag. */
export type BridgeMultiSelectorConfig<TMap extends Record<BaseSelectorKey, BridgeInterface>> = {
  readonly bridges: TMap;
  readonly initialKeys: SelectorKey<TMap>[];
  readonly activated: boolean;
  readonly owned: boolean;
};

/** Configuration for AsyncTransformBridge — source, target, async operator, gate state, and optional error handler. */
export type AsyncTransformBridgeConfig<TInput, TOutput> = ErrorHandlingConfig<AsyncConvertTransfer<TInput, TOutput>> & {
  readonly source: OutputTransfer<TInput>;
  readonly target: InputTransfer<TOutput>;
  readonly operator: AsyncOperatorInterface<TInput, TOutput | undefined>;
  readonly activated: boolean;
}

/** Configuration for linkTransfers() — provides an optional error handler for async-push rejection. */
export type LinkConfig<TTargetTransfer extends BaseTransferInterface> = {
  readonly onError?: ErrorHandler<TTargetTransfer>;
}
