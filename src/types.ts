import type {
  BaseTransferInterface,
  BridgeInterface,
  DisposableInterface,
  GateInterface,
  GateTransferInterface,
  TriggerableInterface,
  PushableInterface,
  PullableInterface,
  SubscribableInterface,
  PollingProxyInterface,
  PollingProxyTransferInterface,
  PullableTransferInterface,
  PushableTransferInterface,
  SubscribableTransferInterface,
  TickerInterface,
  AsyncPushableInterface,
  AsyncPullableInterface,
  AsyncTriggerableInterface,
  AsyncPollingProxyInterface,
  AsyncPushableTransferInterface,
  AsyncPullableTransferInterface,
  AsyncPollingProxyTransferInterface,
} from "./interfaces";
import type { TickerConfig } from "./configs";

/** Extracts the first element type from a readonly tuple. */
export type First<T extends readonly unknown[]> = T extends readonly [infer Head, ...unknown[]] ? Head : never;
/** Extracts the last element type from a readonly tuple. */
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer Tail] ? Tail : never;

/** Synchronous data handler — called with a value of type T. */
export type DataHandler<T> = (data: T) => void;
/** Synchronous data fetcher — returns a value of type T or undefined. */
export type DataFetcher<T> = () => T | undefined;
/** Asynchronous data handler — may return a Promise or void. */
export type AsyncDataHandler<T> = (data: T) => Promise<void> | void;
/** Asynchronous data fetcher — returns a Promise of T or undefined. */
export type AsyncDataFetcher<T> = () => Promise<T | undefined>;
/** Error handler — receives an Error and returns void. */
export type ErrorHandler<TSource> = (e: Error, source: TSource) => void;
/** Callback invoked by a Ticker on each tick. */
export type TickerCallback = () => void;
/** Factory function that creates a TickerInterface from a TickerConfig. */
export type TickerFactory = (config: TickerConfig) => TickerInterface;

/** Branded type: PushableInterface with the `isPushable` flag set to true. */
export type Pushable<T = any> = PushableInterface<T> & { readonly isPushable: true };
/** Branded type: PollingProxyInterface with the `isPollingProxy` flag set to true. */
export type PollingProxy<T = any> = PollingProxyInterface<T> & { readonly isPollingProxy: true };
/** Branded type: PullableInterface with the `isPullable` flag set to true. */
export type Pullable<T = any> = PullableInterface<T> & { readonly isPullable: true };
/** Branded type: SubscribableInterface with the `isSubscribable` flag set to true. */
export type Subscribable<T = any> = SubscribableInterface<T> & { readonly isSubscribable: true };
/** Branded type: TriggerableInterface with the `isTriggerable` flag set to true. */
export type Triggerable = TriggerableInterface & { readonly isTriggerable: true };
/** Branded type: GateInterface with the `isGate` flag set to true. */
export type Gate = GateInterface & { readonly isGate: true };

/** Branded type: AsyncPushableInterface with the `isAsyncPushable` flag set to true. */
export type AsyncPushable<T = any> = AsyncPushableInterface<T> & { readonly isAsyncPushable: true };
/** Branded type: AsyncPollingProxyInterface with the `isAsyncPollingProxy` flag set to true. */
export type AsyncPollingProxy<T = any> = AsyncPollingProxyInterface<T> & { readonly isAsyncPollingProxy: true };
/** Branded type: AsyncPullableInterface with the `isAsyncPullable` flag set to true. */
export type AsyncPullable<T = any> = AsyncPullableInterface<T> & { readonly isAsyncPullable: true };
/** Branded type: AsyncTriggerableInterface with the `isAsyncTriggerable` flag set to true. */
export type AsyncTriggerable = AsyncTriggerableInterface & { readonly isAsyncTriggerable: true };

/** Maps a single feature flag to its corresponding branded interface and direction flags. */
type FeatureMap<TIn, TOut, F> =
  F extends { readonly isPushable: true } ? Pushable<TIn> & { readonly isInput: true } :
  F extends { readonly isPollingProxy: true } ? PollingProxy<TIn> & { readonly isInput: true, readonly isOutput: true } :
  F extends { readonly isPullable: true } ? Pullable<TOut> & { readonly isOutput: true } :
  F extends { readonly isSubscribable: true } ? Subscribable<TOut> & { readonly isOutput: true } :
  F extends { readonly isTriggerable: true } ? Triggerable :
  F extends { readonly isGate: true } ? Gate :
  F extends { readonly isAsyncPushable: true } ? AsyncPushable<TIn> & { readonly isInput: true } :
  F extends { readonly isAsyncPollingProxy: true } ? AsyncPollingProxy<TIn> & { readonly isInput: true, readonly isOutput: true } :
  F extends { readonly isAsyncPullable: true } ? AsyncPullable<TOut> & { readonly isOutput: true } :
  F extends { readonly isAsyncTriggerable: true } ? AsyncTriggerable :
  unknown;

/** Converts a union type into an intersection type via contravariant function parameter inference. */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/** Resolves an array of feature flags into a single intersection of all corresponding branded interfaces. */
type ResolveFeatures<TIn, TOut, Features extends any[]> = UnionToIntersection<{
  [K in keyof Features]: FeatureMap<TIn, TOut, Features[K]>
}[number]>;

/** Adds `isDuplex: true` when the resolved features include both input and output direction. */
type IsDuplexFeatures<Features extends any[]> =
  ResolveFeatures<any, any, Features> extends { readonly isInput: true, readonly isOutput: true }
    ? { readonly isDuplex: true }
    : unknown;

/** Resolves a transfer with explicit feature flags into a concrete intersection type with BaseTransferInterface and duplex flag. */
type ExplicitTransfer<TIn, TOut, Features extends any[]> = BaseTransferInterface
  & ResolveFeatures<TIn, TOut, Features>
  & IsDuplexFeatures<Features>;

/**
 * Generic transfer type that resolves to an ExplicitTransfer with the correct
 * feature set based on the number of type arguments provided.
 *
 * - Two arguments (T, T, Features[]): single-type duplex transfer.
 * - Three arguments (TIn, TOut, Features[]): dual-type transfer.
 */
export type Transfer<
  TInOrAll,
  TOutOrFeatures extends any[] | any,
  TFeaturesOrUndefined extends any[] | undefined = undefined,
> = TFeaturesOrUndefined extends any[]
  ? ExplicitTransfer<TInOrAll, TOutOrFeatures, TFeaturesOrUndefined>
  : TOutOrFeatures extends any[]
    ? ExplicitTransfer<TInOrAll, TInOrAll, TOutOrFeatures>
    : never;

/** Union of all transfer interfaces that can act as a pipeline input (push/poll/gate/async variants). */
export type InputTransfer<T> = PushableTransferInterface<T> | PollingProxyTransferInterface<T> | GateTransferInterface<T> | AsyncPushableTransferInterface<T> | AsyncPollingProxyTransferInterface<T>;

/** Union of all transfer interfaces that can act as a pipeline output (pull/subscribe/gate/async variants). */
export type OutputTransfer<T> = PullableTransferInterface<T> | SubscribableTransferInterface<T> | GateTransferInterface<T> | AsyncPullableTransferInterface<T>;

/** A transfer that is both an input and an output (duplex). */
export type DuplexTransfer<TInput, TOutput = TInput> = InputTransfer<TInput> & OutputTransfer<TOutput> & {
  isDuplex: true;
}

/** Extracts the input data type from an InputTransfer. */
export type InputTransferDataType<T> = T extends InputTransfer<infer U> ? U : never;
/** Extracts the output data type from an OutputTransfer. */
export type OutputTransferDataType<T> = T extends OutputTransfer<infer U> ? U : never;

/** Base type for selector keys — string, number, or symbol. */
export type BaseSelectorKey = string | number | symbol;
/** Extracts the key type from a bridge map. */
export type SelectorKey<TMap extends Record<BaseSelectorKey, BridgeInterface>> = keyof TMap;

/** Filters `never` elements out of a tuple type, preserving order of the remaining elements. */
type FilterNever<T extends any[], Acc extends any[] = []> =
  T extends [infer Head, ...infer Rest]
    ? [Head] extends [never] ? FilterNever<Rest, Acc> : FilterNever<Rest, [...Acc, Head]>
    : Acc;

/**
 * Unified composite transfer type produced by CompositeTransferBuilder.
 *
 * Input capability flags (Pushable, PollingProxy, AsyncPushable, AsyncPollingProxy)
 * are extracted from the start transfer. Output capability flags (Pullable, Subscribable,
 * AsyncPullable) are extracted from the finish transfer. Triggerable, AsyncTriggerable,
 * and Gate are extracted from options or the start/finish transfers (same priority logic
 * as UniversalCompositeTransfer).
 *
 * The result is a `Transfer<TInput, TOutput, [...Flags]>` — the same computed type used
 * by all transfer factories, with compile-time literal flags guaranteeing method existence.
 */
export type CompositeTransfer<
  TInput,
  TOutput,
  TStartTransfer,
  TFinishTransfer,
  TTriggerable extends TriggerableInterface | undefined,
  TAsyncTriggerable extends AsyncTriggerableInterface | undefined,
  TGate extends GateInterface | undefined,
> = Transfer<TInput, TOutput, FilterNever<[
  // Input flags — from start transfer
  TStartTransfer extends { readonly isPushable: true } ? Pushable<TInput> : never,
  TStartTransfer extends { readonly isPollingProxy: true } ? PollingProxy<TInput> : never,
  TStartTransfer extends { readonly isAsyncPushable: true } ? AsyncPushable<TInput> : never,
  TStartTransfer extends { readonly isAsyncPollingProxy: true } ? AsyncPollingProxy<TInput> : never,

  // Output flags — from finish transfer
  TFinishTransfer extends { readonly isPullable: true } ? Pullable<TOutput> : never,
  TFinishTransfer extends { readonly isSubscribable: true } ? Subscribable<TOutput> : never,
  TFinishTransfer extends { readonly isAsyncPullable: true } ? AsyncPullable<TOutput> : never,

  // Optional flags — from explicit options or extracted by UniversalCompositeTransfer
  TTriggerable extends TriggerableInterface ? Triggerable : never,
  TAsyncTriggerable extends AsyncTriggerableInterface ? AsyncTriggerable : never,
  TGate extends GateInterface ? Gate : never,
]>>;

// ═══════════════════════════════════════════════════════════════
// Deprecated types
// ═══════════════════════════════════════════════════════════════

/**
 * @deprecated Use `CompositeTransfer` instead. Will be removed in the next major release.
 *
 * Composite transfer type produced by InputPipelineBuilder — exposes input capabilities plus optional trigger/gate.
 */
export type CompositeInputTransfer<
  TStart,
  TTransfer extends InputTransfer<TStart>,
  TTriggerable extends TriggerableInterface | undefined,
  TAsyncTriggerable extends AsyncTriggerableInterface | undefined,
  TGate extends GateInterface | undefined,
> = BaseTransferInterface & DisposableInterface
  & InputTransfer<TStart>
  & Omit<TTransfer, keyof SubscribableInterface<any> | keyof PullableInterface<any>>
  & (TTriggerable extends TriggerableInterface ? TriggerableInterface : {})
  & (TAsyncTriggerable extends AsyncTriggerableInterface ? AsyncTriggerableInterface : {})
  & (TGate extends GateInterface ? GateInterface : {});

/**
 * @deprecated Use `CompositeTransfer` instead. Will be removed in the next major release.
 *
 * Composite transfer type produced by OutputPipelineBuilder — exposes output capabilities plus optional trigger/gate.
 */
export type CompositeOutputTransfer<
  TFinish,
  TTransfer extends OutputTransfer<TFinish>,
  TTriggerable extends TriggerableInterface | undefined,
  TAsyncTriggerable extends AsyncTriggerableInterface | undefined,
  TGate extends GateInterface | undefined,
> = BaseTransferInterface & DisposableInterface
  & OutputTransfer<TFinish>
  & Omit<TTransfer, keyof PushableInterface<any> | keyof AsyncPushableInterface<any>>
  & (TTriggerable extends TriggerableInterface ? TriggerableInterface : {})
  & (TAsyncTriggerable extends AsyncTriggerableInterface ? AsyncTriggerableInterface : {})
  & (TGate extends GateInterface ? GateInterface : {});

/**
 * @deprecated Use `CompositeTransfer` instead. Will be removed in the next major release.
 *
 * Composite transfer type produced by DuplexPipelineBuilder — exposes both input and output capabilities plus optional trigger/gate.
 */
export type CompositeDuplexTransfer<
  TStart,
  TFinish,
  TStartTransfer extends InputTransfer<TStart>,
  TFinishTransfer extends OutputTransfer<TFinish>,
  TTriggerable extends TriggerableInterface | undefined,
  TAsyncTriggerable extends AsyncTriggerableInterface | undefined,
  TGate extends GateInterface | undefined,
> = BaseTransferInterface & DisposableInterface
  & InputTransfer<TStart>
  & OutputTransfer<TFinish>
  & Omit<TStartTransfer, keyof SubscribableInterface<any> | keyof PullableInterface<any>>
  & Omit<TFinishTransfer, keyof PushableInterface<any> | keyof AsyncPushableInterface<any>>
  & { isDuplex: true }
  & (TTriggerable extends TriggerableInterface ? TriggerableInterface : {})
  & (TAsyncTriggerable extends AsyncTriggerableInterface ? AsyncTriggerableInterface : {})
  & (TGate extends GateInterface ? GateInterface : {});
