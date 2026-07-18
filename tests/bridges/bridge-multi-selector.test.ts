import type { BridgeInterface, DataHandler, GateInterface, SubscriberInterface } from '../../src';
import { BridgeMultiSelector } from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector — Constructor & Initial State
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, true],
  [false, false],
] as Array<[boolean, boolean]>)(
  'BridgeMultiSelector constructor initial active state test',
  (activated: boolean, expectedActive: boolean) => {
    it('', () => {
      const bridges = {
        a: createMockBridge(false),
        b: createMockBridge(false),
        c: createMockBridge(false),
      };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a', 'b'],
        activated,
        owned: false,
      });

      expect(selector.active).toBe(expectedActive);
      expect(selector.selectedKeys).toEqual(['a', 'b']);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector constructor throws on invalid initial key test',
  () => {
    it('', () => {
      const bridges = {
        a: createMockBridge(false),
        b: createMockBridge(false),
      };

      expect(() => {
        new BridgeMultiSelector({
          bridges,
          initialKeys: ['a', 'invalid' as any],
          activated: true,
          owned: false,
        });
      }).toThrow('Bridge key "invalid" is invalid');
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector — Select
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeMultiSelector select changes active bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridgeC = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB, c: bridgeC };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a'],
        activated: true,
        owned: false,
      });

      expect(selector.selectedKeys).toEqual(['a']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);
      expect(bridgeC.active).toBe(false);

      selector.select(['b', 'c']);

      expect(selector.selectedKeys).toEqual(['b', 'c']);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(true);
      expect(bridgeC.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector selectedBridges returns correct bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridgeC = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB, c: bridgeC };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a', 'c'],
        activated: false,
        owned: false,
      });

      expect(selector.selectedBridges).toEqual([bridgeA, bridgeC]);

      selector.select(['b']);
      expect(selector.selectedBridges).toEqual([bridgeB]);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector — Check/Uncheck
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeMultiSelector check adds key to selection test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridgeC = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB, c: bridgeC };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a'],
        activated: true,
        owned: false,
      });

      expect(selector.selectedKeys).toEqual(['a']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);
      expect(bridgeC.active).toBe(false);

      selector.check('b');

      expect(selector.selectedKeys).toEqual(['a', 'b']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);
      expect(bridgeC.active).toBe(false);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector check throws on invalid key test',
  () => {
    it('', () => {
      const bridges = {
        a: createMockBridge(false),
        b: createMockBridge(false),
      };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a'],
        activated: false,
        owned: false,
      });

      expect(() => {
        selector.check('invalid' as any);
      }).toThrow('Bridge key "invalid" is invalid');

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector check when inactive does not activate test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a'],
        activated: false,
        owned: false,
      });

      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.check('b');

      expect(selector.selectedKeys).toEqual(['a', 'b']);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.activate();
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector uncheck removes key from selection test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridgeC = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB, c: bridgeC };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a', 'b', 'c'],
        activated: true,
        owned: false,
      });

      expect(selector.selectedKeys).toEqual(['a', 'b', 'c']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);
      expect(bridgeC.active).toBe(true);

      selector.uncheck('b');

      expect(selector.selectedKeys).toEqual(['a', 'c']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);
      expect(bridgeC.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector uncheck throws on invalid key test',
  () => {
    it('', () => {
      const bridges = {
        a: createMockBridge(false),
        b: createMockBridge(false),
      };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a'],
        activated: false,
        owned: false,
      });

      expect(() => {
        selector.uncheck('invalid' as any);
      }).toThrow('Bridge key "invalid" is invalid');

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector uncheck when bridge already inactive is safe test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a', 'b'],
        activated: false,
        owned: false,
      });

      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      expect(() => {
        selector.uncheck('b');
      }).not.toThrow();

      expect(selector.selectedKeys).toEqual(['a']);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector — Activate/Deactivate
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeMultiSelector activate activates all selected bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridgeC = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB, c: bridgeC };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a', 'c'],
        activated: false,
        owned: false,
      });

      expect(selector.active).toBe(false);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);
      expect(bridgeC.active).toBe(false);

      selector.activate();

      expect(selector.active).toBe(true);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);
      expect(bridgeC.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector deactivate deactivates all bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(true);
      const bridgeB = createMockBridge(true);
      const bridgeC = createMockBridge(true);
      const bridges = { a: bridgeA, b: bridgeB, c: bridgeC };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a', 'b'],
        activated: true,
        owned: false,
      });

      expect(selector.active).toBe(true);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);
      expect(bridgeC.active).toBe(false);

      selector.deactivate();

      expect(selector.active).toBe(false);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);
      expect(bridgeC.active).toBe(false);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector — Toggle
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true, false, true],
  [false, true, false],
] as Array<[boolean, boolean, boolean]>)(
  'BridgeMultiSelector toggle switches active state test',
  (initialActive: boolean, afterFirstToggle: boolean, afterSecondToggle: boolean) => {
    it('', () => {
      const bridgeA = createMockBridge(initialActive);
      const bridgeB = createMockBridge(initialActive);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a'],
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
// BridgeMultiSelector — Destroy
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeMultiSelector destroy with owned=true destroys all bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);

      const destroySpyA = jest.fn();
      const destroySpyB = jest.fn();
      bridgeA.destroy = destroySpyA;
      bridgeB.destroy = destroySpyB;

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
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
  'BridgeMultiSelector destroy with owned=false does not destroy bridges test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);

      const destroySpyA = jest.fn();
      const destroySpyB = jest.fn();
      bridgeA.destroy = destroySpyA;
      bridgeB.destroy = destroySpyB;

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
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
  'BridgeMultiSelector multiple destroy calls are safe test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
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
// BridgeMultiSelector — Integration Scenarios
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeMultiSelector check then activate test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a'],
        activated: false,
        owned: false,
      });

      selector.check('b');
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.activate();
      expect(selector.active).toBe(true);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector activate then uncheck test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: ['a', 'b'],
        activated: false,
        owned: false,
      });

      selector.activate();
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);

      selector.uncheck('b');
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);
      expect(selector.selectedKeys).toEqual(['a']);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector empty initial keys test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const bridges = { a: bridgeA, b: bridgeB };

      const selector = new BridgeMultiSelector({
        bridges,
        initialKeys: [],
        activated: true,
        owned: false,
      });

      expect(selector.selectedKeys).toEqual([]);
      expect(selector.active).toBe(true);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.check('a');
      expect(bridgeA.active).toBe(true);

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

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector onStateChange()
// ═══════════════════════════════════════════════════════════════

describe.each([
  [true],
  [false],
] as Array<[boolean]>)(
  'BridgeMultiSelector onStateChange notifies on activate/deactivate test',
  (initialState: boolean) => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const multiSelector = new BridgeMultiSelector({
        bridges: { a: bridge1, b: bridge2, c: bridge3 },
        owned: false,
        activated: initialState,
        initialKeys: ['a'],
      });
      const handler = jest.fn();

      multiSelector.onStateChange(handler);
      expect(handler).not.toHaveBeenCalled();

      multiSelector.activate();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(multiSelector);

      multiSelector.deactivate();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(multiSelector);

      multiSelector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector onStateChange notifies on toggle test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const multiSelector = new BridgeMultiSelector({
        bridges: { a: bridge1, b: bridge2, c: bridge3 },
        owned: false,
        activated: false,
        initialKeys: ['a'],
      });
      const handler = jest.fn();

      multiSelector.onStateChange(handler);
      multiSelector.toggle();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(multiSelector);

      multiSelector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector onStateChange notifies on select test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const multiSelector = new BridgeMultiSelector({
        bridges: { a: bridge1, b: bridge2, c: bridge3 },
        owned: false,
        activated: true,
        initialKeys: ['a'],
      });
      const handler = jest.fn();

      multiSelector.onStateChange(handler);
      multiSelector.select(['b', 'c']);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(multiSelector);

      multiSelector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector onStateChange notifies on check test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const multiSelector = new BridgeMultiSelector({
        bridges: { a: bridge1, b: bridge2, c: bridge3 },
        owned: false,
        activated: true,
        initialKeys: ['a'],
      });
      const handler = jest.fn();

      multiSelector.onStateChange(handler);
      multiSelector.check('b');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(multiSelector);

      multiSelector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector onStateChange notifies on uncheck test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const multiSelector = new BridgeMultiSelector({
        bridges: { a: bridge1, b: bridge2, c: bridge3 },
        owned: false,
        activated: true,
        initialKeys: ['a', 'b'],
      });
      const handler = jest.fn();

      multiSelector.onStateChange(handler);
      multiSelector.uncheck('b');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(multiSelector);

      multiSelector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector onStateChange unsubscribe stops notifications test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const multiSelector = new BridgeMultiSelector({
        bridges: { a: bridge1, b: bridge2, c: bridge3 },
        owned: false,
        activated: false,
        initialKeys: ['a'],
      });
      const handler = jest.fn();

      const subscriber = multiSelector.onStateChange(handler);
      multiSelector.activate();
      expect(handler).toHaveBeenCalledTimes(1);

      subscriber.unsubscribe();
      multiSelector.deactivate();
      expect(handler).toHaveBeenCalledTimes(1);

      multiSelector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector onStateChange handler receives GateInterface test',
  () => {
    it('', () => {
      const bridge1 = createMockBridge(false);
      const bridge2 = createMockBridge(false);
      const bridge3 = createMockBridge(false);

      const multiSelector = new BridgeMultiSelector({
        bridges: { a: bridge1, b: bridge2, c: bridge3 },
        owned: false,
        activated: false,
        initialKeys: ['a'],
      });
      let receivedGate: any = null;

      multiSelector.onStateChange((g) => { receivedGate = g; });
      multiSelector.activate();

      expect(receivedGate).toBe(multiSelector);
      expect(receivedGate.active).toBe(true);

      multiSelector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector — Additional Coverage
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeMultiSelector constructor without owned defaults to false test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);
      const destroySpyA = jest.fn();
      const destroySpyB = jest.fn();
      bridgeA.destroy = destroySpyA;
      bridgeB.destroy = destroySpyB;

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
        activated: false,
      } as any);

      selector.destroy();

      expect(destroySpyA).not.toHaveBeenCalled();
      expect(destroySpyB).not.toHaveBeenCalled();
    });
  },
);

describe(
  'BridgeMultiSelector check on already active bridge does not reactivate test',
  () => {
    it('', () => {
      const bridgeA = createMockBridge(false);
      const bridgeB = createMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
        activated: true,
        owned: false,
      });

      expect(bridgeA.active).toBe(true);

      const activateSpy = jest.fn();
      bridgeA.activate = activateSpy;

      selector.check('a');

      expect(activateSpy).not.toHaveBeenCalled();

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// BridgeMultiSelector — syncWithChildren
// ═══════════════════════════════════════════════════════════════

describe(
  'BridgeMultiSelector syncWithChildren: external bridge activation adds to selection test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);
      const bridgeC = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB, c: bridgeC },
        initialKeys: ['a'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      expect(selector.selectedKeys).toEqual(['a']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(false);

      // Externally activate bridge B → selector should check('b')
      bridgeB.activate();

      expect(selector.selectedKeys).toEqual(['a', 'b']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: external bridge deactivation removes from selection test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a', 'b'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      expect(selector.selectedKeys).toEqual(['a', 'b']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);

      // Externally deactivate bridge A → selector should uncheck('a')
      bridgeA.deactivate();

      expect(selector.selectedKeys).toEqual(['b']);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: check does not cause feedback loop test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      // check('b') internally activates bridgeB → onStateChange fires.
      // Without _syncing guard, handler would see b.active && !selectedKeys.has('b')
      // — but 'b' is already in selectedKeys by now, so it's a no-op.
      // Still, verify no double-activation or state corruption.
      selector.check('b');

      expect(selector.selectedKeys).toEqual(['a', 'b']);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: uncheck does not cause feedback loop test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a', 'b'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      // uncheck('a') internally deactivates bridgeA → onStateChange fires.
      // Without _syncing guard, handler would see !b.active && selectedKeys.has('a')
      // — but 'a' is already removed by now, so it's a no-op.
      // Still, verify no double-deactivation or state corruption.
      selector.uncheck('a');

      expect(selector.selectedKeys).toEqual(['b']);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: activate does not cause feedback loop test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a', 'b'],
        activated: false,
        owned: false,
        syncWithChildren: true,
      });

      // activate() internally deactivates all bridges then activates selected ones.
      // Without _syncing guard, deactivating already-inactive bridges would fire
      // handlers, and activating selected bridges would fire handlers too.
      selector.activate();

      expect(selector.active).toBe(true);
      expect(bridgeA.active).toBe(true);
      expect(bridgeB.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: deactivate does not cause feedback loop test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a', 'b'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      // deactivate() internally deactivates all selected bridges.
      // Without _syncing guard, each deactivation would fire the handler
      // → uncheck() → _gateState.notify() again.
      selector.deactivate();

      expect(selector.active).toBe(false);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: select does not cause feedback loop test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);
      const bridgeC = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB, c: bridgeC },
        initialKeys: ['a', 'b'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      // select(['c']) internally deactivates A and B, then activates C.
      // Without _syncing guard, deactivating A and B would fire handlers
      // → uncheck('a'), uncheck('b') — corrupting the new selection.
      selector.select(['c']);

      expect(selector.selectedKeys).toEqual(['c']);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(false);
      expect(bridgeC.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren disabled: external bridge activation does nothing test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
        activated: true,
        owned: false,
        // syncWithChildren not set — defaults to false
      });

      bridgeB.activate();

      expect(selector.selectedKeys).toEqual(['a']);
      expect(bridgeB.active).toBe(true); // activated externally, selector didn't interfere

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: external activation of already-selected bridge is no-op test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      // bridgeA is already selected and active — activating it again should not trigger check()
      bridgeA.activate();

      expect(selector.selectedKeys).toEqual(['a']);
      expect(bridgeA.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: external deactivation of non-selected bridge is no-op test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      // bridgeB is not selected — deactivating it should not trigger anything
      bridgeB.deactivate();

      expect(selector.selectedKeys).toEqual(['a']);
      expect(bridgeA.active).toBe(true);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: inactive selector adds key but stays inactive test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: {a: bridgeA, b: bridgeB},
        initialKeys: ['a'],
        activated: false,
        owned: false,
        syncWithChildren: true,
      });

      // Selector is inactive. External activation of bridgeB triggers check('b'),
      // but _tryActivateBridge won't activate because selector is inactive.
      // bridgeB is already active (externally), so no re-activation needed.
      bridgeB.activate();

      expect(selector.selectedKeys).toEqual(['a', 'b']);
      expect(selector.active).toBe(false);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: destroy unsubscribes from child state changes test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: { a: bridgeA, b: bridgeB },
        initialKeys: ['a'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      selector.destroy();

      // After destroy, activating/deactivating bridges should not throw
      expect(() => {
        bridgeB.activate();
        bridgeA.deactivate();
      }).not.toThrow();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: onStateChange fires on external bridge activation test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: {a: bridgeA, b: bridgeB},
        initialKeys: ['a'],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });
      const handler = jest.fn();

      selector.onStateChange(handler);

      // External activation of bridgeB triggers check('b') → _gateState.notify()
      bridgeB.activate();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(selector);

      selector.destroy();
    });
  },
);

describe(
  'BridgeMultiSelector syncWithChildren: multiple external activations accumulate test',
  () => {
    it('', () => {
      const bridgeA = createStatefulMockBridge(false);
      const bridgeB = createStatefulMockBridge(false);
      const bridgeC = createStatefulMockBridge(false);

      const selector = new BridgeMultiSelector({
        bridges: {a: bridgeA, b: bridgeB, c: bridgeC},
        initialKeys: [],
        activated: true,
        owned: false,
        syncWithChildren: true,
      });

      // Sequentially activate B and C externally
      bridgeB.activate();
      bridgeC.activate();

      expect(selector.selectedKeys).toEqual(['b', 'c']);
      expect(bridgeA.active).toBe(false);
      expect(bridgeB.active).toBe(true);
      expect(bridgeC.active).toBe(true);

      // Now deactivate B externally
      bridgeB.deactivate();

      expect(selector.selectedKeys).toEqual(['c']);
      expect(bridgeB.active).toBe(false);

      selector.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Helper Functions (additional)
// ═══════════════════════════════════════════════════════════════

function createStatefulMockBridge(initialActive: boolean): BridgeInterface {
  let active = initialActive;
  const handlers = new Set<DataHandler<GateInterface>>();

  const bridge = {
    get active() { return active; },
    activate: () => { active = true; handlers.forEach(h => h(bridge)); },
    deactivate: () => { active = false; handlers.forEach(h => h(bridge)); },
    toggle: () => {
      active = !active;
      handlers.forEach(h => h(bridge));
      return active;
    },
    onStateChange: (handler: DataHandler<GateInterface>): SubscriberInterface => {
      handlers.add(handler);
      return { unsubscribe: () => { handlers.delete(handler); } } as SubscriberInterface;
    },
    destroy: () => { handlers.clear(); },
  } as BridgeInterface;

  return bridge;
}

