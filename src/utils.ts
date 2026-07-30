import type { SubscriberInterface } from "./interfaces";
import type {
  AsyncPollingProxy,
  AsyncPullable,
  AsyncPushable,
  ErrorHandler,
  InputTransfer,
  OutputTransfer,
  PollingProxy,
  Pullable,
  Pushable,
  Subscribable,
} from "./types";
import type { LinkConfig } from "./configs";
import { Subscriber } from "./helpers";

/**
 * Links an output transfer (LHS) to an input transfer (RHS).
 *
 * The strategy is determined by capability flags. Sync operations take priority:
 * if both transfers support sync linking, it is used.
 * Async strategies are applied only when sync is not applicable.
 *
 * Sync strategies:
 * - subscribable → pushable: reactive subscription
 * - pullable → pollingProxy: active polling via setFetcher
 * - subscribable → pollingProxy: subscription + last-value buffer
 *
 * Async strategies:
 * - subscribable → asyncPushable: subscription + asyncPush with .catch()
 * - asyncPullable → asyncPollingProxy: active polling via setAsyncFetcher
 * - pullable → asyncPollingProxy: sync-pull wrapped in an async fetcher
 * - subscribable → asyncPollingProxy: subscription + buffer + async fetcher
 *
 * Errors:
 * - asyncPullable → sync-pollingProxy: sync poller cannot await
 * - pullable/asyncPullable → pushable/asyncPushable: needs a Bridge/Triggerable
 *
 * Rejection handling for subscribable → asyncPushable:
 * .catch() is always called. If options.onError is provided, it is invoked
 * via handleError() and the rejection is suppressed.
 * Without onError, handleError() rethrows — resulting in an unhandled promise
 * rejection (the source's subscription remains active).
 *
 * Ordering for subscribable → asyncPushable:
 * No ordering guarantees — fast sync notifications from LHS can overtake
 * pending asyncPush calls. A serializer is a separate task (not in this queue).
 *
 * @param lhs — output transfer (source)
 * @param rhs — input transfer (sink)
 * @param options — optional link config (onError for async-push rejection)
 * @returns SubscriberInterface for breaking the link
 *
 * @see {@link linkSubscribableToPushable} — Case 1
 * @see {@link linkPullableToPollingProxy} — Case 2
 * @see {@link linkSubscribableToPollingProxy} — Case 3
 * @see {@link linkSubscribableToAsyncPushable} — Case 4
 * @see {@link linkAsyncPullableToAsyncPollingProxy} — Case 5
 * @see {@link linkPullableToAsyncPollingProxy} — Case 6
 * @see {@link linkSubscribableToAsyncPollingProxy} — Case 7
 *
 * @category Utilities
 */
export function linkTransfers<T, RTransfer extends InputTransfer<T>>(
  lhs: OutputTransfer<T>,
  rhs: RTransfer,
  options?: LinkConfig<RTransfer>,
): SubscriberInterface {
  // ═══════════════════════════════════════════════════════════════
  // SYNC CASES (priority)
  // ═══════════════════════════════════════════════════════════════

  // CASE 1: Reactive Push (LHS streams data -> RHS accepts data)
  if (lhs.isSubscribable && rhs.isPushable) {
    return linkSubscribableToPushable(lhs as Subscribable<T>, rhs as Pushable<T>);
  }

  // CASE 2: Active Polling on the input side (RHS pulls data itself)
  if (lhs.isPullable && rhs.isPollingProxy) {
    return linkPullableToPollingProxy(lhs as Pullable<T>, rhs as PollingProxy<T>);
  }

  // CASE 3: Subscription + last-value buffer for the poller
  if (lhs.isSubscribable && rhs.isPollingProxy) {
    return linkSubscribableToPollingProxy(lhs as Subscribable<T>, rhs as PollingProxy<T>);
  }

  // ═══════════════════════════════════════════════════════════════
  // ASYNC CASES (applied only when sync is not applicable)
  // ═══════════════════════════════════════════════════════════════

  // CASE 4: subscribable → asyncPushable
  // Reactive subscription + async-push with rejection handling.
  // No ordering guarantees: fast sync notifications can overtake
  // pending asyncPush calls.
  if (lhs.isSubscribable && rhs.isAsyncPushable) {
    return linkSubscribableToAsyncPushable(
      lhs as Subscribable<T>,
      rhs as AsyncPushable<T>,
      options?.onError as ErrorHandler<AsyncPushable<T>>,
    );
  }

  // CASE 5: asyncPullable → asyncPollingProxy
  // Active polling: RHS pulls data via asyncPull.
  if (lhs.isAsyncPullable && rhs.isAsyncPollingProxy) {
    return linkAsyncPullableToAsyncPollingProxy(lhs as AsyncPullable<T>, rhs as AsyncPollingProxy<T>);
  }

  // CASE 6: pullable → asyncPollingProxy
  // Sync-pull wrapped in an async fetcher for the async poller.
  if (lhs.isPullable && rhs.isAsyncPollingProxy) {
    return linkPullableToAsyncPollingProxy(lhs as Pullable<T>, rhs as AsyncPollingProxy<T>);
  }

  // CASE 7: subscribable → asyncPollingProxy
  // Subscription + last-value buffer for the async poller.
  if (lhs.isSubscribable && rhs.isAsyncPollingProxy) {
    return linkSubscribableToAsyncPollingProxy(lhs as Subscribable<T>, rhs as AsyncPollingProxy<T>);
  }

  // ═══════════════════════════════════════════════════════════════
  // ERRORS
  // ═══════════════════════════════════════════════════════════════

  // CASE 8: asyncPullable → sync-pollingProxy — impossible
  // Sync poller calls fetcher() synchronously and cannot await.
  if (lhs.isAsyncPullable && rhs.isPollingProxy) {
    throwLinkAsyncPullableToPollingProxyError();
  }

  // CASE 9: pullable/asyncPullable → pushable/asyncPushable — needs a trigger
  if ((lhs.isPullable || lhs.isAsyncPullable) && (rhs.isPushable || rhs.isAsyncPushable)) {
    throwLinkPullableToPushableError();
  }

  // CASE 10: Incompatible or unfeasible configuration
  throwLinkUnsupportedError(lhs, rhs);
}

// ═══════════════════════════════════════════════════════════════
// Sync linking strategies
// ═══════════════════════════════════════════════════════════════

/**
 * Links a Subscribable source to a Pushable target via direct subscription.
 * Every emitted value from lhs is pushed into rhs.
 *
 * @param lhs — subscribable source
 * @param rhs — pushable target
 * @returns SubscriberInterface for unsubscribing
 *
 * @category Utilities
 */
export function linkSubscribableToPushable<T>(lhs: Subscribable<T>, rhs: Pushable<T>): SubscriberInterface {
  return lhs.subscribe((data) => rhs.push(data));
}

/**
 * Links a Pullable source to a PollingProxy target.
 * The poller's fetcher is set to pull from lhs on each tick.
 *
 * @param lhs — pullable source
 * @param rhs — polling proxy target
 * @returns SubscriberInterface for clearing the fetcher
 *
 * @category Utilities
 */
export function linkPullableToPollingProxy<T>(
  lhs: Pullable<T>,
  rhs: PollingProxy<T>,
): SubscriberInterface {
  rhs.setFetcher(() => lhs.pull());

  return new Subscriber(() => {
    rhs.clearFetcher();
  });
}

/**
 * Links a Subscribable source to a PollingProxy target.
 * The last emitted value is buffered and served on each poller tick.
 *
 * @param lhs — subscribable source
 * @param rhs — polling proxy target
 * @returns SubscriberInterface for unsubscribing and clearing the fetcher
 *
 * @category Utilities
 */
export function linkSubscribableToPollingProxy<T>(
  lhs: Subscribable<T>,
  rhs: PollingProxy<T>,
): SubscriberInterface {
  let lastValue: T | undefined;

  const sub = lhs.subscribe((data) => {
    lastValue = data;
  });

  rhs.setFetcher(() => {
    const value = lastValue;
    lastValue = undefined;
    return value;
  });

  return new Subscriber(() => {
    sub.unsubscribe();
    rhs.clearFetcher();
  });
}

// ═══════════════════════════════════════════════════════════════
// Async linking strategies
// ═══════════════════════════════════════════════════════════════

/**
 * Links a Subscribable source to an AsyncPushable target.
 * Each emitted value triggers asyncPush; rejections are handled via onError.
 *
 * No ordering guarantees — fast sync notifications can overtake
 * pending asyncPush calls.
 *
 * @param lhs — subscribable source
 * @param rhs — async pushable target
 * @param onError — optional error handler for async-push rejections
 * @returns SubscriberInterface for unsubscribing
 *
 * @category Utilities
 */
export function linkSubscribableToAsyncPushable<T>(
  lhs: Subscribable<T>,
  rhs: AsyncPushable<T>,
  onError?: ErrorHandler<AsyncPushable<T>>,
): SubscriberInterface {
  return lhs.subscribe((data) => {
    rhs.asyncPush(data).catch((e) => {
      handleError(e, rhs, onError);
    });
  });
}

/**
 * Links an AsyncPullable source to an AsyncPollingProxy target.
 * The async poller's fetcher is set to asyncPull from lhs on each tick.
 *
 * @param lhs — async pullable source
 * @param rhs — async polling proxy target
 * @returns SubscriberInterface for clearing the async fetcher
 *
 * @category Utilities
 */
export function linkAsyncPullableToAsyncPollingProxy<T>(
  lhs: AsyncPullable<T>,
  rhs: AsyncPollingProxy<T>,
): SubscriberInterface {
  rhs.setAsyncFetcher(() => lhs.asyncPull());

  return new Subscriber(() => {
    rhs.clearAsyncFetcher();
  });
}

/**
 * Links a Pullable source to an AsyncPollingProxy target.
 * Sync-pull is wrapped in an async fetcher for the async poller.
 *
 * @param lhs — pullable source
 * @param rhs — async polling proxy target
 * @returns SubscriberInterface for clearing the async fetcher
 *
 * @category Utilities
 */
export function linkPullableToAsyncPollingProxy<T>(
  lhs: Pullable<T>,
  rhs: AsyncPollingProxy<T>,
): SubscriberInterface {
  rhs.setAsyncFetcher(async () => lhs.pull());

  return new Subscriber(() => {
    rhs.clearAsyncFetcher();
  });
}

/**
 * Links a Subscribable source to an AsyncPollingProxy target.
 * The last emitted value is buffered and served on each async poller tick.
 *
 * @param lhs — subscribable source
 * @param rhs — async polling proxy target
 * @returns SubscriberInterface for unsubscribing and clearing the async fetcher
 *
 * @category Utilities
 */
export function linkSubscribableToAsyncPollingProxy<T>(
  lhs: Subscribable<T>,
  rhs: AsyncPollingProxy<T>,
): SubscriberInterface {
  let lastValue: T | undefined;

  const sub = lhs.subscribe((data) => {
    lastValue = data;
  });

  rhs.setAsyncFetcher(async () => {
    const value = lastValue;
    lastValue = undefined;
    return value;
  });

  return new Subscriber(() => {
    sub.unsubscribe();
    rhs.clearAsyncFetcher();
  });
}

// ═══════════════════════════════════════════════════════════════
// Link error helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Throws an error for an unsupported asyncPullable → sync-pollingProxy link.
 *
 * @category Utilities
 */
export function throwLinkAsyncPullableToPollingProxyError(): never {
  throw new Error(
    "Cannot link AsyncPullable source to sync PollingProxy. Use AsyncPollingProxyTransfer.",
  );
}

/**
 * Throws an error for an unsupported pullable/asyncPullable → pushable/asyncPushable link.
 *
 * @category Utilities
 */
export function throwLinkPullableToPushableError(): never {
  throw new Error(
    "Cannot directly link Pullable/AsyncPullable source to Pushable/AsyncPushable target. Use a Bridge or Triggerable adapter to pull and push data.",
  );
}

/**
 * Throws an error for an incompatible or unfeasible transfer link combination.
 *
 * @param lhs — output transfer
 * @param rhs — input transfer
 *
 * @category Utilities
 */
export function throwLinkUnsupportedError(
  lhs: { isSubscribable: boolean; isPullable: boolean; isAsyncPullable: boolean },
  rhs: { isPushable: boolean; isAsyncPushable: boolean; isPollingProxy: boolean; isAsyncPollingProxy: boolean },
): never {
  throw new Error(
    `Unsupported transfer link combination: LHS(subscribable:${lhs.isSubscribable}, pullable:${lhs.isPullable}, asyncPullable:${lhs.isAsyncPullable}) -> RHS(pushable:${rhs.isPushable}, asyncPushable:${rhs.isAsyncPushable}, poller:${rhs.isPollingProxy}, asyncPoller:${rhs.isAsyncPollingProxy})`,
  );
}

/**
 * Universal error handler.
 * If onError is provided — calls it and suppresses the exception.
 * If onError is not provided — rethrows the exception.
 *
 * @category Utilities
 */
export function handleError<TSource>(error: unknown, source: TSource, onError?: ErrorHandler<TSource>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (onError !== undefined) {
    onError(err, source);
  } else {
    throw err;
  }
}
