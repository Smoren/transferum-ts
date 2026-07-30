import {
  createDefaultLinker,
  DefaultLinker,
  PushChannelTransfer,
  PushStoredChannelTransfer,
  SinkTransfer,
} from '../../src';
import type { LinkerInterface } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// createDefaultLinker
// ═══════════════════════════════════════════════════════════════

describe(
  'createDefaultLinker returns DefaultLinker instance test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();

      expect(linker).toBeDefined();
      expect(linker).toBeInstanceOf(DefaultLinker);
    });
  },
);

describe(
  'createDefaultLinker returns LinkerInterface test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();

      expect(typeof linker.link).toBe('function');
      expect(typeof linker.start).toBe('function');
    });
  },
);

describe(
  'createDefaultLinker returns new instance each call test',
  () => {
    it('', () => {
      const linker1 = createDefaultLinker();
      const linker2 = createDefaultLinker();

      expect(linker1).not.toBe(linker2);
    });
  },
);

describe(
  'createDefaultLinker link connects Subscribable to Pushable test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();
      const source = new PushChannelTransfer<number>();
      const received: number[] = [];
      const target = new SinkTransfer<number>({ callback: (v) => received.push(v) });

      const subscriber = linker.link(source, target);

      expect(subscriber.active).toBe(true);

      source.push(42);

      expect(received).toEqual([42]);

      subscriber.unsubscribe();
      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'createDefaultLinker link unsubscribes correctly test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();
      const source = new PushChannelTransfer<number>();
      const target = new SinkTransfer<number>({ callback: jest.fn() });

      const subscriber = linker.link(source, target);
      expect(subscriber.active).toBe(true);

      subscriber.unsubscribe();
      expect(subscriber.active).toBe(false);

      source.destroy();
      target.destroy();
    });
  },
);

describe(
  'createDefaultLinker start creates builder test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();
      const startTransfer = new PushStoredChannelTransfer<number>();

      const builder = linker.start(startTransfer);

      expect(builder).toBeDefined();
    });
  },
);

describe(
  'createDefaultLinker start builds composite with correct flags test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();

      const composite = linker
        .start(new PushStoredChannelTransfer<number>())
        .to(new PushStoredChannelTransfer<number>())
        .finish(new PushStoredChannelTransfer<number>());

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
  'createDefaultLinker start builder forwards data through chain test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();
      const source = new PushStoredChannelTransfer<number>();
      const received: number[] = [];
      const sink = new SinkTransfer<number>({ callback: (v) => received.push(v) });

      const composite = linker
        .start(source)
        .to(new PushStoredChannelTransfer<number>())
        .finish(sink);

      composite.push(42);

      expect(received).toEqual([42]);

      composite.destroy();
    });
  },
);

describe(
  'createDefaultLinker start builder with owned resources test',
  () => {
    it('', () => {
      const linker = createDefaultLinker();
      const intermediate = new PushStoredChannelTransfer<number>();
      const destroySpy = jest.fn();
      intermediate.destroy = destroySpy;

      const composite = linker
        .start(new PushStoredChannelTransfer<number>())
        .to(intermediate, { owned: true })
        .finish(new PushStoredChannelTransfer<number>());

      composite.destroy();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'createDefaultLinker implements LinkerInterface test',
  () => {
    it('', () => {
      const linker: LinkerInterface = createDefaultLinker();

      expect(linker.link).toBeDefined();
      expect(linker.start).toBeDefined();
    });
  },
);
