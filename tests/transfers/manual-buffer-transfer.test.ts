import { ManualBufferTransfer } from '../../src';
import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ManualBufferTransfer
// ═══════════════════════════════════════════════════════════════
// ManualBufferTransfer — a buffer with manual control via trigger().
// pull() returns data only after trigger().

// ═══════════════════════════════════════════════════════════════
// ManualBufferTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'ManualBufferTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new ManualBufferTransfer<unknown>();

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isSubscribable).toBe(false);
      expect(transfer.isGate).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ManualBufferTransfer Trigger & Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForManualBufferTriggerPull(),
] as Array<[number]>)(
  'ManualBufferTransfer pull returns undefined without trigger test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualBufferTransfer<number>();

      transfer.push(value);
      expect(transfer.pull()).toBeUndefined();

      transfer.trigger();
      expect(transfer.pull()).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing trigger/pull.
 */
function dataProviderForManualBufferTriggerPull(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForManualBufferTriggerResets(),
] as Array<[number, number]>)(
  'ManualBufferTransfer trigger flag resets after pull test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new ManualBufferTransfer<number>();

      transfer.push(value1);
      transfer.trigger();

      expect(transfer.pull()).toBe(value1);
      expect(transfer.pull()).toBeUndefined();

      transfer.trigger();
      expect(transfer.pull()).toBeUndefined();

      transfer.push(value2);
      transfer.trigger();
      expect(transfer.pull()).toBe(value2);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing flag reset.
 */
function dataProviderForManualBufferTriggerResets(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

describe.each([
  ...dataProviderForManualBufferMultipleTriggers(),
] as Array<[number, number]>)(
  'ManualBufferTransfer multiple triggers without pull test',
  (value: number, count: number) => {
    it('', () => {
      const transfer = new ManualBufferTransfer<number>();

      transfer.push(value);

      for (let i = 0; i < count; i++) {
        transfer.trigger();
      }

      // After the first pull(), data is extracted
      expect(transfer.pull()).toBe(value);
      // Then undefined
      expect(transfer.pull()).toBeUndefined();

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing multiple trigger().
 */
function dataProviderForManualBufferMultipleTriggers(): Array<unknown> {
  return [
    [1, 3],
    [10, 5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// ManualBufferTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForManualBufferDestroy(),
] as Array<[number]>)(
  'ManualBufferTransfer destroy clears state test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualBufferTransfer<number>();

      transfer.push(value);
      transfer.trigger();
      transfer.destroy();

      expect(transfer.pull()).toBeUndefined();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForManualBufferDestroy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}
