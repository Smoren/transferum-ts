import { ChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ChannelTransfer
// ═══════════════════════════════════════════════════════════════
// Output channel with external control via setup/destroy callbacks.
// Capabilities: isOutput, isSubscribable

// ═══════════════════════════════════════════════════════════════
// ChannelTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'ChannelTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new ChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
      });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
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
// ChannelTransfer Subscribe & Emit
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForChannelEmit(),
] as Array<[number]>)(
  'ChannelTransfer emit notifies subscribers test',
  (value: number) => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new ChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      emit(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing emit().
 */
function dataProviderForChannelEmit(): Array<unknown> {
  return [
    [1],
    [42],
    [-5],
  ];
}

describe(
  'ChannelTransfer multiple subscribers receive same value test',
  () => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new ChannelTransfer<number>({
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

describe(
  'ChannelTransfer setup called in constructor test',
  () => {
    it('', () => {
      const setup = jest.fn();
      const transfer = new ChannelTransfer<number>({
        setup,
        destroy: () => {},
      });

      expect(setup).toHaveBeenCalledTimes(1);
      expect(setup).toHaveBeenCalledWith(expect.any(Function));

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ChannelTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'ChannelTransfer destroy calls callback test',
  () => {
    it('', () => {
      const destroy = jest.fn();
      const transfer = new ChannelTransfer<number>({
        setup: () => {},
        destroy,
      });

      transfer.destroy();

      expect(destroy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'ChannelTransfer destroy cleans up subscriptions test',
  () => {
    it('', () => {
      let emit!: (data: number) => void;
      const transfer = new ChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      emit(42);
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ChannelTransfer Error Handling - Setup
// ═══════════════════════════════════════════════════════════════

describe(
  'ChannelTransfer setup error with onSetupError suppresses test',
  () => {
    it('', () => {
      const error = new Error('setup error');
      const onSetupError = jest.fn();

      const transfer = new ChannelTransfer<number>({
        setup: () => { throw error; },
        destroy: () => {},
        onSetupError,
      });

      expect(onSetupError).toHaveBeenCalledTimes(1);
      expect(onSetupError).toHaveBeenCalledWith(error);

      transfer.destroy();
    });
  },
);

describe(
  'ChannelTransfer setup error without onSetupError rethrows test',
  () => {
    it('', () => {
      expect(() => new ChannelTransfer<number>({
        setup: () => { throw new Error('setup error'); },
        destroy: () => {},
      })).toThrow('setup error');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ChannelTransfer Error Handling - Emit
// ═══════════════════════════════════════════════════════════════

describe(
  'ChannelTransfer emit error with onEmitError suppresses test',
  () => {
    it('', () => {
      const error = new Error('handler error');
      const onEmitError = jest.fn();
      let emit!: (data: number) => void;

      const transfer = new ChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
        onEmitError,
      });

      transfer.subscribe(() => { throw error; });
      emit(42);

      expect(onEmitError).toHaveBeenCalledTimes(1);
      expect(onEmitError).toHaveBeenCalledWith(error);

      transfer.destroy();
    });
  },
);

describe(
  'ChannelTransfer emit error without onEmitError rethrows test',
  () => {
    it('', () => {
      let emit!: (data: number) => void;

      const transfer = new ChannelTransfer<number>({
        setup: (e) => { emit = e; },
        destroy: () => {},
      });

      transfer.subscribe(() => { throw new Error('handler error'); });

      expect(() => emit(42)).toThrow('handler error');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ChannelTransfer Error Handling - Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'ChannelTransfer destroy error with onDestroyError suppresses test',
  () => {
    it('', () => {
      const error = new Error('destroy error');
      const onDestroyError = jest.fn();

      const transfer = new ChannelTransfer<number>({
        setup: () => {},
        destroy: () => { throw error; },
        onDestroyError,
      });

      transfer.destroy();

      expect(onDestroyError).toHaveBeenCalledTimes(1);
      expect(onDestroyError).toHaveBeenCalledWith(error);
    });
  },
);

describe(
  'ChannelTransfer destroy error without onDestroyError rethrows test',
  () => {
    it('', () => {
      const transfer = new ChannelTransfer<number>({
        setup: () => {},
        destroy: () => { throw new Error('destroy error'); },
      });

      expect(() => transfer.destroy()).toThrow('destroy error');
    });
  },
);
