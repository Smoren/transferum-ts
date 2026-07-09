import {
  AsyncInputPipelineBuilder,
  PushStoredChannelTransfer,
  GateTransfer,
  AsyncPollingSourceTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncInputPipelineBuilder
// ═══════════════════════════════════════════════════════════════
// Async version of InputPipelineBuilder.
// Additions: asyncTriggerable, linkOnError in finish().

// ═══════════════════════════════════════════════════════════════
// start() & Basic Creation
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder start creates builder test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = AsyncInputPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'AsyncInputPipelineBuilder finish creates composite test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new GateTransfer<number>({ activated: true });

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// to() — Chaining
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder to adds intermediate transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .to(intermediate)
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'AsyncInputPipelineBuilder to chains multiple transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .to(new PushStoredChannelTransfer<number>())
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'AsyncInputPipelineBuilder to with owned destroys intermediate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .to(intermediate, true)
        .finish(new PushStoredChannelTransfer<number>());

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — asyncTriggerable
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder finish with asyncTriggerable test',
  () => {
    it('', async () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { asyncTriggerable });

      expect(composite.isAsyncTriggerable).toBe(true);

      const handler = jest.fn();
      asyncTriggerable.subscribe(handler);

      await composite.asyncTrigger();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      composite.destroy();
    });
  },
);

describe(
  'AsyncInputPipelineBuilder finish with both triggerable and asyncTriggerable test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { asyncTriggerable });

      expect(composite.isTriggerable).toBe(true);
      expect(composite.isAsyncTriggerable).toBe(true);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — gate
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder finish with gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({activated: false});
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .to(gate)
        .finish(lastTransfer, {gate});

      expect(composite.isGate).toBe(true);
      expect(composite.active).toBe(false);

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — linkOnError
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder finish with linkOnError suppresses link errors test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const onError = jest.fn();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      // linkOnError is passed to linkTransfers as config.onError
      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, {linkOnError: onError});

      expect(composite).toBeDefined();

      composite.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — owned
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder finish with owned destroys last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'AsyncInputPipelineBuilder finish without owned does not destroy last transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, {owned: false});

      composite.destroy();

      expect(destroySpy).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Data Flow
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder data flows through pipeline test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const channel = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .to(channel)
        .finish(lastTransfer);

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
  'AsyncInputPipelineBuilder gate blocks data flow test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: false });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
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
// Destroy & Cleanup
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncInputPipelineBuilder all owned resources destroyed test',
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

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .to(t1, true)
        .to(t2, true)
        .finish(lastTransfer, {owned: true});

      composite.destroy();

      expect(spies[0]).toHaveBeenCalledTimes(1);
      expect(spies[1]).toHaveBeenCalledTimes(1);
      expect(spies[2]).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'AsyncInputPipelineBuilder multiple destroy calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncInputPipelineBuilder
        .start(startTransfer)
        .finish(new PushStoredChannelTransfer<number>());

      expect(() => {
        composite.destroy();
        composite.destroy();
      }).not.toThrow();
    });
  },
);

describe(
  'AsyncInputPipelineBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = new (AsyncInputPipelineBuilder as any)(startTransfer, startTransfer);

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

