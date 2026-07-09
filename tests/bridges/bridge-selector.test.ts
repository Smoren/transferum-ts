import type { BridgeInterface } from '../../src';
import { BridgeSelector } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// BridgeSelector — Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, true],
  [false, false],
] as Array<[boolean, boolean]>)(
  'BridgeSelector constructor initial active state test',
  (activated: boolean, expectedActive: boolean) => {
    it('', () => {
      const bridges = {
        a: createMockBridge(false),
        b: createMockBridge(false),
      };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated,
        owned: false,
      });

      expect(selector.active).toBe(expectedActive);
      expect(selector.selectedKey).toBe('a');

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector constructor throws on invalid initial key test',
  () => {
    it('', () => {
      const bridges = {
        a: createMockBridge(false),
        b: createMockBridge(false),
      };

      expect(() => {
        new BridgeSelector({
          bridges,
          initialKey: 'invalid' as any,
          activated: true,
          owned: false,
        });
      }).toThrow('Initial bridge key is invalid');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeSelector — Select
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeSelector select changes active bridge test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: true,
        owned: false,
      });

      expect(selector.selectedKey).toBe('a');
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);

      selector.select('b');

      expect(selector.selectedKey).toBe('b');
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector select same key does nothing test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridges = { a: bridgeA, b: createMockBridge(false) };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: true,
        owned: false,
      });

      expect(selector.selectedKey).toBe('a');
      expect(bridgeA.active).toBe(true);

      selector.select('a');

      expect(selector.selectedKey).toBe('a');
      expect(bridgeA.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector selectedBridge returns correct bridge test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: false,
        owned: false,
      });

      expect(selector.selectedBridge).toBe(bridgeA);

      selector.select('b');
      expect(selector.selectedBridge).toBe(bridgeB);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeSelector — Activate/Deactivate
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeSelector activate activates only selected bridge test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: false,
        owned: false,
      });

      expect(selector.active).toBe(false);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.activate();

      expect(selector.active).toBe(true);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector deactivate deactivates all bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(true);
      const bridgeB = createMockBridge(true);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: true,
        owned: false,
      });

      expect(selector.active).toBe(true);
      // Only the selected bridge should be active
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);

      selector.deactivate();

      expect(selector.active).toBe(false);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeSelector — Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, false, true],
  [false, true, false],
] as Array<[boolean, boolean, boolean]>)(
  'BridgeSelector toggle switches active state test',
  (initialActive: boolean, afterFirstToggle: boolean, afterSecondToggle: boolean) => {
    it('', () => {
      const bridgeA = createMockBridge(initialActive);
      const bridgeB = createMockBridge(initialActive);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: initialActive,
        owned: false,
      });

      expect(selector.active).toBe(initialActive);

      const firstResult = selector.toggle();
      expect(firstResult).toBe(afterFirstToggle);
      expect(selector.active).toBe(afterFirstToggle);

      const secondResult = selector.toggle();
      expect(secondResult).toBe(afterSecondToggle);
      expect(selector.active).toBe(afterSecondToggle);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeSelector — Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeSelector destroy with owned=true destroys all bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);

      const destroySpyA = jest.fn();
      const destroySpyB = jest.fn();
      bridgeA.destroy = destroySpyA;
      bridgeB.destroy = destroySpyB;

      const selector = new BridgeSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKey: 'a',
        activated: false,
        owned: true,
      });

      selector.destroy();

      expect(destroySpyA).toHaveBeenCalledTimes(1);
      expect(destroySpyB).toHaveBeenCalledTimes(1);
    });
  },
);

describe(
  'BridgeSelector destroy with owned=false does not destroy bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);

      const destroySpyA = jest.fn();
      const destroySpyB = jest.fn();
      bridgeA.destroy = destroySpyA;
      bridgeB.destroy = destroySpyB;

      const selector = new BridgeSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKey: 'a',
        activated: false,
        owned: false,
      });

      selector.destroy();

      expect(destroySpyA).not.toHaveBeenCalled();
      expect(destroySpyB).not.toHaveBeenCalled();
    });
  },
);

describe(
  'BridgeSelector multiple destroy calls are safe test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);

      const selector = new BridgeSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKey: 'a',
        activated: false,
        owned: false,
      });

      expect(() => {
        selector.destroy();
        selector.destroy();
        selector.destroy();
      }).not.toThrow();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeSelector — Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeSelector select then activate test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: false,
        owned: false,
      });

      selector.select('b');
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.activate();
      expect(selector.active).toBe(true);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector activate then select test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeSelector({
        bridges,
        initialKey: 'a',
        activated: false,
        owned: false,
      });

      selector.activate();
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);

      selector.select('b');
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
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

function createAlwaysActiveBridge(): BridgeInterface {
  return {
    get active() { return true; },
    activate: jest.fn(),
    deactivate: jest.fn(),
    toggle: jest.fn(),
    destroy: jest.fn(),
  } as unknown as BridgeInterface;
}

// ═══════════════════════════════════════════════════════════════
// BridgeSelector onStateChange()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'BridgeSelector onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const selector = new BridgeSelector({
        bridges: { a: bridge1, b: bridge2 },
        owned: false,
        activated: initialState,
        initialKey: 'a',
      });
      const handler = jest.fn();

      selector.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      selector.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(selector);

      selector.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(selector);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const selector = new BridgeSelector({
        bridges: { a: bridge1, b: bridge2 },
        owned: false,
        activated: false,
        initialKey: 'a',
      });
      const handler = jest.fn();

      selector.onStateChange(handler);
      selector.toggle();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(selector);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector onStateChange notifies on select test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const selector = new BridgeSelector({
        bridges: { a: bridge1, b: bridge2 },
        owned: false,
        activated: true,
        initialKey: 'a',
      });
      const handler = jest.fn();

      selector.onStateChange(handler);
      selector.select('b');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(selector);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const selector = new BridgeSelector({
        bridges: { a: bridge1, b: bridge2 },
        owned: false,
        activated: false,
        initialKey: 'a',
      });
      const handler = jest.fn();

      const subscriber = selector.onStateChange(handler);
      selector.activate();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      selector.deactivate();
      expect(handler).toHaveBeenCalledTimes(1);

      selector.destroy();
    });
  },
);

describe(
  'BridgeSelector onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);

      const selector = new BridgeSelector({
        bridges: { a: bridge1, b: bridge2 },
        owned: false,
        activated: false,
        initialKey: 'a',
      });
      let receivedGate: any = null;

      selector.onStateChange((g) => { receivedGate = g; });
      selector.activate();

      expect(receivedGate).toBe(selector);
      expect(receivedGate.active).toBe(true);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeSelector — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeSelector constructor without owned defaults to false test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const destroySpyA = jest.fn();
      const destroySpyB = jest.fn();
      bridgeA.destroy = destroySpyA;
      bridgeB.destroy = destroySpyB;

      const selector = new BridgeSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKey: 'a',
        activated: false,
      } as any);

      selector.destroy();

      expect(destroySpyA).not.toHaveBeenCalled();
      expect(destroySpyB).not.toHaveBeenCalled();
    });
  },
);

describe(
  'BridgeSelector _tryActivateBridge skips already active bridge test',
  () => {
    it('', () => {
      const bridgeA = createAlwaysActiveBridge();
      const bridgeB = createMockBridge(false);

      const selector = new BridgeSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKey: 'a',
        activated: false,
        owned: false,
      });

      selector.activate();

      expect(bridgeA.activate).not.toHaveBeenCalled();
      selector.destroy();
    });
  },
);

