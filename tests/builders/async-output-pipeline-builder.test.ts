import {
  AsyncOutputPipelineBuilder,
  PushStoredChannelTransfer,
  GateTransfer,
  AsyncPollingSourceTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncOutputPipelineBuilder
// ═══════════════════════════════════════════════════════════════
// Async version of OutputPipelineBuilder.
// Additions: asyncTriggerable, linkOnError in finish().

// ═══════════════════════════════════════════════════════════════
// start() & Basic Creation
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOutputPipelineBuilder start creates builder test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = AsyncOutputPipelineBuilder.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'AsyncOutputPipelineBuilder finish creates composite test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncOutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer);

      expect(composite).toBeDefined();
      expect(composite.isOutput).toBe(true);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// to() — Chaining
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOutputPipelineBuilder to adds intermediate transfer test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncOutputPipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .finish(new PushStoredChannelTransfer<number>());

      expect(composite).toBeDefined();
    });
  },
);

describe(
  'AsyncOutputPipelineBuilder to with owned destroys intermediate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = AsyncOutputPipelineBuilder
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
  'AsyncOutputPipelineBuilder finish with asyncTriggerable test',
  () => {
    it('', async () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const asyncTriggerable = new AsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncOutputPipelineBuilder
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
// finish() — gate & owned
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOutputPipelineBuilder finish with gate test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const gate = new GateTransfer<number>({ activated: true });
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncOutputPipelineBuilder
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
  'AsyncOutputPipelineBuilder finish with owned test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      lastTransfer.destroy = destroySpy;

      const composite = AsyncOutputPipelineBuilder
        .start(startTransfer)
        .finish(lastTransfer, { owned: true });

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// finish() — linkOnError
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncOutputPipelineBuilder finish with linkOnError test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const onError = jest.fn();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncOutputPipelineBuilder
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
  'AsyncOutputPipelineBuilder data flows through pipeline test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const composite = AsyncOutputPipelineBuilder
        .start(startTransfer)
        .to(new PushStoredChannelTransfer<number>())
        .finish(lastTransfer);

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      startTransfer.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'AsyncOutputPipelineBuilder all owned resources destroyed test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();
      const t1 = new PushStoredChannelTransfer<number>();
      const lastTransfer = new PushStoredChannelTransfer<number>();

      const spies = [jest.fn(), jest.fn()];
      t1.destroy = spies[0];
      lastTransfer.destroy = spies[1];

      const composite = AsyncOutputPipelineBuilder
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
  'AsyncOutputPipelineBuilder private constructor uses default ownedResources test',
  () => {
    it('', () => {
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = new (AsyncOutputPipelineBuilder as any)(startTransfer, startTransfer);

      const lastTransfer = new PushStoredChannelTransfer<number>();
      const composite = builder.finish(lastTransfer);

      expect(composite).toBeDefined();

      const received: number[] = [];
      lastTransfer.subscribe((data) => { received.push(data); });

      startTransfer.push(42);
      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

