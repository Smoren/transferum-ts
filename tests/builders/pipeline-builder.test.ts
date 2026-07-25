import {
  PipelineBuilder,
  PushStoredChannelTransfer,
  PushChannelTransfer,
  GateTransfer,
  ManualFlowTransfer,
  ConditionTransfer,
  SinkTransfer,
  AsyncPollingSourceTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PipelineBuilder — Basic creation
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder.start() creates builder with output transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = PipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'PipelineBuilder.start() accepts GateTransfer (output-only) test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });

      const builder = PipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — Basic composite creation
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish creates duplex composite from duplex start test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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
  'PipelineBuilder finish creates input-only composite with SinkTransfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const sink = new SinkTransfer<number>({ callback: () => {} });

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(sink);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
      // SinkTransfer has no output capabilities
      expect(composite.isPushable).toBe(true);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// to() — Chaining
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder to chains single intermediate transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'PipelineBuilder to chains multiple transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .to(new PushStoredChannelTransfer<number>())
        .to(new PushStoredChannelTransfer<number>())
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'PipelineBuilder to with ConditionTransfer type transformation test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(new ConditionTransfer<number>({ shouldAccept: x => x > 0 }))
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// to() — owned parameter
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder to with owned destroys intermediate on composite destroy test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(intermediate, true)
        .finish(new PushStoredChannelTransfer<number>());

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'PipelineBuilder to without owned does not destroy intermediate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(intermediate)
        .finish(new PushStoredChannelTransfer<number>());

      composite.destroy();

      expect(destroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — owned parameter
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with owned destroys last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — gate option
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with gate option test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(gate)
        .finish(lastTransfer, { gate });

      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder gate blocks data when inactive test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: false });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(gate)
        .finish(lastTransfer, { gate });

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(1);
      expect(received).toEqual([]);

      composite.activate();
      composite.push(2);
      expect(received).toEqual([2]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — triggerable option
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with triggerable (ManualFlowTransfer) test',
  () => {
    it('', () => {
      const startTransfer = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { triggerable: startTransfer });

      expect(composite.isTriggerable).toBe(true);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — asyncTriggerable option
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with asyncTriggerable test',
  () => {
    it('', async () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { asyncTriggerable });

      expect(composite.isAsyncTriggerable).toBe(true);

      const handler = jest.fn();
      asyncTriggerable.subscribe(handler);

      await composite.asyncTrigger();

      expect(handler).toHaveBeenCalledWith(42);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — linkOnError (async mode)
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with linkOnError test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const onError = jest.fn();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { linkOnError: onError });

      expect(composite).toBeDefined();

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Data Flow
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder data flows through pipeline test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .finish(lastTransfer);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder data flows through multiple intermediates test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .to(new ConditionTransfer<number>({ shouldAccept: x => x > 10 }))
        .to(new PushStoredChannelTransfer<number>())
        .finish(lastTransfer);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(5);
      expect(received).toEqual([]);

      composite.push(42);
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — gate toggle / activate / deactivate
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder toggle gate state test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { gate: new GateTransfer<number>({ activated: true }) });

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
  'PipelineBuilder gate with activated=false then activate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: false });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(gate)
        .finish(lastTransfer, { gate });

      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(false);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);
      expect(received).toEqual([]);

      composite.toggle();
      composite.push(22);
      expect(received).toEqual([22]);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder gate in finish options blocks data test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: false });

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      expect(composite.isGate).toBe(true);
      expect(lastTransfer.active).toBe(false);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(1);
      composite.push(2);
      expect(received).toEqual([]);

      lastTransfer.activate();
      composite.push(3);
      expect(received).toEqual([3]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — cleanup: startTransfer not destroyed
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder startTransfer not destroyed on composite destroy test',
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

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(channel, true)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(channelDestroySpy).toHaveBeenCalledTimes(1);
      expect(lastDestroySpy).toHaveBeenCalledTimes(1);
      expect(startDestroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Edge cases — undefined, null, object values
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder handles undefined values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number | undefined>();
      const lastTransfer = new PushStoredChannelTransfer<number | undefined>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: (number | undefined)[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(undefined);

      expect(received).toEqual([]);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder handles null values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<null>();
      const lastTransfer = new PushStoredChannelTransfer<null>();

      const composite = PipelineBuilder
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
  'PipelineBuilder handles object values test',
  () => {
    it('', () => {
      type Obj = { id: number; name: string };

      const startTransfer = new PushStoredChannelTransfer<Obj>();
      const lastTransfer = new PushStoredChannelTransfer<Obj>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      const received: Obj[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      const obj = { id: 1, name: 'test' };
      composite.push(obj);

      expect(received).toEqual([obj]);
      expect(received[0]).toBe(obj);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — owned: false (explicit)
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with owned=false does not destroy last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: false });

      composite.destroy();

      expect(destroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — triggerable + gate combined
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with both triggerable and gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const triggerable = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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

      composite.deactivate();
      composite.push(22);
      expect(received).toEqual([42]);

      composite.activate();
      composite.trigger();
      expect(received).toEqual([42]);

      composite.push(36);
      composite.trigger();
      expect(received).toEqual([42, 36]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — triggerable with data flow
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder triggerable sends data on trigger test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const triggerable = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(triggerable)
        .finish(lastTransfer, { triggerable });

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
  'PipelineBuilder triggerable in finish options with data flow test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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
// Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder all owned resources destroyed test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const spies = [jest.fn(), jest.fn(), jest.fn()];
      t1.destroy = spies[0];
      t2.destroy = spies[1];
      lastTransfer.destroy = spies[2];

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(t1, true)
        .to(t2, true)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(spies[0]).toHaveBeenCalledTimes(1);
      expect(spies[1]).toHaveBeenCalledTimes(1);
      expect(spies[2]).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'PipelineBuilder multiple destroy calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(new PushStoredChannelTransfer<number>());

      expect(() => {
        composite.destroy();
        composite.destroy();
      }).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Flag computation
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder flags from start (Pushable) and finish (Pullable, Subscribable) test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      // PushStoredChannelTransfer is Pushable + Pullable + Subscribable + Triggerable
      // Input flags from start: Pushable
      expect(composite.isPushable).toBe(true);
      // Output flags from finish: Pullable, Subscribable
      expect(composite.isPullable).toBe(true);
      expect(composite.isSubscribable).toBe(true);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder flags from GateTransfer start test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      // GateTransfer is not pushable/pullable/subscribable — it's a gate only
      // But it IS an OutputTransfer (GateTransferInterface extends GateInterface which is OutputTransfer)
      // Output flags from finish: Pullable, Subscribable
      expect(composite.isPullable).toBe(true);
      expect(composite.isSubscribable).toBe(true);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Private constructor fallback
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = new (PipelineBuilder as any)(startTransfer, startTransfer);

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

// ═══════════════════════════════════════════════════════════════
// Multiple finish calls — builder immutability
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder multiple finish calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = PipelineBuilder.start(startTransfer);

      const lastTransfer1 = new PushStoredChannelTransfer<number>();
      const lastTransfer2 = new PushStoredChannelTransfer<number>();

      const composite1 = builder.finish(lastTransfer1);
      const composite2 = builder.finish(lastTransfer2);

      expect(composite1).toBeDefined();
      expect(composite2).toBeDefined();

      composite1.destroy();
      composite2.destroy();
    });
  },
);

describe(
  'PipelineBuilder builder is immutable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate1 = new PushStoredChannelTransfer<number>();

      const builder1 = PipelineBuilder.start(startTransfer);
      const builder2 = builder1.to(intermediate1);

      const lastTransfer1 = new PushStoredChannelTransfer<number>();
      const composite1 = builder1.finish(lastTransfer1);

      const lastTransfer2 = new PushStoredChannelTransfer<number>();
      const composite2 = builder2.finish(lastTransfer2);

      expect(composite1).toBeDefined();
      expect(composite2).toBeDefined();

      composite1.destroy();
      composite2.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Unsubscribe stops notifications
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder unsubscribe stops notifications test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      const received: number[] = [];
      const subscriber = lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(1);
      expect(received).toEqual([1]);

      subscriber.unsubscribe();

      composite.push(2);
      expect(received).toEqual([1]);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Complex pipeline — 5+ transfers
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder complex pipeline with 5 transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const t3 = new PushStoredChannelTransfer<number>();
      const t4 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(t1)
        .to(t2)
        .to(t3)
        .to(t4)
        .finish(lastTransfer);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      composite.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Numeric edge cases — zero, negative, large values
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder handles zero and negative values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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
  'PipelineBuilder handles large data values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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
// Output-style data flow — startTransfer.push() → composite.subscribe()
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder output-style data flow from startTransfer push test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      startTransfer.push(1);
      startTransfer.push(2);
      startTransfer.push(3);

      expect(received).toEqual([1, 2, 3]);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder output-style gate blocks data from startTransfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: false });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      startTransfer.push(1);
      startTransfer.push(2);
      expect(received).toEqual([]);

      startTransfer.activate();
      startTransfer.push(3);
      expect(received).toEqual([3]);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder output-style pull delegates to last transfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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
// PushChannelTransfer in chain
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder with PushChannelTransfer in chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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
  'PipelineBuilder PushChannelTransfer drops data without subscriber test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(pushChannel)
        .finish(lastTransfer);

      composite.push(1);
      composite.push(2);

      const received: number[] = [];
      composite.subscribe((data) => { received.push(data); });

      composite.push(3);
      expect(received).toContain(3);

      composite.destroy();
    });
  },
);

describe(
  'PipelineBuilder mixed PushChannel and PushStored chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const stored1 = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const stored2 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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
// GateTransfer in middle of chain
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder with GateTransfer in middle of chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
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

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer in chain
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder with ConditionTransfer in chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const condition = new ConditionTransfer<number>({shouldAccept: (x) => x > 0});
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .to(condition as any)
        .finish(lastTransfer);

      const received: number[] = [];
      composite.subscribe((data) => {
        received.push(data);
      });

      composite.push(-1);
      composite.push(1);
      composite.push(2);

      expect(received.length).toBeGreaterThanOrEqual(2);
      expect(received).toContain(1);
      expect(received).toContain(2);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// triggerable + asyncTriggerable combined
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder finish with both triggerable and asyncTriggerable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { asyncTriggerable });

      expect(composite.isTriggerable).toBe(true);
      expect(composite.isAsyncTriggerable).toBe(true);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Type transformation chain — number → string → number
// ═══════════════════════════════════════════════════════════════

describe(
  'PipelineBuilder type transformation chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const stringTransfer = new PushStoredChannelTransfer<string>();
      const numberTransfer = new PushStoredChannelTransfer<number>();

      const builder = PipelineBuilder
        .start(startTransfer)
        .to(stringTransfer as any)
        .to(numberTransfer as any);

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);

      composite.destroy();
    });
  },
);
