import { TransformBridge, PushStoredChannelTransfer, MapOperator } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// TransformBridge — Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, true],
  [false, false],
] as Array<[boolean, boolean]>)(
  'TransformBridge constructor initial active state test',
  (activated: boolean, expectedActive: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated,
      });

      expect(bridge.active).toBe(expectedActive);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransformBridge — Data Flow & Transformation
// ═══════════════════════════════════════════════════════════════

describe.each([
  [5, '5'],
  [10, '10'],
  [42, '42'],
] as Array<[number, string]>)(
  'TransformBridge transforms number to string test',
  (inputValue: number, expectedOutput: string) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toContain(expectedOutput);

      bridge.destroy();
    });
  },
);

describe.each([
  [1, 2, 4],
  [10, 20, 40],
] as Array<[number, number, number]>)(
  'TransformBridge transforms with multiplier test',
  (value1: number, value2: number, multiplier: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, number>((n) => n * multiplier),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(value1);
      source.push(value2);

      expect(received).toContain(value1 * multiplier);
      expect(received).toContain(value2 * multiplier);

      bridge.destroy();
    });
  },
);

describe.each([
  ['hello', 5],
  ['world', 5],
  ['test', 4],
] as Array<[string, number]>)(
  'TransformBridge transforms string to length test',
  (inputValue: string, expectedLength: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<string>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<string, number>((s) => s.length),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toContain(expectedLength);

      bridge.destroy();
    });
  },
);

describe.each([
  [{ id: 1, name: 'alice' }, { userId: 1, displayName: 'ALICE' }],
  [{ id: 42, name: 'bob' }, { userId: 42, displayName: 'BOB' }],
] as Array<[{ id: number; name: string }, { userId: number; displayName: string }]>)(
  'TransformBridge object transformation test',
  (input: { id: number; name: string }, expected: { userId: number; displayName: string }) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<{ id: number; name: string }>();
      const target = new PushStoredChannelTransfer<{ userId: number; displayName: string }>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<{ id: number; name: string }, { userId: number; displayName: string }>((obj) => ({
          userId: obj.id,
          displayName: obj.name.toUpperCase(),
        })),
        activated: true,
      });

      const received: Array<{ userId: number; displayName: string }> = [];
      target.subscribe((data) => { received.push(data); });

      source.push(input);
      expect(received).toContainEqual(expected);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransformBridge — Data Flow & Transformation
// ═══════════════════════════════════════════════════════════════

describe.each([
  [5, '5'],
  [10, '10'],
  [42, '42'],
] as Array<[number, string]>)(
  'TransformBridge transforms number to string test',
  (inputValue: number, expectedOutput: string) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toContain(expectedOutput);

      bridge.destroy();
    });
  },
);

describe.each([
  [1, 2, 4],
  [10, 20, 40],
] as Array<[number, number, number]>)(
  'TransformBridge transforms with multiplier test',
  (value1: number, value2: number, multiplier: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, number>((n) => n * multiplier),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(value1);
      source.push(value2);

      expect(received).toContain(value1 * multiplier);
      expect(received).toContain(value2 * multiplier);

      bridge.destroy();
    });
  },
);

describe.each([
  ['hello', 5],
  ['world', 5],
  ['test', 4],
] as Array<[string, number]>)(
  'TransformBridge transforms string to length test',
  (inputValue: string, expectedLength: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<string>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<string, number>((s) => s.length),
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toContain(expectedLength);

      bridge.destroy();
    });
  },
);

describe.each([
  [{ id: 1, name: 'alice' }, { userId: 1, displayName: 'ALICE' }],
  [{ id: 42, name: 'bob' }, { userId: 42, displayName: 'BOB' }],
] as Array<[{ id: number; name: string }, { userId: number; displayName: string }]>)(
  'TransformBridge object transformation test',
  (input: { id: number; name: string }, expected: { userId: number; displayName: string }) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<{ id: number; name: string }>();
      const target = new PushStoredChannelTransfer<{ userId: number; displayName: string }>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<{ id: number; name: string }, { userId: number; displayName: string }>((obj) => ({
          userId: obj.id,
          displayName: obj.name.toUpperCase(),
        })),
        activated: true,
      });

      const received: Array<{ userId: number; displayName: string }> = [];
      target.subscribe((data) => { received.push(data); });

      source.push(input);
      expect(received).toContainEqual(expected);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransformBridge — Activate/Deactivate
// ═══════════════════════════════════════════════════════════════

describe.each([
  [5, 10],
  [20, 40],
] as Array<[number, number]>)(
  'TransformBridge activate from inactive state test',
  (inputValue: number, secondValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: false,
      });

      expect(bridge.active).toBe(false);

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toEqual([]);

      bridge.activate();
      expect(bridge.active).toBe(true);

      source.push(secondValue);
      expect(received).toContain(secondValue.toString());

      bridge.destroy();
    });
  },
);

describe.each([
  [1, 2],
  [10, 20],
] as Array<[number, number]>)(
  'TransformBridge deactivate blocks data flow test',
  (value1: number, value2: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: true,
      });

      expect(bridge.active).toBe(true);

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(value1);
      expect(received).toContain(value1.toString());

      bridge.deactivate();
      expect(bridge.active).toBe(false);

      const beforeCount = received.length;
      source.push(value2);
      expect(received.length).toBe(beforeCount);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransformBridge — Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, false, true],
  [false, true, false],
] as Array<[boolean, boolean, boolean]>)(
  'TransformBridge toggle switches active state test',
  (initialActive: boolean, afterFirstToggle: boolean, afterSecondToggle: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: initialActive,
      });

      expect(bridge.active).toBe(initialActive);

      const firstResult = bridge.toggle();
      expect(firstResult).toBe(afterFirstToggle);
      expect(bridge.active).toBe(afterFirstToggle);

      const secondResult = bridge.toggle();
      expect(secondResult).toBe(afterSecondToggle);
      expect(bridge.active).toBe(afterSecondToggle);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransformBridge — Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
] as Array<[number]>)(
  'TransformBridge destroy stops data flow test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: true,
      });

      bridge.destroy();

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(testValue);
      expect(received).toEqual([]);
    });
  },
);

describe.each([
  [1],
  [42],
] as Array<[number]>)(
  'TransformBridge multiple destroy calls are safe test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
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
// TransformBridge — Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1, 2, 3],
  [10, 20, 30],
] as Array<[number, number, number]>)(
  'TransformBridge start-stop-start cycle test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: false,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      bridge.activate();
      source.push(value1);
      expect(received).toContain(value1.toString());

      bridge.deactivate();
      const beforeCount = received.length;
      source.push(value2);
      expect(received.length).toBe(beforeCount);

      bridge.activate();
      source.push(value3);
      expect(received).toContain(value3.toString());

      bridge.destroy();
    });
  },
);

describe.each([
  [0, '0'],
  [-5, '-5'],
  [100, '100'],
] as Array<[number, string]>)(
  'TransformBridge handles edge values test',
  (inputValue: number, expectedOutput: string) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator<number, string>((n) => n.toString()),
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toContain(expectedOutput);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransformBridge onStateChange()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'TransformBridge onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator((n) => String(n)),
        activated: initialState,
      });
      const handler = jest.fn();

      bridge.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      bridge.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(bridge);

      bridge.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(bridge);

      bridge.destroy();
    });
  },
);

describe(
  'TransformBridge onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator((n) => String(n)),
        activated: false,
      });
      const handler = jest.fn();

      bridge.onStateChange(handler);
      bridge.toggle();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(bridge);

      bridge.destroy();
    });
  },
);

describe(
  'TransformBridge onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator((n) => String(n)),
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

describe(
  'TransformBridge onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new TransformBridge({
        source,
        target,
        operator: new MapOperator((n) => String(n)),
        activated: false,
      });
      let receivedGate: any = null;

      bridge.onStateChange((g) => { receivedGate = g; });
      bridge.activate();

      expect(receivedGate).toBe(bridge);
      expect(receivedGate.active).toBe(true);

      bridge.destroy();
    });
  },
);
