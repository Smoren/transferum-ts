import {
  AsyncDuplexPipelineBuilder,
  PushStoredChannelTransfer,
  GateTransfer,
  AsyncPollingSourceTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncDuplexPipelineBuilder
// ═══════════════════════════════════════════════════════════════
// Async version of DuplexPipelineBuilder.
// Additions: asyncTriggerable, linkOnError in finish().
// finish() accepts an OutputTransfer (not InputTransfer).

// ═══════════════════════════════════════════════════════════════
// start() & Basic Creation
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncDuplexPipelineBuilder start creates builder test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = AsyncDuplexPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'AsyncDuplexPipelineBuilder finish creates composite test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<string>();

      const composite = AsyncDuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isInput).toBe(true);
      expect(composite.isOutput).toBe(true);
      expect(composite.isDuplex).toBe(true);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// to() — Chaining
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncDuplexPipelineBuilder to chains transfers test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncDuplexPipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .to(new PushStoredChannelTransfer<number>())
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'AsyncDuplexPipelineBuilder to with owned test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = AsyncDuplexPipelineBuilder
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
  'AsyncDuplexPipelineBuilder finish with asyncTriggerable test',
  () => {
    it('', async () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncDuplexPipelineBuilder
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
// finish() — gate, owned, linkOnError
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncDuplexPipelineBuilder finish with gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncDuplexPipelineBuilder
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
  'AsyncDuplexPipelineBuilder finish with owned test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = AsyncDuplexPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'AsyncDuplexPipelineBuilder finish with linkOnError test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const onError = jest.fn();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncDuplexPipelineBuilder
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
  'AsyncDuplexPipelineBuilder data flows through pipeline test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncDuplexPipelineBuilder
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
  'AsyncDuplexPipelineBuilder gate blocks data test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: false });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncDuplexPipelineBuilder
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
// Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncDuplexPipelineBuilder all owned resources destroyed test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const spies = [jest.fn(), jest.fn()];
      t1.destroy = spies[0];
      lastTransfer.destroy = spies[1];

      const composite = AsyncDuplexPipelineBuilder
        .start(startTransfer)
        .to(t1, true)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(spies[0]).toHaveBeenCalledTimes(1);
      expect(spies[1]).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'AsyncDuplexPipelineBuilder multiple destroy calls are safe test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncDuplexPipelineBuilder
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
  'AsyncDuplexPipelineBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = new (AsyncDuplexPipelineBuilder as any)(startTransfer, startTransfer);

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

