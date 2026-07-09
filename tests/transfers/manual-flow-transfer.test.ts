import { ManualFlowTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// ManualFlowTransfer
// ═══════════════════════════════════════════════════════════════
// ManualFlowTransfer — a reactive stream with manual control
// of emission via trigger().

// ═══════════════════════════════════════════════════════════════
// ManualFlowTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'ManualFlowTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new ManualFlowTransfer<unknown>();

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isGate).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// ManualFlowTransfer Push & Trigger
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForManualFlowPushNoNotify(),
] as Array<[number]>)(
  'ManualFlowTransfer push does not notify subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualFlowTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);

      expect(handler).not.toHaveBeenCalled();

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing that push() does not notify.
 */
function dataProviderForManualFlowPushNoNotify(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForManualFlowTriggerNotify(),
] as Array<[number]>)(
  'ManualFlowTransfer trigger notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualFlowTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);
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
function dataProviderForManualFlowTriggerNotify(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForManualFlowTriggerClears(),
] as Array<[number, number]>)(
  'ManualFlowTransfer trigger clears state test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new ManualFlowTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);

      transfer.push(value1);
      transfer.trigger();

      transfer.push(value2);
      transfer.trigger();

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, value1);
      expect(handler).toHaveBeenNthCalledWith(2, value2);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing clearing on trigger().
 */
function dataProviderForManualFlowTriggerClears(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

// ═══════════════════════════════════════════════════════════════
// ManualFlowTransfer Multiple Subscribers
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForManualFlowMultipleSubscribers(),
] as Array<[number]>)(
  'ManualFlowTransfer trigger notifies all subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualFlowTransfer<number>();
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      transfer.subscribe(handler1);
      transfer.subscribe(handler2);

      transfer.push(value);
      transfer.trigger();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledWith(value);
      expect(handler2).toHaveBeenCalledWith(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing multiple subscribers.
 */
function dataProviderForManualFlowMultipleSubscribers(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ═══════════════════════════════════════════════════════════════
// ManualFlowTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForManualFlowDestroy(),
] as Array<[number]>)(
  'ManualFlowTransfer destroy cleans up test',
  (value: number) => {
    it('', () => {
      const transfer = new ManualFlowTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);
      transfer.destroy();

      expect(handler).not.toHaveBeenCalled();
      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForManualFlowDestroy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}
