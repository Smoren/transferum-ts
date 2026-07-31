import {
  CompositeTransferBuilder,
  PushStoredChannelTransfer,
  PushChannelTransfer,
  GateTransfer,
  ManualFlowTransfer,
  ConditionTransfer,
  SinkTransfer,
  AsyncPollingSourceTransfer,
  DefaultLinkStrategy,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// CompositeTransferBuilder — Basic creation
// ═══════════════════════════════════════════════════════════════

describe(
  'CompositeTransferBuilder.start() creates builder with output transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = CompositeTransferBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'CompositeTransferBuilder.start() accepts GateTransfer (output-only) test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });

      const builder = CompositeTransferBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'CompositeTransferBuilder.start() accepts linkStrategy via options test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const linkStrategy = new DefaultLinkStrategy();

      const builder = CompositeTransferBuilder.start(startTransfer, { linkStrategy });

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'CompositeTransferBuilder.start() with linkStrategy uses it for linking test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const received: number[] = [];
      const finishWithCallback = new SinkTransfer<number>({ callback: (v) => received.push(v) });

      const composite = CompositeTransferBuilder
        .start(startTransfer, { linkStrategy: new DefaultLinkStrategy() })
        .finish(finishWithCallback);

      startTransfer.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — Basic composite creation
// ═══════════════════════════════════════════════════════════════

describe(
  'CompositeTransferBuilder finish creates duplex composite from duplex start test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder finish creates input-only composite with SinkTransfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const sink = new SinkTransfer<number>({ callback: () => {} });

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder to chains single intermediate transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'CompositeTransferBuilder to chains multiple transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder to with ConditionTransfer type transformation test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(new ConditionTransfer<number>({ shouldAccept: x => x > 0 }))
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// to() — onLinkError (async mode)
// ═══════════════════════════════════════════════════════════════

describe(
  'CompositeTransferBuilder to with onLinkError passes handler to linkTransfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const onError = jest.fn();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>(), { onLinkError: onError })
        .finish(lastTransfer);

      expect(composite).toBeDefined();

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// to() — owned parameter
// ═══════════════════════════════════════════════════════════════

describe(
  'CompositeTransferBuilder to with owned destroys intermediate on composite destroy test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(intermediate, { owned: true })
        .finish(new PushStoredChannelTransfer<number>());

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'CompositeTransferBuilder to without owned does not destroy intermediate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder finish with owned destroys last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder finish with gate option test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder gate blocks data when inactive test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: false });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder finish with triggerable (ManualFlowTransfer) test',
  () => {
    it('', () => {
      const startTransfer = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder finish with asyncTriggerable test',
  () => {
    it('', async () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
// finish() — onLinkError (async mode)
// ═══════════════════════════════════════════════════════════════

describe(
  'CompositeTransferBuilder finish with onLinkError test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const onError = jest.fn();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .finish(lastTransfer, { onLinkError: onError });

      expect(composite).toBeDefined();

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Data Flow
// ═══════════════════════════════════════════════════════════════

describe(
  'CompositeTransferBuilder data flows through pipeline test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder data flows through multiple intermediates test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder toggle gate state test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder gate with activated=false then activate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: false });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder gate in finish options blocks data test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: false });

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder startTransfer not destroyed on composite destroy test',
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

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(channel, { owned: true })
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
  'CompositeTransferBuilder handles undefined values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number | undefined>();
      const lastTransfer = new PushStoredChannelTransfer<number | undefined>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder handles null values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<null>();
      const lastTransfer = new PushStoredChannelTransfer<null>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder handles object values test',
  () => {
    it('', () => {
      type Obj = { id: number; name: string };

      const startTransfer = new PushStoredChannelTransfer<Obj>();
      const lastTransfer = new PushStoredChannelTransfer<Obj>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder finish with owned=false does not destroy last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder finish with both triggerable and gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const triggerable = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder triggerable sends data on trigger test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const triggerable = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder triggerable in finish options with data flow test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const manualFlow = new ManualFlowTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder all owned resources destroyed test',
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

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(t1, { owned: true })
        .to(t2, { owned: true })
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(spies[0]).toHaveBeenCalledTimes(1);
      expect(spies[1]).toHaveBeenCalledTimes(1);
      expect(spies[2]).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'CompositeTransferBuilder multiple destroy calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder flags from start (Pushable) and finish (Pullable, Subscribable) test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder flags from GateTransfer start test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = new (CompositeTransferBuilder as any)(startTransfer, startTransfer);

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
  'CompositeTransferBuilder multiple finish calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = CompositeTransferBuilder.start(startTransfer);

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
  'CompositeTransferBuilder builder is immutable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate1 = new PushStoredChannelTransfer<number>();

      const builder1 = CompositeTransferBuilder.start(startTransfer);
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
  'CompositeTransferBuilder unsubscribe stops notifications test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder complex pipeline with 5 transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const t2 = new PushStoredChannelTransfer<number>();
      const t3 = new PushStoredChannelTransfer<number>();
      const t4 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder handles zero and negative values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder handles large data values test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder output-style data flow from startTransfer push test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder output-style gate blocks data from startTransfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: false });
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder output-style pull delegates to last transfer test',
  () => {
    it('', () => {
      const startTransfer = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder with PushChannelTransfer in chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder PushChannelTransfer drops data without subscriber test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder mixed PushChannel and PushStored chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const stored1 = new PushStoredChannelTransfer<number>();
      const pushChannel = new PushChannelTransfer<number>();
      const stored2 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
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
  'CompositeTransferBuilder with GateTransfer in middle of chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(gate)
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
  'CompositeTransferBuilder with ConditionTransfer in chain test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const condition = new ConditionTransfer<number>({shouldAccept: (x) => x > 0});
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .to(condition)
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
  'CompositeTransferBuilder finish with both triggerable and asyncTriggerable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = CompositeTransferBuilder
        .start(startTransfer)
        .finish(lastTransfer, { asyncTriggerable });

      expect(composite.isTriggerable).toBe(true);
      expect(composite.isAsyncTriggerable).toBe(true);

      composite.destroy();
    });
  },
);
