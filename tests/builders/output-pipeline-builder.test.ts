import {
  OutputPipelineBuilder,
  PushStoredChannelTransfer,
  GateTransfer,
  ManualFlowTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// OutputPipelineBuilder — Basic creation
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder.start() creates builder with output transfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });

      const builder = OutputPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'OutputPipelineBuilder preserves start transfer reference test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });

      const builder = OutputPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();

      // finish() should return a composite with access to startTransfer
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isOutput).toBe(true);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// OutputPipelineBuilder.to() — Adding intermediate transfers
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder.to() adds single intermediate transfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const intermediate = new PushStoredChannelTransfer<number>();

      const builder = OutputPipelineBuilder.start(startTransfer);
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
  'OutputPipelineBuilder.to() chains multiple transfers test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const stored1 = new PushStoredChannelTransfer<number>();
      const stored2 = new PushStoredChannelTransfer<number>();
      const manual = new ManualFlowTransfer<number>();

      const builder = OutputPipelineBuilder.start(startTransfer);
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
  'OutputPipelineBuilder.to() with owned=true adds transfer to owned resources test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const builder = OutputPipelineBuilder.start(startTransfer);
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
  'OutputPipelineBuilder.to() with owned=false does not destroy transfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const builder = OutputPipelineBuilder.start(startTransfer);
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
// OutputPipelineBuilder.finish() — Completing the pipeline
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder.finish() creates composite with basic options test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isOutput).toBe(true);
      expect(composite.isPullable).toBe(true);
      expect(composite.isSubscribable).toBe(true);
    });
  },
);

describe(
  'OutputPipelineBuilder.finish() with owned=true destroys last transfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'OutputPipelineBuilder.finish() with owned=false does not destroy last transfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: false });

      composite.destroy();

      expect(destroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// OutputPipelineBuilder.finish() — Triggerable and Gate
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder.finish() with explicit triggerable test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { triggerable: manualFlow });

      expect(composite).toBeDefined();
      expect(composite.isTriggerable).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder.finish() with explicit gate test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const explicitGate = new GateTransfer<number>({ activated: false });

      const composite = OutputPipelineBuilder
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
  'OutputPipelineBuilder.finish() with both triggerable and gate test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();
      const explicitGate = new GateTransfer<number>({ activated: true });

      const composite = OutputPipelineBuilder
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
// OutputPipelineBuilder — Integration tests
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder full pipeline with data flow test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      // Verifying that data flows through the pipeline
      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      // GateTransfer is active — data passes through
      startTransfer.push(1);
      startTransfer.push(2);
      startTransfer.push(3);

      expect(received).toEqual([1, 2, 3]);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder pipeline with gate blocking test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: false });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      // Gate is not active — data is blocked in startTransfer
      startTransfer.push(1);
      startTransfer.push(2);

      expect(received).toEqual([]);

      // Activate gate
      startTransfer.activate();
      startTransfer.push(3);

      expect(received).toEqual([3]);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder pipeline cleanup on destroy test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const startDestroySpy = jest.fn();
      const channelDestroySpy = jest.fn();
      const lastDestroySpy = jest.fn();

      startTransfer.destroy = startDestroySpy;
      channel.destroy = channelDestroySpy;
      lastTransfer.destroy = lastDestroySpy;

      const composite = OutputPipelineBuilder
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
// OutputPipelineBuilder — Edge cases
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder handles undefined values test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number | undefined>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number | undefined>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: (number | undefined)[] = [];
      composite.subscribe((data) => { received.push(data); });

      startTransfer.push(undefined);

      // GateTransfer ignores undefined
      expect(received).toEqual([]);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder handles null values test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<null>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<null>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: null[] = [];
      composite.subscribe((data) => { received.push(data); });

      startTransfer.push(null);

      expect(received).toEqual([null]);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder handles object values test',
  () => {
    it('', () => {
      type Obj = { id: number; name: string };

      const startTransfer = new GateTransfer<Obj>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<Obj>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: Obj[] = [];
      composite.subscribe((data) => { received.push(data); });

      const obj = { id: 1, name: 'test' };
      startTransfer.push(obj);

      expect(received).toEqual([obj]);
      expect(received[0]).toBe(obj); // Same reference

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder multiple finish calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });

      const builder = OutputPipelineBuilder.start(startTransfer);

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
// OutputPipelineBuilder — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder unsubscribe stops notifications test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      const received: number[] = [];
      const subscriber = composite.subscribe((data) => { received.push(data); });

      startTransfer.push(1);
      expect(received).toEqual([1]);

      subscriber.unsubscribe();

      startTransfer.push(2);
      expect(received).toEqual([1]); // 2 not received
    });
  },
);

describe(
  'OutputPipelineBuilder builder is immutable test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const intermediate1 = new PushStoredChannelTransfer<number>();
      const intermediate2 = new PushStoredChannelTransfer<number>();

      const builder1 = OutputPipelineBuilder.start(startTransfer);
      const builder2 = builder1.to(intermediate1);
      const builder3 = builder2.to(intermediate2);

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
  'OutputPipelineBuilder complex pipeline with 5 transfers test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const t3 = new PushStoredChannelTransfer<number>();
      const t4 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .to(t1)
        .to(t2)
        .to(t3)
        .to(t4)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      startTransfer.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder all owned resources destroyed test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const destroySpies = [jest.fn(), jest.fn(), jest.fn()];
      t1.destroy = destroySpies[0];
      t2.destroy = destroySpies[1];
      lastTransfer.destroy = destroySpies[2];

      const composite = OutputPipelineBuilder
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
  'OutputPipelineBuilder toggle gate state test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
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
  'OutputPipelineBuilder handles zero and negative values test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      startTransfer.push(0);
      startTransfer.push(-1);
      startTransfer.push(-100);

      expect(received).toEqual([0, -1, -100]);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder handles large data values test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      const largeValue = Number.MAX_SAFE_INTEGER;
      startTransfer.push(largeValue);

      expect(received).toEqual([largeValue]);

      composite.destroy();
    });
  },
);

describe(
  'OutputPipelineBuilder pull delegates to output test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = OutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      lastTransfer.push(42);
      const value = composite.pull();

      expect(value).toBe(42);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// OutputPipelineBuilder — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'OutputPipelineBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });

      const builder = new (OutputPipelineBuilder as any)(startTransfer, startTransfer);

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();

      const received: number[] = [];
      composite.subscribe((data: any) => { received.push(data); });

      startTransfer.push(42);
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

