import { GateTransfer } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// GateTransfer
// ═══════════════════════════════════════════════════════════════
// GateTransfer — transfer with state management (gate).
// Passes data only when active === true.

// ═══════════════════════════════════════════════════════════════
// GateTransfer Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe(
  'GateTransfer has correct capability flags test',
  () => {
    it('', () => {
      const transfer = new GateTransfer<unknown>({ activated: true });

      expect(transfer.isInput).toBe(true);
      expect(transfer.isOutput).toBe(true);
      expect(transfer.isDuplex).toBe(true);
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isGate).toBe(true);
      expect(transfer.isPullable).toBe(false);
      expect(transfer.isTriggerable).toBe(false);
      expect(transfer.isPollingSource).toBe(false);
      expect(transfer.isPollingProxy).toBe(false);

      transfer.destroy();
    });
  },
);

describe.each([
  ...dataProviderForGateInitialActive(),
] as Array<[boolean, boolean]>)(
  'GateTransfer initial active state test',
  (activated: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated });

      expect(transfer.active).toBe(expected);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing initial state.
 */
function dataProviderForGateInitialActive(): Array<unknown> {
  return [
    [true, true],
    [false, false],
  ];
}

// ═══════════════════════════════════════════════════════════════
// GateTransfer Active State
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForGateBlocksWhenInactive(),
] as Array<[number, number]>)(
  'GateTransfer blocks data when inactive test',
  (value1: number, value2: number) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: false });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(value1);
      expect(handler).not.toHaveBeenCalled();

      transfer.activate();
      transfer.push(value2);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(value2);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing blocking.
 */
function dataProviderForGateBlocksWhenInactive(): Array<unknown> {
  return [
    [1, 2],
    [10, 20],
  ];
}

describe.each([
  ...dataProviderForGateActivate(),
] as Array<[boolean]>)(
  'GateTransfer activate changes state to true test',
  (initialActive: boolean) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: initialActive });

      transfer.activate();
      expect(transfer.active).toBe(true);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing activate().
 */
function dataProviderForGateActivate(): Array<unknown> {
  return [
    [true],
    [false],
  ];
}

describe.each([
  ...dataProviderForGateDeactivate(),
] as Array<[boolean]>)(
  'GateTransfer deactivate changes state to false test',
  (initialActive: boolean) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: initialActive });

      transfer.deactivate();
      expect(transfer.active).toBe(false);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing deactivate().
 */
function dataProviderForGateDeactivate(): Array<unknown> {
  return [
    [true],
    [false],
  ];
}

describe.each([
  ...dataProviderForGateToggle(),
] as Array<[boolean, boolean]>)(
  'GateTransfer toggle switches state test',
  (initialActive: boolean, expected: boolean) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: initialActive });

      const result = transfer.toggle();

      expect(result).toBe(expected);
      expect(transfer.active).toBe(expected);

      transfer.destroy();
    });
  },
);

/**
 * Data provider for testing toggle().
 */
function dataProviderForGateToggle(): Array<unknown> {
  return [
    [true, false],
    [false, true],
  ];
}

// ═══════════════════════════════════════════════════════════════
// GateTransfer Destroy
// ═══════════════════════════════════════════════════════════════

describe.each([
  ...dataProviderForGateDestroy(),
] as Array<[number]>)(
  'GateTransfer destroy deactivates and cleans up test',
  (value: number) => {
    it('', () => {
      const transfer = new GateTransfer<number>({ activated: true });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.destroy();

      expect(transfer.active).toBe(false);
      transfer.push(value);
      expect(handler).not.toHaveBeenCalled();

      expect(() => transfer.destroy()).not.toThrow();
    });
  },
);

/**
 * Data provider for testing destroy().
 */
function dataProviderForGateDestroy(): Array<unknown> {
  return [
    [1],
    [42],
  ];
}

// ═══════════════════════════════════════════════════════════════
// GateTransfer subscribeState()
// ═══════════════════════════════════════════════════════════════
// subscribeState() allows subscribing to gate state changes
// (active/inactive). Subscribers receive the GateInterface in the callback.

describe.each([
  ...dataProviderForSubscribeStateActivateDeactivate(),
] as Array<[boolean]>)(
  'GateTransfer subscribeState notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: initialState });
      const handler = jest.fn();

      gate.onStateChange(handler);

      expect(handler).not.toHaveBeenCalled();

      gate.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(gate);

      gate.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(gate);

      gate.destroy();
    });
  },
);

function dataProviderForSubscribeStateActivateDeactivate(): Array<unknown> {
  return [
    [true],
    [false],
  ];
}

describe.each([
  ...dataProviderForSubscribeStateToggle(),
] as Array<[boolean]>)(
  'GateTransfer subscribeState notifies on toggle test',
  (initialState: boolean) => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: initialState });
      const handler = jest.fn();

      gate.onStateChange(handler);

      gate.toggle();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(gate);

      gate.toggle();
      expect(handler).toHaveBeenCalledTimes(2);

      gate.destroy();
    });
  },
);

function dataProviderForSubscribeStateToggle(): Array<unknown> {
  return [
    [true],
    [false],
  ];
}

describe.each([
  ...dataProviderForSubscribeStateMultipleSubscribers(),
] as Array<[number]>)(
  'GateTransfer subscribeState notifies all subscribers test',
  (subscriberCount: number) => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      const handlers = Array.from({ length: subscriberCount }, () => jest.fn());

      handlers.forEach(handler => gate.onStateChange(handler));

      gate.activate();

      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(gate);
      });

      gate.destroy();
    });
  },
);

function dataProviderForSubscribeStateMultipleSubscribers(): Array<unknown> {
  return [
    [2],
    [5],
  ];
}

describe(
  'GateTransfer subscribeState unsubscribe stops notifications test',
  () => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      const handler = jest.fn();

      const subscriber = gate.onStateChange(handler);

      gate.activate();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();

      gate.deactivate();
      expect(handler).toHaveBeenCalledTimes(1);

      gate.destroy();
    });
  },
);

describe(
  'GateTransfer destroy cleans up subscribeState subscriptions test',
  () => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      const handler = jest.fn();

      gate.onStateChange(handler);
      gate.destroy();

      expect(() => gate.activate()).not.toThrow();
      expect(handler).not.toHaveBeenCalled();
    });
  },
);

describe(
  'GateTransfer subscribeState handler receives GateInterface test',
  () => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      let receivedGate: any = null;

      gate.onStateChange((g) => {
        receivedGate = g;
      });

      gate.activate();

      expect(receivedGate).toBe(gate);
      expect(receivedGate.active).toBe(true);
      expect(typeof receivedGate.activate).toBe('function');
      expect(typeof receivedGate.deactivate).toBe('function');
      expect(typeof receivedGate.toggle).toBe('function');

      gate.destroy();
    });
  },
);

describe(
  'GateTransfer subscribeState receives all state changes test',
  () => {
    it('', () => {
      const gate = new GateTransfer<number>({ activated: false });
      const states: boolean[] = [];

      gate.onStateChange((g) => {
        states.push(g.active);
      });

      gate.activate();    // true
      gate.toggle();      // false
      gate.activate();    // true
      gate.deactivate();  // false
      gate.toggle();      // true

      expect(states).toEqual([true, false, true, false, true]);

      gate.destroy();
    });
  },
);

