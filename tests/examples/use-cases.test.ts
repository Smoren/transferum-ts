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
  createConditionTransfer,
  createMergeTransfer,
  createSinkTransfer,
  createBridgeSelector,
  createBridgeMultiSelector,
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
  SensorReading,
  SensorState,
  ValidationResult,
  RawData,
  ProcessedData,
  Telemetry,
  LogEntry,
  SearchResult,
  // @ts-ignore
} from './fixtures';
import {
  wait,
  toViewModel,
  validate,
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
// Use Cases — Debounced search with error handling and empty-result suppression
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Debounced search with error handling and empty-result suppression', () => {
  it('debounces, filters, async-converts with onError, suppresses empty results', async () => {
    const input = createDebounceTransfer<string>({ delay: 50 });

    const rendered: SearchResult[][] = [];
    const errors: Error[] = [];

    let shouldFail = false;
    let returnEmpty = false;

    const searchAPI = jest.fn(async (q: string): Promise<SearchResult[]> => {
      if (shouldFail) throw new Error('API down');
      if (returnEmpty) return [];
      return [{ id: 1, title: q }];
    });

    const pipeline = AsyncInputPipelineBuilder
      .start(input)
      .to(createConditionTransfer<string>({ shouldAccept: q => q.length >= 3 }))
      .to(createAsyncConvertTransfer<string, SearchResult[]>({
        operator: createAsyncMapOperator(async q => await searchAPI(q)),
        onError: (e) => errors.push(e),
      }))
      .to(createConditionTransfer<SearchResult[]>({ shouldAccept: results => results.length > 0 }))
      .finish(createSinkTransfer<SearchResult[]>({
        callback: results => rendered.push(results),
      }), { owned: true });

    // Short query — rejected by shouldAccept
    input.push('ab');
    await wait(100);
    expect(rendered).toEqual([]);
    expect(searchAPI).not.toHaveBeenCalled();

    // Valid query — results rendered
    input.push('hello');
    await wait(100);
    expect(rendered).toEqual([[{ id: 1, title: 'hello' }]]);
    expect(errors).toEqual([]);

    // API fails — onError catches, stream survives
    shouldFail = true;
    input.push('world');
    await wait(100);
    expect(errors.length).toBe(1);
    expect(rendered).toEqual([[{ id: 1, title: 'hello' }]]); // no new render

    // API returns empty — suppressed by shouldEmit
    shouldFail = false;
    returnEmpty = true;
    input.push('test');
    await wait(100);
    expect(rendered).toEqual([[{ id: 1, title: 'hello' }]]); // still no new render

    pipeline.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Merging multiple data sources into a single view
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Merging multiple data sources into a single view', () => {
  it('merges multiple sensor streams into one', async () => {
    const tempSensor = createAsyncPollingSourceTransfer<SensorReading>({ fetcher: () => Promise.resolve({ sensor: 'temperature', value: 25 }), interval: 1000, activated: true });
    const humiditySensor = createAsyncPollingSourceTransfer<SensorReading>({ fetcher: () => Promise.resolve({ sensor: 'humidity', value: 55 }), interval: 1000, activated: true });

    const merge = createMergeTransfer<SensorReading>({
      sources: [tempSensor, humiditySensor],
    });

    const received: SensorReading[] = [];
    merge.subscribe((data) => {
      received.push(data);
    });

    await wait(0);

    expect(received.length).toBe(2);
    expect(received[0]).toEqual({ sensor: 'temperature', value: 25 });
    expect(received[1]).toEqual({ sensor: 'humidity', value: 55 });

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
    const fetcher = jest.fn<() => Promise<SensorState>>(() => Promise.resolve({ temperature: ++counter }));

    const channel = createAsyncIdlePollingTransfer<SensorState>({
      fetcher,
      timeout: 50,
      interval: 20,
      activated: true,
    });

    const received: SensorState[] = [];
    channel.subscribe((item) => received.push(item));

    // Push real-time data
    channel.push({ temperature: 0 });
    expect(received).toEqual([{ temperature: 0 }]);

    // Wait for idle polling to kick in
    await wait(150);
    channel.deactivate();
    channel.destroy();

    expect(received.length).toBeGreaterThan(1);
    expect(fetcher).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// Use Cases — Debounced user input with async validation
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Debounced user input with async validation', () => {
  it('debounces input, async-validates, and sends to async sink', async () => {
    const input = createPushStoredChannelTransfer<string>();

    const saved: ValidationResult[] = [];
    const pipeline = AsyncInputPipelineBuilder
      .start(input)
      .to(createDebounceTransfer<string>({ delay: 50 }))
      .to(createAsyncConditionTransfer<string>({ shouldAccept: async (s) => s.length > 0 }))
      .to(createAsyncConvertTransfer<string, ValidationResult>({
        operator: createAsyncMapOperator(async (s) => await validate(s)),
      }))
      .finish(createAsyncSinkTransfer<ValidationResult>({ callback: async (result) => { saved.push(result); } }));

    input.push('user@example.com');
    await wait(100);

    expect(saved.length).toBe(1);
    expect(saved[0]).toEqual({ valid: true });

    // Empty string — rejected by shouldAccept
    input.push('');
    await wait(100);

    expect(saved.length).toBe(1);

    pipeline.destroy();
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

// ═══════════════════════════════════════════════════════════════
// Use Cases — Multi-route conditional routing with BridgeMultiSelector
// ═══════════════════════════════════════════════════════════════

describe('README Use Cases: Multi-route conditional routing with BridgeMultiSelector', () => {
  it('routes log entries to multiple backends with runtime selection', async () => {
    const source = createPushStoredChannelTransfer<LogEntry>();

    const sentryTarget: LogEntry[] = [];
    const elkTarget: LogEntry[] = [];
    const prometheusTarget: LogEntry[] = [];

    const sentryFilter = createConditionTransfer<LogEntry>({ shouldAccept: (l) => l.level === 'ERROR' });
    const elkFilter = createConditionTransfer<LogEntry>({ shouldAccept: (l) => l.level === 'WARN' });
    const prometheusFilter = createConditionTransfer<LogEntry>({ shouldAccept: (l) => l.level === 'INFO' });

    linkTransfers(source, createSplitTransfer<LogEntry>({ targets: [sentryFilter, elkFilter, prometheusFilter] }));

    const routes = createBridgeMultiSelector({
      bridges: {
        sentry: createPassBridge({
          source: sentryFilter,
          target: createAsyncSinkTransfer<LogEntry>({ callback: async (l) => sentryTarget.push(l), onError: (e) => console.error(e) }),
          activated: false,
        }),
        elk: createPassBridge({
          source: elkFilter,
          target: createAsyncSinkTransfer<LogEntry>({ callback: async (l) => elkTarget.push(l), onError: (e) => console.error(e) }),
          activated: false,
        }),
        prometheus: createPassBridge({
          source: prometheusFilter,
          target: createAsyncSinkTransfer<LogEntry>({ callback: async (l) => prometheusTarget.push(l), onError: (e) => console.error(e) }),
          activated: false,
        }),
      },
      initialKeys: ['sentry', 'elk', 'prometheus'],
      activated: true,
      owned: true,
    });

    const errorLog: LogEntry = { level: 'ERROR', message: 'fail', timestamp: 1 };
    const warnLog: LogEntry = { level: 'WARN', message: 'slow', timestamp: 2 };
    const infoLog: LogEntry = { level: 'INFO', message: 'ok', timestamp: 3 };

    // All routes active — each receives its level
    source.push(errorLog);
    source.push(warnLog);
    source.push(infoLog);
    await wait(10);

    expect(sentryTarget).toEqual([errorLog]);
    expect(elkTarget).toEqual([warnLog]);
    expect(prometheusTarget).toEqual([infoLog]);

    // Leave only Sentry and Prometheus
    routes.select(['sentry', 'prometheus']);

    source.push(errorLog);
    source.push(warnLog);
    source.push(infoLog);
    await wait(10);

    expect(sentryTarget).toEqual([errorLog, errorLog]);
    expect(elkTarget).toEqual([warnLog]); // unchanged — elk route inactive
    expect(prometheusTarget).toEqual([infoLog, infoLog]);

    // Check single route back
    routes.check('elk');

    source.push(warnLog);
    await wait(10);

    expect(elkTarget).toEqual([warnLog, warnLog]);

    // Uncheck single route
    routes.uncheck('elk');

    source.push(warnLog);
    await wait(10);

    expect(elkTarget).toEqual([warnLog, warnLog]); // unchanged — elk route inactive again

    routes.destroy();
    source.destroy();
  });
});

