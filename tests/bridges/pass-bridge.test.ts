import { PassBridge, PushStoredChannelTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// PassBridge — Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, true],
  [false, false],
] as Array<[boolean, boolean]>)(
  'PassBridge constructor initial active state test',
  (activated: boolean, expectedActive: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated,
      });

      expect(bridge.active).toBe(expectedActive);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PassBridge — Data Flow
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1, 2, 3],
  [10, 20, 30],
] as Array<[number, number, number]>)(
  'PassBridge data flows from source to target test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      source.push(value1);
      source.push(value2);
      source.push(value3);

      expect(received).toContain(value1);
      expect(received).toContain(value2);
      expect(received).toContain(value3);

      bridge.destroy();
    });
  },
);

describe.each([
  ['42'],
  ['hello'],
] as Array<[string]>)(
  'PassBridge with string data type test',
  (value: string) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<string>();
      const target = new PushStoredChannelTransfer<string>();

      const bridge = new PassBridge({
        source,
        target,
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      source.push(value);
      expect(received).toContain(value);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PassBridge — Activate/Deactivate
// ═══════════════════════════════════════════════════════════════

describe.each([
  [5, 10],
  [20, 40],
] as Array<[number, number]>)(
  'PassBridge activate from inactive state test',
  (inputValue: number, secondValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: false,
      });

      expect(bridge.active).toBe(false);

      const received: number[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      source.push(inputValue);
      expect(received).toEqual([]);

      bridge.activate();
      expect(bridge.active).toBe(true);

      source.push(secondValue);
      expect(received).toContain(secondValue);

      bridge.destroy();
    });
  },
);

describe.each([
  [1, 2],
  [10, 20],
] as Array<[number, number]>)(
  'PassBridge deactivate blocks data flow test',
  (value1: number, value2: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: true,
      });

      expect(bridge.active).toBe(true);

      const received: number[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      source.push(value1);
      expect(received).toContain(value1);

      bridge.deactivate();
      expect(bridge.active).toBe(false);

      const beforeCount = received.length;
      source.push(value2);
      expect(received.length).toBe(beforeCount);

      bridge.destroy();
    });
  },
);

describe.each([
  [],
] as Array<[]>)(
  'PassBridge deactivate from already inactive state test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: false,
      });

      expect(bridge.active).toBe(false);
      expect(() => bridge.deactivate()).not.toThrow();
      expect(bridge.active).toBe(false);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PassBridge — Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, false, true],
  [false, true, false],
] as Array<[boolean, boolean, boolean]>)(
  'PassBridge toggle switches active state test',
  (initialActive: boolean, afterFirstToggle: boolean, afterSecondToggle: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
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

describe.each([
  [1, 2],
  [10, 20],
] as Array<[number, number]>)(
  'PassBridge toggle controls data flow test',
  (value1: number, value2: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      source.push(value1);
      expect(received).toContain(value1);

      bridge.toggle();

      const beforeCount = received.length;
      source.push(value2);
      expect(received.length).toBe(beforeCount);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PassBridge — Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
  [100],
] as Array<[number]>)(
  'PassBridge destroy stops data flow test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: true,
      });

      bridge.destroy();

      const received: number[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      source.push(testValue);
      expect(received).toEqual([]);
    });
  },
);

describe.each([
  [1],
  [42],
] as Array<[number]>)(
  'PassBridge multiple destroy calls are safe test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
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
// PassBridge — Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1, 2, 3],
  [10, 20, 30],
] as Array<[number, number, number]>)(
  'PassBridge start-stop-start cycle test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: false,
      });

      const received: number[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      bridge.activate();
      source.push(value1);
      expect(received).toContain(value1);

      bridge.deactivate();
      const beforeCount = received.length;
      source.push(value2);
      expect(received.length).toBe(beforeCount);

      bridge.activate();
      source.push(value3);
      expect(received).toContain(value3);

      bridge.destroy();
    });
  },
);

describe.each([
  [0],
  [-5],
  [100],
] as Array<[number]>)(
  'PassBridge handles edge values test',
  (value: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { if (data !== undefined) received.push(data); });

      source.push(value);
      expect(received).toContain(value);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// PassBridge — subscribeState()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'PassBridge subscribeState notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
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
  'PassBridge subscribeState notifies on toggle test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
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
  'PassBridge subscribeState unsubscribe stops notifications test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
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
  'PassBridge subscribeState handler receives GateInterface test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new PassBridge({
        source,
        target,
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

