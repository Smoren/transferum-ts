import { WriteTransfer, LatestStorage, QueueStorage, StackStorage } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// WriteTransfer
// ═══════════════════════════════════════════════════════════════
// Write adapter for an arbitrary InputFlowInterface (e.g., Storage).
// Capabilities: isInput, isPushable

// ═══════════════════════════════════════════════════════════════
// WriteTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'WriteTransfer has correct capability flags test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new WriteTransfer<number>({ flow: storage });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(false);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isSubscribable).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// WriteTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'WriteTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new WriteTransfer<number>({ flow: storage });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing push().
 * [StorageClass, value, expectedSize]
 */
function dataProviderForWritePush(): Array<unknown> {
  return [
    [LatestStorage, 42, 1],
    [LatestStorage, 0, 1],
    [QueueStorage, 42, 1],
    [QueueStorage, 0, 1],
    [StackStorage, 42, 1],
    [StackStorage, 0, 1],
  ];
}

describe(
  'WriteTransfer push overwrites LatestStorage test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new WriteTransfer<number>({ flow: storage });

      transfer.push(1);
      transfer.push(2);

      expect(storage.size).toBe(1);
      expect(storage.read()).toBe(2);

      transfer.destroy();
    });
  },
);

describe(
  'WriteTransfer push appends to QueueStorage test',
  () => {
    it('', () => {
      const storage = new QueueStorage<number>();
      const transfer = new WriteTransfer<number>({ flow: storage });

      transfer.push(1);
      transfer.push(2);
      transfer.push(3);

      expect(storage.size).toBe(3);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing owned destroy.
 * [StorageClass, value]
 */
function dataProviderForWriteOwned(): Array<unknown> {
  return [
    [LatestStorage, 42],
    [QueueStorage, 42],
    [StackStorage, 42],
  ];
}

describe(
  'WriteTransfer not owned destroy does not clear storage test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new WriteTransfer<number>({ flow: storage });

      transfer.push(42);
      expect(storage.size).toBe(1);

      transfer.destroy();

      expect(storage.size).toBe(1);
      expect(storage.read()).toBe(42);
    });
  },
);

describe(
  'WriteTransfer default owned is false test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new WriteTransfer<number>({ flow: storage });

      transfer.push(42);
      transfer.destroy();

      expect(storage.size).toBe(1);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// WriteTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'WriteTransfer push with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('write error');
      const onError = jest.fn();
      const flow = {
        write: () => { throw error; },
      };
      const transfer = new WriteTransfer<number>({ flow, onError });

      transfer.push(42);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);

      transfer.destroy();
    });
  },
);

describe(
  'WriteTransfer push without onError rethrows test',
  () => {
    it('', () => {
      const flow = {
        write: () => { throw new Error('write error'); },
      };
      const transfer = new WriteTransfer<number>({ flow });

      expect(() => transfer.push(42)).toThrow('write error');

      transfer.destroy();
    });
  },
);
