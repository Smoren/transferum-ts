import { SinkTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// SinkTransfer
// ═══════════════════════════════════════════════════════════════
// Sink endpoint (sink) — invokes a callback upon receiving data.
// Capabilities: isInput, isPushable

// ═══════════════════════════════════════════════════════════════
// SinkTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'SinkTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new SinkTransfer<number>({
        callback: () => {},
      });

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
// SinkTransfer Push
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSinkPush(),
] as Array<[number]>)(
  'SinkTransfer push calls callback test',
  (value: number) => {
    it('', () => {
      const callback = jest.fn();
      const transfer = new SinkTransfer<number>({ callback });

      transfer.push(value);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing push().
 */
function dataProviderForSinkPush(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'SinkTransfer push calls callback multiple times test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const transfer = new SinkTransfer<number>({ callback });

      transfer.push(1);
      transfer.push(2);
      transfer.push(3);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith(1);
      expect(callback).toHaveBeenCalledWith(2);
      expect(callback).toHaveBeenCalledWith(3);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// SinkTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'SinkTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const transfer = new SinkTransfer<number>({ callback });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

describe(
  'SinkTransfer destroy does not affect callback test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const transfer = new SinkTransfer<number>({ callback });

      transfer.destroy();
      transfer.push(42);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(42);
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// SinkTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'SinkTransfer push with onError suppresses error test',
  () => {
    it('', () => {
      const error = new Error('callback error');
      const onError = jest.fn();
      const transfer = new SinkTransfer<number>({
        callback: () => { throw error; },
        onError,
      });

      transfer.push(42);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);

      transfer.destroy();
    });
  },
);

describe(
  'SinkTransfer push without onError rethrows test',
  () => {
    it('', () => {
      const transfer = new SinkTransfer<number>({
        callback: () => { throw new Error('callback error'); },
      });

      expect(() => transfer.push(42)).toThrow('callback error');

      transfer.destroy();
    });
  },
);

describe(
  'SinkTransfer push with onError continues after error test',
  () => {
    it('', () => {
      let callCount = 0;
      const onError = jest.fn();
      const transfer = new SinkTransfer<number>({
        callback: (n) => {
          callCount++;
          if (callCount === 1) { throw new Error('first error'); }
        },
        onError,
      });

      transfer.push(1); // throws, suppressed
      transfer.push(2); // succeeds

      expect(onError).toHaveBeenCalledTimes(1);
      expect(callCount).toBe(2);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// SinkTransfer Complex Data Types
// ═══════════════════════════════════════════════════════════════

describe(
  'SinkTransfer push with object test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const transfer = new SinkTransfer<{ x: number; y: number }>({ callback });
      const data = { x: 1, y: 2 };

      transfer.push(data);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ x: 1, y: 2 });

      transfer.destroy();
    });
  },
);

describe(
  'SinkTransfer push with array test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const transfer = new SinkTransfer<number[]>({ callback });
      const data = [1, 2, 3];

      transfer.push(data);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([1, 2, 3]);

      transfer.destroy();
    });
  },
);

describe(
  'SinkTransfer push with string test',
  () => {
    it('', () => {
      const callback = jest.fn();
      const transfer = new SinkTransfer<string>({ callback });

      transfer.push('hello');

      expect(callback).toHaveBeenCalledWith('hello');

      transfer.destroy();
    });
  },
);
