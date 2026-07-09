import { SplitTransfer, PushChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// SplitTransfer
// ═══════════════════════════════════════════════════════════════
// SplitTransfer — splits a stream into multiple targets.

// ═══════════════════════════════════════════════════════════════
// SplitTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'SplitTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new SplitTransfer<number>({ targets: [] });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(false);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(false);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isGate).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// SplitTransfer Push to Targets
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSplitSingleTarget(),
] as Array<[number]>)(
  'SplitTransfer pushes to single target test',
  (value: number) => {
    it('', () => {
      const target = new PushChannelTransfer<number>();
      const split = new SplitTransfer<number>({ targets: [target] });
      const handler = jest.fn();

      target.subscribe(handler);
      split.push(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      split.destroy();
      target.destroy();
    });
  },
);

/**
 * Data provider for testing a single target.
 */
function dataProviderForSplitSingleTarget(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForSplitMultipleTargets(),
] as Array<[number, number, number]>)(
  'SplitTransfer pushes to all targets test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const target1 = new PushChannelTransfer<number>();
      const target2 = new PushChannelTransfer<number>();
      const split = new SplitTransfer<number>({ targets: [target1, target2] });
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      target1.subscribe(handler1);
      target2.subscribe(handler2);

      split.push(value1);
      split.push(value2);
      split.push(value3);

      expect(handler1).toHaveBeenCalledTimes(3);
      expect(handler2).toHaveBeenCalledTimes(3);

      expect(handler1).toHaveBeenNthCalledWith(1, value1);
      expect(handler1).toHaveBeenNthCalledWith(2, value2);
      expect(handler1).toHaveBeenNthCalledWith(3, value3);

      expect(handler2).toHaveBeenNthCalledWith(1, value1);
      expect(handler2).toHaveBeenNthCalledWith(2, value2);
      expect(handler2).toHaveBeenNthCalledWith(3, value3);

      split.destroy();
      target1.destroy();
      target2.destroy();
    });
  },
);

/**
 * Data provider for testing multiple targets.
 */
function dataProviderForSplitMultipleTargets(): Array<unknown> {
  return [
    [1, 2, 3],
    [10, 20, 30],
  ];
}

// ═══════════════════════════════════════════════════════════════
// SplitTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForSplitDestroy(),
] as Array<[number]>)(
  'SplitTransfer destroy clears targets list test',
  (value: number) => {
    it('', () => {
      const target = new PushChannelTransfer<number>();
      const split = new SplitTransfer<number>({ targets: [target] });
      const handler = jest.fn();

      target.subscribe(handler);
      split.destroy();

      // After destroy(), targets is cleared
      split.push(value);
      expect(handler).not.toHaveBeenCalled();

      target.destroy();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForSplitDestroy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe(
  'SplitTransfer destroy does not destroy targets test',
  () => {
    it('', () => {
      const target = new PushChannelTransfer<number>();
      const split = new SplitTransfer<number>({ targets: [target] });
      const handler = jest.fn();

      target.subscribe(handler);
      split.destroy();

      // target should remain functional
      target.push(1);
      expect(handler).toHaveBeenCalledTimes(1);

      target.destroy();
    });
  },
);

