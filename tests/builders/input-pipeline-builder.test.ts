import {
  InputPipelineBuilder,
  PushStoredChannelTransfer,
  GateTransfer,
  ManualFlowTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// InputPipelineBuilder — Basic creation
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder.start() creates builder with duplex transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = InputPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'InputPipelineBuilder preserves start transfer reference test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = InputPipelineBuilder.start(startTransfer);

      // Verifying that the builder is created successfully
      expect(builder).toBeDefined();

      // finish() should return a composite with access to startTransfer
      const lastTransfer = new GateTransfer<number>({ activated: true });
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// InputPipelineBuilder.to() — Adding intermediate transfers
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder.to() adds single intermediate transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>(); // Subscribable + Pushable + Pullable

      const builder = InputPipelineBuilder.start(startTransfer);
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
  'InputPipelineBuilder.to() chains multiple transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const stored1 = new PushStoredChannelTransfer<number>();
      const stored2 = new PushStoredChannelTransfer<number>();
      const manual = new ManualFlowTransfer<number>();

      const builder = InputPipelineBuilder.start(startTransfer);
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
  'InputPipelineBuilder.to() with owned=true adds transfer to owned resources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const builder = InputPipelineBuilder.start(startTransfer);
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
  'InputPipelineBuilder.to() with owned=false does not destroy transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const builder = InputPipelineBuilder.start(startTransfer);
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
// InputPipelineBuilder.finish() — Completing the pipeline
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder.finish() creates composite with basic options test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
      expect(composite.isPushable).toBe(true);
      expect(composite.isSubscribable).toBe(true);
    });
  },
);

describe(
  'InputPipelineBuilder.finish() with owned=true destroys last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: true });
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'InputPipelineBuilder.finish() with owned=false does not destroy last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: true });
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: false });

      composite.destroy();

      expect(destroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// InputPipelineBuilder.finish() — Triggerable and Gate
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder.finish() with explicit triggerable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const triggerable = new ManualFlowTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(triggerable)
        .finish(lastTransfer, { triggerable });

      expect(composite).toBeDefined();
      expect(composite.isTriggerable).toBe(true);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([]);

      composite.trigger();
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder.finish() with explicit gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: false });
      const lastTransfer = new GateTransfer<number>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(gate)
        .finish(lastTransfer, { gate });

      expect(composite).toBeDefined();
      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(false);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([]);
      expect(composite.active).toBe(false);

      composite.toggle();
      composite.push(22);
      expect(received).toEqual([22]);
      expect(composite.active).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder.finish() with both triggerable and gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const triggerable = new ManualFlowTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(gate)
        .to(triggerable)
        .finish(lastTransfer, { triggerable, gate });

      expect(composite).toBeDefined();
      expect(composite.isTriggerable).toBe(true);
      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(true);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([]);

      composite.trigger();
      expect(received).toEqual([42]);

      composite.trigger();
      expect(received).toEqual([42]);

      composite.deactivate();
      composite.push(22);
      expect(received).toEqual([42]);

      composite.trigger();
      expect(received).toEqual([42]);

      composite.activate();
      composite.trigger();
      expect(received).toEqual([42]);

      composite.push(36);
      expect(received).toEqual([42]);

      composite.trigger();
      expect(received).toEqual([42, 36]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// InputPipelineBuilder — Integration tests
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder full pipeline with data flow test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      // Verifying that data flows through the pipeline
      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(1);
      composite.push(2);
      composite.push(3);

      expect(received).toEqual([1, 2, 3]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder pipeline with gate blocking test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const gateTransfer = new GateTransfer<number>({ activated: false });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(gateTransfer, { gate: gateTransfer });

      const received: number[] = [];
      gateTransfer.subscribe((data) => { received.push(data); });

      // Gate is not active — data is blocked
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
  'InputPipelineBuilder pipeline cleanup on destroy test',
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

      const composite = InputPipelineBuilder
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
// InputPipelineBuilder — Edge cases
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder handles undefined values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number | undefined>();
      const lastTransfer = new GateTransfer<number | undefined>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: (number | undefined)[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(undefined);

      // PushStoredChannel ignores undefined in SubscriptionManager
      expect(received).toEqual([]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder handles null values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<null>();
      const lastTransfer = new GateTransfer<null>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: null[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(null);

      expect(received).toEqual([null]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder handles object values test',
  () => {
    it('', () => {
      type Obj = { id: number; name: string };

      const startTransfer = new PushStoredChannelTransfer<Obj>();
      const lastTransfer = new GateTransfer<Obj>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: Obj[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      const obj = { id: 1, name: 'test' };
      composite.push(obj);

      expect(received).toEqual([obj]);
      expect(received[0]).toBe(obj); // Same reference

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder multiple finish calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = InputPipelineBuilder.start(startTransfer);

      const lastTransfer1 = new GateTransfer<number>({ activated: true });
      const lastTransfer2 = new GateTransfer<number>({ activated: true });

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
// InputPipelineBuilder — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder unsubscribe stops notifications test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      const received: number[] = [];
      const subscriber = lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(1);
      expect(received).toEqual([1]);

      subscriber.unsubscribe();

      composite.push(2);
      expect(received).toEqual([1]); // 2 not received
    });
  },
);

describe(
  'InputPipelineBuilder builder is immutable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate1 = new PushStoredChannelTransfer<number>();

      const builder1 = InputPipelineBuilder.start(startTransfer);
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
  'InputPipelineBuilder type transformation chain test',
  () => {
    it('', () => {
      // Chain with type transformation: number -> string -> number
      const startTransfer = new PushStoredChannelTransfer<number>();
      const stringTransfer = new PushStoredChannelTransfer<string>();
      const numberTransfer = new PushStoredChannelTransfer<number>();

      const builder = InputPipelineBuilder
        .start(startTransfer)
        .to(stringTransfer as any) // Type casting for test
        .to(numberTransfer as any);

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
    });
  },
);

describe(
  'InputPipelineBuilder complex pipeline with 5 transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const t3 = new PushStoredChannelTransfer<number>();
      const t4 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(t1)
        .to(t2)
        .to(t3)
        .to(t4)
        .finish(lastTransfer);

      const received: number[] = [];
      startTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder triggerable in finish options test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer, { triggerable: manualFlow });

      expect(composite.isTriggerable).toBe(true);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder gate in finish options blocks data test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: false });

      // GateTransfer as lastTransfer has a built-in gate
      const composite = InputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      expect(composite.isGate).toBe(true);
      expect(lastTransfer.active).toBe(false);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      // Gate is not active — GateTransfer blocks push()
      composite.push(1);
      composite.push(2);
      expect(received).toEqual([]);

      // Activate
      lastTransfer.activate();
      composite.push(3);
      expect(received).toEqual([3]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder all owned resources destroyed test',
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

      const composite = InputPipelineBuilder
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
  'InputPipelineBuilder toggle gate state test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: true });

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { gate: lastTransfer });

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
  'InputPipelineBuilder handles zero and negative values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(0);
      composite.push(-1);
      composite.push(-100);

      expect(received).toEqual([0, -1, -100]);

      composite.destroy();
    });
  },
);

describe(
  'InputPipelineBuilder handles large data values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = InputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      const largeValue = Number.MAX_SAFE_INTEGER;
      composite.push(largeValue);

      expect(received).toEqual([largeValue]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// InputPipelineBuilder — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'InputPipelineBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = new (InputPipelineBuilder as any)(startTransfer, startTransfer);

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

