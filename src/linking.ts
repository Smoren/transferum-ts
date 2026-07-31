import type {
  CommunicationContractInterface,
  LinkStrategyInterface,
  SubscriberInterface,
} from "./interfaces";
import type {
  AsyncPollingProxy,
  AsyncPullable,
  AsyncPushable,
  InputTransfer,
  OutputTransfer,
  PollingProxy,
  Pullable,
  Pushable,
  Subscribable,
  ErrorHandler,
} from "./types";
import type { LinkConfig } from "./configs";
import { Subscriber } from "./helpers";
import { handleError } from "./utils";

/**
 * Abstract base class for link strategies.
 *
 * Provides protected helper methods for each linking strategy (sync and async)
 * and error helpers. Custom strategies can extend this class and override
 * only the strategies they need to customize, reusing the rest.
 *
 * Subclasses must implement {@link LinkStrategyInterface.link}.
 *
 * @category Linking
 */
abstract class BaseLinkingStrategy implements LinkStrategyInterface {
  public abstract link<T, RTransfer extends InputTransfer<T>>(
    lhs: OutputTransfer<T>,
    rhs: RTransfer,
    options?: LinkConfig<RTransfer>,
  ): SubscriberInterface;

  protected _linkSubscribableToPushable<T>(lhs: Subscribable<T>, rhs: Pushable<T>): SubscriberInterface {
    return lhs.subscribe((data) => rhs.push(data));
  }

  protected _linkPullableToPollingProxy<T>(lhs: Pullable<T>, rhs: PollingProxy<T>): SubscriberInterface {
    rhs.setFetcher(() => lhs.pull());
    return new Subscriber(() => {
      rhs.clearFetcher();
    });
  }

  protected _linkSubscribableToPollingProxy<T>(lhs: Subscribable<T>, rhs: PollingProxy<T>): SubscriberInterface {
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

  protected _linkSubscribableToAsyncPushable<T>(
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

  protected _linkAsyncPullableToAsyncPollingProxy<T>(lhs: AsyncPullable<T>, rhs: AsyncPollingProxy<T>): SubscriberInterface {
    rhs.setAsyncFetcher(() => lhs.asyncPull());
    return new Subscriber(() => {
      rhs.clearAsyncFetcher();
    });
  }

  protected _linkPullableToAsyncPollingProxy<T>(lhs: Pullable<T>, rhs: AsyncPollingProxy<T>): SubscriberInterface {
    rhs.setAsyncFetcher(async () => lhs.pull());
    return new Subscriber(() => {
      rhs.clearAsyncFetcher();
    });
  }

  protected _linkSubscribableToAsyncPollingProxy<T>(lhs: Subscribable<T>, rhs: AsyncPollingProxy<T>): SubscriberInterface {
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

  protected _throwLinkUnsupportedError(
    lhs: CommunicationContractInterface,
    rhs: CommunicationContractInterface,
  ): never {
    throw new Error(
      `Unsupported transfer link combination: LHS(subscribable:${lhs.isSubscribable}, pullable:${lhs.isPullable}, asyncPullable:${lhs.isAsyncPullable}) -> RHS(pushable:${rhs.isPushable}, asyncPushable:${rhs.isAsyncPushable}, poller:${rhs.isPollingProxy}, asyncPoller:${rhs.isAsyncPollingProxy})`,
    );
  }
}

/**
 * Default implementation of {@link LinkStrategyInterface}.
 *
 * Extends {@link BaseLinkingStrategy} and implements {@link link} with
 * standard capability-based dispatch: inspects flags on both transfers
 * and selects the matching sync or async linking strategy.
 *
 * @example
 * ```typescript
 * const linkStrategy = new DefaultLinkStrategy();
 * const subscriber = linkStrategy.link(source, target);
 * ```
 *
 * @category Linking
 */
export class DefaultLinkStrategy extends BaseLinkingStrategy {
  /**
   * Links an output transfer to an input transfer.
   *
   * The strategy is determined by capability flags. Sync strategies take
   * priority over async ones. See {@link linkTransfers} for the full
   * strategy matrix.
   *
   * @typeParam T — data type flowing through the link
   * @typeParam RTransfer — type of the input transfer (RHS)
   * @param lhs — output transfer (source)
   * @param rhs — input transfer (sink)
   * @param options — optional link config (onError for async-push rejection)
   * @returns SubscriberInterface for breaking the link
   */
  public link<T, RTransfer extends InputTransfer<T>>(
    lhs: OutputTransfer<T>,
    rhs: RTransfer,
    options?: LinkConfig<RTransfer>,
  ): SubscriberInterface {
    // ═══════════════════════════════════════════════════════════════
    // SYNC CASES (priority)
    // ═══════════════════════════════════════════════════════════════

    // CASE 1: Reactive Push (LHS streams data -> RHS accepts data)
    if (lhs.isSubscribable && rhs.isPushable) {
      return this._linkSubscribableToPushable(lhs as Subscribable<T>, rhs as Pushable<T>);
    }

    // CASE 2: Active Polling on the input side (RHS pulls data itself)
    if (lhs.isPullable && rhs.isPollingProxy) {
      return this._linkPullableToPollingProxy(lhs as Pullable<T>, rhs as PollingProxy<T>);
    }

    // CASE 3: Subscription + last-value buffer for the poller
    if (lhs.isSubscribable && rhs.isPollingProxy) {
      return this._linkSubscribableToPollingProxy(lhs as Subscribable<T>, rhs as PollingProxy<T>);
    }

    // ═══════════════════════════════════════════════════════════════
    // ASYNC CASES (applied only when sync is not applicable)
    // ═══════════════════════════════════════════════════════════════

    // CASE 4: subscribable → asyncPushable
    // Reactive subscription + async-push with rejection handling.
    // No ordering guarantees: fast sync notifications can overtake
    // pending asyncPush calls.
    if (lhs.isSubscribable && rhs.isAsyncPushable) {
      return this._linkSubscribableToAsyncPushable(
        lhs as Subscribable<T>,
        rhs as AsyncPushable<T>,
        options?.onError as ErrorHandler<AsyncPushable<T>>,
      );
    }

    // CASE 5: asyncPullable → asyncPollingProxy
    // Active polling: RHS pulls data via asyncPull.
    if (lhs.isAsyncPullable && rhs.isAsyncPollingProxy) {
      return this._linkAsyncPullableToAsyncPollingProxy(lhs as AsyncPullable<T>, rhs as AsyncPollingProxy<T>);
    }

    // CASE 6: pullable → asyncPollingProxy
    // Sync-pull wrapped in an async fetcher for the async poller.
    if (lhs.isPullable && rhs.isAsyncPollingProxy) {
      return this._linkPullableToAsyncPollingProxy(lhs as Pullable<T>, rhs as AsyncPollingProxy<T>);
    }

    // CASE 7: subscribable → asyncPollingProxy
    // Subscription + last-value buffer for the async poller.
    if (lhs.isSubscribable && rhs.isAsyncPollingProxy) {
      return this._linkSubscribableToAsyncPollingProxy(lhs as Subscribable<T>, rhs as AsyncPollingProxy<T>);
    }

    // ═══════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════

    // CASE 8: asyncPullable → sync-pollingProxy — impossible
    // Sync poller calls fetcher() synchronously and cannot await.
    if (lhs.isAsyncPullable && rhs.isPollingProxy) {
      this._throwLinkAsyncPullableToPollingProxyError();
    }

    // CASE 9: pullable/asyncPullable → pushable/asyncPushable — needs a trigger
    if ((lhs.isPullable || lhs.isAsyncPullable) && (rhs.isPushable || rhs.isAsyncPushable)) {
      this._throwLinkPullableToPushableError();
    }

    // CASE 10: Incompatible or unfeasible configuration
    this._throwLinkUnsupportedError(lhs, rhs);
  }

  /**
   * Throws an error for an unsupported asyncPullable → sync-pollingProxy link.
   *
   * @category Linking
   */
  protected _throwLinkAsyncPullableToPollingProxyError(): never {
    throw new Error(
      "Cannot link AsyncPullable source to sync PollingProxy. Use AsyncPollingProxyTransfer.",
    );
  }

  /**
   * Throws an error for an unsupported pullable/asyncPullable → pushable/asyncPushable link.
   *
   * @category Linking
   */
  protected _throwLinkPullableToPushableError(): never {
    throw new Error(
      "Cannot directly link Pullable/AsyncPullable source to Pushable/AsyncPushable target. Use a Bridge or Triggerable adapter to pull and push data.",
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Link Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Links an output transfer (LHS) to an input transfer (RHS).
 *
 * Delegates to {@link DefaultLinkStrategy.link}. The strategy is determined
 * by capability flags. Sync operations take priority: if both transfers
 * support sync linking, it is used. Async strategies are applied only when
 * sync is not applicable.
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
 * @category Linking
 */
export function linkTransfers<T, RTransfer extends InputTransfer<T>>(
  lhs: OutputTransfer<T>,
  rhs: RTransfer,
  options?: LinkConfig<RTransfer>,
): SubscriberInterface {
  return (new DefaultLinkStrategy()).link(lhs, rhs, options);
}
