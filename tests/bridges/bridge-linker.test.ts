import type {
  LinkStrategyInterface,
  SubscriberInterface,
} from '../../src';
import {
  PassBridge,
  TransformBridge,
  TransferBridge,
  AsyncTransformBridge,
  PushStoredChannelTransfer,
  MapOperator,
  AsyncMapOperator,
  linkTransfers,
} from '../../src';
import { describe, expect, it } from '@jest/globals';

/**
 * Custom linker that wraps linkTransfers and records every call.
 * Used to verify that bridges delegate to the injected linker.
 */
class TrackingLinker implements LinkStrategyInterface {
  public calls: Array<{ lhs: string; rhs: string }> = [];

  link<RTransfer extends { constructor: { name: string } }>(
    lhs: { constructor: { name: string } },
    rhs: RTransfer,
  ): SubscriberInterface {
    this.calls.push({ lhs: lhs.constructor.name, rhs: rhs.constructor.name });
    return linkTransfers(
      lhs as Parameters<typeof linkTransfers>[0],
      rhs as unknown as Parameters<typeof linkTransfers>[1],
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PassBridge with linker
// ═══════════════════════════════════════════════════════════════

describe('PassBridge with custom linker', () => {
  it('uses linker.link() for internal wiring', () => {
    const source = new PushStoredChannelTransfer<number>();
    const target = new PushStoredChannelTransfer<number>();
    const linker = new TrackingLinker();

    const bridge = new PassBridge({
      source,
      target,
      activated: true,
      linkStrategy: linker,
    });

    // PassBridge wires: source → gate, gate → target
    expect(linker.calls).toHaveLength(2);

    const received: number[] = [];
    target.subscribe((data) => { if (data !== undefined) received.push(data); });

    source.push(42);
    expect(received).toContain(42);

    bridge.destroy();
  });

  it('works without linker (backward compatible)', () => {
    const source = new PushStoredChannelTransfer<number>();
    const target = new PushStoredChannelTransfer<number>();

    const bridge = new PassBridge({
      source,
      target,
      activated: true,
    });

    const received: number[] = [];
    target.subscribe((data) => { if (data !== undefined) received.push(data); });

    source.push(42);
    expect(received).toContain(42);

    bridge.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// TransformBridge with linker
// ═══════════════════════════════════════════════════════════════

describe('TransformBridge with custom linker', () => {
  it('uses linker.link() for internal wiring', () => {
    const source = new PushStoredChannelTransfer<number>();
    const target = new PushStoredChannelTransfer<string>();
    const linker = new TrackingLinker();

    const bridge = new TransformBridge({
      source,
      target,
      operator: new MapOperator<number, string>((n) => n.toString()),
      activated: true,
      linkStrategy: linker,
    });

    // TransformBridge wires: source → gate, gate → converter, converter → target
    expect(linker.calls).toHaveLength(3);

    const received: string[] = [];
    target.subscribe((data) => { if (data !== undefined) received.push(data); });

    source.push(42);
    expect(received).toContain('42');

    bridge.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// TransferBridge with linker
// ═══════════════════════════════════════════════════════════════

describe('TransferBridge with custom linker', () => {
  it('uses linker.link() for internal wiring', () => {
    const source = new PushStoredChannelTransfer<number>();
    const target = new PushStoredChannelTransfer<number>();
    const middle = new PushStoredChannelTransfer<number>();
    const linker = new TrackingLinker();

    const bridge = new TransferBridge({
      source,
      target,
      middle,
      middleOwned: false,
      activated: true,
      linkStrategy: linker,
    });

    // TransferBridge wires: source → gate, gate → middle, middle → target
    expect(linker.calls).toHaveLength(3);

    const received: number[] = [];
    target.subscribe((data) => { if (data !== undefined) received.push(data); });

    source.push(42);
    expect(received).toContain(42);

    bridge.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// AsyncTransformBridge with linker
// ═══════════════════════════════════════════════════════════════

describe('AsyncTransformBridge with custom linker', () => {
  it('uses linker.link() for internal wiring', async () => {
    const source = new PushStoredChannelTransfer<number>();
    const target = new PushStoredChannelTransfer<string>();
    const linker = new TrackingLinker();

    const bridge = new AsyncTransformBridge({
      source,
      target,
      operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
      activated: true,
      linkStrategy: linker,
    });

    // AsyncTransformBridge wires: source → gate, gate → converter, converter → target
    expect(linker.calls).toHaveLength(3);

    const received: string[] = [];
    target.subscribe((data) => { if (data !== undefined) received.push(data); });

    source.push(42);
    // Allow async operation to complete
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(received).toContain('42');

    bridge.destroy();
  });
});
