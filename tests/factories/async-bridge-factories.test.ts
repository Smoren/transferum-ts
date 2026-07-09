import {
  createAsyncTransformBridge,
  createAsyncMapOperator,
  PushStoredChannelTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// Async Bridge Factory
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncTransformBridge returns correct type test',
  () => {
    it('', () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();
      const operator = createAsyncMapOperator<number, string>(async (n) => n.toString());

      const bridge = createAsyncTransformBridge<number, string>({
        source,
        target,
        operator,
        activated: false,
      });

      expect(bridge).toBeDefined();
      expect(bridge.active).toBe(false);

      bridge.destroy();
    });
  },
);

describe(
  'createAsyncTransformBridge transforms data test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();
      const operator = createAsyncMapOperator<number, string>(async (n) => n.toString());

      const bridge = createAsyncTransformBridge<number, string>({
        source,
        target,
        operator,
        activated: true,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(42);

      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      expect(received).toContain('42');

      bridge.destroy();
    });
  },
);

describe(
  'createAsyncTransformBridge gate controls data flow test',
  () => {
    it('', async () => {
      const source = new PushStoredChannelTransfer<number>();
      const target = new PushStoredChannelTransfer<string>();
      const operator = createAsyncMapOperator<number, string>(async (n) => n.toString());

      const bridge = createAsyncTransformBridge<number, string>({
        source,
        target,
        operator,
        activated: false,
      });

      const received: string[] = [];
      target.subscribe((data) => { received.push(data); });

      source.push(1);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      expect(received).toEqual([]);

      bridge.activate();
      source.push(2);
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      expect(received).toContain('2');

      bridge.destroy();
    });
  },
);
