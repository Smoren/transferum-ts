import {
  createDefaultLinkStrategy,
  DefaultLinkStrategy,
  PushChannelTransfer,
  SinkTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// createDefaultLinkStrategy
// ═══════════════════════════════════════════════════════════════

describe(
  'createDefaultLinkStrategy returns DefaultLinkStrategy instance test',
  () => {
    it('', () => {
      const linker = createDefaultLinkStrategy();

      expect(linker).toBeDefined();
      expect(linker).toBeInstanceOf(DefaultLinkStrategy);
    });
  },
);

describe(
  'createDefaultLinkStrategy returns LinkerInterface test',
  () => {
    it('', () => {
      const linker = createDefaultLinkStrategy();
      expect(typeof linker.link).toBe('function');
    });
  },
);

describe(
  'createDefaultLinkStrategy returns new instance each call test',
  () => {
    it('', () => {
      const linker1 = createDefaultLinkStrategy();
      const linker2 = createDefaultLinkStrategy();

      expect(linker1).not.toBe(linker2);
    });
  },
);

describe(
  'createDefaultLinkStrategy link connects Subscribable to Pushable test',
  () => {
    it('', () => {
      const linker = createDefaultLinkStrategy();
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
  'createDefaultLinkStrategy link unsubscribes correctly test',
  () => {
    it('', () => {
      const linker = createDefaultLinkStrategy();
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
