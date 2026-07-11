import { StoredChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer
// ═══════════════════════════════════════════════════════════════
// Output channel that stores the last value and is externally controlled.
// Capabilities: isOutput, isPullable, isTriggerable, isSubscribable

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'StoredChannelTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new StoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
      });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isGate).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForStoredPull(),
] as Array<[number]>)(
  'StoredChannelTransfer pull returns current value test',
  (value: number) => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new StoredChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
        initialValue: value,
      });

      expect(transfer.pull()).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing pull().
 */
function dataProviderForStoredPull(): Array<unknown> {
  return [
    [0],
    [1],
    [42],
    [-5],
  ];
}

describe(
  'StoredChannelTransfer pull after emit returns emitted value test',
  () => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new StoredChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
      });

      emit(42);

      expect(transfer.pull()).toBe(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer Trigger & Subscribe
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForStoredTrigger(),
] as Array<[number]>)(
  'StoredChannelTransfer trigger notifies subscribers test',
  (value: number) => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new StoredChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
        initialValue: value,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.trigger();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing trigger().
 */
function dataProviderForStoredTrigger(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'StoredChannelTransfer emit triggers notification test',
  () => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new StoredChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      emit(42);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'StoredChannelTransfer multiple subscribers receive same value test',
  () => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new StoredChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
      });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);
      emit(42);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(42);
      expect(handler2).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'StoredChannelTransfer destroy calls callback test',
  () => {
    it('', () => {
      const destroy = jest.fn();
      const transfer = new StoredChannelTransfer<number>({
        setup: () => {},
        destroy,
      });

      transfer.destroy();

      expect(destroy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'StoredChannelTransfer destroy cleans up subscriptions test',
  () => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new StoredChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      emit(42);
      expect(handler).not.toHaveBeenCalled();

      transfer.trigger();
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer Error Handling - Setup
// ═══════════════════════════════════════════════════════════════

describe(
  'StoredChannelTransfer setup error always rethrows test',
  () => {
    it('', () => {
      expect(() => new StoredChannelTransfer<number>({
        setup: () => { throw new Error('setup error'); },
        destroy: () => {},
      })).toThrow('setup error');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer Error Handling - Trigger
// ═══════════════════════════════════════════════════════════════

describe(
  'StoredChannelTransfer trigger error with onError suppresses test',
  () => {
    it('', () => {
      const error = new Error('handler error');
      const onError = jest.fn();
      const transfer = new StoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
        onError,
        initialValue: 42,
      });

      transfer.subscribe(() => { throw error; });
      transfer.trigger();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error, transfer);

      transfer.destroy();
    });
  },
);

describe(
  'StoredChannelTransfer trigger error without onError rethrows test',
  () => {
    it('', () => {
      const transfer = new StoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
        initialValue: 42,
      });

      transfer.subscribe(() => { throw new Error('handler error'); });

      expect(() => transfer.trigger()).toThrow('handler error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// StoredChannelTransfer Error Handling - Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'StoredChannelTransfer destroy error with onDestroyError suppresses test',
  () => {
    it('', () => {
      const error = new Error('destroy error');
      const onDestroyError = jest.fn();

      const transfer = new StoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => { throw error; },
        onDestroyError,
      });

      transfer.destroy();

      expect(onDestroyError).toHaveBeenCalledTimes(1);
      expect(onDestroyError).toHaveBeenCalledWith(error, transfer);
    });
  },
);

