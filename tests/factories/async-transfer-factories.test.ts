import {
  createAsyncSinkTransfer,
  createAsyncWriteTransfer,
  createAsyncReadTransfer,
  createAsyncPollingSourceTransfer,
  createAsyncPollingProxyTransfer,
  createAsyncPollingFlowTransfer,
  createAsyncIdlePollingTransfer,
  createAsyncConvertTransfer,
  createAsyncConditionTransfer,
  createAsyncStoredChannelTransfer,
  AsyncMapOperator,
  LatestStorage,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// Async Transfer Factories
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// createAsyncSinkTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncSinkTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createAsyncSinkTransfer<number>({ callback: () => {} });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPushable).toBe(true);
      expect(transfer.isPushable).toBe(false);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncSinkTransfer asyncPush calls callback test',
  () => {
    it('', async () => {
      const callback = jest.fn();
      const transfer = createAsyncSinkTransfer<number>({ callback });

      await transfer.asyncPush(42);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncWriteTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncWriteTransfer returns correct type test',
  () => {
    it('', () => {
      const storage = new LatestStorage<number>();
      const transfer = createAsyncWriteTransfer<number>({ flow: storage });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPushable).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncWriteTransfer asyncPush writes to flow test',
  () => {
    it('', async () => {
      const storage = new LatestStorage<number>();
      const transfer = createAsyncWriteTransfer<number>({ flow: storage });

      await transfer.asyncPush(42);

      expect(storage.read()).toBe(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncReadTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncReadTransfer returns correct type test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = createAsyncReadTransfer<number>({ flow });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPullable).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncReadTransfer asyncPull reads from flow test',
  () => {
    it('', async () => {
      const flow = { read: jest.fn(async () => 42) };
      const transfer = createAsyncReadTransfer<number>({ flow });

      const result = await transfer.asyncPull();

      expect(result).toBe(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncPollingSourceTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncPollingSourceTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createAsyncPollingSourceTransfer<number>({
        fetcher: async () => 0,
        interval: 100,
        activated: false,
      });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isAsyncTriggerable).toBe(true);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncPollingSourceTransfer asyncPull returns fetcher result test',
  () => {
    it('', async () => {
      const transfer = createAsyncPollingSourceTransfer<number>({
        fetcher: async () => 42,
        interval: 100,
        activated: false,
      });

      const result = await transfer.asyncPull();
      expect(result).toBe(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncPollingProxyTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncPollingProxyTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createAsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPollingProxy).toBe(true);
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isAsyncTriggerable).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncPollingProxyTransfer setAsyncFetcher then asyncPull test',
  () => {
    it('', async () => {
      const transfer = createAsyncPollingProxyTransfer<number>({
        interval: 100,
        activated: false,
      });

      transfer.setAsyncFetcher(async () => 42);
      transfer.activate();
      const result = await transfer.asyncPull();

      expect(result).toBe(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncPollingFlowTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncPollingFlowTransfer returns correct type test',
  () => {
    it('', () => {
      const flow = { read: jest.fn(async () => 0) };
      const transfer = createAsyncPollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
      });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isAsyncTriggerable).toBe(true);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncPollingFlowTransfer asyncPull reads from flow test',
  () => {
    it('', async () => {
      const flow = { read: jest.fn(async () => 42) };
      const transfer = createAsyncPollingFlowTransfer<number>({
        flow,
        interval: 100,
        activated: false,
      });

      const result = await transfer.asyncPull();
      expect(result).toBe(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncIdlePollingTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncIdlePollingTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createAsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });

      expect(transfer).toBeDefined();
      expect(transfer.isPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isTriggerable).toBe(true);
      expect(transfer.isPollingSource).toBe(true);
      expect(transfer.isGate).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncIdlePollingTransfer push notifies subscribers test',
  () => {
    it('', () => {
      const transfer = createAsyncIdlePollingTransfer<number>({
        fetcher: async () => 0,
        timeout: 1000,
        interval: 100,
        activated: false,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      transfer.push(42);

      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncConvertTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncConvertTransfer returns correct type test',
  () => {
    it('', () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());
      const transfer = createAsyncConvertTransfer<number, string>({ operator });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncConvertTransfer asyncPush transforms and notifies test',
  () => {
    it('', async () => {
      const operator = new AsyncMapOperator<number, string>(async (n) => n.toString());
      const transfer = createAsyncConvertTransfer<number, string>({ operator });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(42);

      expect(handler).toHaveBeenCalledWith('42');

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncConditionTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncConditionTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createAsyncConditionTransfer<number>({
        shouldAccept: async () => true,
      });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPushable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncConditionTransfer accepts valid data test',
  () => {
    it('', async () => {
      const transfer = createAsyncConditionTransfer<number>({
        shouldAccept: async (n) => n > 0,
      });
      const handler = jest.fn();

      transfer.subscribe(handler);
      await transfer.asyncPush(42);

      expect(handler).toHaveBeenCalledWith(42);

      transfer.destroy();
    });
  },
);

// ═══════════════════════════════════════════════════════════════
// createAsyncStoredChannelTransfer
// ═══════════════════════════════════════════════════════════════

describe(
  'createAsyncStoredChannelTransfer returns correct type test',
  () => {
    it('', () => {
      const transfer = createAsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
      });

      expect(transfer).toBeDefined();
      expect(transfer.isAsyncPullable).toBe(true);
      expect(transfer.isSubscribable).toBe(true);
      expect(transfer.isAsyncTriggerable).toBe(true);

      transfer.destroy();
    });
  },
);

describe(
  'createAsyncStoredChannelTransfer with initialValue test',
  () => {
    it('', async () => {
      const transfer = createAsyncStoredChannelTransfer<number>({
        setup: () => {},
        destroy: () => {},
        initialValue: 42,
      });

      const result = await transfer.asyncPull();
      expect(result).toBe(42);

      transfer.destroy();
    });
  },
);
