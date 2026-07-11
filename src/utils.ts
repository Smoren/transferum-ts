import type {
  PushableTransferInterface,
  SubscribableTransferInterface,
  SubscriberInterface,
  PullableTransferInterface,
  PollingProxyTransferInterface,
  AsyncPushableTransferInterface,
  AsyncPullableTransferInterface,
  AsyncPollingProxyTransferInterface,
} from "./interfaces";
import type { ErrorHandler, InputTransfer, OutputTransfer } from "./types";
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
 * .catch() is always called. If options.onError is provided, it is invoked.
 * Without onError, the error is suppressed to protect the reactive stream.
 *
 * Ordering for subscribable → asyncPushable:
 * No ordering guarantees — fast sync notifications from LHS can overtake
 * pending asyncPush calls. A serializer is a separate task (not in this queue).
 *
 * @param lhs — output transfer (source)
 * @param rhs — input transfer (sink)
 * @param options — optional link config (onError for async-push rejection)
 * @returns SubscriberInterface for breaking the link
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
    return (lhs as SubscribableTransferInterface<T>).subscribe((data) => {
      (rhs as PushableTransferInterface<T>).push(data);
    });
  }

  // CASE 2: Active Polling on the input side (RHS pulls data itself)
  if (lhs.isPullable && rhs.isPollingProxy) {
    const pullableLhs = lhs as PullableTransferInterface<T>;
    const pollerRhs = rhs as PollingProxyTransferInterface<T>;

    pollerRhs.setFetcher(() => pullableLhs.pull());

    return new Subscriber(() => {
      pollerRhs.clearFetcher();
    });
  }

  // CASE 3: Subscription + last-value buffer for the poller
  if (lhs.isSubscribable && rhs.isPollingProxy) {
    const subscribableLhs = lhs as SubscribableTransferInterface<T>;
    const pollerRhs = rhs as PollingProxyTransferInterface<T>;

    let lastValue: T | undefined = undefined;

    const sub = subscribableLhs.subscribe((data) => {
      lastValue = data;
    });

    pollerRhs.setFetcher(() => {
      const value = lastValue;
      lastValue = undefined;
      return value;
    });

    return new Subscriber(() => {
      sub.unsubscribe();
      pollerRhs.clearFetcher();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ASYNC CASES (applied only when sync is not applicable)
  // ═══════════════════════════════════════════════════════════════

  // CASE 4: subscribable → asyncPushable
  // Reactive subscription + async-push with rejection handling.
  // No ordering guarantees: fast sync notifications can overtake
  // pending asyncPush calls.
  if (lhs.isSubscribable && rhs.isAsyncPushable) {
    const subscribableLhs = lhs as SubscribableTransferInterface<T>;
    const asyncPushableRhs = rhs as AsyncPushableTransferInterface<T>;
    const onError = options?.onError;

    return subscribableLhs.subscribe((data) => {
      asyncPushableRhs.asyncPush(data).catch((e) => {
        if (onError !== undefined) {
          // TODO сделать через handleError ? (возможно в дальнейшем развитии понадобится, так как не факт, что должно быть подавление)
          onError(e instanceof Error ? e : new Error(String(e)), rhs);
        }
      });
    });
  }

  // CASE 5: asyncPullable → asyncPollingProxy
  // Active polling: RHS pulls data via asyncPull.
  if (lhs.isAsyncPullable && rhs.isAsyncPollingProxy) {
    const asyncPullableLhs = lhs as AsyncPullableTransferInterface<T>;
    const asyncPollerRhs = rhs as AsyncPollingProxyTransferInterface<T>;

    asyncPollerRhs.setAsyncFetcher(() => asyncPullableLhs.asyncPull());

    return new Subscriber(() => {
      asyncPollerRhs.clearAsyncFetcher();
    });
  }

  // CASE 6: pullable → asyncPollingProxy
  // Sync-pull wrapped in an async fetcher for the async poller.
  if (lhs.isPullable && rhs.isAsyncPollingProxy) {
    const pullableLhs = lhs as PullableTransferInterface<T>;
    const asyncPollerRhs = rhs as AsyncPollingProxyTransferInterface<T>;

    asyncPollerRhs.setAsyncFetcher(async () => pullableLhs.pull());

    return new Subscriber(() => {
      asyncPollerRhs.clearAsyncFetcher();
    });
  }

  // CASE 7: subscribable → asyncPollingProxy
  // Subscription + last-value buffer for the async poller.
  if (lhs.isSubscribable && rhs.isAsyncPollingProxy) {
    const subscribableLhs = lhs as SubscribableTransferInterface<T>;
    const asyncPollerRhs = rhs as AsyncPollingProxyTransferInterface<T>;

    let lastValue: T | undefined = undefined;

    const sub = subscribableLhs.subscribe((data) => {
      lastValue = data;
    });

    asyncPollerRhs.setAsyncFetcher(async () => {
      const value = lastValue;
      lastValue = undefined;
      return value;
    });

    return new Subscriber(() => {
      sub.unsubscribe();
      asyncPollerRhs.clearAsyncFetcher();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ERRORS
  // ═══════════════════════════════════════════════════════════════

  // CASE 8: asyncPullable → sync-pollingProxy — impossible
  // Sync poller calls fetcher() synchronously and cannot await.
  if (lhs.isAsyncPullable && rhs.isPollingProxy) {
    throw new Error(
      "Cannot link AsyncPullable source to sync PollingProxy. Use AsyncPollingProxyTransfer."
    );
  }

  // CASE 9: pullable/asyncPullable → pushable/asyncPushable — needs a trigger
  if ((lhs.isPullable || lhs.isAsyncPullable) && (rhs.isPushable || rhs.isAsyncPushable)) {
    throw new Error(
      "Cannot directly link Pullable/AsyncPullable source to Pushable/AsyncPushable target. Use a Bridge or Triggerable adapter to pull and push data."
    );
  }

  // CASE 10: Incompatible or unfeasible configuration
  throw new Error(
    `Unsupported transfer link combination: LHS(subscribable:${lhs.isSubscribable}, pullable:${lhs.isPullable}, asyncPullable:${lhs.isAsyncPullable}) -> RHS(pushable:${rhs.isPushable}, asyncPushable:${rhs.isAsyncPushable}, poller:${rhs.isPollingProxy}, asyncPoller:${rhs.isAsyncPollingProxy})`
  );
}

/**
 * Universal error handler.
 * If onError is provided — calls it and suppresses the exception.
 * If onError is not provided — rethrows the exception.
 */
export function handleError<TSource>(error: unknown, source: TSource, onError?: ErrorHandler<TSource>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (onError !== undefined) {
    onError(err, source);
  } else {
    throw err;
  }
}
