import {
  PushChannelTransfer,
  DelayedPushChannelTransfer,
  DebounceTransfer,
  ThrottleTransfer,
  PushStoredChannelTransfer,
  BufferTransfer,
  ManualBufferTransfer,
  ManualFlowTransfer,
  GateTransfer,
  MergeTransfer,
  SplitTransfer,
  PollingSourceTransfer,
  PollingProxyTransfer,
  PollingFlowTransfer,
  IdlePollingTransfer,
  ChannelTransfer,
  StoredChannelTransfer,
  SinkTransfer,
  WriteTransfer,
  ReadTransfer,
  ConvertTransfer,
  ConditionTransfer,
  UniversalCompositeTransfer,
  MapOperator,
  LatestStorage,
  linkTransfers,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';
// @ts-ignore
import { wait } from './fixtures';

// ═══════════════════════════════════════════════════════════════
// Transfers — Individual Examples
// ═══════════════════════════════════════════════════════════════

describe('README Transfers: PushChannelTransfer', () => {
  it('emits data to subscribers on push', () => {
    const channel = new PushChannelTransfer<number>();

    const received: number[] = [];
    channel.subscribe((data) => received.push(data));
    channel.push(42);

    expect(received).toEqual([42]);
    channel.destroy();
  });
});

describe('README Transfers: DelayedPushChannelTransfer', () => {
  it('emits data with delay', async () => {
    const channel = new DelayedPushChannelTransfer<number>({ delay: 50 });

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
    const channel = new DebounceTransfer<number>({ delay: 50 });

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
    const channel = new ThrottleTransfer<number>({ interval: 50 });

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
    const channel = new PushStoredChannelTransfer<number>({ initialValue: 0 });

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
    const buffer = new BufferTransfer<number>();

    buffer.push(42);
    expect(buffer.pull()).toBe(42);
    expect(buffer.pull()).toBeUndefined();

    buffer.destroy();
  });
});

describe('README Transfers: ManualBufferTransfer', () => {
  it('allows pull only after trigger', () => {
    const buffer = new ManualBufferTransfer<number>();

    buffer.push(42);
    expect(buffer.pull()).toBeUndefined();

    buffer.trigger();
    expect(buffer.pull()).toBe(42);

    buffer.destroy();
  });
});

describe('README Transfers: ManualFlowTransfer', () => {
  it('emits to subscribers only on trigger', () => {
    const flow = new ManualFlowTransfer<number>();

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
    const gate = new GateTransfer<number>({ activated: false });

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
    const gate = new GateTransfer<number>({ activated: false });

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
    const source1 = new PushStoredChannelTransfer<number>();
    const source2 = new PushStoredChannelTransfer<number>();

    const merge = new MergeTransfer<number>({ sources: [source1, source2] });

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
    const target1 = new PushStoredChannelTransfer<number>();
    const target2 = new PushStoredChannelTransfer<number>();

    const split = new SplitTransfer<number>({ targets: [target1, target2] });

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
    const polling = new PollingSourceTransfer<number>({
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
    const source = new PushStoredChannelTransfer<number>({ initialValue: 42 });
    const poller = new PollingProxyTransfer<number>({
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
    const polling = new PollingFlowTransfer<number>({
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
    const channel = new IdlePollingTransfer<number>({
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

    const channel = new ChannelTransfer<number>({
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

    const channel = new StoredChannelTransfer<number>({
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
    const sink = new SinkTransfer<number>({
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
    const writer = new WriteTransfer<number>({ flow: storage });

    writer.push(42);
    expect(storage.read()).toBe(42);

    writer.destroy();
  });
});

describe('README Transfers: ReadTransfer', () => {
  it('reads from storage', () => {
    const storage = new LatestStorage<number>();
    storage.write(42);
    const reader = new ReadTransfer<number>({ flow: storage });

    expect(reader.pull()).toBe(42);

    reader.destroy();
  });
});

describe('README Transfers: ConvertTransfer', () => {
  it('transforms data via operator', () => {
    const converter = new ConvertTransfer<number, string>({
      operator: new MapOperator((n: number) => `val_${n}`),
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
    const condition = new ConditionTransfer<number>({
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
    const transfer = new PushStoredChannelTransfer<number>();

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
