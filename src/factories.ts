import type {
  Transfer,
  Pullable,
  Pushable,
  Subscribable,
  Triggerable,
  PollingProxy,
  Gate,
  AsyncPushable,
  AsyncPullable,
  AsyncTriggerable,
  AsyncPollingProxy,
  BaseSelectorKey,
} from "./types";
import type {
  BaseStateTransferConfig,
  DelayedPushChannelTransferConfig,
  DebounceTransferConfig,
  ThrottleTransferConfig,
  GateTransferConfig,
  MergeTransferConfig,
  SplitTransferConfig,
  PollingSourceConfig,
  PollingProxyConfig,
  ChannelTransferConfig,
  StoredChannelTransferConfig,
  SinkTransferConfig,
  WriteTransferConfig,
  ReadTransferConfig,
  ConvertTransferConfig,
  ConditionTransferConfig,
  PollingFlowTransferConfig,
  IdlePollingTransferConfig,
  AsyncPollingSourceConfig,
  AsyncPollingProxyConfig,
  AsyncPollingFlowTransferConfig,
  AsyncIdlePollingTransferConfig,
  AsyncSinkTransferConfig,
  AsyncWriteTransferConfig,
  AsyncReadTransferConfig,
  AsyncConvertTransferConfig,
  AsyncConditionTransferConfig,
  AsyncStoredChannelTransferConfig,
  AsyncTransformBridgeConfig,
  PassBridgeConfig,
  TransformBridgeConfig,
  TransferBridgeConfig,
  BridgeAggregatorConfig,
  BridgeSelectorConfig,
  BridgeMultiSelectorConfig,
} from "./configs";
import type { AsyncOperatorInterface, BridgeInterface, OperatorInterface } from "./interfaces";
import {
  PushChannelTransfer,
  DelayedPushChannelTransfer,
  DebounceTransfer,
  ThrottleTransfer,
  PushStoredChannelTransfer,
  BufferTransfer,
  ManualBufferTransfer,
  ManualFlowTransfer,
  GateTransfer,
  MergeTransfer,
  SplitTransfer,
  PollingSourceTransfer,
  PollingProxyTransfer,
  ChannelTransfer,
  StoredChannelTransfer,
  SinkTransfer,
  WriteTransfer,
  ReadTransfer,
  ConvertTransfer,
  ConditionTransfer,
  PollingFlowTransfer,
  IdlePollingTransfer,
  AsyncSinkTransfer,
  AsyncWriteTransfer,
  AsyncReadTransfer,
  AsyncPollingSourceTransfer,
  AsyncPollingProxyTransfer,
  AsyncPollingFlowTransfer,
  AsyncIdlePollingTransfer,
  AsyncConvertTransfer,
  AsyncConditionTransfer,
  AsyncStoredChannelTransfer,
} from "./transfers";
import {
  PassBridge,
  TransformBridge,
  AsyncTransformBridge,
  TransferBridge,
  BridgeAggregator,
  BridgeSelector,
  BridgeMultiSelector,
} from "./bridges";
import {
  FilterOperator,
  GuardOperator,
  MapOperator,
  PipelineOperator,
  ReducerOperator,
  TransparentOperator,
  AsyncMapOperator,
  AsyncGuardOperator,
  AsyncPipelineOperator,
} from "./operators";
import { LatestStorage, QueueStorage, StackStorage } from "./storages";

// ═══════════════════════════════════════════════════════════════
// Basic channels
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a PushChannelTransfer — a reactive channel with automatic emission to subscribers.
 *
 * Capabilities: Pushable, Subscribable
 *
 * @example
 * const channel = createPushChannelTransfer<number>();
 * channel.subscribe(x => console.log(x));
 * channel.push(42);
 */
export function createPushChannelTransfer<T>(): Transfer<T, [Pushable, Subscribable]> {
  return new PushChannelTransfer<T>();
}

/**
 * Creates a DelayedPushChannelTransfer — a reactive channel with delayed emission to subscribers.
 *
 * Capabilities: Pushable, Subscribable
 *
 * @param config — configuration (delay, initialValue)
 * @example
 * const channel = createDelayedPushChannelTransfer<number>({ delay: 100 });
 * channel.subscribe(x => console.log(x));
 * channel.push(42); // 42 will be logged after 100 ms
 */
export function createDelayedPushChannelTransfer<T>(
  config: DelayedPushChannelTransferConfig
): Transfer<T, [Pushable, Subscribable]> {
  return new DelayedPushChannelTransfer<T>(config);
}

/**
 * Creates a DebounceTransfer — a reactive channel with debounced emission to subscribers.
 *
 * Capabilities: Pushable, Subscribable
 *
 * @param config — configuration (delay)
 * @example
 * const channel = createDebounceTransfer<number>({ delay: 200 });
 * channel.subscribe(x => console.log(x));
 * channel.push(1); // resets the timer
 * channel.push(2); // resets the timer
 * // after 200 ms of silence, subscribers receive 2
 */
export function createDebounceTransfer<T>(
  config: DebounceTransferConfig
): Transfer<T, [Pushable, Subscribable]> {
  return new DebounceTransfer<T>(config);
}

/**
 * Creates a ThrottleTransfer — a reactive channel with throttled emission to subscribers.
 *
 * Capabilities: Pushable, Subscribable
 *
 * @param config — configuration (interval)
 * @example
 * const channel = createThrottleTransfer<number>({ interval: 100 });
 * channel.subscribe(x => console.log(x));
 * channel.push(1); // emitted immediately (leading edge)
 * channel.push(2); // saved as pending
 * // after 100 ms subscribers receive 2 (trailing edge)
 */
export function createThrottleTransfer<T>(
  config: ThrottleTransferConfig
): Transfer<T, [Pushable, Subscribable]> {
  return new ThrottleTransfer<T>(config);
}

/**
 * Creates a PushStoredChannelTransfer — a channel that stores the last value.
 *
 * Capabilities: Pushable, Pullable, Subscribable, Triggerable
 *
 * @param config — configuration (initialValue)
 * @example
 * const channel = createPushStoredChannelTransfer<number>({ initialValue: 0 });
 * channel.push(42);
 * console.log(channel.pull()); // 42
 */
export function createPushStoredChannelTransfer<T>(
  config?: BaseStateTransferConfig<T>
): Transfer<T, [Pushable, Pullable, Subscribable, Triggerable]> {
  return new PushStoredChannelTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Buffers
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a BufferTransfer — a passive buffer with push/pull mechanics.
 *
 * Capabilities: Pushable, Pullable
 *
 * @example
 * const buffer = createBufferTransfer<number>();
 * buffer.push(42);
 * console.log(buffer.pull()); // 42
 */
export function createBufferTransfer<T>(): Transfer<T, [Pushable, Pullable]> {
  return new BufferTransfer<T>();
}

/**
 * Creates a ManualBufferTransfer — a buffer with manual read control via trigger().
 *
 * Capabilities: Pushable, Pullable, Triggerable
 *
 * @example
 * const buffer = createManualBufferTransfer<number>();
 * buffer.push(42);
 * buffer.trigger();
 * console.log(buffer.pull()); // 42
 */
export function createManualBufferTransfer<T>(): Transfer<T, [Pushable, Pullable, Triggerable]> {
  return new ManualBufferTransfer<T>();
}

/**
 * Creates a ManualFlowTransfer — a reactive stream with manual emission control.
 *
 * Capabilities: Pushable, Subscribable, Triggerable
 *
 * @param config — configuration (initialValue)
 * @example
 * const flow = createManualFlowTransfer<number>();
 * flow.subscribe(x => console.log(x));
 * flow.push(42);
 * flow.trigger(); // 42
 */
export function createManualFlowTransfer<T>(
  config?: BaseStateTransferConfig<T>
): Transfer<T, [Pushable, Subscribable, Triggerable]> {
  return new ManualFlowTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Gate
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a GateTransfer — a transfer with state management (gate).
 *
 * Capabilities: Pushable, Subscribable, Gate
 *
 * @param config — configuration (activated)
 * @example
 * const gate = createGateTransfer<number>({ activated: true });
 * gate.subscribe(x => console.log(x));
 * gate.push(42); // passes through, since activated === true
 * gate.deactivate();
 * gate.push(100); // ignored
 */
export function createGateTransfer<T>(
  config: GateTransferConfig
): Transfer<T, [Pushable, Subscribable, Gate]> {
  return new GateTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Aggregation and branching
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a MergeTransfer — an aggregator of multiple sources into a single stream.
 *
 * Capabilities: Subscribable
 *
 * @param config — configuration (sources)
 * @example
 * const source1 = createPushStoredChannelTransfer<number>();
 * const source2 = createPushStoredChannelTransfer<number>();
 * const merge = createMergeTransfer<number>({ sources: [source1, source2] });
 * merge.subscribe(x => console.log(x));
 */
export function createMergeTransfer<T>(
  config: MergeTransferConfig<T>
): Transfer<T, [Subscribable]> {
  return new MergeTransfer<T>(config);
}

/**
 * Creates a SplitTransfer — a stream splitter to multiple targets.
 *
 * Capabilities: Pushable
 *
 * @param config — configuration (targets)
 * @example
 * const target1 = createPushStoredChannelTransfer<number>();
 * const target2 = createPushStoredChannelTransfer<number>();
 * const split = createSplitTransfer<number>({ targets: [target1, target2] });
 * split.push(42); // sent to both targets
 */
export function createSplitTransfer<T>(
  config: SplitTransferConfig<T>
): Transfer<T, [Pushable]> {
  return new SplitTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Polling
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a PollingSourceTransfer — an output transfer with internal polling.
 *
 * Capabilities: Pullable, Subscribable, Triggerable, Gate
 *
 * @param config — configuration (fetcher, interval, activated, onError)
 * @example
 * const polling = createPollingSourceTransfer<number>({
 *   fetcher: () => Date.now(),
 *   interval: 1000,
 *   activated: true
 * });
 * polling.subscribe(x => console.log(x));
 */
export function createPollingSourceTransfer<T>(
  config: PollingSourceConfig<T>,
): Transfer<T, [Pullable, Subscribable, Triggerable, Gate]> {
  return new PollingSourceTransfer<T>(config);
}

/**
 * Creates a PollingProxyTransfer — a duplex transfer with polling from the previous node.
 *
 * Capabilities: PollingProxy, Pullable, Subscribable, Triggerable, Gate
 *
 * @param config — configuration (interval, activated, onError)
 * @example
 * const polling = createPollingProxyTransfer<number>({
 *   interval: 1000,
 *   activated: true
 * });
 * // setFetcher is called via linkTransfers
 */
export function createPollingProxyTransfer<T>(
  config: PollingProxyConfig,
): Transfer<T, [PollingProxy, Pullable, Subscribable, Triggerable, Gate]> {
  return new PollingProxyTransfer<T>(config);
}

/**
 * Creates a PollingFlowTransfer — polling from OutputFlowInterface (e.g., Storage).
 *
 * Capabilities: Pullable, Subscribable, Triggerable, Gate
 *
 * @param config — configuration (flow, interval, activated, onError)
 * @example
 * const polling = createPollingFlowTransfer<number>({
 *   flow: storage,
 *   interval: 1000,
 *   activated: true
 * });
 * polling.subscribe(x => console.log(x));
 */
export function createPollingFlowTransfer<T>(
  config: PollingFlowTransferConfig<T>
): Transfer<T, [Pullable, Subscribable, Triggerable, Gate]> {
  return new PollingFlowTransfer<T>(config);
}

/**
 * Creates an IdlePollingTransfer — a reactive channel with fallback polling on idle.
 *
 * If no data has been received via push() for longer than timeout ms,
 * periodic polling of the fetcher starts with the given interval.
 * When new data arrives via push(), polling stops and the idle timer resets.
 *
 * Capabilities: Pushable, Subscribable, Triggerable, Gate
 *
 * @param config — configuration (fetcher, timeout, interval, activated, onError)
 * @example
 * const channel = createIdlePollingTransfer<number>({
 *   fetcher: () => fetchLatest(),
 *   timeout: 5000,
 *   interval: 1000,
 *   activated: true
 * });
 * channel.subscribe(x => console.log(x));
 * channel.push(42); // notifies subscribers, resets idle timer
 * // after 5 seconds without push, polling starts every 1 second
 */
export function createIdlePollingTransfer<T>(
  config: IdlePollingTransferConfig<T>
): Transfer<T, [Pushable, Subscribable, Triggerable, Gate]> {
  return new IdlePollingTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Externally managed channels
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a ChannelTransfer — an output channel with external management via setup/destroy.
 *
 * Capabilities: Subscribable
 *
 * @param config — configuration (setup, destroy, onSetupError, onEmitError, onDestroyError)
 * @example
 * const channel = createChannelTransfer<number>({
 *   setup: (emit) => {
 *     const interval = setInterval(() => emit(Date.now()), 1000);
 *     return () => clearInterval(interval);
 *   },
 *   destroy: () => {}
 * });
 * channel.subscribe(x => console.log(x));
 */
export function createChannelTransfer<T>(
  config: ChannelTransferConfig<T>
): Transfer<T, [Subscribable]> {
  return new ChannelTransfer<T>(config);
}

/**
 * Creates a StoredChannelTransfer — a channel that stores the last value with external management.
 *
 * Capabilities: Pullable, Subscribable, Triggerable
 *
 * @param config — configuration (setup, destroy, initialValue, onError handlers)
 * @example
 * const channel = createStoredChannelTransfer<number>({
 *   setup: (emit) => {
 *     const ws = new WebSocket('ws://example.com');
 *     ws.onmessage = (e) => emit(JSON.parse(e.data));
 *   },
 *   destroy: () => ws.close()
 * });
 * console.log(channel.pull()); // last value
 * channel.subscribe(x => console.log(x));
 */
export function createStoredChannelTransfer<T>(
  config: StoredChannelTransferConfig<T>
): Transfer<T, [Pullable, Subscribable, Triggerable]> {
  return new StoredChannelTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Sink / Flow adapters
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a SinkTransfer — a terminal destination (callback).
 *
 * Capabilities: Pushable
 *
 * @param config — configuration (callback, initialValue)
 * @example
 * const sink = createSinkTransfer<number>({
 *   callback: x => console.log('Received:', x)
 * });
 * sink.push(42);
 */
export function createSinkTransfer<T>(
  config: SinkTransferConfig<T>
): Transfer<T, [Pushable]> {
  return new SinkTransfer<T>(config);
}

/**
 * Creates a WriteTransfer — an adapter for writing to InputFlowInterface.
 *
 * Capabilities: Pushable
 *
 * @param config — configuration (flow, onError)
 * @example
 * const writer = createWriteTransfer<number>({
 *   flow: storage
 * });
 * writer.push(42); // storage.write(42)
 */
export function createWriteTransfer<T>(
  config: WriteTransferConfig<T>
): Transfer<T, [Pushable]> {
  return new WriteTransfer<T>(config);
}

/**
 * Creates a ReadTransfer — an adapter for reading from OutputFlowInterface.
 *
 * Capabilities: Pullable
 *
 * @param config — configuration (flow, onError)
 * @example
 * const reader = createReadTransfer<number>({
 *   flow: storage
 * });
 * console.log(reader.pull()); // storage.read()
 */
export function createReadTransfer<T>(
  config: ReadTransferConfig<T>
): Transfer<T, [Pullable]> {
  return new ReadTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Transformation and filtering
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a ConvertTransfer — a converter transfer via Operator.
 *
 * Capabilities: Pushable, Subscribable
 *
 * @param config — configuration (operator, onError)
 * @example
 * const converter = createConvertTransfer<number, string>({
 *   operator: new MapOperator(x => x.toString())
 * });
 * converter.subscribe(s => console.log(s));
 * converter.push(42); // "42"
 */
export function createConvertTransfer<TInput, TOutput>(
  config: ConvertTransferConfig<TInput, TOutput>
): Transfer<TInput, TOutput, [Pushable, Subscribable]> {
  return new ConvertTransfer<TInput, TOutput>(config);
}

/**
 * Creates a ConditionTransfer — a transfer with conditional filtering.
 *
 * Capabilities: Pushable, Subscribable
 *
 * @param config — configuration (shouldAccept, shouldEmit, onError)
 * @example
 * const condition = createConditionTransfer<number>({
 *   shouldAccept: x => x > 0,
 *   shouldEmit: x => x !== undefined && x < 100
 * });
 * condition.subscribe(x => console.log(x));
 * condition.push(42); // passes
 * condition.push(-1); // ignored
 */
export function createConditionTransfer<T>(
  config: ConditionTransferConfig<T>
): Transfer<T, [Pushable, Subscribable]> {
  return new ConditionTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Bridges
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a PassBridge — a simple bridge with gate control.
 *
 * @typeParam T — data type
 * @param config — configuration (source, target, activated)
 * @example
 * const source = createPushStoredChannelTransfer<number>();
 * const target = createSinkTransfer<number>({ callback: console.log });
 * const bridge = createPassBridge<number>({
 *   source,
 *   target,
 *   activated: true
 * });
 * source.push(42); // passes through the bridge
 * bridge.deactivate();
 * source.push(100); // ignored
 */
export function createPassBridge<T>(
  config: PassBridgeConfig<T>
): PassBridge<T> {
  return new PassBridge<T>(config);
}

/**
 * Creates a TransformBridge — a bridge with data conversion via Operator.
 *
 * @typeParam TInput — input data type
 * @typeParam TOutput — output data type
 * @param config — configuration (source, target, operator, activated)
 * @example
 * const source = createPushStoredChannelTransfer<number>();
 * const target = createSinkTransfer<string>({ callback: console.log });
 * const bridge = createTransformBridge<number, string>({
 *   source,
 *   target,
 *   operator: new MapOperator(n => n.toString()),
 *   activated: true
 * });
 * source.push(42); // "42"
 */
export function createTransformBridge<TInput, TOutput>(
  config: TransformBridgeConfig<TInput, TOutput>
): TransformBridge<TInput, TOutput> {
  return new TransformBridge<TInput, TOutput>(config);
}

/**
 * Creates a TransferBridge — a bridge with an intermediate duplex transfer.
 *
 * @typeParam TInput — input data type
 * @typeParam TOutput — output data type
 * @param config — configuration (source, target, middle, middleOwned, activated)
 * @example
 * const source = createPushStoredChannelTransfer<number>();
 * const target = createSinkTransfer<number>({ callback: console.log });
 * const middle = createConditionTransfer<number>({ shouldAccept: x => x > 0 });
 * const bridge = createTransferBridge<number, number>({
 *   source,
 *   target,
 *   middle,
 *   middleOwned: true,
 *   activated: true
 * });
 * source.push(42); // passes
 * source.push(-5); // ignored
 */
export function createTransferBridge<TInput, TOutput>(
  config: TransferBridgeConfig<TInput, TOutput>
): TransferBridge<TInput, TOutput> {
  return new TransferBridge<TInput, TOutput>(config);
}

/**
 * Creates a BridgeAggregator — an aggregator of multiple bridges.
 *
 * @param config — configuration (bridges, activated, owned)
 * @example
 * const bridge1 = createPassBridge<number>({ source, target, activated: false });
 * const bridge2 = createPassBridge<number>({ source, target, activated: false });
 * const aggregator = createBridgeAggregator({
 *   bridges: [bridge1, bridge2],
 *   activated: true,
 *   owned: false
 * });
 * aggregator.active; // true (all bridges active)
 */
export function createBridgeAggregator(
  config: BridgeAggregatorConfig
): BridgeAggregator {
  return new BridgeAggregator(config);
}

/**
 * Creates a BridgeSelector — a selector for a single bridge from a map.
 *
 * @typeParam TMap — bridge map (Record<Key, BridgeInterface>)
 * @param config — configuration (bridges, initialKey, activated, owned)
 * @example
 * const bridge1 = createPassBridge<number>({ source, target, activated: false });
 * const bridge2 = createPassBridge<number>({ source, target, activated: false });
 * const selector = createBridgeSelector({
 *   bridges: { first: bridge1, second: bridge2 },
 *   initialKey: 'first',
 *   activated: true,
 *   owned: false
 * });
 * selector.select('second'); // switches to the second bridge
 */
export function createBridgeSelector<TMap extends Record<BaseSelectorKey, BridgeInterface>>(
  config: BridgeSelectorConfig<TMap>
): BridgeSelector<TMap> {
  return new BridgeSelector<TMap>(config);
}

/**
 * Creates a BridgeMultiSelector — a selector for multiple bridges from a map.
 *
 * @typeParam TMap — bridge map (Record<Key, BridgeInterface>)
 * @param config — configuration (bridges, initialKeys, activated, owned)
 * @example
 * const bridge1 = createPassBridge<number>({ source, target, activated: false });
 * const bridge2 = createPassBridge<number>({ source, target, activated: false });
 * const selector = createBridgeMultiSelector({
 *   bridges: { first: bridge1, second: bridge2 },
 *   initialKeys: ['first'],
 *   activated: true,
 *   owned: false
 * });
 * selector.check('second'); // adds the second bridge to active
 */
export function createBridgeMultiSelector<TMap extends Record<BaseSelectorKey, BridgeInterface>>(
  config: BridgeMultiSelectorConfig<TMap>
): BridgeMultiSelector<TMap> {
  return new BridgeMultiSelector<TMap>(config);
}


// ═══════════════════════════════════════════════════════════════
// Operators
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a TransparentOperator — an identity operator (returns data unchanged).
 *
 * @typeParam T — data type
 * @example
 * const op = createTransparentOperator<number>();
 * op.apply(42); // 42
 */
export function createTransparentOperator<T>(): TransparentOperator<T> {
  return new TransparentOperator<T>();
}

/**
 * Creates a MapOperator — a transform operator via a mapper function.
 *
 * @typeParam TInput — input data type
 * @typeParam TOutput — output data type
 * @param mapper — transform function
 * @example
 * const op = createMapOperator<number, string>(n => n.toString());
 * op.apply(42); // "42"
 */
export function createMapOperator<TInput, TOutput>(
  mapper: (data: TInput) => TOutput
): MapOperator<TInput, TOutput> {
  return new MapOperator<TInput, TOutput>(mapper);
}

/**
 * Creates a FilterOperator — an array filter operator by predicate.
 *
 * @typeParam T — array element type
 * @param predicate — filter predicate function
 * @example
 * const op = createFilterOperator<number>(n => n % 2 === 0);
 * op.apply([1, 2, 3, 4]); // [2, 4]
 */
export function createFilterOperator<T>(
  predicate: (item: T) => boolean
): FilterOperator<T> {
  return new FilterOperator<T>(predicate);
}

/**
 * Creates a ReducerOperator — an array reduce operator to a single value.
 *
 * @typeParam T — array element type
 * @param reducer — reduce function
 * @param defaultValue — default value for an empty array
 * @example
 * const op = createReducerOperator<number>((acc, curr) => acc + curr, 0);
 * op.apply([1, 2, 3]); // 6
 * op.apply([]); // 0
 */
export function createReducerOperator<T>(
  reducer: (acc: T, curr: T) => T,
  defaultValue?: T
): ReducerOperator<T> {
  return new ReducerOperator<T>(reducer, defaultValue);
}

/**
 * Creates a GuardOperator — a validation operator (passes data or returns undefined).
 *
 * @typeParam T — data type
 * @param validator — validation function
 * @example
 * const op = createGuardOperator<number>(n => n > 0);
 * op.apply(42); // 42
 * op.apply(-1); // undefined
 */
export function createGuardOperator<T>(
  validator: (data: T) => boolean
): GuardOperator<T> {
  return new GuardOperator<T>(validator);
}

/**
 * Creates a PipelineOperator — a composition of multiple operators into a chain.
 *
 * @typeParam TInput — input data type
 * @typeParam TOutput — output data type
 * @param operators — array of operators for sequential application
 * @example
 * const op = createPipelineOperator<number, string>([
 *   createMapOperator<number, number>(n => n * 2),
 *   createMapOperator<number, string>(n => n.toString()),
 * ]);
 * op.apply(21); // "42"
 */
export function createPipelineOperator<TInput, TOutput>(
  operators: OperatorInterface<unknown, unknown>[]
): PipelineOperator<TInput, TOutput> {
  return new PipelineOperator<TInput, TOutput>(operators);
}

// ═══════════════════════════════════════════════════════════════
// Async transfers
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an AsyncSinkTransfer — an asynchronous terminal sink.
 *
 * Capabilities: AsyncPushable
 *
 * @param config — configuration (callback: AsyncDataHandler<T>)
 * @example
 * const sink = createAsyncSinkTransfer<number>({
 *   callback: async (n) => { await fetch('/api', { body: JSON.stringify(n) }); }
 * });
 * await sink.asyncPush(42);
 */
export function createAsyncSinkTransfer<T>(
  config: AsyncSinkTransferConfig<T>
): Transfer<T, [AsyncPushable]> {
  return new AsyncSinkTransfer<T>(config);
}

/**
 * Creates an AsyncWriteTransfer — an adapter for asynchronous writing to AsyncInputFlowInterface.
 *
 * Capabilities: AsyncPushable
 *
 * @param config — configuration (flow, onError)
 */
export function createAsyncWriteTransfer<T>(
  config: AsyncWriteTransferConfig<T>
): Transfer<T, [AsyncPushable]> {
  return new AsyncWriteTransfer<T>(config);
}

/**
 * Creates an AsyncReadTransfer — an adapter for asynchronous reading from AsyncOutputFlowInterface.
 *
 * Capabilities: AsyncPullable
 *
 * @param config — configuration (flow, onError)
 */
export function createAsyncReadTransfer<T>(
  config: AsyncReadTransferConfig<T>
): Transfer<T, [AsyncPullable]> {
  return new AsyncReadTransfer<T>(config);
}

/**
 * Creates an AsyncPollingSourceTransfer — an output transfer with asynchronous source polling.
 *
 * Capabilities: AsyncPullable, Subscribable, AsyncTriggerable, Gate
 *
 * @param config — configuration (fetcher, interval, activated, tickerFactory, onError)
 */
export function createAsyncPollingSourceTransfer<T>(
  config: AsyncPollingSourceConfig<T>
): Transfer<T, [AsyncPullable, Subscribable, AsyncTriggerable, Gate]> {
  return new AsyncPollingSourceTransfer<T>(config);
}

/**
 * Creates an AsyncPollingProxyTransfer — a duplex transfer with async polling from the previous node.
 *
 * Capabilities: AsyncPollingProxy, AsyncPullable, Subscribable, AsyncTriggerable, Gate
 *
 * @param config — configuration (interval, activated, tickerFactory, onError)
 */
export function createAsyncPollingProxyTransfer<T>(
  config: AsyncPollingProxyConfig
): Transfer<T, [AsyncPollingProxy, AsyncPullable, Subscribable, AsyncTriggerable, Gate]> {
  return new AsyncPollingProxyTransfer<T>(config);
}

/**
 * Creates an AsyncPollingFlowTransfer — polling from AsyncOutputFlowInterface.
 *
 * Capabilities: AsyncPullable, Subscribable, AsyncTriggerable, Gate
 *
 * @param config — configuration (flow, interval, activated, tickerFactory, onError)
 */
export function createAsyncPollingFlowTransfer<T>(
  config: AsyncPollingFlowTransferConfig<T>
): Transfer<T, [AsyncPullable, Subscribable, AsyncTriggerable, Gate]> {
  return new AsyncPollingFlowTransfer<T>(config);
}

/**
 * Creates an AsyncIdlePollingTransfer — a reactive channel with async fallback polling on idle.
 *
 * Capabilities: Pushable, Subscribable, Triggerable, Gate
 *
 * @param config — configuration (fetcher, timeout, interval, activated, initialValue, tickerFactory, onError)
 */
export function createAsyncIdlePollingTransfer<T>(
  config: AsyncIdlePollingTransferConfig<T>
): Transfer<T, [Pushable, Subscribable, Triggerable, Gate]> {
  return new AsyncIdlePollingTransfer<T>(config);
}

/**
 * Creates an AsyncConvertTransfer — an async converter transfer via AsyncOperator.
 *
 * Capabilities: AsyncPushable, Subscribable
 *
 * @param config — configuration (operator: AsyncOperatorInterface, onError)
 */
export function createAsyncConvertTransfer<TInput, TOutput>(
  config: AsyncConvertTransferConfig<TInput, TOutput>
): Transfer<TInput, TOutput, [AsyncPushable, Subscribable]> {
  return new AsyncConvertTransfer<TInput, TOutput>(config);
}

/**
 * Creates an AsyncConditionTransfer — a transfer with async conditional filtering.
 *
 * Capabilities: AsyncPushable, Subscribable
 *
 * @param config — configuration (shouldAccept?, shouldEmit?, onError)
 */
export function createAsyncConditionTransfer<T>(
  config: AsyncConditionTransferConfig<T>
): Transfer<T, [AsyncPushable, Subscribable]> {
  return new AsyncConditionTransfer<T>(config);
}

/**
 * Creates an AsyncStoredChannelTransfer — a channel with value storage and async interface.
 *
 * Capabilities: AsyncPullable, Subscribable, AsyncTriggerable
 *
 * @param config — configuration (setup, destroy, initialValue, onError handlers)
 */
export function createAsyncStoredChannelTransfer<T>(
  config: AsyncStoredChannelTransferConfig<T>
): Transfer<T, [AsyncPullable, Subscribable, AsyncTriggerable]> {
  return new AsyncStoredChannelTransfer<T>(config);
}

// ═══════════════════════════════════════════════════════════════
// Async bridges
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an AsyncTransformBridge — a bridge with async transformation via AsyncOperator.
 *
 * @typeParam TInput — input data type
 * @typeParam TOutput — output data type
 * @param config — configuration (source, target, operator: AsyncOperatorInterface, activated, onError)
 */
export function createAsyncTransformBridge<TInput, TOutput>(
  config: AsyncTransformBridgeConfig<TInput, TOutput>
): AsyncTransformBridge<TInput, TOutput> {
  return new AsyncTransformBridge<TInput, TOutput>(config);
}

// ═══════════════════════════════════════════════════════════════
// Async operators
// ═══════════════════════════════════════════════════════════════

/**
 * Creates an AsyncMapOperator — an async transform operator.
 *
 * @typeParam TInput — input data type
 * @typeParam TOutput — output data type
 * @param mapper — async transform function
 * @example
 * const op = createAsyncMapOperator<number, string>(async (n) => (await fetch(`/api/${n}`)).text());
 * await op.apply(42); // fetch result
 */
export function createAsyncMapOperator<TInput, TOutput>(
  mapper: (data: TInput) => Promise<TOutput>
): AsyncMapOperator<TInput, TOutput> {
  return new AsyncMapOperator<TInput, TOutput>(mapper);
}

/**
 * Creates an AsyncGuardOperator — an async validation operator.
 *
 * @typeParam T — data type
 * @param validator — async validation function
 * @example
 * const op = createAsyncGuardOperator<number>(async (n) => (await check(n)).valid);
 * const result = await op.apply(42); // 42 or undefined
 */
export function createAsyncGuardOperator<T>(
  validator: (data: T) => Promise<boolean>
): AsyncGuardOperator<T> {
  return new AsyncGuardOperator<T>(validator);
}

/**
 * Creates an AsyncPipelineOperator — a composition of sync/async operators into a chain.
 *
 * @typeParam TInput — input data type
 * @typeParam TOutput — output data type
 * @param operators — array of sync/async operators for sequential application
 * @example
 * const op = createAsyncPipelineOperator<number, string>([
 *   createAsyncMapOperator<number, number>(async (n) => n * 2),
 *   createMapOperator<number, string>(n => n.toString()),
 * ]);
 * await op.apply(21); // "42"
 */
export function createAsyncPipelineOperator<TInput, TOutput>(
  operators: (OperatorInterface<unknown, unknown> | AsyncOperatorInterface<unknown, unknown>)[]
): AsyncPipelineOperator<TInput, TOutput> {
  return new AsyncPipelineOperator<TInput, TOutput>(operators as AsyncOperatorInterface<unknown, unknown>[]);
}

// ═══════════════════════════════════════════════════════════════
// Storages
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a LatestStorage — a storage that keeps only the last value.
 *
 * @typeParam T — data type
 * @param defaultValue — initial value (optional)
 * @example
 * const storage = createLatestStorage<number>(0);
 * storage.write(42);
 * storage.read(); // 42
 * storage.size; // 1
 */
export function createLatestStorage<T>(defaultValue?: T): LatestStorage<T> {
  return new LatestStorage<T>(defaultValue);
}

/**
 * Creates a QueueStorage — a storage with a FIFO queue.
 *
 * @typeParam T — data type
 * @param maxLength — maximum queue length (optional)
 * @example
 * const storage = createQueueStorage<number>(3);
 * storage.write(1);
 * storage.write(2);
 * storage.read(); // 1 (first written)
 */
export function createQueueStorage<T>(maxLength?: number): QueueStorage<T> {
  return new QueueStorage<T>(maxLength);
}

/**
 * Creates a StackStorage — a storage with a LIFO stack.
 *
 * @typeParam T — data type
 * @param maxLength — maximum stack length (optional)
 * @example
 * const storage = createStackStorage<number>(3);
 * storage.write(1);
 * storage.write(2);
 * storage.read(); // 2 (last written)
 */
export function createStackStorage<T>(maxLength?: number): StackStorage<T> {
  return new StackStorage<T>(maxLength);
}
