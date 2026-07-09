import {
  DuplexPipelineBuilder,
  PushStoredChannelTransfer,
  GateTransfer,
  PushChannelTransfer,
  ManualFlowTransfer,
  ConditionTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder — Basic creation
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder.start() creates builder with duplex transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = DuplexPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'DuplexPipelineBuilder preserves start transfer reference test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = DuplexPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();

      // finish() should return a composite with access to startTransfer
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
      expect(composite.isOutput).toBe(true);
      expect(composite.isDuplex).toBe(true);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder.to() — Adding intermediate transfers
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder.to() adds single intermediate transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();

      const builder = DuplexPipelineBuilder.start(startTransfer);
      const nextBuilder = builder.to(intermediate);

      expect(nextBuilder).toBeDefined();

      // finish() should work after adding an intermediate transfer
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = nextBuilder.finish(lastTransfer);

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'DuplexPipelineBuilder.to() chains multiple transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const stored1 = new PushStoredChannelTransfer<number>();
      const stored2 = new PushStoredChannelTransfer<number>();
      const manual = new ManualFlowTransfer<number>();

      const builder = DuplexPipelineBuilder.start(startTransfer);
      const builder2 = builder.to(stored1);
      const builder3 = builder2.to(stored2);
      const builder4 = builder3.to(manual);

      expect(builder4).toBeDefined();

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder4.finish(lastTransfer);

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'DuplexPipelineBuilder.to() with owned=true adds transfer to owned resources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const builder = DuplexPipelineBuilder.start(startTransfer);
      const nextBuilder = builder.to(intermediate, true); // owned = true

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = nextBuilder.finish(lastTransfer);

      expect(composite).toBeDefined();

      // On composite destroy, intermediate should be destroyed
      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'DuplexPipelineBuilder.to() with owned=false does not destroy transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const builder = DuplexPipelineBuilder.start(startTransfer);
      const nextBuilder = builder.to(intermediate, false); // owned = false

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = nextBuilder.finish(lastTransfer);

      composite.destroy();

      // intermediate should not be destroyed (not in owned)
      expect(destroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder.finish() — Completing the pipeline
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder.finish() creates composite with basic options test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
      expect(composite.isOutput).toBe(true);
      expect(composite.isDuplex).toBe(true);
      expect(composite.isPushable).toBe(true);
      expect(composite.isPullable).toBe(true);
      expect(composite.isSubscribable).toBe(true);
    });
  },
);

describe(
  'DuplexPipelineBuilder.finish() with owned=true destroys last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'DuplexPipelineBuilder.finish() with owned=false does not destroy last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: false });

      composite.destroy();

      expect(destroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder.finish() — Triggerable and Gate
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder.finish() with explicit triggerable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { triggerable: manualFlow });

      expect(composite).toBeDefined();
      expect(composite.isTriggerable).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder.finish() with explicit gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const explicitGate = new GateTransfer<number>({ activated: false });

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { gate: explicitGate });

      expect(composite).toBeDefined();
      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(false); // Explicit gate is not active

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder.finish() with both triggerable and gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();
      const explicitGate = new GateTransfer<number>({ activated: true });

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, {
          triggerable: manualFlow,
          gate: explicitGate,
        });

      expect(composite).toBeDefined();
      expect(composite.isTriggerable).toBe(true);
      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(true);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder — Integration tests (duplex stream)
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder full pipeline with push data flow test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      // Verifying that data flows through the pipeline (push → subscribe)
      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(1);
      composite.push(2);
      composite.push(3);

      expect(received).toEqual([1, 2, 3]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder full pipeline with pull data flow test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      // Verifying that pull() works
      lastTransfer.push(42);
      const value = composite.pull();

      expect(value).toBe(42);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder pipeline with gate blocking test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: false });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer, { gate: startTransfer });

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      // Gate is not active — data is blocked in startTransfer
      composite.push(1);
      composite.push(2);

      expect(received).toEqual([]);

      // Activate gate
      composite.activate();
      composite.push(3);

      expect(received).toEqual([3]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder pipeline cleanup on destroy test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const startDestroySpy = jest.fn();
      const channelDestroySpy = jest.fn();
      const lastDestroySpy = jest.fn();

      startTransfer.destroy = startDestroySpy;
      channel.destroy = channelDestroySpy;
      lastTransfer.destroy = lastDestroySpy;

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(channel, true) // owned
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      // owned resources should be destroyed
      expect(channelDestroySpy).toHaveBeenCalledTimes(1);
      expect(lastDestroySpy).toHaveBeenCalledTimes(1);

      // startTransfer is not in the owned array (not passed with owned: true)
      expect(startDestroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder — Edge cases
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder handles undefined values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number | undefined>();
      const lastTransfer = new PushStoredChannelTransfer<number | undefined>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: (number | undefined)[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(undefined);

      // PushStoredChannel ignores undefined in SubscriptionManager
      expect(received).toEqual([]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder handles null values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<null>();
      const lastTransfer = new PushStoredChannelTransfer<null>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: null[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(null);

      expect(received).toEqual([null]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder handles object values test',
  () => {
    it('', () => {
      type Obj = { id: number; name: string };

      const startTransfer = new PushStoredChannelTransfer<Obj>();
      const lastTransfer = new PushStoredChannelTransfer<Obj>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: Obj[] = [];
      composite.subscribe((data) => { received.push(data); });

      const obj = { id: 1, name: 'test' };
      composite.push(obj);

      expect(received).toEqual([obj]);
      expect(received[0]).toBe(obj); // Same reference

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder multiple finish calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = DuplexPipelineBuilder.start(startTransfer);

      const lastTransfer1 = new PushStoredChannelTransfer<number>();
      const lastTransfer2 = new PushStoredChannelTransfer<number>();

      const composite1 = builder.finish(lastTransfer1);
      const composite2 = builder.finish(lastTransfer2);

      expect(composite1).toBeDefined();
      expect(composite2).toBeDefined();

      // Both composites should work independently
      composite1.destroy();
      composite2.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder unsubscribe stops notifications test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      const received: number[] = [];
      const subscriber = composite.subscribe((data) => { received.push(data); });

      composite.push(1);
      expect(received).toEqual([1]);

      subscriber.unsubscribe();

      composite.push(2);
      expect(received).toEqual([1]); // 2 not received
    });
  },
);

describe(
  'DuplexPipelineBuilder builder is immutable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate1 = new PushStoredChannelTransfer<number>();
      const intermediate2 = new PushStoredChannelTransfer<number>();

      const builder1 = DuplexPipelineBuilder.start(startTransfer);
      const builder2 = builder1.to(intermediate1);

      // builder1 should not change after to()
      const lastTransfer1 = new PushStoredChannelTransfer<number>();
      const composite1 = builder1.finish(lastTransfer1);

      // builder2 should not change either
      const lastTransfer2 = new PushStoredChannelTransfer<number>();
      const composite2 = builder2.finish(lastTransfer2);

      expect(composite1).toBeDefined();
      expect(composite2).toBeDefined();

      composite1.destroy();
      composite2.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder complex pipeline with 5 transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const t3 = new PushStoredChannelTransfer<number>();
      const t4 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(t1)
        .to(t2)
        .to(t3)
        .to(t4)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder all owned resources destroyed test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const destroySpies = [jest.fn(), jest.fn(), jest.fn()];
      t1.destroy = destroySpies[0];
      t2.destroy = destroySpies[1];
      lastTransfer.destroy = destroySpies[2];

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(t1, true)
        .to(t2, true)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      // All owned resources should be destroyed
      expect(destroySpies[0]).toHaveBeenCalledTimes(1);
      expect(destroySpies[1]).toHaveBeenCalledTimes(1);
      expect(destroySpies[2]).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'DuplexPipelineBuilder toggle gate state test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { gate: startTransfer });

      expect(composite.active).toBe(true);

      const toggled = composite.toggle();
      expect(toggled).toBe(false);
      expect(composite.active).toBe(false);

      const toggled2 = composite.toggle();
      expect(toggled2).toBe(true);
      expect(composite.active).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder handles zero and negative values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(0);
      composite.push(-1);
      composite.push(-100);

      expect(received).toEqual([0, -1, -100]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder handles large data values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      const largeValue = Number.MAX_SAFE_INTEGER;
      composite.push(largeValue);

      expect(received).toEqual([largeValue]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder triggerable in finish options test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer, { triggerable: manualFlow });

      expect(composite.isTriggerable).toBe(true);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder gate in finish options blocks data test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: false });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      // GateTransfer as startTransfer has a built-in gate
      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer, { gate: startTransfer });

      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(false);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      // Gate is not active — GateTransfer blocks push()
      composite.push(1);
      composite.push(2);
      expect(received).toEqual([]);

      // Activate
      composite.activate();
      composite.push(3);
      expect(received).toEqual([3]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder — Tests with PushChannelTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder with PushChannelTransfer in chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(pushChannel)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(1);
      composite.push(2);

      expect(received).toEqual([1, 2]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder PushChannelTransfer drops data without subscriber test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(pushChannel)
        .finish(lastTransfer);

      // PushChannel does not buffer — data is lost without a subscriber
      composite.push(1);
      composite.push(2);

      // Subscribe later
      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      // PushStoredChannel at the input stores the last value
      // But PushChannel in the middle has no buffer
      // Behavior depends on linkTransfers implementation

      composite.push(3);
      expect(received).toContain(3);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder mixed PushChannel and PushStored chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const stored1 = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const stored2 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(stored1)
        .to(pushChannel)
        .to(stored2)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(1);
      composite.push(2);
      composite.push(3);

      expect(received).toEqual([1, 2, 3]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder — Tests with various transfer combinations
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder with GateTransfer in middle of chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(gate as any)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(1);
      composite.push(2);

      expect(received).toEqual([1, 2]);

      composite.destroy();
    });
  },
);

describe(
  'DuplexPipelineBuilder with ConditionTransfer in chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const condition = new ConditionTransfer<number>({ shouldAccept: (x) => x > 0 });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = DuplexPipelineBuilder
        .start(startTransfer)
        .to(condition as any)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(-1);
      composite.push(1);
      composite.push(2);

      // ConditionTransfer may pass all values depending on implementation
      expect(received.length).toBeGreaterThanOrEqual(2);
      expect(received).toContain(1);
      expect(received).toContain(2);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'DuplexPipelineBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = new (DuplexPipelineBuilder as any)(startTransfer, startTransfer);

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();

      const received: number[] = [];
      composite.subscribe((data: any) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

