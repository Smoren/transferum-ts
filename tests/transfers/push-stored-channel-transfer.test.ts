import { PushStoredChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer
// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer — a reactive channel that stores
// the last value. Supports push/pull/subscribe/trigger.

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'PushStoredChannelTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<unknown>();

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isGate).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer Push & State
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushStoredChannelPushStores(),
] as Array<[number, number]>)(
  'PushStoredChannelTransfer push stores value for pull test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      transfer.push(value1);
      expect(transfer.pull()).toBe(value1);

      transfer.push(value2);
      expect(transfer.pull()).toBe(value2);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing value retention.
 */
function dataProviderForPushStoredChannelPushStores(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
    [0, 1],
  ];
}

describe.each([
  ...dataProviderForPushStoredChannelPushNotify(),
] as Array<[number]>)(
  'PushStoredChannelTransfer push notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();
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
 * Data provider for testing notification on push().
 */
function dataProviderForPushStoredChannelPushNotify(): Array<unknown> {
  return [
    [1],
    [42],
    [-5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer Trigger
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushStoredChannelTrigger(),
] as Array<[number]>)(
  'PushStoredChannelTransfer trigger notifies subscribers test',
  (value: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();
      const handler = jest.fn();

      transfer.push(value);
      transfer.subscribe(handler);

      // Subscriber does not receive old data automatically
      expect(handler).not.toHaveBeenCalled();

      // trigger() sends the current value
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
function dataProviderForPushStoredChannelTrigger(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

describe.each([
  ...dataProviderForPushStoredChannelTriggerMultiple(),
] as Array<[number, number]>)(
  'PushStoredChannelTransfer multiple triggers notify each time test',
  (value: number, count: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();
      const handler = jest.fn();

      transfer.push(value);
      transfer.subscribe(handler);

      for (let i = 0; i < count; i++) {
        transfer.trigger();
      }

      expect(handler).toHaveBeenCalledTimes(count);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing multiple trigger().
 */
function dataProviderForPushStoredChannelTriggerMultiple(): Array<unknown> {
  return [
    [1, 3],
    [10, 5],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer Pull
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushStoredChannelPullNoClear(),
] as Array<[number]>)(
  'PushStoredChannelTransfer pull does not clear state test',
  (value: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      transfer.push(value);
      expect(transfer.pull()).toBe(value);
      expect(transfer.pull()).toBe(value);
      expect(transfer.pull()).toBe(value);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing that pull() does not clear state.
 */
function dataProviderForPushStoredChannelPullNoClear(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushStoredChannelDestroy(),
] as Array<[number]>)(
  'PushStoredChannelTransfer destroy cleans up test',
  (value: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value);
      expect(handler).toHaveBeenCalledTimes(1);

      transfer.destroy();
      // destroy() should not call handler again
      expect(handler).toHaveBeenCalledTimes(1);
      expect(transfer.pull()).toBeUndefined();

      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForPushStoredChannelDestroy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ═══════════════════════════════════════════════════════════════
// PushStoredChannelTransfer Edge Cases
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForPushStoredChannelOverwrite(),
] as Array<[number, number, number]>)(
  'PushStoredChannelTransfer push overwrites previous value test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const transfer = new PushStoredChannelTransfer<number>();

      transfer.push(value1);
      transfer.push(value2);
      transfer.push(value3);

      expect(transfer.pull()).toBe(value3);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing value overwrite.
 */
function dataProviderForPushStoredChannelOverwrite(): Array<unknown> {
  return [
    [1, 2, 3],
    [10, 20, 30],
  ];
}
