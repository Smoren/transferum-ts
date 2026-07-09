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
export type ErrorHandlingConfig = {
  readonly onError?: ErrorHandler;
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
export type PollingProxyConfig = GateConfig & ErrorHandlingConfig & {
  readonly interval: number;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for PollingSourceTransfer — polling proxy config plus a sync fetcher. */
export type PollingSourceConfig<T> = PollingProxyConfig & {
  readonly fetcher: DataFetcher<T>;
}

/** Configuration for SinkTransfer — callback invoked on each incoming data. */
export type SinkTransferConfig<T> = {
  readonly callback: DataHandler<T>;
}

/** Configuration for ChannelTransfer — external setup/destroy callbacks with per-stage error handlers. */
export type ChannelTransferConfig<T> = {
  readonly setup: (emit: DataHandler<T>) => void;
  readonly destroy: () => void;
  readonly onSetupError?: ErrorHandler;
  readonly onEmitError?: ErrorHandler;
  readonly onDestroyError?: ErrorHandler;
}

/** Configuration for StoredChannelTransfer — channel config plus optional initial value. */
export type StoredChannelTransferConfig<T> = BaseStateTransferConfig<T> & {
  readonly setup: (emit: DataHandler<T>) => void;
  readonly destroy: () => void;
  readonly onSetupError?: ErrorHandler;
  readonly onEmitError?: ErrorHandler;
  readonly onDestroyError?: ErrorHandler;
}

/** Configuration for WriteTransfer — target flow with write() and optional error handler. */
export type WriteTransferConfig<T> = ErrorHandlingConfig & {
  readonly flow: InputFlowInterface<T>;
}

/** Configuration for ReadTransfer — source flow with read() and optional error handler. */
export type ReadTransferConfig<T> = ErrorHandlingConfig & {
  readonly flow: OutputFlowInterface<T>;
}

/** Configuration for ConvertTransfer — operator for data transformation and optional error handler. */
export type ConvertTransferConfig<TInput, TOutput> = ErrorHandlingConfig & {
  readonly operator: OperatorInterface<TInput, TOutput | undefined>;
}

/** Configuration for ConditionTransfer — optional input/output predicates and error handler. */
export type ConditionTransferConfig<T> = ErrorHandlingConfig & {
  readonly shouldAccept?: (incomingData: T) => boolean;
  readonly shouldEmit?: (currentState: T | undefined) => boolean;
}

/** Configuration for PollingFlowTransfer — polling proxy config plus an output flow source. */
export type PollingFlowTransferConfig<T> = PollingProxyConfig & {
  readonly flow: OutputFlowInterface<T>;
}

/** Configuration for IdlePollingTransfer — fetcher, idle timeout, polling interval, gate state, and optional initial value. */
export type IdlePollingTransferConfig<T> = BaseStateTransferConfig<T> & PollingProxyConfig & GateConfig & ErrorHandlingConfig & {
  readonly fetcher: DataFetcher<T>;
  readonly timeout: number;
}

// ═══════════════════════════════════════════════════════════════
// Async configs
// ═══════════════════════════════════════════════════════════════

/** Configuration for async polling proxy transfers — interval, gate state, optional ticker factory and error handler. */
export type AsyncPollingProxyConfig = GateConfig & ErrorHandlingConfig & {
  readonly interval: number;
  readonly tickerFactory?: TickerFactory;
}

/** Configuration for AsyncPollingSourceTransfer — async polling config plus an async fetcher. */
export type AsyncPollingSourceConfig<T> = AsyncPollingProxyConfig & {
  readonly fetcher: AsyncDataFetcher<T>;
}

/** Configuration for AsyncPollingFlowTransfer — async polling config plus an async output flow source. */
export type AsyncPollingFlowTransferConfig<T> = AsyncPollingProxyConfig & {
  readonly flow: AsyncOutputFlowInterface<T>;
}

/** Configuration for AsyncIdlePollingTransfer — async fetcher, idle timeout, polling interval, gate state, and optional initial value. */
export type AsyncIdlePollingTransferConfig<T> = BaseStateTransferConfig<T> & AsyncPollingProxyConfig & GateConfig & ErrorHandlingConfig & {
  readonly fetcher: AsyncDataFetcher<T>;
  readonly timeout: number;
}

/** Configuration for AsyncSinkTransfer — sync or async callback invoked on each incoming data. */
export type AsyncSinkTransferConfig<T> = {
  readonly callback: AsyncDataHandler<T> | DataHandler<T>;
}

/** Configuration for AsyncWriteTransfer — async or sync target flow with write() and optional error handler. */
export type AsyncWriteTransferConfig<T> = ErrorHandlingConfig & {
  readonly flow: AsyncInputFlowInterface<T> | InputFlowInterface<T>;
}

/** Configuration for AsyncReadTransfer — async or sync source flow with read() and optional error handler. */
export type AsyncReadTransferConfig<T> = ErrorHandlingConfig & {
  readonly flow: AsyncOutputFlowInterface<T> | OutputFlowInterface<T>;
}

/** Configuration for AsyncConvertTransfer — async operator for data transformation and optional error handler. */
export type AsyncConvertTransferConfig<TInput, TOutput> = ErrorHandlingConfig & {
  readonly operator: AsyncOperatorInterface<TInput, TOutput | undefined>;
}

/** Configuration for AsyncConditionTransfer — optional sync/async input/output predicates and error handler. */
export type AsyncConditionTransferConfig<T> = ErrorHandlingConfig & {
  readonly shouldAccept?: (incomingData: T) => Promise<boolean> | boolean;
  readonly shouldEmit?: (currentState: T | undefined) => Promise<boolean> | boolean;
}

/** Configuration for AsyncStoredChannelTransfer — channel config with async pull/trigger interface plus optional initial value. */
export type AsyncStoredChannelTransferConfig<T> = BaseStateTransferConfig<T> & {
  readonly setup: (emit: DataHandler<T>) => void;
  readonly destroy: () => void;
  readonly onSetupError?: ErrorHandler;
  readonly onEmitError?: ErrorHandler;
  readonly onDestroyError?: ErrorHandler;
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
export type AsyncTransformBridgeConfig<TInput, TOutput> = ErrorHandlingConfig & {
  readonly source: OutputTransfer<TInput>;
  readonly target: InputTransfer<TOutput>;
  readonly operator: AsyncOperatorInterface<TInput, TOutput | undefined>;
  readonly activated: boolean;
}

/** Configuration for linkTransfers() — provides an optional error handler for async-push rejection. */
export type LinkConfig = {
  readonly onError?: ErrorHandler;
}

