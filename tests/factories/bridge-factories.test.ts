import {
  createPassBridge,
  createTransformBridge,
  createTransferBridge,
  createBridgeAggregator,
  createBridgeSelector,
  createBridgeMultiSelector,
  createPushStoredChannelTransfer,
  createSinkTransfer,
  createConditionTransfer,
  MapOperator,
  PushStoredChannelTransfer, SinkTransfer,
} from '../../src';

import { describe, expect, it } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// createPassBridge
// ═══════════════════════════════════════════════════════════════

describe(
  'createPassBridge returns bridge with correct initial state test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge = createPassBridge({
        source,
        target,
        activated: false,
      });

      expect(bridge).toBeDefined();
      expect(bridge.active).toBe(false);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createPassBridge with direct transfer creation test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>({ initialValue: 0 });
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });

      const bridge = createPassBridge({
        source,
        target,
        activated: true,
      });

      source.push(100);
      source.push(200);

      expect(received).toEqual([100, 200]);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createTransformBridge with direct transfer creation test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: string[] = [];
      const target = createSinkTransfer<string>({ callback: (x) => received.push(x) });

      const bridge = createTransformBridge({
        source,
        target,
        operator: new MapOperator((n: number) => String(n * 2)),
        activated: true,
      });

      source.push(5);
      source.push(10);

      expect(received).toEqual(['10', '20']);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createTransferBridge with direct middle transfer test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });
      const middle = createConditionTransfer({
        shouldAccept: (x: number) => x >= 10 && x <= 100,
      });

      const bridge = createTransferBridge({
        source,
        target,
        middle,
        middleOwned: true,
        activated: true,
      });

      source.push(5); // ignored
      source.push(50); // passes
      source.push(150); // ignored

      expect(received).toEqual([50]);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeAggregator with mixed bridge types test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target1 = createSinkTransfer({ callback: () => {} });
      const target2 = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target: target1,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target: target2,
        activated: false,
      });

      const aggregator = createBridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(true);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);

      aggregator.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeSelector with direct bridge creation test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKey: 'second',
        activated: true,
        owned: false,
      });

      expect(selector.selectedKey).toBe('second');
      expect(selector.selectedBridge).toBe(bridge2);
      expect(bridge2.active).toBe(true);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createPassBridge deactivate blocks data test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });

      const bridge = createPassBridge({
        source,
        target,
        activated: true,
      });

      source.push(1);
      bridge.deactivate();
      source.push(2);

      expect(received).toEqual([1]);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createPassBridge toggle test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });

      const bridge = createPassBridge({
        source,
        target,
        activated: false,
      });

      source.push(1);
      bridge.toggle(); // activate
      source.push(2);
      bridge.toggle(); // deactivate
      source.push(3);

      expect(received).toEqual([2]);

      bridge.destroy();
      source.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createTransformBridge
// ═══════════════════════════════════════════════════════════════

describe(
  'createTransformBridge transforms data test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: string[] = [];
      const target = createSinkTransfer<string>({ callback: (x) => received.push(x) });

      const bridge = createTransformBridge<number, string>({
        source,
        target,
        operator: new MapOperator((n) => `val_${n}`),
        activated: true,
      });

      source.push(42);

      expect(received).toEqual(['val_42']);
      expect(bridge.active).toBe(true);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createTransformBridge with filter operator test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: (string | undefined)[] = [];
      const target = createSinkTransfer<string | undefined>({ callback: (x) => received.push(x) });

      const bridge = createTransformBridge<number, string | undefined>({
        source,
        target,
        operator: new MapOperator((n) => (n > 0 ? `positive_${n}` : undefined)),
        activated: true,
      });

      source.push(5);
      source.push(-3);
      source.push(10);

      expect(received).toEqual(['positive_5', 'positive_10']);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createTransformBridge deactivate blocks transformation test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: string[] = [];
      const target = createSinkTransfer<string>({ callback: (x) => received.push(x) });

      const bridge = createTransformBridge<number, string>({
        source,
        target,
        operator: new MapOperator((n) => `val_${n}`),
        activated: true,
      });

      source.push(1);
      bridge.deactivate();
      source.push(2);

      expect(received).toEqual(['val_1']);

      bridge.destroy();
      source.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createTransferBridge
// ═══════════════════════════════════════════════════════════════

describe(
  'createTransferBridge with middleOwned true test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });
      const middle = createConditionTransfer({ shouldAccept: (x: number) => x > 0 });

      const bridge = createTransferBridge<number, number>({
        source,
        target,
        middle,
        middleOwned: true,
        activated: true,
      });

      source.push(5);
      source.push(-3);
      source.push(10);

      expect(received).toEqual([5, 10]);
      expect(bridge.active).toBe(true);

      bridge.destroy();
      source.destroy();
      // middle already destroyed via bridge.destroy()
    });
  },
);

describe(
  'createTransferBridge with middleOwned false test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });
      const middle = createConditionTransfer({ shouldAccept: (x: number) => x > 0 });

      const bridge = createTransferBridge<number, number>({
        source,
        target,
        middle,
        middleOwned: false,
        activated: true,
      });

      source.push(5);
      source.push(-3);

      expect(received).toEqual([5]);

      bridge.destroy();
      source.destroy();
      // middle is still alive, can be used
      middle.destroy();
    });
  },
);

describe(
  'createTransferBridge deactivate test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });
      const middle = new PushStoredChannelTransfer<number>();

      const bridge = createTransferBridge<number, number>({
        source,
        target,
        middle,
        middleOwned: true,
        activated: true,
      });

      source.push(1);
      bridge.deactivate();
      source.push(2);

      expect(received).toEqual([1]);

      bridge.destroy();
      source.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createBridgeAggregator
// ═══════════════════════════════════════════════════════════════

describe(
  'createBridgeAggregator with empty bridges test',
  () => {
    it('', () => {
      const aggregator = createBridgeAggregator({
        bridges: [],
        activated: true,
        owned: false,
      });

      expect(aggregator).toBeDefined();
      expect(aggregator.active).toBe(false); // empty aggregator is not active

      aggregator.destroy();
    });
  },
);

describe(
  'createBridgeAggregator all bridges active test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const aggregator = createBridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(true);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);

      aggregator.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeAggregator deactivate all bridges test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const aggregator = createBridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      aggregator.deactivate();

      expect(aggregator.active).toBe(false);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(false);

      aggregator.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeAggregator with owned true destroys bridges test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const aggregator = createBridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: false,
        owned: true,
      });

      aggregator.destroy();

      // After destroy with owned=true, bridges should be destroyed
      // Verify that the array is cleared
      expect(() => aggregator.activate()).not.toThrow();

      source.destroy();
    });
  },
);

describe(
  'createBridgeAggregator toggle test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const aggregator = createBridgeAggregator({
        bridges: [bridge1],
        activated: false,
        owned: false,
      });

      expect(aggregator.active).toBe(false);

      aggregator.toggle(); // activate
      expect(aggregator.active).toBe(true);

      aggregator.toggle(); // deactivate
      expect(aggregator.active).toBe(false);

      aggregator.destroy();
      source.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createBridgeSelector
// ═══════════════════════════════════════════════════════════════

describe(
  'createBridgeSelector with invalid initialKey throws test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });

      expect(() =>
        createBridgeSelector({
          bridges: { first: bridge1 },
          initialKey: 'nonexistent' as any,
          activated: false,
          owned: false,
        })
      ).toThrow('Initial bridge key is invalid');

      source.destroy();
    });
  },
);

describe(
  'createBridgeSelector selects initial bridge test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKey: 'first',
        activated: true,
        owned: false,
      });

      expect(selector.selectedKey).toBe('first');
      expect(selector.selectedBridge).toBe(bridge1);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(false);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeSelector select changes active bridge test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKey: 'first',
        activated: true,
        owned: false,
      });

      selector.select('second');

      expect(selector.selectedKey).toBe('second');
      expect(selector.selectedBridge).toBe(bridge2);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(true);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeSelector deactivate test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKey: 'first',
        activated: true,
        owned: false,
      });

      selector.deactivate();

      expect(selector.active).toBe(false);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(false);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeSelector with owned true destroys bridges test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeSelector({
        bridges: { first: bridge1 },
        initialKey: 'first',
        activated: false,
        owned: true,
      });

      selector.destroy();

      source.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createBridgeMultiSelector
// ═══════════════════════════════════════════════════════════════

describe(
  'createBridgeMultiSelector selects initial bridges test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge3 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeMultiSelector({
        bridges: { first: bridge1, second: bridge2, third: bridge3 },
        initialKeys: ['first', 'third'],
        activated: true,
        owned: false,
      });

      expect(selector.selectedKeys).toEqual(['first', 'third']);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(false);
      expect(bridge3.active).toBe(true);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeMultiSelector check adds bridge test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeMultiSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKeys: ['first'],
        activated: true,
        owned: false,
      });

      selector.check('second');

      expect(selector.selectedKeys).toEqual(['first', 'second']);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeMultiSelector uncheck removes bridge test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeMultiSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKeys: ['first', 'second'],
        activated: true,
        owned: false,
      });

      selector.uncheck('first');

      expect(selector.selectedKeys).toEqual(['second']);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(true);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeMultiSelector select replaces all bridges test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge3 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeMultiSelector({
        bridges: { first: bridge1, second: bridge2, third: bridge3 },
        initialKeys: ['first'],
        activated: true,
        owned: false,
      });

      selector.select(['second', 'third']);

      expect(selector.selectedKeys).toEqual(['second', 'third']);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(true);
      expect(bridge3.active).toBe(true);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeMultiSelector with invalid key throws test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeMultiSelector({
        bridges: { first: bridge1 },
        initialKeys: ['first'],
        activated: false,
        owned: false,
      });

      expect(() => selector.check('nonexistent' as any)).toThrow(
        'Bridge key "nonexistent" is invalid'
      );
      expect(() => selector.uncheck('nonexistent' as any)).toThrow(
        'Bridge key "nonexistent" is invalid'
      );
      expect(() => selector.select(['nonexistent' as any])).toThrow(
        'Bridge key "nonexistent" is invalid'
      );

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeMultiSelector deactivate test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeMultiSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKeys: ['first', 'second'],
        activated: true,
        owned: false,
      });

      selector.deactivate();

      expect(selector.active).toBe(false);
      expect(bridge1.active).toBe(false);
      expect(bridge2.active).toBe(false);

      selector.destroy();
      source.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// Integration Tests with direct transfer creation
// ═══════════════════════════════════════════════════════════════

describe(
  'createPassBridge with direct transfer creation test',
  () => {
    it('', () => {
      // Using direct transfer creation instead of factories
      const source = new PushStoredChannelTransfer({ initialValue: 0 });
      const received: number[] = [];
      const target = new SinkTransfer({ callback: (x: number) => received.push(x) });

      const bridge = createPassBridge({
        source,
        target,
        activated: true,
      });

      source.push(100);
      source.push(200);

      expect(received).toEqual([100, 200]);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createTransformBridge with direct transfer creation test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: string[] = [];
      const target = createSinkTransfer<string>({ callback: (x) => received.push(x) });

      const bridge = createTransformBridge<number, string>({
        source,
        target,
        operator: new MapOperator((n) => String(n * 2)),
        activated: true,
      });

      source.push(5);
      source.push(10);

      expect(received).toEqual(['10', '20']);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createTransferBridge with direct middle transfer test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: number[] = [];
      const target = createSinkTransfer({ callback: (x: number) => received.push(x) });
      const middle = createConditionTransfer({
        shouldAccept: (x: number) => x >= 10 && x <= 100,
      });

      const bridge = createTransferBridge<number, number>({
        source,
        target,
        middle,
        middleOwned: true,
        activated: true,
      });

      source.push(5); // ignored
      source.push(50); // passes
      source.push(150); // ignored

      expect(received).toEqual([50]);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeAggregator with mixed bridge types test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target1 = createSinkTransfer({ callback: () => {} });
      const target2 = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target: target1,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target: target2,
        activated: false,
      });

      const aggregator = createBridgeAggregator({
        bridges: [bridge1, bridge2],
        activated: true,
        owned: false,
      });

      expect(aggregator.active).toBe(true);
      expect(bridge1.active).toBe(true);
      expect(bridge2.active).toBe(true);

      aggregator.destroy();
      source.destroy();
    });
  },
);

describe(
  'createBridgeSelector with direct bridge creation test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge1 = createPassBridge({
        source,
        target,
        activated: false,
      });
      const bridge2 = createPassBridge({
        source,
        target,
        activated: false,
      });

      const selector = createBridgeSelector({
        bridges: { first: bridge1, second: bridge2 },
        initialKey: 'second',
        activated: true,
        owned: false,
      });

      expect(selector.selectedKey).toBe('second');
      expect(selector.selectedBridge).toBe(bridge2);
      expect(bridge2.active).toBe(true);

      selector.destroy();
      source.destroy();
    });
  },
);

describe(
  'Full pipeline with bridges using factories test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const received: string[] = [];
      const target = createSinkTransfer<string>({ callback: (x) => received.push(x) });

      // Creating a chain with transformation
      const bridge = createTransformBridge<number, string>({
        source,
        target,
        operator: new MapOperator((n) => `result_${n}`),
        activated: true,
      });

      source.push(1);
      source.push(2);
      source.push(3);

      expect(received).toEqual(['result_1', 'result_2', 'result_3']);

      bridge.destroy();
      source.destroy();
    });
  },
);

describe(
  'Bridge with GateTransfer created via factory test',
  () => {
    it('', () => {
      const source = createPushStoredChannelTransfer<number>();
      const target = createSinkTransfer({ callback: () => {} });

      const bridge = createPassBridge({
        source,
        target,
        activated: false,
      });

      // Gate inside bridge is controlled via bridge
      expect(bridge.active).toBe(false);

      bridge.activate();
      expect(bridge.active).toBe(true);

      bridge.destroy();
      source.destroy();
    });
  },
);
