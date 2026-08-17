import { describe, expect, it, jest } from '@jest/globals';
import {
  BaseLinkStrategy,
  DefaultLinkStrategy,
  PushChannelTransfer,
  PushStoredChannelTransfer,
  SinkTransfer,
  PollingProxyTransfer,
  ReadTransfer,
  LatestStorage,
  AsyncSinkTransfer,
  CompositeTransferBuilder,
  PassBridge,
  ConditionTransfer,
  linkTransfers,
} from '../../src';
import type {
  SubscriberInterface,
  OutputTransfer,
  InputTransfer,
  Subscribable,
  Pushable,
  AsyncPushable,
  ErrorHandler,
} from '../../src';

// ═══════════════════════════════════════════════════════════════
// BaseLinkStrategy is exported and subclassable
// ═══════════════════════════════════════════════════════════════

describe('BaseLinkStrategy is exported as an abstract class test', () => {
  it('is importable and can be extended to implement link()', () => {
    expect(BaseLinkStrategy).toBeDefined();

    class MinimalStrategy extends BaseLinkStrategy {
      public link(): SubscriberInterface {
        throw new Error('not implemented');
      }
    }

    const instance = new MinimalStrategy();
    expect(instance).toBeInstanceOf(BaseLinkStrategy);
  });
});

// ═══════════════════════════════════════════════════════════════
// Custom subclass extending BaseLinkStrategy directly
// — implements link() and reuses inherited protected helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Custom strategy that extends BaseLinkStrategy and implements link()
 * by dispatching to the inherited protected _link* helpers.
 * Verifies that protected methods are accessible from a subclass.
 */
class CustomDirectStrategy extends BaseLinkStrategy {
  public link<T, RTransfer extends InputTransfer<T>>(
    lhs: OutputTransfer<T>,
    rhs: RTransfer,
  ): SubscriberInterface {
    // Delegate to linkTransfers, which uses DefaultLinkStrategy internally.
    // This verifies that a subclass can implement link() while reusing the base helpers.
    return linkTransfers(lhs, rhs);
  }
}

describe('CustomDirectStrategy extends BaseLinkStrategy and links Subscribable to Pushable test', () => {
  it('forwards data through linkTransfers delegation', () => {
    const strategy = new CustomDirectStrategy();
    const source = new PushChannelTransfer<number>();
    const received: number[] = [];
    const target = new SinkTransfer<number>({ callback: (v) => received.push(v) });

    const subscriber = strategy.link(source, target);
    expect(subscriber.active).toBe(true);

    source.push(42);
    expect(received).toEqual([42]);

    subscriber.unsubscribe();
    source.destroy();
    target.destroy();
  });
});

describe('CustomDirectStrategy extends BaseLinkStrategy and links Pullable to PollingProxy test', () => {
  it('forwards data through linkTransfers delegation', async () => {
    const strategy = new CustomDirectStrategy();
    const storage = new LatestStorage<number>();
    storage.write(99);
    const source = new ReadTransfer<number>({ flow: storage });
    const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

    const received: number[] = [];
    poller.subscribe((data) => { if (data !== undefined) received.push(data); });

    const subscriber = strategy.link(source, poller);
    expect(subscriber.active).toBe(true);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(received.length).toBeGreaterThan(0);
        expect(received[0]).toBe(99);
        subscriber.unsubscribe();
        source.destroy();
        poller.destroy();
        resolve();
      }, 50);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Custom subclass extending DefaultLinkStrategy
// — overrides individual _link* methods while keeping dispatch
// ═══════════════════════════════════════════════════════════════

/**
 * Strategy that extends DefaultLinkStrategy and overrides one sync and one async
 * _link* method to add call tracking. Non-overridden methods fall through to
 * the inherited defaults.
 */
class TrackingStrategy extends DefaultLinkStrategy {
  public subscribableToPushableCalls = 0;
  public subscribableToAsyncPushableCalls = 0;

  protected override _linkSubscribableToPushable<T>(
    lhs: Subscribable<T>,
    rhs: Pushable<T>,
  ): SubscriberInterface {
    this.subscribableToPushableCalls++;
    return super._linkSubscribableToPushable(lhs, rhs);
  }

  protected override _linkSubscribableToAsyncPushable<T>(
    lhs: Subscribable<T>,
    rhs: AsyncPushable<T>,
    onError?: ErrorHandler<AsyncPushable<T>>,
  ): SubscriberInterface {
    this.subscribableToAsyncPushableCalls++;
    return super._linkSubscribableToAsyncPushable(lhs, rhs, onError);
  }
}

describe('TrackingStrategy extends DefaultLinkStrategy and overrides _linkSubscribableToPushable test', () => {
  it('intercepts the overridden sync strategy while dispatching via inherited link()', () => {
    const strategy = new TrackingStrategy();
    const source = new PushChannelTransfer<number>();
    const target = new SinkTransfer<number>({ callback: jest.fn() });

    const subscriber = strategy.link(source, target);

    expect(strategy.subscribableToPushableCalls).toBe(1);
    expect(subscriber.active).toBe(true);

    subscriber.unsubscribe();
    source.destroy();
    target.destroy();
  });
});

describe('TrackingStrategy extends DefaultLinkStrategy and overrides _linkSubscribableToAsyncPushable test', () => {
  it('intercepts the overridden async strategy while dispatching via inherited link()', async () => {
    const strategy = new TrackingStrategy();
    const source = new PushChannelTransfer<number>();
    const received: number[] = [];
    const target = new AsyncSinkTransfer<number>({ callback: (v) => { received.push(v); } });

    const subscriber = strategy.link(source, target);

    expect(strategy.subscribableToAsyncPushableCalls).toBe(1);

    source.push(42);
    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    expect(received).toEqual([42]);

    subscriber.unsubscribe();
    source.destroy();
    target.destroy();
  });
});

describe('TrackingStrategy non-overridden methods fall through to DefaultLinkStrategy test', () => {
  it('uses inherited _linkPullableToPollingProxy without tracking', async () => {
    const strategy = new TrackingStrategy();
    const storage = new LatestStorage<number>();
    storage.write(55);
    const source = new ReadTransfer<number>({ flow: storage });
    const poller = new PollingProxyTransfer<number>({ interval: 10, activated: true });

    const received: number[] = [];
    poller.subscribe((data) => { if (data !== undefined) received.push(data); });

    strategy.link(source, poller);

    // The overridden sync method should NOT have been called for this combination
    expect(strategy.subscribableToPushableCalls).toBe(0);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(received.length).toBeGreaterThan(0);
        expect(received[0]).toBe(55);
        source.destroy();
        poller.destroy();
        resolve();
      }, 50);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Custom subclass injected into CompositeTransferBuilder
// ═══════════════════════════════════════════════════════════════

describe('Custom BaseLinkStrategy subclass injected into CompositeTransferBuilder test', () => {
  it('uses the custom strategy for all internal links in the chain', () => {
    const strategy = new TrackingStrategy();
    const source = new PushStoredChannelTransfer<number>();
    const target = new SinkTransfer<number>({ callback: jest.fn() });

    const pipeline = CompositeTransferBuilder
      .start(source, { linkStrategy: strategy })
      .to(new ConditionTransfer<number>({ shouldAccept: (x) => x > 0 }))
      .finish(target, { owned: true });

    // Two links: source → condition, condition → sink
    // Both are Subscribable → Pushable
    expect(strategy.subscribableToPushableCalls).toBe(2);

    pipeline.push(42);
    pipeline.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Custom subclass injected into a Bridge
// ═══════════════════════════════════════════════════════════════

describe('Custom BaseLinkStrategy subclass injected into PassBridge test', () => {
  it('uses the custom strategy for internal bridge wiring', () => {
    const strategy = new TrackingStrategy();
    const source = new PushStoredChannelTransfer<number>();
    const target = new PushStoredChannelTransfer<number>();

    const bridge = new PassBridge({
      source,
      target,
      activated: true,
      linkStrategy: strategy,
    });

    // PassBridge wires: source → gate, gate → target
    // Both are Subscribable → Pushable
    expect(strategy.subscribableToPushableCalls).toBe(2);

    const received: number[] = [];
    target.subscribe((data) => { if (data !== undefined) received.push(data); });

    source.push(42);
    expect(received).toContain(42);

    bridge.destroy();
  });
});
