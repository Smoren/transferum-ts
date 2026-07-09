import { AsyncStoredChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncStoredChannelTransfer
// ═══════════════════════════════════════════════════════════════
// Output channel that stores a value, is externally controlled, and has an async interface.
// setup/emit/subscribe are sync, pull/trigger are async.
// Capabilities: isOutput, isSubscribable, isAsyncPullable, isAsyncTriggerable

// ═══════════════════════════════════════════════════════════════
// AsyncStoredChannelTransfer Capability Flags
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncStoredChannelTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
      });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isAsyncPushable).toBe(false);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);
      expect(transfer.isAsyncPollingProxy).toBe(false);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isAsyncTriggerable).toBe(true);
      expect(transfer.isGate).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncStoredChannelTransfer setup & emit & subscribe
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncStoredChannelTransfer setup calls setup callback with emit test',
  () => {
    it('', () => {
      const setup = jest.fn((emit: any) => { emit(42); });
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup,
        destroy: () => {},
      });

      expect(setup).toHaveBeenCalledTimes(1);
      expect(setup).toHaveBeenCalledWith(expect.any(Function));

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer emit notifies subscribers test',
  () => {
    it('', async () => {
      let emitFn: ((data: number) => void) | null = null;
      const handler = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
      });

      transfer.subscribe(handler);
      emitFn!(42);

      // emit calls asyncTrigger (fire-and-forget), waiting for microtask
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer emit with zero value notifies subscribers test',
  () => {
    it('', async () => {
      let emitFn: ((data: number) => void) | null = null;
      const handler = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
      });

      transfer.subscribe(handler);
      emitFn!(0);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(0);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer emit with negative value notifies subscribers test',
  () => {
    it('', async () => {
      let emitFn: ((data: number) => void) | null = null;
      const handler = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
      });

      transfer.subscribe(handler);
      emitFn!(-5);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(-5);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer emit stores value for asyncPull test',
  () => {
    it('', async () => {
      let emitFn: ((data: number) => void) | null = null;
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
      });

      emitFn!(42);

      const result = await transfer.asyncPull();
      expect(result).toBe(42);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer asyncPull returns undefined without emit test',
  () => {
    it('', async () => {
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
      });

      const result = await transfer.asyncPull();
      expect(result).toBeUndefined();

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer asyncPull returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
      });

      const result = transfer.asyncPull();
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncStoredChannelTransfer asyncTrigger notifies subscribers test',
  () => {
    it('', async () => {
      let emitFn: ((data: number) => void) | null = null;
      const handler = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
      });

      transfer.subscribe(handler);

      emitFn!(42);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      expect(handler).toHaveBeenCalledTimes(1);

      await transfer.asyncTrigger();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenLastCalledWith(42);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer asyncTrigger returns Promise test',
  () => {
    it('', () => {
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
      });

      const result = transfer.asyncTrigger();
      expect(result).toBeInstanceOf(Promise);
    });
  },
);

describe(
  'AsyncStoredChannelTransfer with initialValue test',
  () => {
    it('', async () => {
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
        initialValue: 99,
      });

      const result = await transfer.asyncPull();
      expect(result).toBe(99);

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer multiple emit notifies multiple times test',
  () => {
    it('', async () => {
      let emitFn: ((data: number) => void) | null = null;
      const received: number[] = [];
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
      });

      transfer.subscribe((data) => { received.push(data); });

      emitFn!(1);
      emitFn!(2);
      emitFn!(3);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toEqual([1, 2, 3]);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncStoredChannelTransfer Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncStoredChannelTransfer setup error with onSetupError suppresses test',
  () => {
    it('', () => {
      const onSetupError = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => { throw new Error('setup error'); },
        destroy: () => {},
        onSetupError,
      });

      expect(onSetupError).toHaveBeenCalledTimes(1);
      expect(onSetupError).toHaveBeenCalledWith(expect.any(Error));

      transfer.destroy();
    });
  },
);

describe(
  'AsyncStoredChannelTransfer setup error without onSetupError rethrows test',
  () => {
    it('', () => {
      expect(() => new AsyncStoredChannelTransfer<number>({
        setup: () => { throw new Error('setup error'); },
        destroy: () => {},
      })).toThrow('setup error');
    });
  },
);

describe(
  'AsyncStoredChannelTransfer destroy error with onDestroyError suppresses test',
  () => {
    it('', () => {
      const onDestroyError = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => { throw new Error('destroy error'); },
        onDestroyError,
      });

      transfer.destroy();

      expect(onDestroyError).toHaveBeenCalledTimes(1);
      expect(onDestroyError).toHaveBeenCalledWith(expect.any(Error));
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncStoredChannelTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncStoredChannelTransfer destroy calls external destroy test',
  () => {
    it('', () => {
      const externalDestroy = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: externalDestroy,
      });

      transfer.destroy();

      expect(externalDestroy).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'AsyncStoredChannelTransfer destroy stops notifications test',
  () => {
    it('', async () => {
      let emitFn: ((data: number) => void) | null = null;
      const handler = jest.fn();
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
      });

      transfer.subscribe(handler);
      transfer.destroy();

      emitFn!(42);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(handler).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// AsyncStoredChannelTransfer asyncTrigger Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncStoredChannelTransfer asyncTrigger error with onEmitError suppresses test',
  () => {
    it('', async () => {
      const onEmitError = jest.fn();
      let emitFn: ((data: number) => void) | null = null;
      const transfer = new AsyncStoredChannelTransfer<number>({
        setup: (emit) => { emitFn = emit; },
        destroy: () => {},
        onEmitError,
      });

      // Subscribe a handler that throws an error
      transfer.subscribe(() => { throw new Error('handler error'); });

      emitFn!(42);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(onEmitError).toHaveBeenCalledTimes(1);
      expect(onEmitError).toHaveBeenCalledWith(expect.any(Error));

      transfer.destroy();
    });
  },
);

