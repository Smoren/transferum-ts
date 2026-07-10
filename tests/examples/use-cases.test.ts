import {
  RAFTicker,
  OutputPipelineBuilder,
  AsyncInputPipelineBuilder,
  AsyncDuplexPipelineBuilder,
  linkTransfers,
  createPassBridge,
  createConvertTransfer,
  createMapOperator,
  createPushStoredChannelTransfer,
  createDebounceTransfer,
  createAsyncConditionTransfer,
  createAsyncConvertTransfer,
  createAsyncMapOperator,
  createAsyncSinkTransfer,
  createMergeTransfer,
  createSinkTransfer,
  createBridgeSelector,
  createSplitTransfer,
  createWriteTransfer,
  createLatestStorage,
  createAsyncPollingSourceTransfer,
  createAsyncIdlePollingTransfer,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';
import type {
  ServerState,
  ViewModel,
  SensorData,
  FeedItem,
  ValidationResult,
  RawData,
  ProcessedData,
  Telemetry,
  // @ts-ignore
} from './fixtures';
import {
  wait,
  toViewModel,
  validate,
  // @ts-ignore
} from './fixtures';

// ═══════════════════════════════════════════════════════════════
// Use Cases — Real-time UI updates from API polling
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Real-time UI updates from API polling', () => {
  it('polls API, transforms response, updates subscribers', async () => {
    const fetcher = jest.fn<() => Promise<ServerState>>(() => Promise.resolve({ id: 1, status: 'ok' }));

    const polling = createAsyncPollingSourceTransfer<ServerState>({
      fetcher,
      interval: 50,
      activated: true,
    });

    const pipeline = OutputPipelineBuilder
      .start(polling)
      .to(createConvertTransfer<ServerState, ViewModel>({
        operator: createMapOperator((state) => toViewModel(state)),
      }))
      .finish(createPushStoredChannelTransfer<ViewModel>());

    const received: ViewModel[] = [];
    pipeline.subscribe((vm) => received.push(vm));

    await wait(80);
    polling.deactivate();
    pipeline.destroy();

    expect(received.length).toBeGreaterThan(0);
    expect(received[0]).toEqual({ id: 1, displayStatus: 'OK' });
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Debounced user input with async validation
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Debounced user input with async validation', () => {
  it('debounces input, validates, transforms, sends to async sink', async () => {
    const input = createDebounceTransfer<string>({ delay: 50 });

    const sinkResults: ValidationResult[] = [];
    const saveResult = jest.fn(async (result: ValidationResult) => {
      sinkResults.push(result);
    });

    const pipeline = AsyncInputPipelineBuilder
      .start(input)
      .to(createAsyncConditionTransfer<string>({
        shouldAccept: async (s) => s.length > 0,
      }))
      .to(createAsyncConvertTransfer<string, ValidationResult>({
        operator: createAsyncMapOperator(async (s) => await validate(s)),
      }))
      .finish(createAsyncSinkTransfer<ValidationResult>({
        callback: async (result) => await saveResult(result),
      }), { owned: true, linkOnError: (e) => console.error(e) });

    input.push('user@example.com');

    await wait(200);
    pipeline.destroy();

    expect(saveResult).toHaveBeenCalled();
    expect(sinkResults[0]).toEqual({ valid: true });
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Merging multiple data sources into a single view
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Merging multiple data sources into a single view', () => {
  it('merges multiple sensor streams into one', async () => {
    const tempSensor = createAsyncPollingSourceTransfer<SensorData>({ fetcher: () => Promise.resolve({ temperature: 25, humidity: 50 }), interval: 1000, activated: true });
    const humiditySensor = createAsyncPollingSourceTransfer<SensorData>({ fetcher: () => Promise.resolve({ temperature: 26, humidity: 55 }), interval: 1000, activated: true });

    const merge = createMergeTransfer<SensorData>({
      sources: [tempSensor, humiditySensor],
    });

    const received: SensorData[] = [];
    merge.subscribe((data) => {
      received.push(data);
    });

    await wait(0);

    expect(received.length).toBe(2);
    expect(received[0]).toEqual({ temperature: 25, humidity: 50 });
    expect(received[1]).toEqual({ temperature: 26, humidity: 55 });

    tempSensor.destroy();
    humiditySensor.destroy();

    merge.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Conditional routing with bridges
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Conditional routing with bridges', () => {
  it('routes data to different pipelines based on a selector', () => {
    const source = createPushStoredChannelTransfer<number>();
    const fastTarget: number[] = [];
    const slowTarget: number[] = [];

    const fastBridge = createPassBridge({
      source,
      target: createSinkTransfer({ callback: (n: number) => fastTarget.push(n) }),
      activated: false,
    });
    const slowBridge = createPassBridge({
      source,
      target: createSinkTransfer({ callback: (n: number) => slowTarget.push(n) }),
      activated: false,
    });

    const router = createBridgeSelector({
      bridges: { fast: fastBridge, slow: slowBridge },
      initialKey: 'fast',
      activated: true,
      owned: true,
    });

    source.push(42);
    expect(fastTarget).toEqual([42]);
    expect(slowTarget).toEqual([]);

    router.select('slow');
    source.push(100);
    expect(fastTarget).toEqual([42]);
    expect(slowTarget).toEqual([100]);

    router.destroy();
    source.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Idle fallback polling
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Idle fallback polling', () => {
  it('falls back to polling on idle', async () => {
    let counter = 0;
    const fetcher = jest.fn<() => Promise<FeedItem>>(() => Promise.resolve({ id: ++counter, content: `item-${counter}` }));

    const channel = createAsyncIdlePollingTransfer<FeedItem>({
      fetcher,
      timeout: 50,
      interval: 20,
      activated: true,
    });

    const received: FeedItem[] = [];
    channel.subscribe((item) => received.push(item));

    // Push real-time data
    channel.push({ id: 0, content: 'realtime' });
    expect(received).toEqual([{ id: 0, content: 'realtime' }]);

    // Wait for idle polling to kick in
    await wait(150);
    channel.deactivate();
    channel.destroy();

    expect(received.length).toBeGreaterThan(1);
    expect(fetcher).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Game loop / animation frame data processing
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Game loop / animation frame data processing', () => {
  it('uses RAFTicker for frame-aligned processing', () => {
    const ticks: number[] = [];
    const ticker = new RAFTicker({ callback: () => ticks.push(Date.now()), interval: 16 });
    ticker.start();

    // RAF fallback uses setTimeout, so it runs in Node.js
    expect(ticker.active).toBe(true);
    ticker.stop();
    expect(ticker.active).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Async data pipeline with storage
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Async data pipeline with storage', () => {
  it('pushes data, async transforms, notifies subscribers', async () => {
    const source = createPushStoredChannelTransfer<RawData>();

    const pipeline = AsyncDuplexPipelineBuilder
      .start(source)
      .to(createAsyncConvertTransfer<RawData, ProcessedData>({
        operator: createAsyncMapOperator(async (raw) => ({ processed: raw.raw.toUpperCase() })),
      }))
      .finish(createPushStoredChannelTransfer<ProcessedData>());

    const received: ProcessedData[] = [];
    pipeline.subscribe((data) => received.push(data));

    source.push({ raw: 'data' });

    await wait(50);
    pipeline.destroy();

    expect(received.length).toBeGreaterThan(0);
    expect(received[0]).toEqual({ processed: 'DATA' });
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Broadcast to multiple consumers
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Broadcast to multiple consumers', () => {
  it('broadcasts to multiple targets via SplitTransfer', () => {
    const source = createPushStoredChannelTransfer<Telemetry>();
    const telemetryStorage = createLatestStorage<Telemetry>();

    const logged: Telemetry[] = [];
    const charted: Telemetry[] = [];

    const split = createSplitTransfer<Telemetry>({
      targets: [
        createSinkTransfer({ callback: (t) => logged.push(t) }),
        createSinkTransfer({ callback: (t) => charted.push(t) }),
        createWriteTransfer({ flow: telemetryStorage }),
      ],
    });

    linkTransfers(source, split);

    const telemetry: Telemetry = { name: 'cpu', value: 42 };
    source.push(telemetry);

    expect(logged).toEqual([telemetry]);
    expect(charted).toEqual([telemetry]);
    expect(telemetryStorage.read()).toEqual(telemetry);

    source.destroy();
    split.destroy();
  });
});
