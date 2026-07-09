import {
  createPushChannelTransfer,
  createDelayedPushChannelTransfer,
  createDebounceTransfer,
  createThrottleTransfer,
  createPushStoredChannelTransfer,
  createBufferTransfer,
  createManualBufferTransfer,
  createManualFlowTransfer,
  createGateTransfer,
  createMergeTransfer,
  createSplitTransfer,
  createPollingSourceTransfer,
  createPollingProxyTransfer,
  createPollingFlowTransfer,
  createIdlePollingTransfer,
  createChannelTransfer,
  createStoredChannelTransfer,
  createSinkTransfer,
  createWriteTransfer,
  createReadTransfer,
  createConvertTransfer,
  createConditionTransfer,
  createMapOperator,
  createAsyncSinkTransfer,
  createAsyncWriteTransfer,
  createAsyncReadTransfer,
  createAsyncConvertTransfer,
  createAsyncConditionTransfer,
  createAsyncMapOperator,
  createAsyncStoredChannelTransfer,
  UniversalCompositeTransfer,
  LatestStorage,
  linkTransfers,
} from '../../src';
import { describe, expect, it } from '@jest/globals';
// @ts-ignore
import { wait } from './fixtures';

// ═══════════════════════════════════════════════════════════════
// Transfers — Individual Examples
// ═══════════════════════════════════════════════════════════════

describe('README Transfers: PushChannelTransfer', () => {
  it('emits data to subscribers on push', () => {
    const channel = createPushChannelTransfer<number>();

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));
    channel.push(42);

    expect(received).toEqual([42]);
    channel.destroy();
  });
});

describe('README Transfers: DelayedPushChannelTransfer', () => {
  it('emits data with delay', async () => {
    const channel = createDelayedPushChannelTransfer<number>({ delay: 50 });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));
    channel.push(1);
    channel.push(2);

    expect(received).toEqual([]);
    await wait(100);
    expect(received).toEqual([1, 2]);

    channel.destroy();
  });
});

describe('README Transfers: DebounceTransfer', () => {
  it('emits only last value after pause', async () => {
    const channel = createDebounceTransfer<number>({ delay: 50 });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));
    channel.push(1);
    channel.push(2);
    channel.push(3);

    expect(received).toEqual([]);
    await wait(100);
    expect(received).toEqual([3]);

    channel.destroy();
  });
});

describe('README Transfers: ThrottleTransfer', () => {
  it('emits leading and trailing edges', async () => {
    const channel = createThrottleTransfer<number>({ interval: 50 });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));
    channel.push(1); // leading
    channel.push(2);
    channel.push(3);

    expect(received).toEqual([1]);
    await wait(100);
    expect(received).toEqual([1, 3]);

    channel.destroy();
  });
});

describe('README Transfers: PushStoredChannelTransfer', () => {
  it('retains last value for pull and trigger', () => {
    const channel = createPushStoredChannelTransfer<number>({ initialValue: 0 });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));
    channel.push(42);

    expect(received).toEqual([42]);
    expect(channel.pull()).toBe(42);

    received.length = 0;
    channel.trigger();
    expect(received).toEqual([42]);

    channel.destroy();
  });
});

describe('README Transfers: BufferTransfer', () => {
  it('stores and extracts values without notifications', () => {
    const buffer = createBufferTransfer<number>();

    buffer.push(42);
    expect(buffer.pull()).toBe(42);
    expect(buffer.pull()).toBeUndefined();

    buffer.destroy();
  });
});

describe('README Transfers: ManualBufferTransfer', () => {
  it('allows pull only after trigger', () => {
    const buffer = createManualBufferTransfer<number>();

    buffer.push(42);
    expect(buffer.pull()).toBeUndefined();

    buffer.trigger();
    expect(buffer.pull()).toBe(42);

    buffer.destroy();
  });
});

describe('README Transfers: ManualFlowTransfer', () => {
  it('emits to subscribers only on trigger', () => {
    const flow = createManualFlowTransfer<number>();

    const received: number[] = [];
    flow.subscribe((data) => received.push(data));
    flow.push(42);
    expect(received).toEqual([]);

    flow.trigger();
    expect(received).toEqual([42]);

    flow.destroy();
  });
});

describe('README Transfers: GateTransfer', () => {
  it('passes data only when active', () => {
    const gate = createGateTransfer<number>({ activated: false });

    const received: number[] = [];
    gate.subscribe((data) => received.push(data));
    gate.push(42);
    expect(received).toEqual([]);

    gate.activate();
    gate.push(100);
    expect(received).toEqual([100]);

    gate.destroy();
  });

  it('subscribes to state changes', () => {
    const gate = createGateTransfer<number>({ activated: false });

    const states: boolean[] = [];
    gate.onStateChange((g) => states.push(g.active));

    gate.activate();
    gate.deactivate();
    gate.toggle();

    expect(states).toEqual([true, false, true]);

    gate.destroy();
  });
});

describe('README Transfers: MergeTransfer', () => {
  it('merges multiple sources into one stream', () => {
    const source1 = createPushStoredChannelTransfer<number>();
    const source2 = createPushStoredChannelTransfer<number>();

    const merge = createMergeTransfer<number>({ sources: [source1, source2] });

    const received: number[] = [];
    merge.subscribe((data) => received.push(data));
    source1.push(1);
    source2.push(2);

    expect(received).toEqual([1, 2]);

    merge.destroy();
    source1.destroy();
    source2.destroy();
  });
});

describe('README Transfers: SplitTransfer', () => {
  it('broadcasts to multiple targets', () => {
    const target1 = createPushStoredChannelTransfer<number>();
    const target2 = createPushStoredChannelTransfer<number>();

    const split = createSplitTransfer<number>({ targets: [target1, target2] });

    const received1: number[] = [];
    const received2: number[] = [];
    target1.subscribe((n) => received1.push(n));
    target2.subscribe((n) => received2.push(n));

    split.push(42);

    expect(received1).toEqual([42]);
    expect(received2).toEqual([42]);

    split.destroy();
    target1.destroy();
    target2.destroy();
  });
});

describe('README Transfers: PollingSourceTransfer', () => {
  it('polls external fetcher on timer', async () => {
    let counter = 0;
    const polling = createPollingSourceTransfer<number>({
      fetcher: () => ++counter,
      interval: 30,
      activated: true,
    });

    const received: number[] = [];
    polling.subscribe((data) => received.push(data));

    await wait(80);
    polling.deactivate();

    expect(received.length).toBeGreaterThan(1);
    polling.destroy();
  });
});

describe('README Transfers: PollingProxyTransfer', () => {
  it('polls previous node via setFetcher', async () => {
    const source = createPushStoredChannelTransfer<number>({ initialValue: 42 });
    const poller = createPollingProxyTransfer<number>({
      interval: 30,
      activated: true,
    });

    linkTransfers(source, poller);

    const received: number[] = [];
    poller.subscribe((data) => received.push(data));

    await wait(80);
    poller.deactivate();

    expect(received.length).toBeGreaterThan(0);
    poller.destroy();
    source.destroy();
  });
});

describe('README Transfers: PollingFlowTransfer', () => {
  it('polls from storage', async () => {
    const storage = new LatestStorage<number>(0);
    const polling = createPollingFlowTransfer<number>({
      flow: storage,
      interval: 30,
      activated: true,
    });

    const received: number[] = [];
    polling.subscribe((data) => received.push(data));

    storage.write(42);
    await wait(80);
    polling.deactivate();

    expect(received).toContain(42);
    polling.destroy();
  });
});

describe('README Transfers: IdlePollingTransfer', () => {
  it('falls back to polling on idle', async () => {
    let counter = 0;
    const channel = createIdlePollingTransfer<number>({
      fetcher: () => ++counter,
      timeout: 50,
      interval: 20,
      activated: true,
    });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));
    channel.push(42);

    expect(received).toEqual([42]);
    received.length = 0;

    await wait(120);
    channel.deactivate();

    expect(received.length).toBeGreaterThan(0);
    channel.destroy();
  });
});

describe('README Transfers: ChannelTransfer', () => {
  it('integrates with external event sources', async () => {
    let emit: ((data: number) => void) | undefined;
    let intervalId: any;

    const channel = createChannelTransfer<number>({
      setup: (e) => {
        emit = e;
        intervalId = setInterval(() => e(Date.now()), 50);
      },
      destroy: () => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
      },
      onEmitError: (e) => console.error(e),
    });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));

    await wait(120);
    channel.destroy();

    expect(received.length).toBeGreaterThan(1);
  });
});

describe('README Transfers: StoredChannelTransfer', () => {
  it('retains value with external management', () => {
    let emit: ((data: number) => void) | undefined;

    const channel = createStoredChannelTransfer<number>({
      setup: (e) => { emit = e; },
      destroy: () => {},
      initialValue: 0,
    });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));

    if (emit !== undefined) {
      emit(42);
    }
    expect(received).toEqual([42]);
    expect(channel.pull()).toBe(42);

    received.length = 0;
    channel.trigger();
    expect(received).toEqual([42]);

    channel.destroy();
  });
});

describe('README Transfers: SinkTransfer', () => {
  it('calls callback on push', () => {
    const received: number[] = [];
    const sink = createSinkTransfer<number>({
      callback: (data) => received.push(data),
    });

    sink.push(42);
    expect(received).toEqual([42]);

    sink.destroy();
  });
});

describe('README Transfers: WriteTransfer', () => {
  it('writes to storage', () => {
    const storage = new LatestStorage<number>();
    const writer = createWriteTransfer<number>({ flow: storage });

    writer.push(42);
    expect(storage.read()).toBe(42);

    writer.destroy();
  });
});

describe('README Transfers: ReadTransfer', () => {
  it('reads from storage', () => {
    const storage = new LatestStorage<number>();
    storage.write(42);
    const reader = createReadTransfer<number>({ flow: storage });

    expect(reader.pull()).toBe(42);

    reader.destroy();
  });
});

describe('README Transfers: ConvertTransfer', () => {
  it('transforms data via operator', () => {
    const converter = createConvertTransfer<number, string>({
      operator: createMapOperator((n: number) => `val_${n}`),
    });

    const received: string[] = [];
    converter.subscribe((data) => received.push(data));
    converter.push(42);

    expect(received).toEqual(['val_42']);
    converter.destroy();
  });
});

describe('README Transfers: ConditionTransfer', () => {
  it('filters data with shouldAccept and shouldEmit', () => {
    const condition = createConditionTransfer<number>({
      shouldAccept: (n) => n > 0,
      shouldEmit: (n) => n !== undefined && n < 100,
    });

    const received: number[] = [];
    condition.subscribe((data) => received.push(data));
    condition.push(-5);
    condition.push(50);
    condition.push(150);

    expect(received).toEqual([50]);
    condition.destroy();
  });
});

describe('README Transfers: UniversalCompositeTransfer', () => {
  it('combines input and output into duplex interface', () => {
    const transfer = createPushStoredChannelTransfer<number>();

    const composite = new UniversalCompositeTransfer({
      input: transfer,
      output: transfer,
      owned: [transfer],
    });

    const received: number[] = [];
    composite.subscribe((data) => received.push(data));
    composite.push(42);

    expect(received).toEqual([42]);
    expect(composite.pull()).toBe(42);

    composite.trigger();
    expect(received).toEqual([42, 42]);

    composite.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Async Transfers — Individual Examples
// ═══════════════════════════════════════════════════════════════

describe('README Async Transfers: AsyncSinkTransfer', () => {
  it('calls async callback on asyncPush', async () => {
    const results: number[] = [];
    const sink = createAsyncSinkTransfer<number>({
      callback: async (n) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(n);
      },
    });

    await sink.asyncPush(42);
    expect(results).toEqual([42]);

    sink.destroy();
  });
});

describe('README Async Transfers: AsyncWriteTransfer', () => {
  it('writes to async storage', async () => {
    const storage = {
      _data: 0,
      async write(value: number): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 10));
        this._data = value;
      },
      read(): number {
        return this._data;
      },
    };

    const writer = createAsyncWriteTransfer<number>({ flow: storage });

    await writer.asyncPush(42);
    expect(storage.read()).toBe(42);

    writer.destroy();
  });
});

describe('README Async Transfers: AsyncReadTransfer', () => {
  it('reads from async storage', async () => {
    const storage = {
      _data: 42,
      async read(): Promise<number> {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return this._data;
      },
    };

    const reader = createAsyncReadTransfer<number>({ flow: storage });

    const value = await reader.asyncPull();
    expect(value).toBe(42);

    reader.destroy();
  });
});

describe('README Async Transfers: AsyncConvertTransfer', () => {
  it('transforms data via async operator', async () => {
    const converter = createAsyncConvertTransfer<number, string>({
      operator: createAsyncMapOperator(async (n: number) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return `val_${n}`;
      }),
    });

    const received: string[] = [];
    converter.subscribe((data) => received.push(data));
    await converter.asyncPush(42);

    expect(received).toEqual(['val_42']);
    converter.destroy();
  });
});

describe('README Async Transfers: AsyncConditionTransfer', () => {
  it('filters data with async predicate', async () => {
    const condition = createAsyncConditionTransfer<number>({
      shouldAccept: async (n) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return n > 0;
      },
    });

    const received: number[] = [];
    condition.subscribe((data) => received.push(data));
    await condition.asyncPush(-5);
    await condition.asyncPush(50);

    expect(received).toEqual([50]);
    condition.destroy();
  });
});

describe('README Async Transfers: AsyncStoredChannelTransfer', () => {
  it('retains value with async interface', async () => {
    let emit: ((data: number) => void) | undefined;

    const channel = createAsyncStoredChannelTransfer<number>({
      setup: (e) => { emit = e; },
      destroy: () => {},
      initialValue: 0,
    });

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));

    if (emit !== undefined) {
      emit(42);
    }
    expect(received).toEqual([42]);

    const value = await channel.asyncPull();
    expect(value).toBe(42);

    channel.destroy();
  });
});

