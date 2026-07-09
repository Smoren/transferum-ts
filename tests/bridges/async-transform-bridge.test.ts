import {
  AsyncTransformBridge,
  PushStoredChannelTransfer,
  AsyncMapOperator,
  AsyncGuardOperator,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// AsyncTransformBridge
// ═══════════════════════════════════════════════════════════════
// Bridge with async data type transformation via AsyncOperator.
// Structure: source → gate → asyncConverter → target
// Gate and subscription are sync. Transformation via await operator.apply().

// ═══════════════════════════════════════════════════════════════
// Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, true],
  [false, false],
] as Array<[boolean, boolean]>)(
  'AsyncTransformBridge constructor initial active state test',
  (activated: boolean, expectedActive: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated,
      });

      expect(bridge.active).toBe(expectedActive);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Data Flow & Transformation
// ═══════════════════════════════════════════════════════════════

describe.each([
  [5, '5'],
  [10, '10'],
  [42, '42'],
] as Array<[number, string]>)(
  'AsyncTransformBridge transforms number to string test',
  (inputValue: number, expectedOutput: string) => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);

      // asyncPush executes asynchronously
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toContain(expectedOutput);

      bridge.destroy();
    });
  },
);

describe.each([
  [1, 2, 4],
  [10, 20, 40],
] as Array<[number, number, number]>)(
  'AsyncTransformBridge transforms with multiplier test',
  (value1: number, value2: number, multiplier: number) => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, number>(async (n) => n * multiplier),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(value1);
      source.push(value2);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toContain(value1 * multiplier);
      expect(received).toContain(value2 * multiplier);

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge transforms string to length test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<string>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<string, number>(async (s) => s.length),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push('hello');

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toContain(5);

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge object transformation test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<{ id: number; name: string }>();
      const target = new PushStoredChannelTransfer<{ userId: number; displayName: string }>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<{ id: number; name: string }, { userId: number; displayName: string }>(
          async (obj) => ({ userId: obj.id, displayName: obj.name.toUpperCase() }),
        ),
        activated: true,
      });

      const received: Array<{ userId: number; displayName: string }> = [];
      target.subscribe((data) => { received.push(data); });

      source.push({ id: 1, name: 'alice' });

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toContainEqual({ userId: 1, displayName: 'ALICE' });

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge multiple values test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(1);
      source.push(2);
      source.push(3);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toEqual(['1', '2', '3']);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Activate/Deactivate
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncTransformBridge activate from inactive state test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: false,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(5);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      expect(received).toEqual([]);

      bridge.activate();
      expect(bridge.active).toBe(true);

      source.push(10);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      expect(received).toContain('10');

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge deactivate blocks data flow test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(1);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      expect(received).toContain('1');

      bridge.deactivate();
      expect(bridge.active).toBe(false);

      const beforeCount = received.length;
      source.push(2);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      expect(received.length).toBe(beforeCount);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Toggle
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncTransformBridge toggle switches active state test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: false,
      });

      expect(bridge.active).toBe(false);

      const firstResult = bridge.toggle();
      expect(firstResult).toBe(true);
      expect(bridge.active).toBe(true);

      const secondResult = bridge.toggle();
      expect(secondResult).toBe(false);
      expect(bridge.active).toBe(false);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncTransformBridge operator error with onError suppresses test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();
      const onError = jest.fn();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async () => { throw new Error('operator error'); }),
        activated: true,
        onError,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(42);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(received).toEqual([]);

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge with AsyncGuardOperator passes valid data test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0)),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(42);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toContain(42);

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge with AsyncGuardOperator blocks invalid data test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncGuardOperator<number>(async (n) => Promise.resolve(n > 0)),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(-1);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      // Guard returns undefined → sendState() does not notify
      expect(received).toEqual([]);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncTransformBridge destroy stops data flow test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: true,
      });

      bridge.destroy();

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(42);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toEqual([]);
    });
  },
);

describe(
  'AsyncTransformBridge multiple destroy calls are safe test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: true,
      });

      expect(() => {
        bridge.destroy();
        bridge.destroy();
        bridge.destroy();
      }).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// onStateChange
// ═══════════════════════════════════════════════════════════════

describe(
  'AsyncTransformBridge onStateChange notifies on activate/deactivate test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: false,
      });
      const handler = jest.fn();

      bridge.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      bridge.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(bridge);

      bridge.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: false,
      });
      const handler = jest.fn();

      bridge.onStateChange(handler);
      bridge.toggle();

      expect(handler).toHaveBeenCalledTimes(1);

      bridge.destroy();
    });
  },
);

describe(
  'AsyncTransformBridge onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new AsyncTransformBridge({
        source,
        target,
        operator: new AsyncMapOperator<number, string>(async (n) => n.toString()),
        activated: false,
      });
      const handler = jest.fn();

      const subscriber = bridge.onStateChange(handler);
      bridge.activate();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      bridge.deactivate();
      expect(handler).toHaveBeenCalledTimes(1);

      bridge.destroy();
    });
  },
);
