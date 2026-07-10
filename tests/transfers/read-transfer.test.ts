import { ReadTransfer, LatestStorage, QueueStorage, StackStorage } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ReadTransfer
// ═══════════════════════════════════════════════════════════════
// Read adapter for an arbitrary OutputFlowInterface (e.g., Storage).
// Capabilities: isOutput, isPullable

// ═══════════════════════════════════════════════════════════════
// ReadTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'ReadTransfer has correct capability flags test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new ReadTransfer<number>({ flow: storage });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isPullable).toBe(true);
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
// ReadTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'ReadTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = new ReadTransfer<number>({ flow: storage });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing pull().
 * [StorageClass, value, expected]
 */
function dataProviderForReadPull(): Array<unknown> {
  return [
    [LatestStorage, 42, 42],
    [LatestStorage, 0, 0],
    [LatestStorage, undefined, undefined],
    [QueueStorage, 42, 42],
    [QueueStorage, 0, 0],
    [QueueStorage, undefined, undefined],
    [StackStorage, 42, 42],
    [StackStorage, 0, 0],
    [StackStorage, undefined, undefined],
  ];
}

describe(
  'ReadTransfer pull from QueueStorage shifts value test',
  () => {
    it('', () => {
      const storage = new QueueStorage<number>();
      storage.write(1);
      storage.write(2);
      const transfer = new ReadTransfer<number>({ flow: storage });

      const result1 = transfer.pull();
      const result2 = transfer.pull();

      expect(result1).toBe(1);
      expect(result2).toBe(2);

      transfer.destroy();
    });
  },
);

describe(
  'ReadTransfer pull from StackStorage pops value test',
  () => {
    it('', () => {
      const storage = new StackStorage<number>();
      storage.write(1);
      storage.write(2);
      const transfer = new ReadTransfer<number>({ flow: storage });

      const result1 = transfer.pull();
      const result2 = transfer.pull();

      expect(result1).toBe(2);
      expect(result2).toBe(1);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing owned destroy.
 * [StorageClass, value]
 */
function dataProviderForReadOwned(): Array<unknown> {
  return [
    [LatestStorage, 42],
    [QueueStorage, 42],
    [StackStorage, 42],
  ];
}

describe(
  'ReadTransfer not owned destroy does not clear storage test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      storage.write(42);
      const transfer = new ReadTransfer<number>({ flow: storage });

      expect(storage.size).toBe(1);

      transfer.destroy();

      expect(storage.size).toBe(1);
      expect(storage.read()).toBe(42);
    });
  },
);

describe(
  'ReadTransfer default owned is false test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      storage.write(42);
      const transfer = new ReadTransfer<number>({ flow: storage });

      transfer.destroy();

      expect(storage.size).toBe(1);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ReadTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'ReadTransfer pull with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('read error');
      const onError = jest.fn();
      const flow = {
        read: () => { throw error; },
      };
      const transfer = new ReadTransfer<number>({ flow, onError });

      const result = transfer.pull();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'ReadTransfer pull without onError rethrows test',
  () => {
    it('', () => {
      const flow = {
        read: () => { throw new Error('read error'); },
      };
      const transfer = new ReadTransfer<number>({ flow });

      expect(() => transfer.pull()).toThrow('read error');

      transfer.destroy();
    });
  },
);
