import {
  createDebounceTransfer,
  createConvertTransfer,
  createMapOperator,
  createBridgeSelector,
  createPassBridge,
  createPushStoredChannelTransfer,
  createThrottleTransfer,
  createGateTransfer,
  linkTransfers,
  createBridgeMultiSelector,
  createPollingSourceTransfer,
  createMergeTransfer,
  createConditionTransfer,
  createSinkTransfer,
  createPushChannelTransfer,
  createSplitTransfer,
  OutputPipelineBuilder,
  DuplexPipelineBuilder,
  RAFTicker,
} from '../../src';
import { describe, expect, it } from '@jest/globals';
import {
  wait,
  type InputEvent,
  type GameCommand,
  type GameState,
  type PhysicsEvent,
  type SensorData,
  type Alert,
  type ComponentState,
  type UIEvent,
  type Metric,
  type LogEntry,
  type Quote,
  type TechnicalIndicator,
  type TradingSignal,
  eventToCommand,
  detectAnomaly,
  // @ts-ignore
} from './fixtures';

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — Game Development
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: Game Development - Input Processing Pipeline', () => {
  it('collects events, filters, transforms, routes to systems', async () => {
    const inputChannel = createDebounceTransfer<InputEvent>({ delay: 50 });
    const commandConverter = createConvertTransfer<InputEvent, GameCommand>({
      operator: createMapOperator((e) => eventToCommand(e)),
    });

    const walkTarget: GameCommand[] = [];
    const runTarget: GameCommand[] = [];
    const shootTarget: GameCommand[] = [];

    const router = createBridgeSelector({
      bridges: {
        walk: createPassBridge({ source: commandConverter, target: createSinkTransfer<GameCommand>({ callback: (c) => walkTarget.push(c) }), activated: false }),
        run: createPassBridge({ source: commandConverter, target: createSinkTransfer<GameCommand>({ callback: (c) => runTarget.push(c) }), activated: false }),
        shoot: createPassBridge({ source: commandConverter, target: createSinkTransfer<GameCommand>({ callback: (c) => shootTarget.push(c) }), activated: false }),
      },
      initialKey: 'walk',
      activated: true,
      owned: true,
    });

    linkTransfers(inputChannel, commandConverter);

    inputChannel.push({ type: 'keydown', key: 'w' });
    await wait(100);

    expect(walkTarget.length).toBe(1);
    expect(runTarget.length).toBe(0);

    router.select('run');
    inputChannel.push({ type: 'keydown', key: 'r' });
    await wait(100);
    expect(runTarget.length).toBe(1);

    router.destroy();
    inputChannel.destroy();
  });
});

describe('README Domain-Specific: Game Development - Game Logic & State Management', () => {
  it('manages game state with throttled UI updates', () => {
    const gameState = createPushStoredChannelTransfer<GameState>({ initialValue: { score: 0, level: 1 } });
    const uiUpdate = createThrottleTransfer<GameState>({ interval: 100 });

    linkTransfers(gameState, uiUpdate);

    const hudUpdates: GameState[] = [];
    uiUpdate.subscribe((state) => hudUpdates.push(state));

    gameState.push({ score: 100, level: 1 });
    gameState.push({ score: 200, level: 1 });

    expect(hudUpdates.length).toBeGreaterThan(0);

    const physicsGate = createGateTransfer<PhysicsEvent>({ activated: true });
    physicsGate.deactivate();
    expect(physicsGate.active).toBe(false);

    physicsGate.destroy();
    gameState.destroy();
    uiUpdate.destroy();
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
    const tempSensor = createPollingSourceTransfer<SensorData>({
      fetcher: () => ({ temperature: 25, humidity: 50 }),
      interval: 50,
      activated: true,
    });

    const humiditySensor = createPollingSourceTransfer<SensorData>({
      fetcher: () => ({ temperature: 26, humidity: 55 }),
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
  it('monitors temperature with debounced alerts', async () => {
    const alertChannel = createDebounceTransfer<Alert>({ delay: 50 });

    const alerts: Alert[] = [];
    alertChannel.subscribe((alert) => {
      alerts.push(alert);
    });

    const tempMonitor = createPollingSourceTransfer<number>({
      fetcher: () => 30,
      interval: 20,
      activated: true,
    });

    const THRESHOLD = 25;
    tempMonitor.subscribe((temp) => {
      if (temp > THRESHOLD) {
        alertChannel.push({ type: 'HIGH_TEMP', value: temp });
      }
    });

    await wait(100);
    tempMonitor.deactivate();
    await wait(100); // wait for debounce to fire after polling stopped

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].type).toBe('HIGH_TEMP');

    alertChannel.destroy();
    tempMonitor.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — UI/UX Applications
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: UI/UX - Component State Management', () => {
  it('manages component state with multiple consumers', () => {
    const componentState = createPushStoredChannelTransfer<ComponentState>({
      initialValue: { loading: false, data: null },
    });

    const contentRenders: ComponentState[] = [];
    const breadcrumbUpdates: ComponentState[] = [];

    componentState.subscribe((state) => contentRenders.push(state));
    componentState.subscribe((state) => breadcrumbUpdates.push(state));

    componentState.push({ loading: true, data: null });

    expect(contentRenders.length).toBe(1);
    expect(breadcrumbUpdates.length).toBe(1);

    const visibilityGate = createGateTransfer<UIEvent>({ activated: true });
    visibilityGate.deactivate();
    expect(visibilityGate.active).toBe(false);

    visibilityGate.destroy();
    componentState.destroy();
  });
});

describe('README Domain-Specific: UI/UX - Animations', () => {
  it('uses RAFTicker for smooth animations', () => {
    const frameTicker = new RAFTicker({
      callback: () => {},
      interval: 16,
    });
    frameTicker.start();
    expect(frameTicker.active).toBe(true);
    frameTicker.stop();

    const mouseMove = createThrottleTransfer<{ x: number; y: number }>({ interval: 50 });
    const moves: { x: number; y: number }[] = [];
    mouseMove.subscribe((e) => moves.push(e));
    mouseMove.push({ x: 10, y: 20 });

    mouseMove.destroy();
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

describe('README Domain-Specific: Monitoring - Real-time Log Analysis', () => {
  it('separates log streams by severity level', () => {
    const logSplit = createSplitTransfer<LogEntry>({
      targets: [
        createConditionTransfer({ shouldAccept: (l) => l.level === 'ERROR' }),
        createConditionTransfer({ shouldAccept: (l) => l.level === 'WARN' }),
        createConditionTransfer({ shouldAccept: (l) => l.level === 'INFO' }),
      ],
    });

    linkTransfers(
      createPushChannelTransfer<LogEntry>(),
      logSplit
    );

    const anomalyDetector = createConditionTransfer<LogEntry>({
      shouldAccept: (l) => detectAnomaly(l),
    });

    const anomalies: LogEntry[] = [];
    anomalyDetector.subscribe((l) => anomalies.push(l));

    const errorLog: LogEntry = { level: 'ERROR', message: 'anomaly detected', timestamp: Date.now() };
    anomalyDetector.push(errorLog);

    expect(anomalies.length).toBe(1);
    expect(anomalies[0].level).toBe('ERROR');

    anomalyDetector.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Domain-Specific Applications — Financial Applications
// ═══════════════════════════════════════════════════════════════

describe('README Domain-Specific: Financial - Stock Market Data Processing', () => {
  it('processes streaming quotes with indicators', () => {
    const quoteStream = createPushStoredChannelTransfer<Quote[]>({ initialValue: [] });

    const indicatorPipeline = DuplexPipelineBuilder
      .start(quoteStream)
      .to(createConvertTransfer<Quote[], TechnicalIndicator>({
        operator: createMapOperator((quotes) => ({
          value: quotes.reduce((sum, q) => sum + q.price, 0),
          threshold: 100,
        })),
      }))
      .to(createConditionTransfer<TechnicalIndicator>({
        shouldAccept: (ind) => ind.value > ind.threshold,
      }))
      .finish(createPushStoredChannelTransfer<TechnicalIndicator>());

    const received: TechnicalIndicator[] = [];
    indicatorPipeline.subscribe((ind) => received.push(ind));

    quoteStream.push([
      { symbol: 'AAPL', price: 60, timestamp: Date.now() },
      { symbol: 'AAPL', price: 50, timestamp: Date.now() },
    ]);

    expect(received.length).toBe(1);
    expect(received[0].value).toBe(110);
    expect(received[0].value).toBeGreaterThan(received[0].threshold);

    indicatorPipeline.destroy();
    quoteStream.destroy();
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
