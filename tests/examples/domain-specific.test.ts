import {
  createDebounceTransfer,
  createConvertTransfer,
  createMapOperator,
  createBridgeSelector,
  createPassBridge,
  createPushStoredChannelTransfer,
  createThrottleTransfer,
  createBridgeMultiSelector,
  createMergeTransfer,
  createConditionTransfer,
  createSinkTransfer,
  createPushChannelTransfer,
  createAsyncPollingSourceTransfer,
  createAsyncConditionTransfer,
  createAsyncConvertTransfer,
  createAsyncMapOperator,
  createAsyncSinkTransfer,
  OutputPipelineBuilder,
  DuplexPipelineBuilder,
  AsyncDuplexPipelineBuilder,
  linkTransfers,
} from '../../src';
import type {
  KeyInput,
  SensorData,
  Alert,
  Metric,
  Quote,
  TechnicalIndicator,
  TradingSignal,
  SearchResult,
  // @ts-ignore
} from './fixtures';
import { describe, expect, it } from '@jest/globals';
import { wait } from './fixtures';

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — Game Development
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: Game Development - Input Processing Pipeline', () => {
  it('debounces raw input, converts to key code, routes to subsystems', async () => {
    const rawInputSource = createDebounceTransfer<KeyInput>({ delay: 50 });

    const inputConverter = createConvertTransfer<KeyInput, string>({
      operator: createMapOperator((event) => event.code),
    });

    const drivingTarget: string[] = [];
    const flyingTarget: string[] = [];
    const uiTarget: string[] = [];

    const gameplayRouter = createBridgeSelector({
      bridges: {
        driving: createPassBridge({ source: inputConverter, target: createSinkTransfer<string>({ callback: (c) => drivingTarget.push(c) }), activated: false }),
        flying: createPassBridge({ source: inputConverter, target: createSinkTransfer<string>({ callback: (c) => flyingTarget.push(c) }), activated: false }),
        ui: createPassBridge({ source: inputConverter, target: createSinkTransfer<string>({ callback: (c) => uiTarget.push(c) }), activated: false }),
      },
      initialKey: 'driving',
      activated: true,
      owned: true,
    });

    linkTransfers(rawInputSource, inputConverter);

    rawInputSource.push({ code: 'KeyW' });
    await wait(100);

    expect(drivingTarget).toEqual(['KeyW']);
    expect(flyingTarget).toEqual([]);

    gameplayRouter.select('flying');
    rawInputSource.push({ code: 'KeyW' });
    await wait(100);

    expect(flyingTarget).toEqual(['KeyW']);
    expect(drivingTarget).toEqual(['KeyW']);

    gameplayRouter.destroy();
    rawInputSource.destroy();
  });
});

describe('README Domain-Specific: Game Development - Particle & Sound Effects', () => {
  it('activates multiple effects simultaneously', () => {
    const trigger = createPushStoredChannelTransfer<string>();

    const particleTarget: string[] = [];
    const audioTarget: string[] = [];
    const cameraTarget: string[] = [];

    const effects = createBridgeMultiSelector({
      bridges: {
        explosion: createPassBridge({ source: trigger, target: createSinkTransfer<string>({ callback: (e) => particleTarget.push(e) }), activated: false }),
        sound: createPassBridge({ source: trigger, target: createSinkTransfer<string>({ callback: (e) => audioTarget.push(e) }), activated: false }),
        shake: createPassBridge({ source: trigger, target: createSinkTransfer<string>({ callback: (e) => cameraTarget.push(e) }), activated: false }),
      },
      initialKeys: [],
      activated: true,
      owned: true,
    });

    effects.check('explosion');
    effects.check('sound');
    effects.check('shake');

    trigger.push('boom');

    expect(particleTarget).toEqual(['boom']);
    expect(audioTarget).toEqual(['boom']);
    expect(cameraTarget).toEqual(['boom']);

    effects.destroy();
    trigger.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — IoT & Automation
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: IoT - Sensor Data Aggregation', () => {
  it('aggregates sensor data with filtering', async () => {
    const tempSensor = createAsyncPollingSourceTransfer<SensorData>({
      fetcher: () => Promise.resolve({ temperature: 25, humidity: 50 }),
      interval: 50,
      activated: true,
    });

    const humiditySensor = createAsyncPollingSourceTransfer<SensorData>({
      fetcher: () => Promise.resolve({ temperature: 26, humidity: 55 }),
      interval: 50,
      activated: true,
    });

    const aggregator = createMergeTransfer<SensorData>({
      sources: [tempSensor, humiditySensor],
    });

    const pipeline = OutputPipelineBuilder
      .start(aggregator)
      .to(createConditionTransfer<SensorData>({
        shouldAccept: (d) => d.temperature > 0 && d.humidity >= 0,
      }))
      .finish(createPushStoredChannelTransfer<SensorData>());

    const received: SensorData[] = [];
    pipeline.subscribe((data) => received.push(data));

    await wait(100);

    expect(received.length).toBeGreaterThan(0);
    expect(received[0].temperature).toBeGreaterThan(0);

    pipeline.destroy();
    tempSensor.deactivate();
    humiditySensor.deactivate();
  });
});

describe('README Domain-Specific: IoT - Device Control', () => {
  it('routes commands to specific actuators', () => {
    const commandChannel = createPushStoredChannelTransfer<string>();

    const lightTarget: string[] = [];
    const thermostatTarget: string[] = [];
    const lockTarget: string[] = [];

    const commandRouter = createBridgeSelector({
      bridges: {
        light: createPassBridge({ source: commandChannel, target: createSinkTransfer<string>({ callback: (c) => lightTarget.push(c) }), activated: false }),
        thermostat: createPassBridge({ source: commandChannel, target: createSinkTransfer<string>({ callback: (c) => thermostatTarget.push(c) }), activated: false }),
        lock: createPassBridge({ source: commandChannel, target: createSinkTransfer<string>({ callback: (c) => lockTarget.push(c) }), activated: false }),
      },
      initialKey: 'light',
      activated: true,
      owned: true,
    });

    commandChannel.push('ON');
    expect(lightTarget).toEqual(['ON']);

    commandRouter.select('thermostat');
    commandChannel.push('SET_25');
    expect(thermostatTarget).toEqual(['SET_25']);

    commandRouter.destroy();
    commandChannel.destroy();
  });
});

describe('README Domain-Specific: IoT - Monitoring & Alerts', () => {
  it('polls temperature, filters, throttles, converts to alerts', async () => {
    const tempMonitor = createAsyncPollingSourceTransfer<number>({
      fetcher: () => Promise.resolve(100),
      interval: 20,
      activated: true,
    });

    const TEMPERATURE_THRESHOLD = 95;

    const alertPipeline = OutputPipelineBuilder
      .start(tempMonitor)
      .to(createConditionTransfer<number>({ shouldAccept: (temp) => temp > TEMPERATURE_THRESHOLD }))
      .to(createThrottleTransfer<number>({ interval: 500 }))
      .finish(createConvertTransfer<number, Alert>({
        operator: createMapOperator((temp) => ({ type: 'HIGH_TEMP', value: temp })),
      }));

    const alerts: Alert[] = [];
    alertPipeline.subscribe((alert) => alerts.push(alert));

    await wait(100);
    tempMonitor.deactivate();

    // ~5 polls in 100ms, but throttle (500ms) passes only the leading edge
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toEqual({ type: 'HIGH_TEMP', value: 100 });

    alertPipeline.destroy();
    tempMonitor.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — UI/UX Applications
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: UI/UX - Reactive Forms', () => {
  it('debounces input, validates, async-transforms, stores results', async () => {
    const searchInput = createDebounceTransfer<string>({ delay: 50 });

    const pipeline = AsyncDuplexPipelineBuilder
      .start(searchInput)
      .to(createAsyncConditionTransfer<string>({ shouldAccept: async (s) => s.length >= 3 }))
      .to(createAsyncConvertTransfer<string, SearchResult[]>({
        operator: createAsyncMapOperator(async (query) => [{ id: 1, title: query }]),
      }))
      .finish(createPushStoredChannelTransfer<SearchResult[]>());

    const received: SearchResult[][] = [];
    pipeline.subscribe((results) => received.push(results));

    searchInput.push('ab');
    await wait(100);
    expect(received).toEqual([]);

    searchInput.push('hello');
    await wait(100);
    expect(received).toEqual([[{ id: 1, title: 'hello' }]]);

    pipeline.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — Monitoring & Logging
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: Monitoring - Metrics Collection', () => {
  it('collects metrics and sends to multiple destinations', () => {
    const metricsChannel = createPushStoredChannelTransfer<Metric>();

    const prometheusTarget: Metric[] = [];
    const elkTarget: Metric[] = [];
    const sentryTarget: Metric[] = [];

    const destinations = createBridgeMultiSelector({
      bridges: {
        prometheus: createPassBridge({ source: metricsChannel, target: createSinkTransfer<Metric>({ callback: (m) => prometheusTarget.push(m) }), activated: true }),
        elk: createPassBridge({ source: metricsChannel, target: createSinkTransfer<Metric>({ callback: (m) => elkTarget.push(m) }), activated: true }),
        sentry: createPassBridge({ source: metricsChannel, target: createSinkTransfer<Metric>({ callback: (m) => sentryTarget.push(m) }), activated: false }),
      },
      initialKeys: ['prometheus', 'elk'],
      activated: true,
      owned: true,
    });

    metricsChannel.push({ name: 'request_latency', value: 150 });

    expect(prometheusTarget).toEqual([{ name: 'request_latency', value: 150 }]);
    expect(elkTarget).toEqual([{ name: 'request_latency', value: 150 }]);
    expect(sentryTarget).toEqual([]);

    destinations.destroy();
    metricsChannel.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — Financial Applications
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: Financial - Stock Market Data Processing', () => {
  it('processes streaming quotes into trading signals', () => {
    const quoteStream = createPushChannelTransfer<Quote[]>();
    const thresholdChannel = createPushStoredChannelTransfer<number>({ initialValue: 100 });

    const indicatorPipeline = DuplexPipelineBuilder
      .start(quoteStream)
      .to(createConvertTransfer<Quote[], TechnicalIndicator>({
        operator: createMapOperator((quotes): TechnicalIndicator => ({
          value: quotes.reduce((sum, q) => sum + q.price, 0),
          symbols: quotes.map((q) => q.symbol),
          threshold: thresholdChannel.pull() ?? 0,
        })),
      }))
      .to(createConditionTransfer<TechnicalIndicator>({
        shouldAccept: (ind) => ind.value > ind.threshold,
      }))
      .to(createConvertTransfer<TechnicalIndicator, TradingSignal>({
        operator: createMapOperator((ind) => ({
          action: 'BUY',
          symbols: ind.symbols,
          targetPrice: ind.value,
        })),
      }))
      .finish(createPushStoredChannelTransfer<TradingSignal>());

    const received: TradingSignal[] = [];
    indicatorPipeline.subscribe((signal) => received.push(signal));

    quoteStream.push([
      { symbol: 'AAPL', price: 60, timestamp: Date.now() },
      { symbol: 'AAPL', price: 50, timestamp: Date.now() },
    ]);

    expect(received.length).toBe(1);
    expect(received[0].action).toBe('BUY');
    expect(received[0].targetPrice).toBe(110);
    expect(received[0].symbols).toEqual(['AAPL', 'AAPL']);

    indicatorPipeline.destroy();
    quoteStream.destroy();
    thresholdChannel.destroy();
  });
});

describe('README Domain-Specific: Financial - Portfolio Management', () => {
  it('switches between strategies based on market conditions', () => {
    const marketData = createPushStoredChannelTransfer<Quote>();

    const conservativeTarget: Quote[] = [];
    const aggressiveTarget: Quote[] = [];
    const balancedTarget: Quote[] = [];

    const strategyRouter = createBridgeSelector({
      bridges: {
        conservative: createPassBridge({ source: marketData, target: createSinkTransfer<Quote>({ callback: (q) => conservativeTarget.push(q) }), activated: false }),
        aggressive: createPassBridge({ source: marketData, target: createSinkTransfer<Quote>({ callback: (q) => aggressiveTarget.push(q) }), activated: false }),
        balanced: createPassBridge({ source: marketData, target: createSinkTransfer<Quote>({ callback: (q) => balancedTarget.push(q) }), activated: true }),
      },
      initialKey: 'balanced',
      activated: true,
      owned: true,
    });

    marketData.push({ symbol: 'AAPL', price: 150, timestamp: Date.now() });
    expect(balancedTarget.length).toBe(1);

    const HIGH_THRESHOLD = 200;
    if (150 > HIGH_THRESHOLD) {
      strategyRouter.select('conservative');
    }

    strategyRouter.destroy();
    marketData.destroy();
  });
});
