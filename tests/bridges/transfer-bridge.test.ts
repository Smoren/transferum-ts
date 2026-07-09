import {
  TransferBridge,
  PushStoredChannelTransfer,
  ConditionTransfer,
  ConvertTransfer, MapOperator,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// TransferBridge — Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, true],
  [false, false],
] as Array<[boolean, boolean]>)(
  'TransferBridge constructor initial active state test',
  (activated: boolean, expectedActive: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated,
      });

      expect(bridge.active).toBe(expectedActive);

      bridge.destroy();
    });
  },
);

describe.each([
  [5, true],
  [10, true],
  [7, true],
  [0, false],
  [-1, false],
  [-3, false],
] as Array<[number, boolean]>)(
  'TransferBridge constructor applies transformation test',
  (inputValue: number, contains: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const condition = new ConditionTransfer<number>({ shouldAccept: (x) => x > 0 });
      const target = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle: condition,
        middleOwned: false,
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);

      if (contains) {
        expect(received).toContain(inputValue);
      } else {
        expect(received).not.toContain(inputValue);
      }

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransferBridge — Activate
// ═══════════════════════════════════════════════════════════════

describe.each([
  [5, 10],
  [20, 40],
  [100, 200],
] as Array<[number, number]>)(
  'TransferBridge activate from inactive state test',
  (inputValue: number, expectedOutput: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: false,
      });

      expect(bridge.active).toBe(false);

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toEqual([]);

      bridge.activate();
      expect(bridge.active).toBe(true);

      source.push(inputValue);
      expect(received).toContain(inputValue);

      bridge.destroy();
    });
  },
);

describe.each([
  [5],
  [10],
  [0],
] as Array<[number]>)(
  'TransferBridge activate from already active state test',
  (inputValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      bridge.activate();
      expect(bridge.active).toBe(true);

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(inputValue);
      expect(received).toContain(inputValue);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransferBridge — Deactivate
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1, 2],
  [10, 20],
  [42, 100],
] as Array<[number, number]>)(
  'TransferBridge deactivate blocks data flow test',
  (value1: number, value2: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      expect(bridge.active).toBe(true);

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

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
  'TransferBridge deactivate from already inactive state test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
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
// TransferBridge — Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, false, true],
  [false, true, false],
] as Array<[boolean, boolean, boolean]>)(
  'TransferBridge toggle switches active state test',
  (initialActive: boolean, afterFirstToggle: boolean, afterSecondToggle: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
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
  'TransferBridge toggle controls data flow test',
  (value1: number, value2: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

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
// TransferBridge — Data Flow
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1, 2, 3],
  [10, 20, 30],
] as Array<[number, number, number]>)(
  'TransferBridge data flows from source to target test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

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
  'TransferBridge with string data type test',
  (value: string) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<string>();
      const target = new PushStoredChannelTransfer<string>();
      const middle = new PushStoredChannelTransfer<string>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(value);
      expect(received).toContain(value);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransferBridge — Middle Ownership
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
] as Array<[number]>)(
  'TransferBridge destroy with middleOwned=true destroys middle transfer test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middleDestroyMock = jest.fn();
      const middle = new PushStoredChannelTransfer<number>();
      middle.destroy = middleDestroyMock;

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: true,
        activated: true,
      });

      bridge.destroy();

      expect(middleDestroyMock).toHaveBeenCalledTimes(1);
    });
  },
);

describe.each([
  [1],
  [42],
] as Array<[number]>)(
  'TransferBridge destroy with middleOwned=false does not destroy middle transfer test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middleDestroyMock = jest.fn();
      const middle = new PushStoredChannelTransfer<number>();
      middle.destroy = middleDestroyMock;

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      bridge.destroy();

      expect(middleDestroyMock).not.toHaveBeenCalled();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransferBridge — Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1],
  [42],
  [100],
] as Array<[number]>)(
  'TransferBridge destroy stops data flow test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      bridge.destroy();

      const received: number[] = [];
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
  'TransferBridge multiple destroy calls are safe test',
  (testValue: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
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
// TransferBridge — Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe.each([
  [1, 2, 3],
  [10, 20, 30],
] as Array<[number, number, number]>)(
  'TransferBridge start-stop-start cycle test',
  (value1: number, value2: number, value3: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: false,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

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
  'TransferBridge handles edge values test',
  (value: number) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      const received: number[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(value);
      expect(received).toContain(value);

      bridge.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// TransferBridge onStateChange()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'TransferBridge onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new ConvertTransfer<number, number>({
        operator: new MapOperator((n) => n * 2),
      });

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
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
  'TransferBridge onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new ConvertTransfer<number, number>({
        operator: new MapOperator((n) => n * 2),
      });

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
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
  'TransferBridge onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new ConvertTransfer<number, number>({
        operator: new MapOperator((n) => n * 2),
      });

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
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
  'TransferBridge onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<number>();
      const middle = new ConvertTransfer<number, number>({
        operator: new MapOperator((n) => n * 2),
      });

      const bridge = new TransferBridge({
        source,
        target,
        middle,
        middleOwned: false,
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
