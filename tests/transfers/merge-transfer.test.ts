import { MergeTransfer, PushChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// MergeTransfer
// ═══════════════════════════════════════════════════════════════
// MergeTransfer — aggregates multiple sources into a single stream.

// ═══════════════════════════════════════════════════════════════
// MergeTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'MergeTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new MergeTransfer<number>({ sources: [] });

      expect(transfer.isInput).toBe(false);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(false);
      expect(transfer.isPushable).toBe(false);
      expect(transfer.isSubscribable).toBe(true);
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
// MergeTransfer Subscribe to Sources
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForMergeSingleSource(),
] as Array<[number]>)(
  'MergeTransfer receives data from single source test',
  (value: number) => {
    it('', () => {
      const source = new PushChannelTransfer<number>();
      const merge = new MergeTransfer<number>({ sources: [source] });
      const handler = jest.fn();

      merge.subscribe(handler);
      source.push(value);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value);

      merge.destroy();
      source.destroy();
    });
  },
);

/**
 * Data provider for testing a single source.
 */
function dataProviderForMergeSingleSource(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForMergeMultipleSources(),
] as Array<[number, number, number]>)(
  'MergeTransfer receives data from multiple sources test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const source1 = new PushChannelTransfer<number>();
      const source2 = new PushChannelTransfer<number>();
      const merge = new MergeTransfer<number>({ sources: [source1, source2] });
      const handler = jest.fn();

      merge.subscribe(handler);

      source1.push(value1);
      source2.push(value2);
      source1.push(value3);

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenNthCalledWith(1, value1);
      expect(handler).toHaveBeenNthCalledWith(2, value2);
      expect(handler).toHaveBeenNthCalledWith(3, value3);

      merge.destroy();
      source1.destroy();
      source2.destroy();
    });
  },
);

/**
 * Data provider for testing multiple sources.
 */
function dataProviderForMergeMultipleSources(): Array<unknown> {
  return [
    [1, 2, 3],
    [10, 20, 30],
  ];
}

// ═══════════════════════════════════════════════════════════════
// MergeTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForMergeDestroyUnsubscribes(),
] as Array<[number]>)(
  'MergeTransfer destroy unsubscribes from all sources test',
  (value: number) => {
    it('', () => {
      const source1 = new PushChannelTransfer<number>();
      const source2 = new PushChannelTransfer<number>();
      const merge = new MergeTransfer<number>({ sources: [source1, source2] });
      const handler = jest.fn();

      merge.subscribe(handler);
      merge.destroy();

      // After destroy(), sources should not notify merge
      source1.push(value);
      source2.push(value);

      expect(handler).not.toHaveBeenCalled();

      source1.destroy();
      source2.destroy();
    });
  },
);

/**
 * Data provider for testing unsubscription on destroy().
 */
function dataProviderForMergeDestroyUnsubscribes(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ═══════════════════════════════════════════════════════════════
// onUnsubscribe callback tests are covered in helpers/subscriber.test.ts
