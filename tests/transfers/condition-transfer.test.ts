import { ConditionTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer
// ═══════════════════════════════════════════════════════════════
// Transfer with conditional filtering on input and output.
// Capabilities: isInput, isOutput, isPushable, isSubscribable

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'ConditionTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: () => true,
      });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer Push & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForConditionPush(),
] as Array<[number]>)(
  'ConditionTransfer push with default conditions notifies test',
  (value: number) => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldEmit: () => true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing push().
 */
function dataProviderForConditionPush(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'ConditionTransfer shouldAccept false blocks data test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => false,
        shouldEmit: () => true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForConditionAccept(),
] as Array<[number, boolean, boolean]>)(
  'ConditionTransfer shouldAccept filters data test',
  (value: number, shouldAccept: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: (v) => v === value && shouldAccept,
        shouldEmit: () => true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      if (expected) {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(value);
      } else {
        expect(handler).not.toHaveBeenCalled();
      }

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing shouldAccept.
 * [value, shouldAccept, expectedNotified]
 */
function dataProviderForConditionAccept(): Array<unknown> {
  return [
    [42, true, true],    // accepts 42
    [42, false, false],  // rejects 42
    [0, true, true],     // accepts 0
    [0, false, false],   // rejects 0
  ];
}

describe(
  'ConditionTransfer shouldEmit false holds data test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: () => false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForConditionEmit(),
] as Array<[number, boolean, boolean]>)(
  'ConditionTransfer shouldEmit controls emission test',
  (value: number, shouldEmit: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: (v) => v === value && shouldEmit,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      if (expected) {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(value);
      } else {
        expect(handler).not.toHaveBeenCalled();
      }

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing shouldEmit.
 * [value, shouldEmit, expectedNotified]
 */
function dataProviderForConditionEmit(): Array<unknown> {
  return [
    [42, true, true],    // emits 42
    [42, false, false],  // holds 42
    [0, true, true],     // emits 0
    [0, false, false],   // holds 0
  ];
}

describe(
  'ConditionTransfer trigger manually emits test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: () => false, // never emit automatically
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(handler).not.toHaveBeenCalled();

      // Override shouldEmit for manual trigger
      (transfer as any)._shouldEmit = () => true;
      transfer.trigger();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'ConditionTransfer destroy cleans up subscriptions test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: () => true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      transfer.push(42);
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

describe(
  'ConditionTransfer destroy is idempotent test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: () => true,
      });

      expect(() => transfer.destroy()).not.toThrow();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'ConditionTransfer push with shouldAccept error and onAcceptError suppresses test',
  () => {
    it('', () => {
      const error = new Error('shouldAccept error');
      const onAcceptError = jest.fn();
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => { throw error; },
        shouldEmit: () => true,
        onAcceptError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(onAcceptError).toHaveBeenCalledTimes(1);
      expect(onAcceptError).toHaveBeenCalledWith(error, transfer);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'ConditionTransfer push with shouldAccept error without onAcceptError rethrows test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => { throw new Error('shouldAccept error'); },
        shouldEmit: () => true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Error is rethrown when onAcceptError is not provided
      expect(() => transfer.push(42)).toThrow('shouldAccept error');
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'ConditionTransfer trigger with shouldEmit error without onEmitError rethrows test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: () => { throw new Error('shouldEmit error'); },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);

      // Error is rethrown when onEmitError is not provided
      expect(() => transfer.push(42)).toThrow('shouldEmit error');

      // Error is rethrown when onEmitError is not provided
      expect(() => transfer.trigger()).toThrow('shouldEmit error');

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'ConditionTransfer trigger with shouldEmit error and onEmitError suppresses test',
  () => {
    it('', () => {
      const error = new Error('shouldEmit error');
      const onEmitError = jest.fn();
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: () => {
          throw error;
        },
        onEmitError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(onEmitError).toHaveBeenCalledTimes(1);
      expect(onEmitError).toHaveBeenCalledWith(error, transfer);
      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

describe(
  'ConditionTransfer shouldAccept and shouldEmit errors use separate handlers test',
  () => {
    it('', () => {
      const onAcceptError = jest.fn();
      const onEmitError = jest.fn();
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => { throw new Error('accept error'); },
        shouldEmit: () => { throw new Error('emit error'); },
        onAcceptError,
        onEmitError,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      // shouldAccept fires first — onAcceptError called, onEmitError not called
      expect(onAcceptError).toHaveBeenCalledTimes(1);
      expect(onEmitError).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ConditionTransfer Complex Conditions
// ═══════════════════════════════════════════════════════════════

describe(
  'ConditionTransfer filter even numbers test',
  () => {
    it('', () => {
      const transfer = new ConditionTransfer<number>({
        shouldAccept: (n) => n % 2 === 0,
        shouldEmit: () => true,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(2);
      transfer.push(3);
      transfer.push(4);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(2);
      expect(handler).toHaveBeenCalledWith(4);

      transfer.destroy();
    });
  },
);

describe(
  'ConditionTransfer block duplicates test',
  () => {
    it('', () => {
      let lastEmitted: number | undefined = undefined;
      const transfer = new ConditionTransfer<number>({
        shouldAccept: () => true,
        shouldEmit: (current) => {
          if (current === lastEmitted) {
            return false;
          }
          lastEmitted = current;
          return true;
        },
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(1);
      transfer.push(1);
      transfer.push(2);
      transfer.push(2);
      transfer.push(3);

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenCalledWith(1);
      expect(handler).toHaveBeenCalledWith(2);
      expect(handler).toHaveBeenCalledWith(3);

      transfer.destroy();
    });
  },
);
