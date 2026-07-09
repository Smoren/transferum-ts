import {
  PushChannelTransfer,
  GateTransfer,
  ManualFlowTransfer,
  PollingProxyTransfer,
  SinkTransfer,
  PushStoredChannelTransfer,
  ReadTransfer,
  UniversalCompositeTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';
import { LatestStorage } from "../../src";

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer
// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer — a universal composite transfer,
// combining input and output transfers into a single interface.
//
// Key features:
// - Automatic extraction of triggerable/gate from input/output
// - Explicit override of triggerable/gate via config
// - Delegation of input/output methods
// - Capability check via flags before calling methods
// - Cleanup of owned resources on destroy()
//
// IMPORTANT: UniversalCompositeTransfer does NOT link input and output automatically.
// It only provides a single interface to two independent transfers.
// To link data between input and output, use linkTransfers() or
// use a single duplex transfer for both.

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Constructor & Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer has correct capability flags from duplex transfer test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      // Using a single duplex transfer for input and output
      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      // Flags from the duplex transfer
      expect(composite.isInput).toBe(true);
      expect(composite.isOutput).toBe(true);
      expect(composite.isDuplex).toBe(true);
      expect(composite.isPushable).toBe(true);
      expect(composite.isPullable).toBe(true);
      expect(composite.isSubscribable).toBe(true);

      // Triggerable extracted (PushStoredChannel has isTriggerable)
      expect(composite.isTriggerable).toBe(true);

      // Not a gate
      expect(composite.isGate).toBe(false);

      // Not a poller
      expect(composite.isPollingSource).toBe(false);
      expect(composite.isPollingProxy).toBe(false);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer extracts gate from duplex transfer test',
  () => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: true });

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      // Gate extracted
      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer isDuplex computed correctly test',
  () => {
    it('', () => {
      const transfer = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      expect(composite.isInput).toBe(true);
      expect(composite.isOutput).toBe(true);
      expect(composite.isDuplex).toBe(true);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Push & Subscribe (Basic Delegation)
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushSubscribe(),
] as Array<[number]>)(
  'UniversalCompositeTransfer push delegates to input test',
  (value: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: number[] = [];
      composite.subscribe((data) => received.push(data));

      composite.push(value);

      expect(received).toEqual([value]);

      composite.destroy();
    });
  },
);

/**
 * Data provider for testing push/subscribe.
 */
function dataProviderForPushSubscribe(): Array<unknown> {
  return [
    [1],
    [42],
    [-5],
    [0],
  ];
}

describe.each([
  ...dataProviderForMultipleValues(),
] as Array<[number, number, number]>)(
  'UniversalCompositeTransfer forwards multiple values test',
  (v1: number, v2: number, v3: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: number[] = [];
      composite.subscribe((data) => received.push(data));

      composite.push(v1);
      composite.push(v2);
      composite.push(v3);

      expect(received).toEqual([v1, v2, v3]);

      composite.destroy();
    });
  },
);

/**
 * Data provider for testing multiple values.
 */
function dataProviderForMultipleValues(): Array<unknown> {
  return [
    [1, 2, 3],
    [10, 20, 30],
  ];
}

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Gate Extraction & Control
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForGateFromTransfer(),
] as Array<[number, number]>)(
  'UniversalCompositeTransfer extracts gate from transfer test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: true });

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: number[] = [];
      composite.subscribe((data) => received.push(data));

      // Gate is active — data passes
      composite.push(value1);
      expect(received).toEqual([value1]);

      // Deactivate gate
      composite.deactivate();
      expect(composite.active).toBe(false);

      // Gate is not active — data is blocked
      composite.push(value2);
      expect(received).toEqual([value1]); // Second value did not pass

      composite.destroy();
    });
  },
);

/**
 * Data provider for testing gate from transfer.
 */
function dataProviderForGateFromTransfer(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

describe.each([
  ...dataProviderForExplicitGate(),
] as Array<[number, number]>)(
  'UniversalCompositeTransfer uses explicit gate from config test',
  (value1: number, value2: number) => {
    it('', () => {
      const explicitGate = new GateTransfer<number>({ activated: true });

      const composite = new UniversalCompositeTransfer({
        input: explicitGate,
        output: explicitGate,
        gate: explicitGate, // Explicitly specify gate
      });

      const received: number[] = [];
      composite.subscribe((data) => received.push(data));

      // Explicit gate is active — data passes
      composite.push(value1);
      expect(received).toEqual([value1]);

      // Deactivate explicit gate
      composite.deactivate();
      expect(composite.active).toBe(false);

      // Gate is not active — data is blocked
      composite.push(value2);
      expect(received).toEqual([value1]);

      composite.destroy();
    });
  },
);

/**
 * Data provider for testing explicit gate.
 */
function dataProviderForExplicitGate(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

describe(
  'UniversalCompositeTransfer explicit gate has priority over input/output test',
  () => {
    it('', () => {
      const input = new GateTransfer<number>({ activated: false });
      const output = new GateTransfer<number>({ activated: false });
      const explicitGate = new GateTransfer<number>({ activated: true });

      const composite = new UniversalCompositeTransfer({
        input,
        output,
        gate: explicitGate, // Explicit gate takes priority
      });

      // Explicit gate is active, despite input/output being inactive
      expect(composite.active).toBe(true);

      composite.destroy();
    });
  },
);

describe.each([
  ...dataProviderForToggle(),
] as Array<[boolean, boolean]>)(
  'UniversalCompositeTransfer toggle switches gate state test',
  (initialState: boolean, expectedAfterToggle: boolean) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: initialState });

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const result = composite.toggle();

      expect(result).toBe(expectedAfterToggle);
      expect(composite.active).toBe(expectedAfterToggle);

      composite.destroy();
    });
  },
);

/**
 * Data provider for testing toggle.
 */
function dataProviderForToggle(): Array<unknown> {
  return [
    [true, false],
    [false, true],
  ];
}

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Triggerable Extraction & Control
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForTriggerableFromTransfer(),
] as Array<[number]>)(
  'UniversalCompositeTransfer extracts triggerable from transfer test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualFlowTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: number[] = [];
      composite.subscribe((data) => received.push(data));

      // push() without trigger() does not send data
      composite.push(value);
      expect(received).toEqual([]);

      // trigger() sends data
      composite.trigger();
      expect(received).toEqual([value]);

      composite.destroy();
    });
  },
);

/**
 * Data provider for testing triggerable from transfer.
 */
function dataProviderForTriggerableFromTransfer(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForExplicitTriggerable(),
] as Array<[number]>)(
  'UniversalCompositeTransfer uses explicit triggerable from config test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualFlowTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
        triggerable: transfer, // Explicitly specify triggerable (though it will be extracted automatically)
      });

      const received: number[] = [];
      composite.subscribe((data) => received.push(data));

      // push() writes data
      composite.push(value);

      // But without trigger(), data is not sent
      expect(received).toEqual([]);

      // trigger() sends data via explicit triggerable
      composite.trigger();
      expect(received).toEqual([value]);

      composite.destroy();
    });
  },
);

/**
 * Data provider for testing explicit triggerable.
 */
function dataProviderForExplicitTriggerable(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'UniversalCompositeTransfer explicit triggerable has priority test',
  () => {
    it('', () => {
      const input = new ManualFlowTransfer<number>();
      const output = new ManualFlowTransfer<number>();
      const explicitTriggerable = new PushStoredChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
        triggerable: explicitTriggerable, // Explicit triggerable
      });

      const received: number[] = [];
      explicitTriggerable.subscribe((data) => received.push(data));

      // push() writes to input
      composite.push(42);

      // Explicit triggerable is not linked to input/output automatically
      expect(received).toEqual([]);

      composite.trigger();
      // Triggerable has no data, because it is not linked to input
      expect(received).toEqual([]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Polling Support
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer setFetcher delegates to input test',
  () => {
    it('', () => {
      const input = new PollingProxyTransfer<number>({ interval: 100, activated: false });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      const fetcher = jest.fn(() => 42);
      composite.setFetcher(fetcher);

      // Fetcher set in input
      expect(fetcher).not.toHaveBeenCalled(); // Not yet called

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer clearFetcher delegates to input test',
  () => {
    it('', () => {
      const input = new PollingProxyTransfer<number>({ interval: 100, activated: false });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      composite.setFetcher(() => 42);
      composite.clearFetcher();

      // After clearFetcher, polling is stopped
      expect(composite.isPollingProxy).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on setFetcher if not poller test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.setFetcher(() => 42)).toThrow(
        'Cannot set fetcher to non-pollable transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on clearFetcher if not poller test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.clearFetcher()).toThrow(
        'Cannot clear fetcher of non-pollable transfer'
      );

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Error Handling (Missing Capabilities)
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer throws on trigger if not triggerable test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.trigger()).toThrow(
        'Cannot trigger on non-triggerable transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on active if not gate test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.active).toThrow(
        'Cannot check active state of non-gate transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on activate if not gate test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.activate()).toThrow(
        'Cannot activate non-gate transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on deactivate if not gate test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.deactivate()).toThrow(
        'Cannot deactivate non-gate transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on toggle if not gate test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.toggle()).toThrow(
        'Cannot toggle non-gate transfer'
      );

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Destroy & Owned Resources
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForDestroyOwned(),
] as Array<[number]>)(
  'UniversalCompositeTransfer destroy cleans up owned resources test',
  (value: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();

      const ownedResource = { destroy: destroySpy };

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
        owned: [ownedResource],
      });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);

      // After destroy(), the owned array is cleared
      // @ts-expect-error — checking a private field
      expect(composite._owned).toEqual([]);
    });
  },
);

/**
 * Data provider for testing destroy.
 */
function dataProviderForDestroyOwned(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'UniversalCompositeTransfer destroy clears owned array test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();
      const ownedResource = { destroy: jest.fn() };

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
        owned: [ownedResource],
      });

      composite.destroy();

      // owned array is cleared
      // @ts-expect-error — checking a private field
      expect(composite._owned).toEqual([]);
    });
  },
);

describe(
  'UniversalCompositeTransfer multiple destroy calls are safe test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
        owned: [],
      });

      expect(() => {
        composite.destroy();
        composite.destroy();
        composite.destroy();
      }).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer gate + triggerable integration test',
  () => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: true });

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: number[] = [];
      composite.subscribe((data) => received.push(data));

      // Gate is active, but trigger() is needed (ManualFlow has triggerable)
      // But GateTransfer does not have isTriggerable, so trigger() will throw
      expect(() => composite.trigger()).toThrow(
        'Cannot trigger on non-triggerable transfer'
      );

      // But push with subscription works
      composite.push(1);
      expect(received).toEqual([1]);

      // Deactivate gate
      composite.deactivate();

      // Data is blocked by gate
      composite.push(2);
      expect(received).toEqual([1]); // 2 did not pass

      // Activate gate
      composite.activate();

      // Works again
      composite.push(3);
      expect(received).toEqual([1, 3]);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer complex pipeline scenario test',
  () => {
    it('', () => {
      // Create a chain: input -> composite -> sink
      const transfer = new PushStoredChannelTransfer<number>();
      const sinkData: number[] = [];
      const sink = new SinkTransfer<number>({ callback: (n) => sinkData.push(n) });

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
        owned: [transfer],
      });

      // Subscribe sink to composite output
      composite.subscribe((data) => sink.push(data));

      composite.push(1);
      composite.push(2);
      composite.push(3);

      expect(sinkData).toEqual([1, 2, 3]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer Edge Cases
// ═══════════════════════════════════════════════════════════════

describe(
  'UniversalCompositeTransfer handles undefined value test',
  () => {
    it('', () => {
      const transfer = new PushChannelTransfer<number | undefined>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: (number | undefined)[] = [];
      composite.subscribe((data) => received.push(data));

      composite.push(undefined);

      // SubscriptionManager ignores undefined
      expect(received).toEqual([]);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer handles null value test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<null>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: null[] = [];
      composite.subscribe((data) => { if (data !== undefined) received.push(data); });

      composite.push(null);

      expect(received).toEqual([null]);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer handles object value test',
  () => {
    it('', () => {
      type Obj = { id: number; name: string };

      const transfer = new PushStoredChannelTransfer<Obj>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: Obj[] = [];
      composite.subscribe((data) => { if (data !== undefined) received.push(data); });

      const obj = { id: 1, name: 'test' };
      composite.push(obj);

      expect(received).toEqual([obj]);
      expect(received[0]).toBe(obj); // Same reference (no cloning)

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeSubscriber unsubscribe stops notifications test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      const received: number[] = [];
      const subscriber = composite.subscribe((data) => received.push(data));

      composite.push(1);
      expect(received).toEqual([1]);

      subscriber.unsubscribe();

      composite.push(2);
      expect(received).toEqual([1]); // 2 not received

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on push if not pushable test',
  () => {
    it('', () => {
      // Create a non-pushable input
      const input = new PollingProxyTransfer<number>({ interval: 100, activated: false });
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.push(42)).toThrow(
        'Cannot push to non-pushable transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on pull if not pullable test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.pull()).toThrow(
        'Cannot pull from non-pullable transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer throws on subscribe if not subscribable test',
  () => {
    it('', () => {
      // Using a transfer without subscribable — ReadTransfer is pullable only
      const storage = new LatestStorage<number>();
      const output = new ReadTransfer<number>({ flow: storage });
      const input = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer<number, number>({
        input,
        output,
      });

      expect(() => composite.subscribe(jest.fn())).toThrow(
        'Cannot subscribe on non-subscribable transfer'
      );

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer pull delegates to output test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      composite.push(42);
      const value = composite.pull();

      expect(value).toBe(42);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer pull returns undefined after pop test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input: transfer,
        output: transfer,
      });

      composite.push(42);
      composite.pull(); // Extract

      // PushStoredChannel does not clear on pull, so it is still available
      const value = composite.pull();
      expect(value).toBe(42);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer onStateChange()
// ═══════════════════════════════════════════════════════════════
// UniversalCompositeTransfer delegates onStateChange to the internal _gate
// (GateTransfer), so the subscriber receives GateTransfer, not composite.

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'UniversalCompositeTransfer onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: initialState });
      const composite = new UniversalCompositeTransfer({
        input: gate,
        output: gate,
        owned: [gate],
      });
      const handler = jest.fn();

      composite.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      composite.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(gate);

      composite.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(gate);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      const composite = new UniversalCompositeTransfer({
        input: gate,
        output: gate,
        owned: [gate],
      });
      const handler = jest.fn();

      composite.onStateChange(handler);
      composite.toggle();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(gate);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      const composite = new UniversalCompositeTransfer({
        input: gate,
        output: gate,
        owned: [gate],
      });
      const handler = jest.fn();

      const subscriber = composite.onStateChange(handler);
      composite.activate();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      composite.deactivate();
      expect(handler).toHaveBeenCalledTimes(1);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      const composite = new UniversalCompositeTransfer({
        input: gate,
        output: gate,
        owned: [gate],
      });
      let receivedGate: any = null;

      composite.onStateChange((g) => { receivedGate = g; });
      composite.activate();

      expect(receivedGate).toBe(gate);
      expect(receivedGate.active).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'UniversalCompositeTransfer onStateChange throws if not gate test',
  () => {
    it('', () => {
      const input = new PushChannelTransfer<number>();
      const output = new PushChannelTransfer<number>();

      const composite = new UniversalCompositeTransfer({
        input,
        output,
      });

      expect(() => composite.onStateChange(jest.fn())).toThrow(
        'Cannot subscribe to state of non-gate transfer'
      );

      composite.destroy();
    });
  },
);

