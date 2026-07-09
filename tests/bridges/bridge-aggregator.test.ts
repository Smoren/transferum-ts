import type { BridgeInterface } from '../../src';
import { BridgeAggregator } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator — Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, true],
  [false, false],
] as Array<[boolean, boolean]>)(
  'BridgeAggregator constructor initial active state test',
  (activated: boolean, expectedActive: boolean) => {
    it('', () => {
      const bridge1 = createMockBridge(true);
      const bridge2 = createMockBridge(true);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated,
        owned: false,
      });

      expect(aggregator.active).toBe(expectedActive);

      aggregator.destroy();
    });
  },
);

describe(
  'BridgeAggregator with empty bridges array test',
  () => {
    it('', () => {
      const aggregator = new BridgeAggregator({
        bridges: [],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(false);

      aggregator.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator — Activate
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeAggregator activate activates all bridges test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2, bridge3],
        activated: false,
        owned: false,
      });

      expect(aggregator.active).toBe(false);

      aggregator.activate();

      expect(aggregator.active).toBe(true);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);
      expect(bridge3.active).toBe(true);

      aggregator.destroy();
    });
  },
);

describe(
  'BridgeAggregator activate from already active state test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(true);
      const bridge2 = createMockBridge(true);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(true);

      aggregator.activate();

      expect(aggregator.active).toBe(true);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);

      aggregator.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator — Deactivate
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeAggregator deactivate deactivates all bridges test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(true);
      const bridge2 = createMockBridge(true);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(true);

      aggregator.deactivate();

      expect(aggregator.active).toBe(false);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(false);

      aggregator.destroy();
    });
  },
);

describe(
  'BridgeAggregator deactivate from already inactive state test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: false,
        owned: false,
      });

      expect(aggregator.active).toBe(false);

      aggregator.deactivate();

      expect(aggregator.active).toBe(false);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(false);

      aggregator.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator — Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, false, true],
  [false, true, false],
] as Array<[boolean, boolean, boolean]>)(
  'BridgeAggregator toggle switches active state test',
  (initialActive: boolean, afterFirstToggle: boolean, afterSecondToggle: boolean) => {
    it('', () => {
      const bridge1 = createMockBridge(initialActive);
      const bridge2 = createMockBridge(initialActive);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: initialActive,
        owned: false,
      });

      expect(aggregator.active).toBe(initialActive);

      const firstResult = aggregator.toggle();
      expect(firstResult).toBe(afterFirstToggle);
      expect(aggregator.active).toBe(afterFirstToggle);

      const secondResult = aggregator.toggle();
      expect(secondResult).toBe(afterSecondToggle);
      expect(aggregator.active).toBe(afterSecondToggle);

      aggregator.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator — Active State Logic
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeAggregator active is true only when all bridges are active test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(true);
      const bridge2 = createMockBridge(true);
      const bridge3 = createMockBridge(true);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2, bridge3],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(true);

      // Deactivate one bridge
      bridge2.deactivate();
      expect(aggregator.active).toBe(false);

      // Deactivate another one
      bridge3.deactivate();
      expect(aggregator.active).toBe(false);

      // Reactivate all
      bridge2.activate();
      bridge3.activate();
      expect(aggregator.active).toBe(true);

      aggregator.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator — Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeAggregator destroy with owned=true destroys all bridges test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(true);
      const bridge2 = createMockBridge(true);

      const destroySpy1 = jest.fn();
      const destroySpy2 = jest.fn();
      bridge1.destroy = destroySpy1;
      bridge2.destroy = destroySpy2;

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: true,
      });

      aggregator.destroy();

      expect(destroySpy1).toHaveBeenCalledTimes(1);
      expect(destroySpy2).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'BridgeAggregator destroy with owned=false does not destroy bridges test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(true);
      const bridge2 = createMockBridge(true);

      const destroySpy1 = jest.fn();
      const destroySpy2 = jest.fn();
      bridge1.destroy = destroySpy1;
      bridge2.destroy = destroySpy2;

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      aggregator.destroy();

      expect(destroySpy1).not.toHaveBeenCalled();
      expect(destroySpy2).not.toHaveBeenCalled();
    });
  },
);

describe(
  'BridgeAggregator multiple destroy calls are safe test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(true);
      const bridge2 = createMockBridge(true);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      expect(() => {
        aggregator.destroy();
        aggregator.destroy();
        aggregator.destroy();
      }).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator — Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeAggregator start-stop-start cycle test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: false,
        owned: false,
      });

      aggregator.activate();
      expect(aggregator.active).toBe(true);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);

      aggregator.deactivate();
      expect(aggregator.active).toBe(false);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(false);

      aggregator.activate();
      expect(aggregator.active).toBe(true);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);

      aggregator.destroy();
    });
  },
);

describe(
  'BridgeAggregator with single bridge test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(true);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(true);

      aggregator.deactivate();
      expect(aggregator.active).toBe(false);
      expect(bridge1.active).toBe(false);

      aggregator.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function createMockBridge(initialActive: boolean): BridgeInterface {
  let active = initialActive;
  return {
    get active() { return active; },
    activate: () => { active = true; },
    deactivate: () => { active = false; },
    toggle: () => { active = !active; return active; },
    destroy: () => { },
  } as BridgeInterface;
}

// ═══════════════════════════════════════════════════════════════
// BridgeAggregator onStateChange()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'BridgeAggregator onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        owned: false,
        activated: initialState,
      });
      const handler = jest.fn();

      aggregator.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      aggregator.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(aggregator);

      aggregator.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(aggregator);

      aggregator.destroy();
    });
  },
);

describe(
  'BridgeAggregator onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        owned: false,
        activated: false,
      });
      const handler = jest.fn();

      aggregator.onStateChange(handler);
      aggregator.toggle();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(aggregator);

      aggregator.destroy();
    });
  },
);

describe(
  'BridgeAggregator onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        owned: false,
        activated: false,
      });
      const handler = jest.fn();

      const subscriber = aggregator.onStateChange(handler);
      aggregator.activate();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      aggregator.deactivate();
      expect(handler).toHaveBeenCalledTimes(1);

      aggregator.destroy();
    });
  },
);

describe(
  'BridgeAggregator onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const aggregator = new BridgeAggregator({
        bridges: [bridge1, bridge2],
        owned: false,
        activated: false,
      });
      let receivedGate: any = null;

      aggregator.onStateChange((g) => { receivedGate = g; });
      aggregator.activate();

      expect(receivedGate).toBe(aggregator);
      expect(receivedGate.active).toBe(true);

      aggregator.destroy();
    });
  },
);
