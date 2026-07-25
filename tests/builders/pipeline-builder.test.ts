import {
  PipelineBuilder,
  PushStoredChannelTransfer,
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

describe(
  'PipelineBuilder pull returns data from last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = PipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      composite.push(42);

      expect(composite.pull()).toBe(42);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
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
