# Transferum

[![npm](https://img.shields.io/npm/v/transferum.svg)](https://www.npmjs.com/package/transferum)
[![jsr](https://jsr.io/badges/@smoren/transferum)](https://jsr.io/@smoren/transferum)
[![npm](https://img.shields.io/npm/dm/transferum.svg?style=flat)](https://www.npmjs.com/package/transferum)
[![Coverage Status](https://coveralls.io/repos/github/Smoren/transferum-ts/badge.svg?branch=master&rand=222)](https://coveralls.io/github/Smoren/transferum-ts?branch=master)
![Build and test](https://github.com/Smoren/transferum-ts/actions/workflows/test.yml/badge.svg)
[![Minified Size](https://badgen.net/bundlephobia/minzip/transferum)](https://bundlephobia.com/result?p=transferum)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A reactive data processing pipeline system for TypeScript.

The library provides type-safe primitives for building data flows: **transfers** (flow nodes), **bridges** (connectors between flows), **builders** (chain constructors), and **operators** (data transformers).

---

## Table of Contents

- [Why Transferum?](#why-transferum)
  - [Problems It Solves](#problems-it-solves)
  - [Key Benefits](#key-benefits)
  - [Use Cases](#use-cases)
- [Domain-Specific Applications](#domain-specific-applications)
  - [Game Development](#game-development)
  - [IoT & Automation](#iot--automation)
  - [UI/UX Applications](#uiux-applications)
  - [Monitoring & Logging Systems](#monitoring--logging-systems)
  - [Financial Applications](#financial-applications)
- [Comparison with Alternatives](#comparison-with-alternatives)
  - [Transferum vs RxJS](#transferum-vs-rxjs)
  - [Transferum vs Most.js](#transferum-vs-mostjs)
  - [Transferum vs Bacon.js / Kefir](#transferum-vs-baconjs--kefir)
  - [Quick Comparison Table](#quick-comparison-table)
  - [When to Choose Transferum](#when-to-choose-transferum)
  - [When to Consider Alternatives](#when-to-consider-alternatives)
- [Installation & Import](#installation--import)
- [Core Concepts](#core-concepts)
  - [Capability Flags System](#capability-flags-system)
  - [Transfers](#transfers)
  - [Linking Transfers](#linking-transfers)
  - [Undefined Behavior in Data Flows](#undefined-behavior-in-data-flows)
  - [Error Handling](#error-handling)
- [Transfers](#transfers-1)
  - [Transfer Comparison Table](#transfer-comparison-table)
  - [PushChannelTransfer](#pushchanneltransfer)
  - [DelayedPushChannelTransfer](#delayedpushchanneltransfer)
  - [DebounceTransfer](#debouncetransfer)
  - [ThrottleTransfer](#throttletransfer)
  - [PushStoredChannelTransfer](#pushstoredchanneltransfer)
  - [BufferTransfer](#buffertransfer)
  - [ManualBufferTransfer](#manualbuffertransfer)
  - [ManualFlowTransfer](#manualflowtransfer)
  - [GateTransfer](#gatetransfer)
  - [MergeTransfer](#mergetransfer)
  - [SplitTransfer](#splittransfer)
  - [PollingSourceTransfer](#pollingsourcetransfer)
  - [PollingProxyTransfer](#pollingproxytransfer)
  - [PollingFlowTransfer](#pollingflowtransfer)
  - [IdlePollingTransfer](#idlepollingtransfer)
  - [ChannelTransfer](#channeltransfer)
  - [StoredChannelTransfer](#storedchanneltransfer)
  - [SinkTransfer](#sinktransfer)
  - [WriteTransfer](#writetransfer)
  - [ReadTransfer](#readtransfer)
  - [ConvertTransfer](#converttransfer)
  - [ConditionTransfer](#conditiontransfer)
  - [UniversalCompositeTransfer](#universalcompositetransfer)
  - [Async Transfer Comparison Table](#async-transfer-comparison-table)
  - [Async Transfers](#async-transfers)
    - [AsyncSinkTransfer](#asyncsinktransfer)
    - [AsyncWriteTransfer](#asyncwritetransfer)
    - [AsyncReadTransfer](#asyncreadtransfer)
    - [AsyncConvertTransfer](#asyncconverttransfer)
    - [AsyncConditionTransfer](#asyncconditiontransfer)
    - [AsyncPollingSourceTransfer](#asyncpollingsourcetransfer)
    - [AsyncPollingProxyTransfer](#asyncpollingproxytransfer)
    - [AsyncPollingFlowTransfer](#asyncpollingflowtransfer)
    - [AsyncIdlePollingTransfer](#asyncidlepollingtransfer)
    - [AsyncStoredChannelTransfer](#asyncstoredchanneltransfer)
- [Operators](#operators)
  - [Operator Comparison Table](#operator-comparison-table)
  - [Async Operators](#async-operators)
- [Storages](#storages)
  - [Storage Comparison Table](#storage-comparison-table)
- [Tickers](#tickers)
- [Helpers](#helpers)
  - [Subscriber](#subscriber)
  - [SubscriptionManager](#subscriptionmanager)
  - [ProxyReference](#proxyreference)
  - [DisposableSubscriberAdapter](#disposablesubscriberadapter)
  - [StateSubscriptionManager](#statesubscriptionmanager)
- [Bridges](#bridges)
  - [Bridge Comparison Table](#bridge-comparison-table)
  - [AsyncTransformBridge](#asynctransformbridge)
- [Pipeline Builders](#pipeline-builders)
  - [Async Builders](#async-builders)
- [Factories](#factories)
- [Utilities](#utilities)
- [Types](#types)
- [Configurations](#configurations)
- [Running Tests](#running-tests)
- [License](#license)

---

## Why Transferum?

### Problems It Solves

As data flows grow in complexity, connecting heterogeneous sources becomes a major bottleneck. Mixing push-based streams, pull-based APIs, polling loops, and async operations demands endless bespoke glue code, and this integration cost compounds with every new stage.

Transferum addresses the structural issues that emerge at scale:

- **No unified contract between stages** — connecting a subscribable source to a pushable sink, a pullable buffer to a polling proxy, or a sync stream to an async consumer shouldn't require hand-written adapters every time.
- **Type erosion across boundaries** — as data passes through transformation, filtering, and async stages, input/output types are lost. Mismatches surface at runtime, not at compile time.
- **Sync/async impedance mismatch** — mixing synchronous reactive streams with async operations typically forces a full migration to one model or manual bridging at every boundary.
- **Flow control as an afterthought** — gating, routing, rate limiting, and fallback behavior are scattered across conditional flags and ad-hoc timers rather than composed from reusable primitives.
- **Fragmented lifecycle management** — subscriptions, timers, and intermediate nodes are cleaned up inconsistently. A uniform `destroy()` contract makes resource ownership explicit and leaks detectable.

Transferum provides **composable, type-safe building blocks** with a uniform capability system. You declare *what* each stage does (push, pull, transform, filter, poll) — the library handles *how* data moves between stages, including sync/async bridging, flow control, and resource cleanup.

### Key Benefits

| Benefit                                   | How                                                                                                                                                                                           |
|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Type-safe pipelines**                   | Each transfer and operator carries its input/output types. Builders enforce type compatibility at compile time — a mismatch is a compile error, not a runtime crash.                          |
| **Uniform capability model**              | Every transfer declares its capabilities via flags (`isPushable`, `isSubscribable`, `isGate`, …). `linkTransfers` automatically selects the correct wiring strategy — no manual glue code.    |
| **Sync + async in one system**            | Sync and async transfers coexist. `linkTransfers` prefers sync when possible and falls back to async strategies when needed. No separate "async world."                                       |
| **Composable architecture**               | Transfers link into chains, bridges connect chains with gate control, builders assemble chains fluently, operators transform data — all orthogonal and reusable.                              |
| **Explicit lifecycle**                    | Every resource (transfer, bridge, subscription, ticker) supports `destroy()`. Builders track `owned` resources and clean them up in one call. No leaked timers or subscriptions.              |
| **Reactive by default, pull when needed** | Most transfers are subscribable (push-based reactivity). Polling transfers add pull-based data acquisition on the same foundation. Use the right model per stage without switching libraries. |
| **Undefined suppression**                 | `undefined` never propagates through the chain — it means "no data," not "empty value." This eliminates an entire class of null-check bugs in downstream consumers.                           |

### Use Cases

#### Real-time UI updates from API polling

```typescript
import { OutputPipelineBuilder, createAsyncPollingSourceTransfer, createConvertTransfer, createMapOperator, createPushStoredChannelTransfer } from 'transferum';

// Poll an API every 5 seconds, transform the response, update subscribers
const polling = createAsyncPollingSourceTransfer<ServerState>({
  fetcher: async (): ServerState => await fetchApi('/api/state'),
  interval: 5000,
  activated: true,
});

const pipeline = OutputPipelineBuilder
  .start(polling)
  .to(createConvertTransfer<ServerState, ViewModel>({
    operator: createMapOperator((state) => toViewModel(state)),
  }))
  .finish(createPushStoredChannelTransfer<ViewModel>());

pipeline.subscribe((vm) => renderUI(vm));
```

#### Debounced user input with async validation

```typescript
import { AsyncInputPipelineBuilder, createDebounceTransfer, createAsyncConditionTransfer, createAsyncConvertTransfer, createAsyncSinkTransfer, createAsyncMapOperator } from 'transferum';

// Debounce input → validate → transform → send to async sink
const input = createDebounceTransfer<string>({ delay: 300 });

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

input.push('user@example.com'); // debounced → validated → saved
```

#### Merging multiple data sources into a single view

```typescript
import { createAsyncPollingSourceTransfer, createPushStoredChannelTransfer, createMergeTransfer } from 'transferum';

// Merge multiple sensor streams into one (all sources must have the same type)
const tempSensor = createAsyncPollingSourceTransfer<SensorData>({ fetcher: () => Promise.resolve({ temperature: 25, humidity: 50 }), interval: 1000, activated: true });
const humiditySensor = createAsyncPollingSourceTransfer<SensorData>({ fetcher: () => Promise.resolve({ temperature: 26, humidity: 55 }), interval: 1000, activated: true });

const merge = createMergeTransfer<SensorData>({
  sources: [tempSensor, humiditySensor],
});

merge.subscribe((data) => updateDashboard(data)); // receives data from both sensors
```

#### Conditional routing with bridges

```typescript
import { createBridgeSelector, createPassBridge } from 'transferum';

// Route data to different processing pipelines based on a selector
const fastBridge = createPassBridge({ source, target: fastPipeline, activated: false });
const slowBridge = createPassBridge({ source, target: slowPipeline, activated: false });

const router = createBridgeSelector({
  bridges: { fast: fastBridge, slow: slowBridge },
  initialKey: 'fast',
  activated: true,
});

// Switch route at runtime
router.select('slow');
```

#### Idle fallback polling

```typescript
import { createAsyncIdlePollingTransfer } from 'transferum';

// When user stops interacting, fall back to polling for fresh data
const channel = createAsyncIdlePollingTransfer<FeedItem>({
  fetcher: async () => await fetchLatestFeed(),
  timeout: 10000,   // 10 s of inactivity → start polling
  interval: 2000,   // poll every 2 s
  activated: true,
});

channel.subscribe((item) => appendToFeed(item));
// User pushes items → real-time. User goes idle → automatic polling kicks in.
```

#### Async data pipeline with storage

```typescript
import { AsyncDuplexPipelineBuilder, createPushStoredChannelTransfer, createAsyncConvertTransfer, createAsyncMapOperator } from 'transferum';

// Push data → async transform → notify subscribers
const source = createPushStoredChannelTransfer<RawData>();

const pipeline = AsyncDuplexPipelineBuilder
  .start(source)
  .to(createAsyncConvertTransfer<RawData, ProcessedData>({
    operator: createAsyncMapOperator(async (raw) => await process(raw)),
  }))
  .finish(createPushStoredChannelTransfer<ProcessedData>());

pipeline.subscribe((data) => console.log(data));
source.push(rawData); // → async transformation → processed data
```

#### Broadcast to multiple consumers

```typescript
import { createPushStoredChannelTransfer, createSplitTransfer, createSinkTransfer, createWriteTransfer, linkTransfers } from 'transferum';

// One source → multiple independent consumers
const source = createPushStoredChannelTransfer<Telemetry>();

const split = createSplitTransfer<Telemetry>({
  targets: [
    createSinkTransfer({ callback: (t) => logTelemetry(t) }),
    createSinkTransfer({ callback: (t) => updateChart(t) }),
    createWriteTransfer({ flow: telemetryStorage }),
  ],
});

linkTransfers(source, split);
source.push(telemetry); // → logged, charted, and stored simultaneously
```

---

## Domain-Specific Applications

Transferum is designed for building complex, predictable data processing systems across various domains:

### Game Development

**Input Processing Pipeline**

Collect events from keyboard, mouse, and gamepad → filter (e.g., `DebounceTransfer` to prevent spam) → transform into game commands → route to appropriate systems.

```typescript
import { createDebounceTransfer, createConvertTransfer, createMapOperator, createBridgeSelector, createPassBridge } from 'transferum';

const inputChannel = createDebounceTransfer<InputEvent>({ delay: 50 });
const commandConverter = createConvertTransfer<InputEvent, GameCommand>({
  operator: createMapOperator((e) => eventToCommand(e)),
});

const router = createBridgeSelector({
  bridges: {
    walk: createPassBridge({ source: commandConverter, target: walkSystem, activated: false }),
    run: createPassBridge({ source: commandConverter, target: runSystem, activated: false }),
    shoot: createPassBridge({ source: commandConverter, target: shootSystem, activated: false }),
  },
  initialKey: 'walk',
  activated: true,
  owned: true,
});

inputChannel.subscribe((e) => inputChannel.push(e));
// Switch mode at runtime
router.select('run');
```

**Game Logic & State Management**

Manage game object state, synchronize animations, calculate physics. Use `ThrottleTransfer` to limit UI update frequency, `GateTransfer` to activate/deactivate game mechanics.

```typescript
import { createPushStoredChannelTransfer, createThrottleTransfer, createGateTransfer, linkTransfers } from 'transferum';

const gameState = createPushStoredChannelTransfer<GameState>({ initialValue: initialState });
const uiUpdate = createThrottleTransfer<GameState>({ interval: 100 }); // 10 FPS UI updates

linkTransfers(gameState, uiUpdate);
uiUpdate.subscribe((state) => renderHUD(state));

// Pause game mechanics
const physicsGate = createGateTransfer<PhysicsEvent>({ activated: true });
physicsGate.deactivate(); // pause physics
```

**Particle & Sound Effects**

Use `BridgeMultiSelector` to activate multiple effects simultaneously on events (explosion, hit).

```typescript
import { createBridgeMultiSelector, createPassBridge } from 'transferum';

const effects = createBridgeMultiSelector({
  bridges: {
    explosion: createPassBridge({ source: trigger, target: particleSystem, activated: false }),
    sound: createPassBridge({ source: trigger, target: audioSystem, activated: false }),
    shake: createPassBridge({ source: trigger, target: cameraShake, activated: false }),
  },
  initialKeys: [],
  activated: true,
  owned: true,
});

// On explosion event
effects.check('explosion');
effects.check('sound');
effects.check('shake');
```

---

### IoT & Automation

**Sensor Data Aggregation**

Read data from multiple sensors (temperature, humidity, motion) via `AsyncPollingSourceTransfer` → filter (`ConditionTransfer`) → aggregate → send to cloud or local storage.

```typescript
import { OutputPipelineBuilder, createAsyncPollingSourceTransfer, createMergeTransfer, createConditionTransfer, createAsyncWriteTransfer } from 'transferum';

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
  .finish(createAsyncWriteTransfer<SensorData>({ flow: cloudStorage }));
```

**Device Control**

Process commands from users or external systems → route to specific actuators (`BridgeSelector`) → receive feedback.

```typescript
import { createBridgeSelector, createPassBridge } from 'transferum';

const commandRouter = createBridgeSelector({
  bridges: {
    light: createPassBridge({ source: commandChannel, target: lightController, activated: false }),
    thermostat: createPassBridge({ source: commandChannel, target: thermostatController, activated: false }),
    lock: createPassBridge({ source: commandChannel, target: lockController, activated: false }),
  },
  initialKey: 'light',
  activated: true,
  owned: true,
});

commandRouter.select('thermostat'); // switch to thermostat control
```

**Monitoring & Alerts**

Use `AsyncPollingSourceTransfer` for periodic device status polling, `DebounceTransfer` for stable-change notifications (e.g., temperature stays above threshold for N seconds).

```typescript
import { createDebounceTransfer, createAsyncPollingSourceTransfer } from 'transferum';

const alertChannel = createDebounceTransfer<Alert>({ delay: 5000 }); // 5s stable alert

alertChannel.subscribe((alert) => {
  sendNotification(alert);
});

const tempMonitor = createAsyncPollingSourceTransfer<number>({
  fetcher: async () => await readTemperature(),
  interval: 1000,
  activated: true,
});

tempMonitor.subscribe((temp) => {
  if (temp > THRESHOLD) {
    alertChannel.push({ type: 'HIGH_TEMP', value: temp });
  }
});
```

---

### UI/UX Applications

**Reactive Forms**

Process user input in form fields → validate (`GuardOperator`) → transform (`MapOperator`) → `DebounceTransfer` for autosave or live search.

```typescript
import {
  AsyncDuplexPipelineBuilder,
  createDebounceTransfer,
  createAsyncConditionTransfer,
  createAsyncConvertTransfer,
  createPushStoredChannelTransfer,
  createAsyncMapOperator,
} from 'transferum';

const searchInput = createDebounceTransfer<string>({ delay: 300 });

const pipeline = AsyncDuplexPipelineBuilder
  .start(searchInput)
  .to(createAsyncConditionTransfer<string>({
    shouldAccept: async (s) => s.length >= 3,
  }))
  .to(createAsyncConvertTransfer<string, SearchResult[]>({
    operator: createAsyncMapOperator(async (query) => await searchAPI(query)),
  }))
  .finish(createPushStoredChannelTransfer<SearchResult[]>());

pipeline.subscribe((results) => renderSuggestions(results));
searchInput.push('user query');
```

**Component State Management**

Use `PushStoredChannelTransfer` to store component state that other UI parts can subscribe to. `GateTransfer` to control element visibility or activity.

```typescript
import { createPushStoredChannelTransfer, createGateTransfer } from 'transferum';

const componentState = createPushStoredChannelTransfer<ComponentState>({
  initialValue: { loading: false, data: null },
});

// Multiple consumers
componentState.subscribe((state) => renderContent(state));
componentState.subscribe((state) => updateBreadcrumb(state));

// Conditional rendering
const visibilityGate = createGateTransfer<UIEvent>({ activated: true });
visibilityGate.deactivate(); // hide element
```

**Animations**

Use `RAFTicker` for smooth animations, `ThrottleTransfer` to limit redraw frequency on intensive events (e.g., `mousemove`).

```typescript
import { createThrottleTransfer, RAFTicker } from 'transferum';

const frameTicker = new RAFTicker({
  callback: () => updateAnimation(),
  interval: 16, // ~60 FPS
});
frameTicker.start();

const mouseMove = createThrottleTransfer<MouseEvent>({ interval: 50 });
mouseMove.subscribe((e) => updateCursorPosition(e));
```

---

### Monitoring & Logging Systems

**Metrics Collection**

Collect metrics from various sources (server logs, client events) → filter → transform → send to multiple monitoring systems (`BridgeMultiSelector` for Prometheus, ELK, Sentry simultaneously).

```typescript
import { createPushStoredChannelTransfer, createBridgeMultiSelector, createPassBridge } from 'transferum';

const metricsChannel = createPushStoredChannelTransfer<Metric>();

const destinations = createBridgeMultiSelector({
  bridges: {
    prometheus: createPassBridge({ source: metricsChannel, target: prometheusWriter, activated: true }),
    elk: createPassBridge({ source: metricsChannel, target: elkWriter, activated: true }),
    sentry: createPassBridge({ source: metricsChannel, target: sentryWriter, activated: false }),
  },
  initialKeys: ['prometheus', 'elk'],
  activated: true,
  owned: true,
});

metricsChannel.push({ name: 'request_latency', value: 150 });
```

**Real-time Log Analysis**

Use `SplitTransfer` to separate log streams by severity level, `ConditionTransfer` for anomaly detection.

```typescript
import { createSplitTransfer, createConditionTransfer } from 'transferum';

const logSplit = createSplitTransfer<LogEntry>({
  targets: [
    createConditionTransfer({ shouldEmit: (l) => l.level === 'ERROR' }),
    createConditionTransfer({ shouldEmit: (l) => l.level === 'WARN' }),
    createConditionTransfer({ shouldEmit: (l) => l.level === 'INFO' }),
  ],
});

const anomalyDetector = createConditionTransfer<LogEntry>({
  shouldAccept: (l) => detectAnomaly(l),
});

anomalyDetector.subscribe((anomalousLog) => {
  triggerAlert(anomalousLog);
});
```

---

### Financial Applications

**Stock Market Data Processing**

Receive streaming quotes → calculate indicators (`MapOperator`) → filter by conditions (`ConditionTransfer`) → execute trading strategies.

```typescript
import {
  DuplexPipelineBuilder,
  createPushStoredChannelTransfer,
  createConvertTransfer,
  createConditionTransfer,
  createAsyncSinkTransfer,
  createMapOperator,
} from 'transferum';

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
  .finish(createAsyncSinkTransfer<TradingSignal>({
    callback: async (signal) => await executeTrade(signal),
  }));

quoteStream.push([{ symbol: 'AAPL', price: 150, timestamp: Date.now() }]);
```

**Portfolio Management**

Use `BridgeSelector` to switch between different strategies or data sources.

```typescript
import { createBridgeSelector, createPassBridge } from 'transferum';

const strategyRouter = createBridgeSelector({
  bridges: {
    conservative: createPassBridge({ source: marketData, target: conservativeStrategy, activated: false }),
    aggressive: createPassBridge({ source: marketData, target: aggressiveStrategy, activated: false }),
    balanced: createPassBridge({ source: marketData, target: balancedStrategy, activated: true }),
  },
  initialKey: 'balanced',
  activated: true,
  owned: true,
});

// Switch strategy based on market conditions
if (marketVolatility > HIGH_THRESHOLD) {
  strategyRouter.select('conservative');
}
```

---

## Comparison with Alternatives

Transferum exists in a rich ecosystem of reactive and stream-processing libraries. This section compares it with popular alternatives to help you make an informed choice.

### Transferum vs RxJS

**RxJS** is the most widely adopted reactive programming library for JavaScript/TypeScript.

| Aspect                           | Transferum                                  | RxJS                                                                       |
|----------------------------------|---------------------------------------------|----------------------------------------------------------------------------|
| **Bundle size**                  | ~15 KB minified                             | ~35 KB minified (full), <5 KB (selective imports)                          |
| **Dependencies**                 | Zero                                        | Zero (v7+)                                                                 |
| **Learning curve**               | Moderate — explicit primitives              | Steep — 100+ operators, complex concepts                                   |
| **Type inference**               | Strong — tuple-based pipeline types         | Strong — but complex generic chains                                        |
| **Sync/Async unify**             | Built-in — `linkTransfers` handles both     | Manual — `from()`, `toPromise()`, `firstValueFrom()`                       |
| **Pull-based**                   | Native — `Pullable`, `PollingProxy`         | Limited — mostly push-based                                                |
| **Gate/Flow control**            | Built-in — `GateTransfer`, `BridgeSelector` | Manual — `takeUntil()`, `switchMap()`, subjects                            |
| **Resource cleanup**             | Explicit — `destroy()` on every transfer    | Subscription-based — `subscription.unsubscribe()`                          |
| **Undefined handling**           | Suppressed — `undefined` never propagates   | Propagated — `undefined` is a valid value                                  |
| **Operators**                    | ~10 core operators                          | 100+ operators (creation, transformation, filtering, combination, utility) |
| **Flow control / Rate limiting** | Built-in — buffers, throttles, debounces    | Built-in — `throttle()`, `buffer()`, `sample()`                            |
| **Testing**                      | Simple — fake timers, direct method calls   | Complex — `TestScheduler`, marble diagrams                                 |
| **Community**                    | Small — single maintainer                   | Large — Google, widespread adoption                                        |

**Key differences:**

- **Architecture:** RxJS uses `Observable` + `Operator` + `Subscription` model. Transferum uses `Transfer` + `Bridge` + `Builder` with capability flags.
- **Composability:** RxJS operators are functions that transform observables. Transferum transfers are objects that can be linked via `linkTransfers()` automatically.
- **Error handling:** RxJS errors terminate the stream unless caught with `catchError()`. Transferum errors are suppressed with optional `onError` handlers, keeping the stream alive.
- **Scheduling:** RxJS has `Scheduler` abstraction (async, asyncSchedule, animationFrame). Transferum has `Ticker` (RAFTicker, IntervalTicker) for polling.

**Code comparison — Debounced search:**

```typescript
// RxJS
import { fromEvent } from 'rxjs';
import { debounceTime, switchMap, filter, map } from 'rxjs/operators';

fromEvent(searchInput, 'input')
  .pipe(
    debounceTime(300),
    map((e: Event) => (e.target as HTMLInputElement).value),
    filter(query => query.length >= 3),
    switchMap(query => fetch(`/api/search?q=${query}`))
  )
  .subscribe(results => render(results));
```

```typescript
// Transferum
import {
  AsyncInputPipelineBuilder,
  createDebounceTransfer,
  createAsyncConditionTransfer,
  createAsyncConvertTransfer,
  createAsyncSinkTransfer,
  createAsyncMapOperator,
} from 'transferum';

const input = createDebounceTransfer<string>({ delay: 300 });

const pipeline = AsyncInputPipelineBuilder
  .start(input)
  .to(createAsyncConditionTransfer<string>({ shouldAccept: q => q.length >= 3 }))
  .to(createAsyncConvertTransfer<string, SearchResult[]>({
    operator: createAsyncMapOperator(async q => await searchAPI(q)),
  }))
  .finish(createAsyncSinkTransfer<SearchResult[]>({
    callback: results => render(results),
  }), { owned: true });

input.push(query); // manually push, or integrate with DOM event
```

---

### Transferum vs Most.js

**Most.js** is a lightweight, high-performance FRP library.

| Aspect            | Transferum                       | Most.js                  |
|-------------------|----------------------------------|--------------------------|
| **Bundle size**   | ~15 KB                           | ~7 KB                    |
| **Status**        | Active (2026)                    | Maintenance mode (2020+) |
| **Async support** | Built-in async transfers         | Native async event loop  |
| **Pull-based**    | Yes — `Pullable`, `PollingProxy` | No — push-only           |
| **TypeScript**    | First-class, strict types        | Community typings        |
| **Operators**     | ~10                              | ~40                      |

Most.js excels in raw performance for push-based streams but lacks Transferum's pull-based primitives and unified sync/async model.

---

### Transferum vs Bacon.js / Kefir

**Bacon.js** and **Kefir** are Functional Reactive Programming (FRP) libraries with `Property` (stateful) and `EventStream` (stateless) abstractions.

| Aspect             | Transferum                                        | Bacon.js / Kefir                     |
|--------------------|---------------------------------------------------|--------------------------------------|
| **State model**    | Explicit — `ProxyReference<T>` per transfer       | Implicit — `Property` holds state    |
| **Stream types**   | Capability flags (`isSubscribable`, `isPullable`) | Two types: `EventStream`, `Property` |
| **Error handling** | Suppressed with `onError`                         | Error events terminate stream        |
| **Async**          | First-class async transfers                       | Via `fromPromise()`                  |
| **Bundle size**    | ~15 KB                                            | ~12 KB (Bacon), ~8 KB (Kefir)        |
| **Status**         | Active                                            | Bacon: maintenance, Kefir: archived  |

Transferum's capability flags provide more granularity than the two-type model, allowing fine-grained control over data flow mechanics.

---

### Quick Comparison Table

| Feature                    | Transferum               | RxJS       | Most.js     | Bacon.js    | Kefir    |
|----------------------------|--------------------------|------------|-------------|-------------|----------|
| **Bundle size (minified)** | ~15 KB                   | ~35 KB     | ~7 KB       | ~12 KB      | ~8 KB    |
| **Dependencies**           | 0                        | 0          | 0           | 0           | 0        |
| **Pull-based**             | ✓                        | ✗          | ✗           | ✗           | ✗        |
| **Sync/Async unify**       | ✓                        | Partial    | Partial     | Partial     | Partial  |
| **Built-in polling**       | ✓ (Ticker)               | ✗ (manual) | ✗           | ✗           | ✗        |
| **Gate/Flow control**      | ✓ (GateTransfer, Bridge) | Manual     | Manual      | Manual      | Manual   |
| **Undefined suppression**  | ✓                        | ✗          | ✗           | ✗           | ✗        |
| **Operators count**        | ~10                      | 100+       | ~40         | ~60         | ~50      |
| **TypeScript support**     | Excellent                | Excellent  | Good        | Fair        | Fair     |
| **Community size**         | Small                    | Very large | Medium      | Small       | Small    |
| **Maintenance status**     | Active                   | Active     | Maintenance | Maintenance | Archived |

---

### When to Choose Transferum

**Transferum is ideal for:**

1. **TypeScript-first projects** — Strict type inference, capability flags checked at compile time.
2. **Mixed sync/async pipelines** — Unified model without manual conversion.
3. **Pull-based data acquisition** — Polling APIs, sensors, or storage with `PollingProxy`.
4. **Explicit flow control** — Gates, bridges, and selectors for runtime routing.
5. **Resource-conscious environments** — Smaller bundle than RxJS, zero dependencies.
6. **Undefined-free data flow** — `undefined` never propagates through the chain — it means "no data," not "empty value," eliminating null-check defects in consumers.
7. **Game development / IoT** — Frame-aligned tickers, idle polling, sensor aggregation.

**Example fit:** Real-time dashboard with API polling, debounced user input, conditional routing to multiple visualizations, and unified sync/async data flows.

---

### When to Consider Alternatives

**Consider RxJS if:**

- You need 100+ operators out of the box (windowing, combining, error recovery).
- Your team already has RxJS expertise.
- You need advanced scheduling (test scheduler, virtual time).
- You need complex stream combination operators (e.g., combining 5+ distinct data sources with intricate join logic).
- Community support and long-term stability are top priorities.

**Consider Most.js if:**

- Raw performance is the top priority.
- You need a small, push-only stream library.
- You don't need pull-based or polling primitives.

**Consider Bacon.js (or maintaining Kefir) only if:**

- You are working on a legacy codebase already locked into these specific FRP abstractions.

---

## Installation & Import

```bash
npm i transferum
```

All components are exported from a single entry point:

```typescript
import {
  // Transfers
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

  // Async transfers
  AsyncSinkTransfer,
  AsyncWriteTransfer,
  AsyncReadTransfer,
  AsyncConvertTransfer,
  AsyncConditionTransfer,
  AsyncPollingSourceTransfer,
  AsyncPollingProxyTransfer,
  AsyncPollingFlowTransfer,
  AsyncIdlePollingTransfer,
  AsyncStoredChannelTransfer,

  // Operators
  TransparentOperator,
  MapOperator,
  FilterOperator,
  ReducerOperator,
  GuardOperator,
  PipelineOperator,

  // Async operators
  AsyncMapOperator,
  AsyncGuardOperator,
  AsyncPipelineOperator,

  // Storages
  LatestStorage,
  QueueStorage,
  StackStorage,

  // Tickers
  RAFTicker,
  IntervalTicker,
  TickerInterface,

  // Helpers
  Subscriber,
  SubscriptionManager,
  StateSubscriptionManager,
  ProxyReference,
  DisposableSubscriberAdapter,

  // Bridges
  PassBridge,
  TransformBridge,
  TransferBridge,
  BridgeAggregator,
  BridgeSelector,
  BridgeMultiSelector,
  AsyncTransformBridge,

  // Builders
  InputPipelineBuilder,
  OutputPipelineBuilder,
  DuplexPipelineBuilder,
  OperatorPipelineBuilder,

  // Async builders
  AsyncInputPipelineBuilder,
  AsyncOutputPipelineBuilder,
  AsyncDuplexPipelineBuilder,
  AsyncOperatorPipelineBuilder,

  // Factories
  createPushChannelTransfer,
  createDelayedPushChannelTransfer,
  createDebounceTransfer,
  createThrottleTransfer,
  createPushStoredChannelTransfer,
  // ... all create* functions (including createAsync*)

  // Utilities
  linkTransfers,
  handleError,
} from 'transferum';
```

---

## Core Concepts

### Capability Flags System

Each transfer implements `CommunicationContractInterface` — a set of boolean flags that determine available methods:

| Flag              | Methods                                                                          | Description                                                  |
|-------------------|----------------------------------------------------------------------------------|--------------------------------------------------------------|
| `isInput`         | —                                                                                | Can accept data from outside (acts as an input)              |
| `isOutput`        | —                                                                                | Can yield data (acts as an output)                           |
| `isDuplex`        | —                                                                                | Both input and output simultaneously (`isInput && isOutput`) |
| `isPushable`      | `push(data)`                                                                     | Data can be pushed into the transfer                         |
| `isPullable`      | `pull()`                                                                         | Data can be read from the transfer                           |
| `isSubscribable`  | `subscribe(handler)`                                                             | The transfer can be subscribed to                            |
| `isTriggerable`   | `trigger()`                                                                      | Has a manual emission trigger                                |
| `isGate`          | `activate()` / `deactivate()` / `toggle()` / `active` / `onStateChange(handler)` | Flow control (on/off) + state subscription                   |
| `isPollingSource` | —                                                                                | Has internal source polling                                  |
| `isPollingProxy`  | `setFetcher()` / `clearFetcher()`                                                | Polls the previous node in the chain                         |

**Asynchronous flags:**

| Flag                  | Methods                                     | Description                                         |
|-----------------------|---------------------------------------------|-----------------------------------------------------|
| `isAsyncPushable`     | `asyncPush(data)`                           | Data can be pushed into the transfer asynchronously |
| `isAsyncPullable`     | `asyncPull()`                               | Data can be read from the transfer asynchronously   |
| `isAsyncTriggerable`  | `asyncTrigger()`                            | Asynchronous manual emission trigger                |
| `isAsyncPollingProxy` | `setAsyncFetcher()` / `clearAsyncFetcher()` | Asynchronously polls the previous node in the chain |

> `isAsyncSubscribable` and `isAsyncPollingSource` **are not required** — subscription remains synchronous in all async transfers, and `isPollingSource` is reused.

Flags are set as `readonly` properties in each transfer class. Flag checking occurs at runtime — calling a method not supported by the transfer throws an `Error`.

**Sync priority over async:** If a transfer supports both sync and async operations (e.g., `UniversalCompositeTransfer` with `PushStoredChannelTransfer` inside), `linkTransfers` prefers sync linking. Async strategies are applied only when sync is not applicable.

### Transfers

A **transfer** is the fundamental building block of a pipeline. Each transfer:

1. Accepts data (`push`), yields data (`pull`), notifies subscribers (`subscribe`) — depending on its flags.
2. Manages internal state via `ProxyReference<T>`.
3. Supports a lifecycle: creation → operation → `destroy()`.

Inheritance hierarchy:

```
BaseTransfer (abstract)
├── BaseStateTransfer<T> (abstract, adds ProxyReference<T>)
│   ├── PushChannelTransfer
│   ├── DelayedPushChannelTransfer
│   ├── DebounceTransfer
│   ├── ThrottleTransfer
│   ├── PushStoredChannelTransfer
│   ├── BufferTransfer
│   ├── ManualBufferTransfer
│   ├── ManualFlowTransfer
│   ├── GateTransfer
│   ├── MergeTransfer
│   ├── PollingSourceTransfer
│   ├── PollingProxyTransfer
│   ├── PollingFlowTransfer
│   ├── IdlePollingTransfer
│   ├── ChannelTransfer
│   ├── StoredChannelTransfer
│   ├── SinkTransfer
│   ├── ConvertTransfer
│   └── ConditionTransfer
├── SplitTransfer
├── WriteTransfer
└── ReadTransfer

UniversalCompositeTransfer (separate hierarchy, composition of input + output)
```

### Linking Transfers

The `linkTransfers(lhs, rhs)` function connects an output transfer (LHS) to an input transfer (RHS), selecting a strategy based on flags:

| LHS                              | RHS                              | Strategy                                                           |
|----------------------------------|----------------------------------|--------------------------------------------------------------------|
| `isSubscribable`                 | `isPushable`                     | Reactive subscription: LHS notifies → RHS accepts                  |
| `isPullable`                     | `isPollingProxy`                 | Active polling: RHS pulls data via `setFetcher`                    |
| `isSubscribable`                 | `isPollingProxy`                 | Subscription + last-value buffering for the poller                 |
| `isSubscribable`                 | `isAsyncPushable`                | Subscription + `asyncPush` with `.catch()` (no ordering guarantee) |
| `isAsyncPullable`                | `isAsyncPollingProxy`            | Active async polling: RHS pulls data via `setAsyncFetcher`         |
| `isPullable`                     | `isAsyncPollingProxy`            | Sync-pull wrapped in an async fetcher                              |
| `isSubscribable`                 | `isAsyncPollingProxy`            | Subscription + buffer + async fetcher                              |
| `isAsyncPullable`                | `isPollingProxy`                 | **Error** — sync poller cannot `await`                             |
| `isPullable` / `isAsyncPullable` | `isPushable` / `isAsyncPushable` | **Error** — a Bridge or Triggerable adapter is required            |
| other                            | other                            | **Error** — unsupported combination                                |

> **Sync priority:** If both transfers support sync linking, it is used. Async strategies are applied only when sync is not applicable.
>
> **Rejection handling** for `subscribable → asyncPushable`: `.catch()` is always called. If `options.onError` is provided — it is invoked with `(error, target)`. Without `onError` — the rejection is silently swallowed to protect the reactive stream (the source continues operating). This differs from per-transfer `onError` (which rethrows) because the source's reactive stream must not be disrupted by a downstream async-push failure.
>
> **Ordering** for `subscribable → asyncPushable`: No ordering guarantee — fast sync notifications from LHS can overtake pending `asyncPush` calls. A serializer is a separate task.

Returns `SubscriberInterface` for breaking the link.

```typescript
import { createPushChannelTransfer, createSinkTransfer, linkTransfers } from 'transferum';

const source = createPushChannelTransfer<number>();
const target = createSinkTransfer<number>({ callback: (n) => console.log(n) });

const link = linkTransfers(source, target);
source.push(42); // → callback called

link.unsubscribe(); // break the link
```

For async links (`subscribable → asyncPushable`), you can pass `options.onError` to intercept rejections:

```typescript
import { linkTransfers } from 'transferum';

const link = linkTransfers(source, asyncTarget, { onError: (e) => console.error(e) });
```

### Undefined Behavior in Data Flows

`undefined` is **never propagated** through a transfer chain. If a value is `undefined`, subscribers are not notified — the event is fully suppressed at the `SubscriptionManager.sendState()` level.

This behavior is intentional: `undefined` means "no data" in the library, not "empty value." If you need to propagate an empty value, use `null`:

```typescript
import { createPushStoredChannelTransfer } from 'transferum';

const channel = createPushStoredChannelTransfer<string | null>({ initialValue: null });

channel.subscribe((data) => console.log(data));

channel.push('hello');   // → "hello"
channel.push(null);      // → null (null MUST reach the subscriber)
channel.push(undefined); // → nothing happens (subscribers NOT notified)
```

If the data type allows `null` (e.g., `string | null`), use it as an explicit empty marker. For strings, this could be `''` (empty string), for numbers — `0`, for objects — `{}` or `null`.

### Error Handling

Transferum uses a **uniform error handling model** across all transfers. Every transfer that can encounter a runtime error (fetcher failure, callback throw, flow read/write error, predicate throw) accepts an optional `onError` handler in its config.

#### `handleError()` and `ErrorHandler<TSource>`

```typescript
type ErrorHandler<TSource> = (e: Error, source: TSource) => void;

function handleError<TSource>(error: unknown, source: TSource, onError?: ErrorHandler<TSource>): void;
```

- Non-`Error` values are converted to `Error` (via `String(error)`).
- If `onError` is provided — invokes it with `(error, source)` and suppresses the exception.
- If `onError` is **not** provided — rethrows the exception.
- If `onError` is provided but **itself throws** — that exception is rethrown (the handler is considered broken).

The `source` parameter is the transfer instance where the error occurred, allowing handlers to distinguish sources and access transfer state.

#### Three scenarios

| Scenario | `onError` provided | `onError` behavior | Result |
|---|---|---|---|
| Handler suppresses | ✓ | Returns normally | Exception suppressed, operation continues |
| No handler | ✗ | — | Exception rethrown |
| Handler throws | ✓ | Throws | Handler's exception rethrown |

#### Per-transfer error handlers

Most transfers use a single `onError` handler. Exceptions:

- **`ConditionTransfer` / `AsyncConditionTransfer`** — separate `onAcceptError` (for `shouldAccept` failures) and `onEmitError` (for `shouldEmit` failures), since the two stages are independent.
- **`ChannelTransfer` / `StoredChannelTransfer` / `AsyncStoredChannelTransfer`** — `onError` covers `emit()` failures; `onDestroyError` covers `destroy()` failures. `setup()` errors are **always rethrown** — a failed setup means the transfer is unusable, and suppressing would create a zombie object.

#### Polling transfers — error behavior

When a fetcher or flow read fails inside `trigger()` / `asyncTrigger()`, the error is passed to `handleError()`. The behavior differs depending on whether the error was suppressed:

**Sync polling** (`PollingSourceTransfer`, `PollingProxyTransfer`, `PollingFlowTransfer`, `IdlePollingTransfer`):

| Method | `onError` suppresses | `onError` absent or throws |
|---|---|---|
| `trigger()` | Error suppressed, polling continues | Exception rethrown, **ticker stops** — polling ceases. Results in an **uncaught exception** (the ticker calls `trigger()` synchronously). |
| `pull()` | Error suppressed, returns `undefined` | Exception rethrown to caller. **Ticker is not affected.** |

**Async polling** (`AsyncPollingSourceTransfer`, `AsyncPollingProxyTransfer`, `AsyncPollingFlowTransfer`, `AsyncIdlePollingTransfer`):

| Method | `onError` suppresses | `onError` absent or throws |
|---|---|---|
| `asyncTrigger()` | Error suppressed, polling continues | Rejection rethrown, **ticker stops** — polling ceases. Results in an **unhandled promise rejection** (the ticker calls `asyncTrigger()` fire-and-forget). |
| `asyncPull()` | Error suppressed, returns `undefined` | Rejection rethrown to caller. **Ticker is not affected.** |

> **Why the difference?** `trigger()` / `asyncTrigger()` are called by the ticker (fire-and-forget), so an unhandled error surfaces as an uncaught exception (sync) or unhandled rejection (async). `pull()` / `asyncPull()` are called directly by the user, so the error propagates to the caller's `try/catch` or `await` expression.
>
> **Recommendation:** always provide `onError` for polling transfers in production to prevent uncaught exceptions and unhandled rejections from stopping your application.

#### `linkTransfers` — async-push rejection

When linking a `Subscribable` source to an `AsyncPushable` target, `asyncPush()` rejections are caught. If `options.onError` is provided — it is invoked with `(error, target)`. Without `onError` — the rejection is silently swallowed to protect the reactive stream (the source continues operating). See [Linking Transfers](#linking-transfers).

---

## Transfers

### Transfer Comparison Table

| Transfer                   | Push | Pull | Sub | Trig | Gate |  Poll   | In | Out | Purpose                                             |
|----------------------------|:----:|:----:|:---:|:----:|:----:|:-------:|:--:|:---:|-----------------------------------------------------|
| PushChannelTransfer        |  ✓   |  —   |  ✓  |  —   |  —   |    —    | ✓  |  ✓  | Reactive channel, data not retained                 |
| DelayedPushChannelTransfer |  ✓   |  —   |  ✓  |  —   |  —   |    —    | ✓  |  ✓  | Channel with delayed emission to subscribers        |
| DebounceTransfer           |  ✓   |  —   |  ✓  |  —   |  —   |    —    | ✓  |  ✓  | Channel with debounce emission (last after pause)   |
| ThrottleTransfer           |  ✓   |  —   |  ✓  |  —   |  —   |    —    | ✓  |  ✓  | Channel with throttle emission (leading + trailing) |
| PushStoredChannelTransfer  |  ✓   |  ✓   |  ✓  |  ✓   |  —   |    —    | ✓  |  ✓  | Channel with last-value caching                     |
| BufferTransfer             |  ✓   |  ✓   |  —  |  —   |  —   |    —    | ✓  |  ✓  | Passive buffer (push/pull without notifications)    |
| ManualBufferTransfer       |  ✓   |  ✓   |  —  |  ✓   |  —   |    —    | ✓  |  ✓  | Buffer with read only after `trigger()`             |
| ManualFlowTransfer         |  ✓   |  —   |  ✓  |  ✓   |  —   |    —    | ✓  |  ✓  | Emission to subscribers only on `trigger()`         |
| GateTransfer               |  ✓   |  —   |  ✓  |  —   |  ✓   |    —    | ✓  |  ✓  | Flow blocking by state (`active`)                   |
| MergeTransfer              |  —   |  —   |  ✓  |  —   |  —   |    —    | —  |  ✓  | Merge multiple sources                              |
| SplitTransfer              |  ✓   |  —   |  —  |  —   |  —   |    —    | ✓  |  —  | Broadcast to multiple targets (broadcast)           |
| PollingSourceTransfer      |  —   |  ✓   |  ✓  |  ✓   |  ✓   |   Src   | —  |  ✓  | Poll external `fetcher` on a timer                  |
| PollingProxyTransfer       |  —   |  ✓   |  ✓  |  ✓   |  ✓   | Src+Prx | ✓  |  ✓  | Poll previous node on a timer                       |
| PollingFlowTransfer        |  —   |  ✓   |  ✓  |  ✓   |  ✓   |   Src   | —  |  ✓  | Poll from `OutputFlowInterface` (Storage)           |
| IdlePollingTransfer        |  ✓   |  ✓   |  ✓  |  ✓   |  ✓   |   Src   | ✓  |  ✓  | Fallback polling on idle incoming data              |
| ChannelTransfer            |  —   |  —   |  ✓  |  —   |  —   |    —    | —  |  ✓  | External source via `setup`/`destroy`               |
| StoredChannelTransfer      |  —   |  ✓   |  ✓  |  ✓   |  —   |    —    | —  |  ✓  | Channel with storage + external source              |
| SinkTransfer               |  ✓   |  —   |  —  |  —   |  —   |    —    | ✓  |  —  | Terminal sink (callback)                            |
| WriteTransfer              |  ✓   |  —   |  —  |  —   |  —   |    —    | ✓  |  —  | Write to `InputFlowInterface` (Storage)             |
| ReadTransfer               |  —   |  ✓   |  —  |  —   |  —   |    —    | —  |  ✓  | Read from `OutputFlowInterface` (Storage)           |
| ConvertTransfer            |  ✓   |  —   |  ✓  |  —   |  —   |    —    | ✓  |  ✓  | Transform via `Operator`                            |
| ConditionTransfer          |  ✓   |  —   |  ✓  |  —   |  —   |    —    | ✓  |  ✓  | Conditional filtering (`shouldAccept`/`shouldEmit`) |

> **Legend:** Push = `isPushable`, Pull = `isPullable`, Sub = `isSubscribable`, Trig = `isTriggerable`, Gate = `isGate`, Poll = polling (`Src` = `isPollingSource`, `Prx` = `isPollingProxy`), In = `isInput`, Out = `isOutput`.

> **UniversalCompositeTransfer** is not included in the table — its flags are determined dynamically from the provided `input` and `output` transfers.

### Async Transfer Comparison Table

| Transfer                   | aPush | aPull | aTrig | Sub | Gate |   Poll   | In | Out | Purpose                                                  |
|----------------------------|:-----:|:-----:|:-----:|:---:|:----:|:--------:|:--:|:---:|----------------------------------------------------------|
| AsyncSinkTransfer          |   ✓   |   —   |   —   |  —  |  —   |    —     | ✓  |  —  | Async terminal sink (callback)                           |
| AsyncWriteTransfer         |   ✓   |   —   |   —   |  —  |  —   |    —     | ✓  |  —  | Async write to `AsyncInputFlowInterface`                 |
| AsyncReadTransfer          |   —   |   ✓   |   —   |  —  |  —   |    —     | —  |  ✓  | Async read from `AsyncOutputFlowInterface`               |
| AsyncConvertTransfer       |   ✓   |   —   |   —   |  ✓  |  —   |    —     | ✓  |  ✓  | Async transform via `AsyncOperator`                      |
| AsyncConditionTransfer     |   ✓   |   —   |   —   |  ✓  |  —   |    —     | ✓  |  ✓  | Async conditional filtering (async predicates)           |
| AsyncPollingSourceTransfer |   —   |   ✓   |   ✓   |  ✓  |  ✓   |   Src    | —  |  ✓  | Async poll external `fetcher` on a timer                 |
| AsyncPollingProxyTransfer  |   —   |   ✓   |   ✓   |  ✓  |  ✓   | Src+aPrx | ✓  |  ✓  | Async poll previous node on a timer                      |
| AsyncPollingFlowTransfer   |   —   |   ✓   |   ✓   |  ✓  |  ✓   |   Src    | —  |  ✓  | Async poll from `AsyncOutputFlowInterface`               |
| AsyncIdlePollingTransfer   |  ✓*   |   ✓   |   ✓   |  ✓  |  ✓   |   Src    | ✓  |  ✓  | Fallback async polling on idle incoming data             |
| AsyncStoredChannelTransfer |   —   |   ✓   |   ✓   |  ✓  |  —   |    —     | —  |  ✓  | Channel with storage + external source + async interface |

> **Legend:** aPush = `isAsyncPushable`, aPull = `isAsyncPullable`, aTrig = `isAsyncTriggerable`, aPrx = `isAsyncPollingProxy`. `✓*` — method is synchronous (`push`), but fetcher is asynchronous.
>
> **Subscription in all async transfers remains synchronous** — `subscribe()` notifies subscribers synchronously, even if data is obtained via `asyncPush`/`asyncPull`/`asyncTrigger`.

**Groups by purpose:**

| Group                  | Transfers                                                                                                      | Common characteristic                                  |
|------------------------|----------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Channels               | PushChannelTransfer, DelayedPushChannelTransfer, DebounceTransfer, ThrottleTransfer, PushStoredChannelTransfer | Reactive data delivery to subscribers                  |
| Buffers                | BufferTransfer, ManualBufferTransfer                                                                           | Synchronous data exchange without reactivity           |
| Controlled flows       | ManualFlowTransfer, GateTransfer                                                                               | Control of emission timing or condition                |
| Polling                | PollingSourceTransfer, PollingProxyTransfer, PollingFlowTransfer, IdlePollingTransfer                          | Periodic source polling                                |
| Adapters               | SinkTransfer, WriteTransfer, ReadTransfer                                                                      | Integration with external flows and storages           |
| Transformation         | ConvertTransfer, ConditionTransfer                                                                             | Data processing and filtering in the flow              |
| Aggregation            | MergeTransfer, SplitTransfer                                                                                   | Merging and splitting flows                            |
| External sources       | ChannelTransfer, StoredChannelTransfer                                                                         | Integration via `setup`/`destroy` callbacks            |
| Composition            | UniversalCompositeTransfer                                                                                     | Combining input + output into a single interface       |
| Async adapters         | AsyncSinkTransfer, AsyncWriteTransfer, AsyncReadTransfer                                                       | Async integration with external flows and storages     |
| Async transformation   | AsyncConvertTransfer, AsyncConditionTransfer                                                                   | Async data processing and filtering                    |
| Async polling          | AsyncPollingSourceTransfer, AsyncPollingProxyTransfer, AsyncPollingFlowTransfer, AsyncIdlePollingTransfer      | Async periodic source polling                          |
| Async external sources | AsyncStoredChannelTransfer                                                                                     | Integration via `setup`/`destroy` with async interface |

### PushChannelTransfer

Reactive channel with automatic emission to subscribers on `push()`. Data is not retained after emission.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`

```typescript
import { createPushChannelTransfer } from 'transferum';

const channel = createPushChannelTransfer<number>();

channel.subscribe((data) => console.log(data));
channel.push(42); // → 42
// After push() state is cleared
```

### DelayedPushChannelTransfer

Reactive channel with delayed emission to subscribers on `push()`. Each `push()` schedules its own timer for `delay` ms, upon expiration of which data is sent to subscribers and state is cleared. Multiple `push()` calls create independent delayed notifications.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`

```typescript
import { createDelayedPushChannelTransfer } from 'transferum';

const channel = createDelayedPushChannelTransfer<number>({ delay: 100 });

channel.subscribe((data) => console.log(data));
channel.push(42); // → 42 will be logged after 100 ms

// Multiple pushes — independent timers
channel.push(1);
channel.push(2);
// after 100 ms: → 1, → 2
```

`destroy()` clears all pending timers — delayed notifications are canceled.

### DebounceTransfer

Reactive channel with debounced emission to subscribers on `push()`. Each `push()` resets the previous timer; subscribers are notified only after `delay` ms of silence following the last `push()`. Only the last value is emitted.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`

```typescript
import { createDebounceTransfer } from 'transferum';

const channel = createDebounceTransfer<number>({ delay: 200 });

channel.subscribe((data) => console.log(data));
channel.push(1); // resets timer
channel.push(2); // resets timer
// after 200 ms of silence → 2

// Rapid push bursts — only the last value
channel.push(10);
channel.push(20);
channel.push(30);
// after 200 ms → 30
```

`destroy()` cancels the pending timer — the delayed notification will not fire.

### ThrottleTransfer

Reactive channel with throttled emission to subscribers on `push()`. The first `push()` passes immediately (leading edge), subsequent ones within `interval` are ignored, but the last value is emitted after the interval ends (trailing edge). No value is lost.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`

```typescript
import { createThrottleTransfer } from 'transferum';

const channel = createThrottleTransfer<number>({ interval: 100 });

channel.subscribe((data) => console.log(data));
channel.push(1); // → 1 (leading edge, immediately)
channel.push(2); // saved as pending
channel.push(3); // saved as pending (overwrote 2)
// after 100 ms → 3 (trailing edge)

// After the interval — new leading edge
channel.push(4); // → 4 (immediately)
```

`destroy()` cancels the pending timer and clears pending — the trailing notification will not fire.

### PushStoredChannelTransfer

Reactive channel with last-value retention. The value is available for `pull()` after `push()`.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isPullable`, `isSubscribable`, `isTriggerable`

```typescript
import { createPushStoredChannelTransfer } from 'transferum';

const channel = createPushStoredChannelTransfer<number>({ initialValue: 0 });

channel.subscribe((data) => console.log(data));
channel.push(42); // → subscribers notified, value retained
console.log(channel.pull()); // 42

channel.trigger(); // re-emit current value to subscribers
```

### BufferTransfer

Passive buffer with push/pull mechanics (no notifications). `pull()` extracts the value with cleanup.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isPullable`

```typescript
import { createBufferTransfer } from 'transferum';

const buffer = createBufferTransfer<number>();

buffer.push(42);
console.log(buffer.pull()); // 42
console.log(buffer.pull()); // undefined (buffer empty)
```

### ManualBufferTransfer

Buffer with manual read control via `trigger()`. `pull()` returns data only after `trigger()`.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isPullable`, `isTriggerable`

```typescript
import { createManualBufferTransfer } from 'transferum';

const buffer = createManualBufferTransfer<number>();

buffer.push(42);
console.log(buffer.pull()); // undefined (trigger not called)

buffer.trigger();
console.log(buffer.pull()); // 42
```

### ManualFlowTransfer

Reactive stream with manual emission control. `push()` writes the value, `trigger()` emits to subscribers.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`, `isTriggerable`

```typescript
import { createManualFlowTransfer } from 'transferum';

const flow = createManualFlowTransfer<number>();

flow.subscribe((data) => console.log(data));
flow.push(42); // subscribers NOT notified
flow.trigger(); // → 42
```

### GateTransfer

Transfer with state management (gate). Passes data only when `active === true`.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`, `isGate`

```typescript
import { createGateTransfer } from 'transferum';

const gate = createGateTransfer<number>({ activated: false });

gate.subscribe((data) => console.log(data));
gate.push(42); // ignored (gate closed)

gate.activate();
gate.push(100); // → 100

gate.deactivate();
gate.push(200); // ignored

console.log(gate.toggle()); // true (open)
```

**Subscribing to state changes:**

```typescript
import { createGateTransfer } from 'transferum';

const gate = createGateTransfer<number>({ activated: false });

gate.onStateChange((g) => {
  console.log(`Gate state changed: active=${g.active}`);
});

gate.activate();   // → "Gate state changed: active=true"
gate.deactivate(); // → "Gate state changed: active=false"
```

`onStateChange()` returns `SubscriberInterface` for unsubscription. The subscriber receives `GateInterface` (the transfer itself) in the callback.

### MergeTransfer

Aggregator of multiple sources into a single stream. Automatically subscribes to all sources.

**Capabilities:** `isOutput`, `isPushable`, `isSubscribable`

```typescript
import { createPushStoredChannelTransfer, createMergeTransfer } from 'transferum';

const source1 = createPushStoredChannelTransfer<number>();
const source2 = createPushStoredChannelTransfer<number>();

const merge = createMergeTransfer<number>({ sources: [source1, source2] });

merge.subscribe((data) => console.log(data));
source1.push(1); // → 1
source2.push(2); // → 2
```

### SplitTransfer

Stream splitter to multiple targets (broadcast). `push()` sends data to all targets.

**Capabilities:** `isInput`, `isPushable`

```typescript
import { createPushStoredChannelTransfer, createSplitTransfer } from 'transferum';

const target1 = createPushStoredChannelTransfer<number>();
const target2 = createPushStoredChannelTransfer<number>();

const split = createSplitTransfer<number>({ targets: [target1, target2] });

split.push(42); // sent to target1 and target2
```

### PollingSourceTransfer

Output transfer with internal polling of a data source. A `Ticker` calls `trigger()` at a specified interval.

**Capabilities:** `isOutput`, `isPollingSource`, `isPullable`, `isSubscribable`, `isTriggerable`, `isGate`

```typescript
import { createPollingSourceTransfer } from 'transferum';

const polling = createPollingSourceTransfer<number>({
  fetcher: () => Date.now(),
  interval: 1000,
  activated: true,
});

polling.subscribe((data) => console.log(data));
// Every second: current time

polling.deactivate(); // stop polling
```

**Error handling:** If `fetcher()` throws in `trigger()`, `onError` is called. With `onError` — suppressed, polling continues. Without `onError` (or if `onError` itself throws) — exception rethrown, ticker stops. If `fetcher()` throws in `pull()` — same logic, but the ticker is not affected (error propagates to caller).

```typescript
const polling = createPollingSourceTransfer<number>({
  fetcher: () => { throw new Error('fail'); },
  interval: 1000,
  activated: true,
  onError: (e, source) => console.error(e, source.active),
});
```

All polling transfers (`PollingSourceTransfer`, `PollingProxyTransfer`, `PollingFlowTransfer`, `IdlePollingTransfer`) also support `onStateChange()` for subscribing to `active` state changes.

### PollingProxyTransfer

Duplex transfer with polling that receives its `fetcher` from the previous node in the chain. The `fetcher` is set via `setFetcher()` (usually called by `linkTransfers`).

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPollingProxy`, `isPollingSource`, `isPullable`, `isSubscribable`, `isTriggerable`, `isGate`

```typescript
import { createPollingProxyTransfer } from 'transferum';

const poller = createPollingProxyTransfer<number>({
  interval: 1000,
  activated: false,
});

// fetcher is set via linkTransfers or manually:
poller.setFetcher(() => someValue);

poller.activate(); // start polling
```

**Error handling:** Same as `PollingSourceTransfer` — `onError` suppresses fetcher errors in `trigger()` and `pull()`. Without `onError` (or if it throws) — `trigger()` rethrows and ticker stops; `pull()` rethrows to caller without affecting the ticker.

### PollingFlowTransfer

Output transfer with polling from `OutputFlowInterface` (e.g., Storage).

**Capabilities:** `isOutput`, `isPollingSource`, `isPullable`, `isSubscribable`, `isTriggerable`, `isGate`

```typescript
import { createLatestStorage, createPollingFlowTransfer } from 'transferum';

const storage = createLatestStorage<number>(0);
const polling = createPollingFlowTransfer<number>({
  flow: storage,
  interval: 1000,
  activated: true,
});

polling.subscribe((data) => console.log(data));
storage.write(42); // after interval → 42
```

**Error handling:** If `flow.read()` throws in `trigger()`, `onError` is called. With `onError` — suppressed, polling continues. Without `onError` (or if it throws) — `trigger()` rethrows, ticker stops. `pull()` rethrows to caller without affecting the ticker.

### IdlePollingTransfer

Reactive channel with fallback polling on idle. If no data arrived via `push()` for longer than `timeout` ms, periodic polling of `fetcher` starts with `interval` ms. When new data arrives, polling stops and the idle timer resets.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isPullable`, `isSubscribable`, `isPollingSource`, `isTriggerable`, `isGate`

```typescript
import { createIdlePollingTransfer } from 'transferum';

const channel = createIdlePollingTransfer<number>({
  fetcher: () => fetchLatest(),
  timeout: 5000,   // 5 seconds without push → start polling
  interval: 1000,  // poll fetcher every second
  activated: true,
});

channel.subscribe((data) => console.log(data));
channel.push(42);  // → subscribers notified, idle timer reset
// after 5 seconds without push → polling fetcher every 1 second
```

**Error handling:** If `fetcher()` throws during polling, `onError` is called. With `onError` — suppressed, polling continues. Without `onError` (or if it throws) — exception rethrown, polling stops. `pull()` rethrows to caller without affecting polling.

### ChannelTransfer

Output channel with external management via `setup`/`destroy` callbacks. Used for integration with external event sources.

**Capabilities:** `isOutput`, `isSubscribable`

**Error handling:** `setup()` errors are **always rethrown** (no `onSetupError`) — a failed setup means the transfer is unusable. `onError` covers `emit()` failures. `onDestroyError` covers `destroy()` failures. Without the corresponding handler — rethrown.

```typescript
import { createChannelTransfer } from 'transferum';

const channel = createChannelTransfer<number>({
  setup: (emit) => {
    const id = setInterval(() => emit(Date.now()), 1000);
  },
  destroy: () => {
    // resource cleanup
  },
  onError: (e) => console.error(e),
});

channel.subscribe((data) => console.log(data));
```

### StoredChannelTransfer

Channel with last-value retention and external management. The value is available for `pull()` and `trigger()`.

**Capabilities:** `isOutput`, `isPullable`, `isTriggerable`, `isSubscribable`

**Error handling:** Same as `ChannelTransfer` — `setup()` errors always rethrown. `onError` covers `emit()` / `trigger()` failures. `onDestroyError` covers `destroy()` failures.

```typescript
import { createStoredChannelTransfer } from 'transferum';

let emit: (data: number) => void;

const channel = createStoredChannelTransfer<number>({
  setup: (e) => { emit = e; },
  destroy: () => {},
  initialValue: 0,
});

channel.subscribe((data) => console.log(data));
emit(42); // → 42
console.log(channel.pull()); // 42

channel.trigger(); // re-emit
```

### SinkTransfer

Terminal destination — calls a callback on receiving data.

**Capabilities:** `isInput`, `isPushable`

```typescript
import { createSinkTransfer } from 'transferum';

const sink = createSinkTransfer<number>({
  callback: (data) => console.log('Received:', data),
});

sink.push(42); // → "Received: 42"
```

### WriteTransfer

Write adapter for an arbitrary `InputFlowInterface` (e.g., Storage).

**Capabilities:** `isInput`, `isPushable`

```typescript
import { createLatestStorage, createWriteTransfer } from 'transferum';

const storage = createLatestStorage<number>();
const writer = createWriteTransfer<number>({ flow: storage });

writer.push(42); // storage.write(42)
```

### ReadTransfer

Read adapter for an arbitrary `OutputFlowInterface` (e.g., Storage).

**Capabilities:** `isOutput`, `isPullable`

```typescript
import { createLatestStorage, createReadTransfer } from 'transferum';

const storage = createLatestStorage<number>();
storage.write(42);
const reader = createReadTransfer<number>({ flow: storage });

console.log(reader.pull()); // 42
```

### ConvertTransfer

Converter transfer: transforms input data via an `Operator` and sends the result to subscribers. If the operator returns `undefined`, subscribers are not notified.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`

```typescript
import { createConvertTransfer, createMapOperator } from 'transferum';

const converter = createConvertTransfer<number, string>({
  operator: createMapOperator((n: number) => `val_${n}`),
});

converter.subscribe((data) => console.log(data));
converter.push(42); // → "val_42"
```

### ConditionTransfer

Transfer with conditional filtering on input (`shouldAccept`) and output (`shouldEmit`).

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`

```typescript
import { createConditionTransfer } from 'transferum';

const condition = createConditionTransfer<number>({
  shouldAccept: (n) => n > 0,        // input filter
  shouldEmit: (n) => n !== undefined && n < 100, // output filter
});

condition.subscribe((data) => console.log(data));
condition.push(-5);  // rejected by shouldAccept
condition.push(50);  // passed both filters → 50
condition.push(150); // passed shouldAccept, rejected by shouldEmit
```

### UniversalCompositeTransfer

Universal composite transfer — combines an input and an output transfer into a single duplex interface. Automatically extracts `triggerable` and `gate` from the provided transfers (or accepts them explicitly).

**Extraction priorities:**
1. Explicit specification in config (`config.triggerable` / `config.gate`)
2. `config.input` (if it has the corresponding flag)
3. `config.output` (if it has the corresponding flag)

```typescript
import {
  createPushStoredChannelTransfer,
  DuplexPipelineBuilder,
  UniversalCompositeTransfer,
} from 'transferum';

const transfer = createPushStoredChannelTransfer<number>();

const composite = new UniversalCompositeTransfer({
  input: transfer,
  output: transfer,
  owned: [transfer], // resources to destroy on destroy()
});

composite.push(42);
composite.subscribe((data) => console.log(data));
composite.pull();
composite.trigger();

composite.destroy(); // destroys all owned resources
```

`onStateChange()` delegates to the internal `_gate` (if extracted). The subscriber receives the internal gate's `GateInterface`, not the composite itself. If no gate is extracted (`isGate === false`), `onStateChange()` throws an `Error`.

**Async methods** (delegated to `input`/`output`/`asyncTriggerable`):

| Method                | Delegation                         | Condition                      |
|-----------------------|------------------------------------|--------------------------------|
| `asyncPush(data)`     | `_input.asyncPush(data)`           | `isAsyncPushable === true`     |
| `asyncPull()`         | `_output.asyncPull()`              | `isAsyncPullable === true`     |
| `asyncTrigger()`      | `_asyncTriggerable.asyncTrigger()` | `isAsyncTriggerable === true`  |
| `setAsyncFetcher(f)`  | `_input.setAsyncFetcher(f)`        | `isAsyncPollingProxy === true` |
| `clearAsyncFetcher()` | `_input.clearAsyncFetcher()`       | `isAsyncPollingProxy === true` |

`asyncTriggerable` is extracted using the same priorities as `triggerable`/`gate`: explicit config → `input` → `output`.

---

## Async Transfers

Async transfers provide asynchronous interfaces (`asyncPush`, `asyncPull`, `asyncTrigger`) for integration with asynchronous data sources (API, IndexedDB, fetch). **Subscription remains synchronous** in all async transfers — subscribers are notified synchronously, even if data is obtained via an async operation.

### AsyncSinkTransfer

Async terminal sink — calls a callback on receiving data via `asyncPush`.

**Capabilities:** `isInput`, `isAsyncPushable`

**Error handling:** If `callback()` throws, `onError` is called. With `onError` provided, the exception is suppressed. Without `onError` — rethrown.

```typescript
import { createAsyncSinkTransfer } from 'transferum';

const sink = createAsyncSinkTransfer<number>({
  callback: async (n) => { await fetch('/api', { body: JSON.stringify(n) }); },
  onError: (e) => console.error(e),
});

await sink.asyncPush(42); // → await callback(42)
```

### AsyncWriteTransfer

Async write adapter for `AsyncInputFlowInterface` (or synchronous `InputFlowInterface`).

**Capabilities:** `isInput`, `isAsyncPushable`

```typescript
import { createAsyncWriteTransfer } from 'transferum';

const writer = createAsyncWriteTransfer<number>({ flow: asyncStorage });

await writer.asyncPush(42); // → await flow.write(42)
```

### AsyncReadTransfer

Async read adapter for `AsyncOutputFlowInterface` (or synchronous `OutputFlowInterface`).

**Capabilities:** `isOutput`, `isAsyncPullable`

```typescript
import { createAsyncReadTransfer } from 'transferum';

const reader = createAsyncReadTransfer<number>({ flow: asyncStorage });

const value = await reader.asyncPull(); // → await flow.read()
```

### AsyncConvertTransfer

Async converter transfer: transforms input data via an `AsyncOperator` and sends the result to subscribers. If the operator returns `undefined`, subscribers are not notified.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isAsyncPushable`, `isSubscribable`

```typescript
import { createAsyncConvertTransfer, createAsyncMapOperator } from 'transferum';

const converter = createAsyncConvertTransfer<number, string>({
  operator: createAsyncMapOperator(async (n: number) => `val_${n}`),
});

converter.subscribe((data) => console.log(data));
await converter.asyncPush(42); // → "val_42"
```

### AsyncConditionTransfer

Transfer with asynchronous conditional filtering. The `shouldAccept` and `shouldEmit` predicates can be sync or async (return `Promise<boolean> | boolean`).

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isAsyncPushable`, `isSubscribable`

```typescript
import { createAsyncConditionTransfer } from 'transferum';

const condition = createAsyncConditionTransfer<number>({
  shouldAccept: async (n) => (await check(n)).valid,
  shouldEmit: (n) => n !== undefined && n < 100,
});

condition.subscribe((data) => console.log(data));
await condition.asyncPush(42); // → passes both filters → 42
```

### AsyncPollingSourceTransfer

Output transfer with asynchronous internal polling. The ticker calls `asyncTrigger()` (fire-and-forget). The `_polling` flag prevents overlapping calls with a slow fetcher.

**Capabilities:** `isOutput`, `isPollingSource`, `isAsyncPullable`, `isSubscribable`, `isAsyncTriggerable`, `isGate`

```typescript
import { createAsyncPollingSourceTransfer } from 'transferum';

const polling = createAsyncPollingSourceTransfer<number>({
  fetcher: async () => (await fetch('/api/data')).json(),
  interval: 1000,
  activated: true,
});

polling.subscribe((data) => console.log(data));
// Every second: async-fetch → subscriber notification
```

**Error handling:** If `fetcher()` throws in `asyncTrigger()`, `onError` is called. With `onError` — suppressed, polling continues. Without `onError` (or if it throws) — rejection rethrown, ticker stops, resulting in an **unhandled promise rejection** (ticker calls `asyncTrigger()` fire-and-forget). `asyncPull()` rethrows to caller without affecting the ticker.

```typescript
const polling = createAsyncPollingSourceTransfer<number>({
  fetcher: async () => { throw new Error('fail'); },
  interval: 1000,
  activated: true,
  onError: (e, source) => console.error(e, source.active),
});
```

### AsyncPollingProxyTransfer

Duplex transfer with async polling that receives its fetcher from the previous node. `setAsyncFetcher()` is set via `linkTransfers` (async strategies 5–7).

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isAsyncPollingProxy`, `isPollingSource`, `isAsyncPullable`, `isSubscribable`, `isAsyncTriggerable`, `isGate`

```typescript
import { createAsyncPollingProxyTransfer } from 'transferum';

const poller = createAsyncPollingProxyTransfer<number>({
  interval: 1000,
  activated: false,
});

// asyncFetcher is set via linkTransfers or manually:
poller.setAsyncFetcher(async () => await asyncSource.asyncPull());

poller.activate(); // start polling
```

**Error handling:** Same as `AsyncPollingSourceTransfer` — `onError` suppresses fetcher errors in `asyncTrigger()` and `asyncPull()`. Without `onError` (or if it throws) — `asyncTrigger()` rethrows, ticker stops, **unhandled promise rejection**. `asyncPull()` rethrows to caller without affecting the ticker.

### AsyncPollingFlowTransfer

Output transfer with async polling from `AsyncOutputFlowInterface`. Similar to `AsyncPollingSourceTransfer`, but the source is an interface with async `read()` instead of `AsyncDataFetcher`.

**Capabilities:** `isOutput`, `isPollingSource`, `isAsyncPullable`, `isSubscribable`, `isAsyncTriggerable`, `isGate`

```typescript
import { createAsyncPollingFlowTransfer } from 'transferum';

const polling = createAsyncPollingFlowTransfer<number>({
  flow: asyncStorage,
  interval: 1000,
  activated: true,
});

polling.subscribe((data) => console.log(data));
```

**Error handling:** If `flow.read()` throws in `asyncTrigger()`, `onError` is called. With `onError` — suppressed, polling continues. Without `onError` (or if it throws) — rejection rethrown, ticker stops, **unhandled promise rejection**. `asyncPull()` rethrows to caller without affecting the ticker.

### AsyncIdlePollingTransfer

Reactive channel with async fallback polling on idle. `push()` is synchronous, but the fetcher is asynchronous — `asyncTrigger()` awaits `_doPoll()` (fetch + notify), `asyncPull()` awaits the fetcher directly. The `_polling` flag prevents overlapping. The ticker uses `_doPoll()` — fire-and-forget.

**Capabilities:** `isInput`, `isOutput`, `isDuplex`, `isPushable`, `isSubscribable`, `isPollingSource`, `isAsyncPullable`, `isAsyncTriggerable`, `isGate`

```typescript
import { createAsyncIdlePollingTransfer } from 'transferum';

const channel = createAsyncIdlePollingTransfer<number>({
  fetcher: async () => (await fetch('/api/latest')).json(),
  timeout: 5000,   // 5 seconds without push → start polling
  interval: 1000,  // poll fetcher every second
  activated: true,
});

channel.subscribe((data) => console.log(data));
channel.push(42);  // → subscribers notified synchronously, idle timer reset
// after 5 seconds without push → async-polling every 1 second
```

**Error handling:** If `fetcher()` throws during polling, `onError` is called. With `onError` — suppressed, polling continues. Without `onError` (or if it throws) — rejection rethrown, polling stops, **unhandled promise rejection** (ticker calls `_doPoll()` fire-and-forget). `asyncPull()` rethrows to caller without affecting polling.

### AsyncStoredChannelTransfer

Channel with value retention, external management, and async interface. `setup`/`emit`/`subscribe` are synchronous (like in `StoredChannelTransfer`), but `asyncPull()`/`asyncTrigger()` are async for integration with async pipelines.

**Capabilities:** `isOutput`, `isSubscribable`, `isAsyncPullable`, `isAsyncTriggerable`

**Error handling:** Same as `ChannelTransfer` — `setup()` errors always rethrown. `onError` covers `emit()` failures (via `asyncTrigger()`). `onDestroyError` covers `destroy()` failures.

```typescript
import { createAsyncStoredChannelTransfer } from 'transferum';

let emit: (data: number) => void;

const channel = createAsyncStoredChannelTransfer<number>({
  setup: (e) => { emit = e; },
  destroy: () => {},
  initialValue: 0,
});

channel.subscribe((data) => console.log(data));
emit(42); // → 42 (asyncTrigger — fire-and-forget)

const value = await channel.asyncPull(); // 42
```

---

## Operators

Operators implement `OperatorInterface<TInput, TOutput>` with the method `apply(data: TInput): TOutput`.

### Operator Comparison Table

| Operator                           | Input | Output                    | Behavior                                                                   |       Composition       | Use case                                      |
|------------------------------------|-------|---------------------------|----------------------------------------------------------------------------|:-----------------------:|-----------------------------------------------|
| `TransparentOperator<T>`           | `T`   | `T`                       | Returns data unchanged (identity)                                          |           Yes           | Stub, pipeline testing without transformation |
| `MapOperator<TIn, TOut>`           | `TIn` | `TOut`                    | Applies a mapper function to data                                          |           Yes           | Type or value transformation                  |
| `FilterOperator<T>`                | `T[]` | `T[]`                     | Keeps array elements matching a predicate                                  |           Yes           | Array element filtering                       |
| `ReducerOperator<T>`               | `T[]` | `T \| undefined`          | Reduces an array to a single value (`undefined` for empty without default) |           Yes           | Aggregation (sum, product, min/max)           |
| `GuardOperator<T>`                 | `T`   | `T \| undefined`          | Passes data if predicate is `true`, otherwise `undefined`                  |           Yes           | Validation, single-value filtering            |
| `PipelineOperator<TIn, TOut>`      | `TIn` | `TOut`                    | Sequentially applies a chain of operators                                  |   Composition result    | Complex multi-stage transformations           |
| `AsyncMapOperator<TIn, TOut>`      | `TIn` | `Promise<TOut>`           | Asynchronously applies a mapper (sync or async)                            | Yes (via AsyncPipeline) | Async type or value transformation            |
| `AsyncGuardOperator<T>`            | `T`   | `Promise<T \| undefined>` | Asynchronously passes data if predicate is `true`                          | Yes (via AsyncPipeline) | Async validation, filtering                   |
| `AsyncPipelineOperator<TIn, TOut>` | `TIn` | `Promise<TOut>`           | Sequentially applies a chain of sync/async operators via `await`           |   Composition result    | Complex async multi-stage transformations     |

> **Composition** — the ability to use an operator as a step in `PipelineOperator` (via `OperatorPipelineBuilder`) or as an `operator` in `ConvertTransfer` / `TransformBridge`. All operators support composition.

**Comparison by data types:**

| Characteristic    | Scalar operators                                      | Array operators                            |
|-------------------|-------------------------------------------------------|--------------------------------------------|
| Operators         | `TransparentOperator`, `MapOperator`, `GuardOperator` | `FilterOperator`, `ReducerOperator`        |
| Input             | Single value (`T`)                                    | Array (`T[]`)                              |
| Output            | Single value or `undefined`                           | Array, scalar, or `undefined`              |
| `GuardOperator`   | Returns `T \| undefined` — blocks the flow on `false` | —                                          |
| `FilterOperator`  | —                                                     | Returns `T[]` — subset of elements         |
| `ReducerOperator` | —                                                     | Returns `T \| undefined` — array aggregate |

```typescript
import { createPipelineOperator, createMapOperator, createGuardOperator } from 'transferum';

const op = createPipelineOperator<number, string>([
  createMapOperator((n: number) => n * 2),
  createMapOperator((n: number) => n.toString()),
  createGuardOperator((s: string) => s.length > 0),
]);

console.log(op.apply(21)); // "42"
```

### Async Operators

Async operators implement `AsyncOperatorInterface<TInput, TOutput>` with the method `apply(data: TInput): Promise<TOutput>`. Mappers and predicates can be synchronous or asynchronous (return `Promise`).

```typescript
import { createAsyncPipelineOperator, createAsyncMapOperator, createMapOperator, createAsyncGuardOperator } from 'transferum';

const op = createAsyncPipelineOperator<number, string>([
  createAsyncMapOperator(async (n: number) => n * 2),
  createMapOperator((n: number) => n.toString()),      // sync operator in async chain
  createAsyncGuardOperator(async (s: string) => s.length > 0),
]);

console.log(await op.apply(21)); // "42"
```

> `AsyncPipelineOperator` accepts both `OperatorInterface` and `AsyncOperatorInterface` — each step is executed via `await`. A sync operator is unwrapped as a no-op.
>
> `AsyncPipelineOperator` (like the sync `PipelineOperator`) **does not stop** the chain on `undefined` from a guard — it passes `undefined` further.

---

## Storages

Storages implement `StorageInterface<TInput, TOutput>` (write/read/clear/reset/size).

### Storage Comparison Table

| Storage            | Structure    | Read order                 |      `maxLength`       | `size`        | `reset()`               | Purpose                |
|--------------------|--------------|----------------------------|:----------------------:|---------------|-------------------------|------------------------|
| `LatestStorage<T>` | Single value | — (last written)           |           —            | 0 or 1        | Restores `defaultValue` | Last-value cache       |
| `QueueStorage<T>`  | Array (FIFO) | First written → first read |   ✓ (evicts oldest)    | Element count | Clears (`clear()`)      | FIFO buffer with limit |
| `StackStorage<T>`  | Array (LIFO) | Last written → first read  | ✓ (evicts from bottom) | Element count | Clears (`clear()`)      | LIFO stack with limit  |

**Behavior comparison:**

| Characteristic                |     `LatestStorage`      |       `QueueStorage`        |         `StackStorage`         |
|-------------------------------|:------------------------:|:---------------------------:|:------------------------------:|
| Stores multiple values        |            —             |              ✓              |               ✓                |
| Read order                    |           Last           | FIFO (first in — first out) |   LIFO (last in — first out)   |
| `write()` overwrites          |        ✓ (always)        |   ✓ (only at `maxLength`)   |    ✓ (only at `maxLength`)     |
| `read()` clears value         | — (available repeatedly) |  ✓ (extracts and removes)   |    ✓ (extracts and removes)    |
| `defaultValue` in constructor |            ✓             |              —              |               —                |
| `reset()`                     | Restores `defaultValue`  |           Clears            |             Clears             |
| `maxLength`                   |            —             |     ✓ (removes oldest)      | ✓ (removes oldest from bottom) |
| `size` after `clear()`        |            0             |              0              |               0                |

**Choosing a storage:**

| Scenario                                       | Recommendation                                    |
|------------------------------------------------|---------------------------------------------------|
| Caching the last state                         | `LatestStorage`                                   |
| Buffering data in arrival order                | `QueueStorage`                                    |
| Reverse processing (last in — first processed) | `StackStorage`                                    |
| Limiting stored data volume                    | `QueueStorage` or `StackStorage` with `maxLength` |
| Source for `PollingFlowTransfer`               | Any (via `ReadTransfer`)                          |
| Sink for `WriteTransfer`                       | Any (via `WriteTransfer`)                         |

```typescript
import { createQueueStorage } from 'transferum';

const queue = createQueueStorage<number>(3);
queue.write(1);
queue.write(2);
queue.write(3);
queue.write(4); // 1 evicted

console.log(queue.read()); // 2
console.log(queue.size);   // 2
```

---

## Tickers

Tickers implement `TickerInterface` and provide periodic callback invocation with a configurable interval. Two implementations for different environments:

| Ticker           | Based on                |     Leading edge      | Environment                         |
|------------------|-------------------------|:---------------------:|-------------------------------------|
| `RAFTicker`      | `requestAnimationFrame` |    ✓ (first frame)    | Browser / SSR (setTimeout fallback) |
| `IntervalTicker` | `setInterval`           | ✓ (setTimeout(fn, 0)) | Node.js / tests (fake timers)       |

**Interface:**

```typescript
interface TickerInterface {
  readonly interval: number;
  readonly active: boolean;
  start(): void;
  stop(): void;
  restart(): void;
  toggle(): boolean;
  updateInterval(delay: number): void;
}
```

**Usage example:**

```typescript
import { RAFTicker, IntervalTicker, type TickerFactory } from 'transferum';

// Browser ticker (default)
const rafTicker = new RAFTicker({ callback: () => console.log('tick'), interval: 1000 });
rafTicker.start();

// Server/test ticker
const intervalTicker = new IntervalTicker({ callback: () => console.log('tick'), interval: 1000 });
intervalTicker.start();

// Via factory (for passing to polling transfers)
const tickerFactory: TickerFactory = (config) => new RAFTicker(config);
```

**Leading edge:** Both tickers invoke the callback immediately on `start()` (or in the next micro-tick for `IntervalTicker` when `interval > 0`). When `interval === 0`, `IntervalTicker` starts `setInterval(fn, 0)` without delay.

**Safe `stop()` inside callback:** `RAFTicker` recalculates `_startTime` **before** calling `callback()`, so the callback can safely call `stop()` synchronously — the frame will not be rescheduled.

---

## Helpers

### Subscriber

Subscription management. Created via `SubscriptionManager.subscribe()`, not directly.

```typescript
// transfer is any SubscribableTransferInterface
const subscriber = transfer.subscribe(handler);

subscriber.onUnsubscribe((s) => console.log('unsubscribed'));
subscriber.unsubscribe(); // → "unsubscribed"
```

### SubscriptionManager

Manages a set of subscribers. `sendState()` notifies all subscribers with the current value (ignores `undefined`).

### ProxyReference

A wrapper around a value:
- `value` — current value
- `pop()` — extract with cleanup
- `clear()` — clear without extraction

### DisposableSubscriberAdapter

Adapts `SubscriberInterface` → `DisposableInterface`. Used in builders to manage subscriptions via `destroy()`.

### StateSubscriptionManager

Subscription manager for object state changes. Reuses `ProxyReference` and `SubscriptionManager`.

The value (usually the owning object itself) is set once in the constructor and never becomes `undefined`, so every `notify()` is guaranteed to notify all subscribers with that value.

Used to implement `GateInterface.onStateChange()` in all gate transfers and bridges.

```typescript
import { StateSubscriptionManager, type GateInterface } from 'transferum';

const manager = new StateSubscriptionManager<GateInterface>(gate);

const subscriber = manager.subscribe((g) => {
  console.log(`State changed: active=${g.active}`);
});

gate.activate();
manager.notify(); // → "State changed: active=true"

subscriber.unsubscribe(); // unsubscribe

manager.destroy(); // unsubscribes all remaining subscribers
```

**Methods:**

| Method               | Description                                                         |
|----------------------|---------------------------------------------------------------------|
| `subscribe(handler)` | Registers a handler, returns `SubscriberInterface`                  |
| `notify()`           | Notifies all active subscribers with the value from the constructor |
| `destroy()`          | Unsubscribes all active subscribers                                 |

---

## Bridges

Bridges implement `BridgeInterface` (active/activate/deactivate/toggle/destroy) and connect data flows with gate control.

### Bridge Comparison Table

| Bridge                            | Connects                  |     Transformation      |              Intermediate transfer              |       Gate        | Owned | Purpose                                  |
|-----------------------------------|---------------------------|:-----------------------:|:-----------------------------------------------:|:-----------------:|:-----:|------------------------------------------|
| `PassBridge<T>`                   | Output → Input            |            —            |                        —                        |         ✓         |   —   | Simple bridge with flow control          |
| `TransformBridge<TIn, TOut>`      | Output → Input            |   ✓ (via `Operator`)    |          `ConvertTransfer` (internal)           |         ✓         |   —   | Bridge with data type transformation     |
| `TransferBridge<TIn, TOut>`       | Output → Input            |            —            | `DuplexTransfer` (external, opt. `middleOwned`) |         ✓         |   ✓   | Bridge with intermediate duplex transfer |
| `AsyncTransformBridge<TIn, TOut>` | Output → Input            | ✓ (via `AsyncOperator`) |        `AsyncConvertTransfer` (internal)        |         ✓         |   —   | Bridge with async type transformation    |
| `BridgeAggregator`                | Group of bridges          |            —            |                        —                        |  ✓ (all at once)  |   ✓   | Synchronous group control of bridges     |
| `BridgeSelector<TMap>`            | One from a bridge map     |            —            |                        —                        | ✓ (only selected) |   ✓   | Select one active bridge                 |
| `BridgeMultiSelector<TMap>`       | Several from a bridge map |            —            |                        —                        |   ✓ (selected)    |   ✓   | Select multiple active bridges           |

> **Gate** — all bridges have an internal `GateTransfer` for flow control. `activate()` / `deactivate()` / `toggle()` delegate to the gate.
> **Owned** — the `owned` parameter controls whether nested bridges are destroyed on `destroy()`.
> **onStateChange()** — all bridges support state change subscription via `onStateChange()`. In `PassBridge`, `TransformBridge`, `TransferBridge` the notification fires on `activate()` / `deactivate()` / `toggle()`. In `BridgeAggregator` — on direct state changes (does not listen to children). In `BridgeSelector` — on `_active` or `_selectedKey` changes (including `select()`). In `BridgeMultiSelector` — on `_active` or `_selectedKeys` changes (including `select()`, `check()`, `uncheck()`).

**Comparison by flow structure:**

| Characteristic      |      `PassBridge`      |         `TransformBridge`          |             `TransferBridge`              |
|---------------------|:----------------------:|:----------------------------------:|:-----------------------------------------:|
| Connects            |    source → target     |          source → target           |              source → target              |
| Intermediate layer  |           —            |         `ConvertTransfer`          |         External `DuplexTransfer`         |
| Data transformation |           —            |           ✓ (`Operator`)           |             Depends on middle             |
| Data types          |       `T` → `T`        |           `TIn` → `TOut`           |              `TIn` → `TOut`               |
| Middle management   |           —            |    Internal (created by bridge)    | External (`middleOwned` controls destroy) |
| Link chain          | source → gate → target | source → gate → converter → target |      source → gate → middle → target      |

**Comparison of selectors and aggregator:**

| Characteristic |        `BridgeAggregator`         |        `BridgeSelector`         |             `BridgeMultiSelector`              |
|----------------|:---------------------------------:|:-------------------------------:|:----------------------------------------------:|
| Active bridges |        All simultaneously         |         One (selected)          |               Several (selected)               |
| `active`       | `true` if ALL bridges are active  |       Controlled by flag        |               Controlled by flag               |
| Selection      |                 —                 |          `select(key)`          | `select(keys[])`, `check(key)`, `uncheck(key)` |
| Switching      | `activate()` / `deactivate()` all |     `select(key)` switches      |       `check()` / `uncheck()` add/remove       |
| Extraction     |                 —                 | `selectedKey`, `selectedBridge` |       `selectedKeys`, `selectedBridges`        |
| `owned`        |  Controls destroy of all bridges  | Controls destroy of all bridges |        Controls destroy of all bridges         |
| `toggle()`     |     Activates/deactivates all     |       Toggles common flag       |              Toggles common flag               |

**Choosing a bridge:**

| Scenario                                                         | Recommendation        |
|------------------------------------------------------------------|-----------------------|
| Simple passthrough with on/off capability                        | `PassBridge`          |
| Passthrough with data type transformation                        | `TransformBridge`     |
| Passthrough through an intermediate transfer (filter, converter) | `TransferBridge`      |
| Synchronous group control of bridges                             | `BridgeAggregator`    |
| Switching between multiple routes                                | `BridgeSelector`      |
| Simultaneous activation of multiple routes                       | `BridgeMultiSelector` |

```typescript
import { createPushStoredChannelTransfer, createSinkTransfer, createPassBridge } from 'transferum';

const source = createPushStoredChannelTransfer<number>();
const target = createSinkTransfer<number>({ callback: (n) => console.log(n) });

const bridge = createPassBridge<number>({
  source,
  target,
  activated: true,
});

source.push(42); // → callback called

bridge.deactivate();
source.push(100); // ignored

bridge.destroy(); // breaks all links
```

### BridgeSelector

```typescript
import { createBridgeSelector, createPassBridge } from 'transferum';

const bridges = {
  fast: createPassBridge({ source, target1, activated: false }),
  slow: createPassBridge({ source, target2, activated: false }),
};

const selector = createBridgeSelector({
  bridges,
  initialKey: 'fast',
  activated: true,
});

selector.select('slow'); // switch to the second bridge
```

### BridgeMultiSelector

```typescript
import { createBridgeMultiSelector } from 'transferum';

const selector = createBridgeMultiSelector({
  bridges,
  initialKeys: ['fast'],
  activated: true,
});

selector.check('slow');   // adds bridge to active
selector.uncheck('fast'); // removes bridge from active
```

### AsyncTransformBridge

Bridge with asynchronous data type transformation via `AsyncOperator`. Gate and subscription remain synchronous. `AsyncConvertTransfer` accepts data via `asyncPush` (the gate→converter link uses the async `linkTransfers` strategy), transforms via `await operator.apply()`, and notifies subscribers synchronously.

**Flow structure:** source → gate → asyncConverter → target

```typescript
import { createAsyncTransformBridge, createAsyncMapOperator } from 'transferum';

const bridge = createAsyncTransformBridge<number, string>({
  source,
  target,
  operator: createAsyncMapOperator(async (n: number) => `val_${n}`),
  activated: true,
  onError: (e) => console.error(e),
});

source.push(42); // → async transformation → "val_42" at target's subscribers
```

---

## Pipeline Builders

Builders provide a fluent API for assembling transfer chains with automatic linking via `linkTransfers`.

### InputPipelineBuilder

Builds an input pipeline: `start(Duplex) → to(Duplex)* → finish(Input)`.

```typescript
import {
  InputPipelineBuilder,
  createPushStoredChannelTransfer,
  createConvertTransfer,
  createSinkTransfer,
  createMapOperator,
} from 'transferum';

const pipeline = InputPipelineBuilder
  .start(createPushStoredChannelTransfer<number>())
  .to(createConvertTransfer<number, string>({ operator: createMapOperator((n) => n.toString()) }))
  .finish(createSinkTransfer<string>({ callback: (s) => console.log(s) }));

pipeline.push(21); // → "21"
```

### OutputPipelineBuilder

Builds an output pipeline: `start(Output) → to(Duplex)* → finish(Duplex)`.

```typescript
import {
  OutputPipelineBuilder,
  createPollingSourceTransfer,
  createConvertTransfer,
  createPushStoredChannelTransfer,
  createMapOperator,
} from 'transferum';

const pipeline = OutputPipelineBuilder
  .start(createPollingSourceTransfer<number>({ fetcher: () => 42, interval: 1000, activated: true }))
  .to(createConvertTransfer<number, string>({ operator: createMapOperator((n) => n.toString()) }))
  .finish(createPushStoredChannelTransfer<string>());

pipeline.subscribe((data) => console.log(data));
```

### DuplexPipelineBuilder

Builds a full-duplex pipeline: `start(Duplex) → to(Duplex)* → finish(Output)`.

```typescript
import { DuplexPipelineBuilder, createPushStoredChannelTransfer, createConditionTransfer } from 'transferum';

const pipeline = DuplexPipelineBuilder
  .start(createPushStoredChannelTransfer<number>())
  .to(createConditionTransfer<number>({ shouldAccept: (n) => n > 0 }))
  .finish(createPushStoredChannelTransfer<number>(), { owned: true });

pipeline.push(42);
pipeline.subscribe((data) => console.log(data));
pipeline.pull();

pipeline.destroy(); // destroys owned resources
```

### OperatorPipelineBuilder

Builds a chain of operators with type checking at each step.

```typescript
import { OperatorPipelineBuilder, createMapOperator, createGuardOperator } from 'transferum';

const operator = OperatorPipelineBuilder
  .create()
  .add(createMapOperator<number, number>((n) => n * 2))
  .add(createMapOperator<number, string>((n) => n.toString()))
  .add(createGuardOperator<string>((s) => s.length > 0))
  .build();

console.log(operator.apply(21)); // "42"
```

### The `owned` parameter

- `owned: true` in `to()` — the intermediate transfer is destroyed on composite `destroy()`.
- `owned: true` in `finish()` — the final transfer is destroyed on composite `destroy()`.
- `owned: false` (default) — the transfer is not destroyed automatically.

### `finish()` options

```
finish(lastTransfer, {
  triggerable?: TriggerableInterface,           // explicit trigger (priority over auto-extraction)
  asyncTriggerable?: AsyncTriggerableInterface, // explicit async trigger (async builders only)
  gate?: GateInterface,                         // explicit gate (priority over auto-extraction)
  owned?: boolean,                              // whether to destroy lastTransfer on destroy()
  linkOnError?: ErrorHandler,                   // async linking error handler (async builders only)
})
```

### Async Builders

Async builders are analogous to sync builders, but:
- `linkTransfers` is called with `LinkConfig` (`onError` for async-push rejection)
- `finish()` accepts `asyncTriggerable` in addition to `triggerable`
- `asyncTriggerable` is passed to `UniversalCompositeTransfer`

| Builder                        | Sync analog               | Difference                                                                  |
|--------------------------------|---------------------------|-----------------------------------------------------------------------------|
| `AsyncInputPipelineBuilder`    | `InputPipelineBuilder`    | `linkOnError` + `asyncTriggerable` in `finish()`                            |
| `AsyncOutputPipelineBuilder`   | `OutputPipelineBuilder`   | `linkOnError` + `asyncTriggerable` in `finish()`                            |
| `AsyncDuplexPipelineBuilder`   | `DuplexPipelineBuilder`   | `linkOnError` + `asyncTriggerable` in `finish()`                            |
| `AsyncOperatorPipelineBuilder` | `OperatorPipelineBuilder` | Accepts sync and async operators, `build()` returns `AsyncPipelineOperator` |

```typescript
import {
  AsyncDuplexPipelineBuilder,
  createPushStoredChannelTransfer,
  createAsyncConvertTransfer,
  createAsyncMapOperator,
} from 'transferum';

const pipeline = AsyncDuplexPipelineBuilder
  .start(createPushStoredChannelTransfer<number>())
  .to(createAsyncConvertTransfer<number, string>({
    operator: createAsyncMapOperator(async (n) => n.toString()),
  }))
  .finish(createPushStoredChannelTransfer<string>(), {
    owned: true,
    linkOnError: (e) => console.error(e),
  });

pipeline.push(42);
pipeline.subscribe((data) => console.log(data)); // → "42"
```

```typescript
import { AsyncOperatorPipelineBuilder, createMapOperator, createAsyncMapOperator } from 'transferum';

const operator = AsyncOperatorPipelineBuilder
  .create()
  .add(createMapOperator<number, number>((n) => n * 2))                   // sync operator
  .add(createAsyncMapOperator<number, string>(async (n) => n.toString())) // async operator
  .build();

console.log(await operator.apply(21)); // "42"
```

---

## Factories

Factory functions `create*` are convenient wrappers over constructors. The return type is computed via `Transfer<TIn, TOut, [Features...]>`, ensuring a precise interface.

```typescript
import { createPushChannelTransfer, createPushStoredChannelTransfer } from 'transferum';

const channel = createPushChannelTransfer<number>();
// type: Transfer<number, [Pushable, Subscribable]>
// available methods: push(), subscribe(), destroy()

const stored = createPushStoredChannelTransfer<number>({ initialValue: 0 });
// type: Transfer<number, [Pushable, Pullable, Subscribable, Triggerable]>
// available methods: push(), pull(), subscribe(), trigger(), destroy()
```

Full list of factories:

| Category                    | Factories                                                                                                                                              |
|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| Channels                    | `createPushChannelTransfer`, `createDelayedPushChannelTransfer`, `createDebounceTransfer`, `createThrottleTransfer`, `createPushStoredChannelTransfer` |
| Buffers                     | `createBufferTransfer`, `createManualBufferTransfer`, `createManualFlowTransfer`                                                                       |
| Gate                        | `createGateTransfer`                                                                                                                                   |
| Aggregation                 | `createMergeTransfer`, `createSplitTransfer`                                                                                                           |
| Polling                     | `createPollingSourceTransfer`, `createPollingProxyTransfer`, `createPollingFlowTransfer`, `createIdlePollingTransfer`                                  |
| Externally-managed channels | `createChannelTransfer`, `createStoredChannelTransfer`                                                                                                 |
| Sink / Flow                 | `createSinkTransfer`, `createWriteTransfer`, `createReadTransfer`                                                                                      |
| Transformation              | `createConvertTransfer`, `createConditionTransfer`                                                                                                     |
| Bridges                     | `createPassBridge`, `createTransformBridge`, `createTransferBridge`, `createBridgeAggregator`, `createBridgeSelector`, `createBridgeMultiSelector`     |
| Operators                   | `createTransparentOperator`, `createMapOperator`, `createFilterOperator`, `createReducerOperator`, `createGuardOperator`, `createPipelineOperator`     |
| Storages                    | `createLatestStorage`, `createQueueStorage`, `createStackStorage`                                                                                      |
| Async adapters              | `createAsyncSinkTransfer`, `createAsyncWriteTransfer`, `createAsyncReadTransfer`                                                                       |
| Async transformation        | `createAsyncConvertTransfer`, `createAsyncConditionTransfer`                                                                                           |
| Async polling               | `createAsyncPollingSourceTransfer`, `createAsyncPollingProxyTransfer`, `createAsyncPollingFlowTransfer`, `createAsyncIdlePollingTransfer`              |
| Async external sources      | `createAsyncStoredChannelTransfer`                                                                                                                     |
| Async bridges               | `createAsyncTransformBridge`                                                                                                                           |
| Async operators             | `createAsyncMapOperator`, `createAsyncGuardOperator`, `createAsyncPipelineOperator`                                                                    |

---

## Utilities

### linkTransfers

```typescript
function linkTransfers<T, RTransfer extends InputTransfer<T>>(
  lhs: OutputTransfer<T>,
  rhs: RTransfer,
  options?: LinkConfig<RTransfer>,
): SubscriberInterface
```

Links an output transfer (LHS) to an input transfer (RHS). Returns `SubscriberInterface` for breaking the link. The strategy is determined by capability flags (see [Linking Transfers](#linking-transfers)). `options.onError` is used to intercept rejections in the async `subscribable → asyncPushable` strategy — invoked as `onError(error, target)`. Without `onError`, rejections are silently swallowed to protect the source's reactive stream.

### handleError

```typescript
function handleError<TSource>(error: unknown, source: TSource, onError?: ErrorHandler<TSource>): void;
```

Universal error handler:
- If `onError` is provided — invokes it with `(error, source)` and suppresses the exception.
- If `onError` is not provided — rethrows the exception.
- Non-`Error` values are converted to `Error` (via `String(error)`).

---

## Types

Key types are defined in `types.ts`:

| Type                                             | Description                                                                               |
|--------------------------------------------------|-------------------------------------------------------------------------------------------|
| `Transfer<TInOrAll, TOutOrFeatures, TFeatures?>` | Computed transfer type from a list of capabilities                                        |
| `GateInterface`                                  | Flow control: `active`, `activate()`, `deactivate()`, `toggle()`, `onStateChange()`       |
| `SubscriberInterface`                            | Subscription management: `active`, `unsubscribe()`, `onUnsubscribe()`, `offUnsubscribe()` |
| `DisposableInterface`                            | Resource cleanup: `destroy()`                                                             |
| `InputTransfer<T>`                               | `PushableTransferInterface \| PollingProxyTransferInterface \| GateTransferInterface`     |
| `OutputTransfer<T>`                              | `PullableTransferInterface \| SubscribableTransferInterface \| GateTransferInterface`     |
| `DuplexTransfer<TIn, TOut>`                      | `InputTransfer<TIn> & OutputTransfer<TOut>`                                               |
| `CompositeInputTransfer`                         | Composite input transfer (from a builder)                                                 |
| `CompositeOutputTransfer`                        | Composite output transfer (from a builder)                                                |
| `CompositeDuplexTransfer`                        | Composite duplex transfer (from a builder)                                                |
| `First<T>` / `Last<T>`                           | First/last element of a tuple                                                             |
| `InputTransferDataType<T>`                       | Extracts the data type from `InputTransfer`                                               |
| `OutputTransferDataType<T>`                      | Extracts the data type from `OutputTransfer`                                              |
| `AsyncDataHandler<T>`                            | Data handler: `(data: T) => Promise<void> \| void`                                        |
| `ErrorHandler<TSource>`                          | Error handler: `(e: Error, source: TSource) => void`                                      |
| `AsyncDataFetcher<T>`                            | Data fetcher function: `() => Promise<T \| undefined>`                                    |
| `AsyncPushable<T>`                               | `AsyncPushableInterface<T> & { readonly isAsyncPushable: true }`                          |
| `AsyncPullable<T>`                               | `AsyncPullableInterface<T> & { readonly isAsyncPullable: true }`                          |
| `AsyncTriggerable`                               | `AsyncTriggerableInterface & { readonly isAsyncTriggerable: true }`                       |
| `AsyncPollingProxy<T>`                           | `AsyncPollingProxyInterface<T> & { readonly isAsyncPollingProxy: true }`                  |
| `AsyncOperatorInterface<TInput, TOutput>`        | Async operator: `apply(data: TInput): Promise<TOutput>`                                   |
| `AsyncInputFlowInterface<T>`                     | Async write: `write(data: T): Promise<void>`                                              |
| `AsyncOutputFlowInterface<T>`                    | Async read: `read(): Promise<T \| undefined>`                                             |
| `AsyncIOFlowInterface<TInput, TOutput>`          | `AsyncInputFlowInterface<TInput> & AsyncOutputFlowInterface<TOutput>`                     |
| `AsyncStorageInterface<TInput, TOutput>`         | `AsyncIOFlowInterface` + `size`, `clear()`, `reset()` (async)                             |

---

## Configurations

Configs are defined in `configs.ts`. All configs are types (not classes), passed to transfer and bridge constructors.

| Config                                | For                          | Required fields                                               |
|---------------------------------------|------------------------------|---------------------------------------------------------------|
| `GateTransferConfig`                  | `GateTransfer`               | `activated`                                                   |
| `DelayedPushChannelTransferConfig<T>` | `DelayedPushChannelTransfer` | `delay`                                                       |
| `DebounceTransferConfig`              | `DebounceTransfer`           | `delay`                                                       |
| `ThrottleTransferConfig`              | `ThrottleTransfer`           | `interval`                                                    |
| `MergeTransferConfig<T>`              | `MergeTransfer`              | `sources`                                                     |
| `SplitTransferConfig<T>`              | `SplitTransfer`              | `targets`                                                     |
| `PollingSourceTransferConfig<T>`      | `PollingSourceTransfer`      | `fetcher`, `interval`, `activated`                            |
| `PollingProxyTransferConfig`          | `PollingProxyTransfer`       | `interval`, `activated`                                       |
| `PollingFlowTransferConfig<T>`        | `PollingFlowTransfer`        | `flow`, `interval`, `activated`                               |
| `IdlePollingTransferConfig<T>`        | `IdlePollingTransfer`        | `fetcher`, `timeout`, `interval`, `activated`                 |
| `ChannelTransferConfig<T>`            | `ChannelTransfer`            | `setup`, `destroy`, `onError?`, `onDestroyError?`             |
| `StoredChannelTransferConfig<T>`      | `StoredChannelTransfer`      | `setup`, `destroy`, `onError?`, `onDestroyError?`             |
| `SinkTransferConfig<T>`               | `SinkTransfer`               | `callback`, `onError?`                                        |
| `WriteTransferConfig<T>`              | `WriteTransfer`              | `flow`                                                        |
| `ReadTransferConfig<T>`               | `ReadTransfer`               | `flow`                                                        |
| `ConvertTransferConfig<TIn, TOut>`    | `ConvertTransfer`            | `operator`                                                    |
| `ConditionTransferConfig<T>`          | `ConditionTransfer`          | — (predicates are optional), `onAcceptError?`, `onEmitError?` |
| `CompositeTransferConfig<TIn, TOut>`  | `UniversalCompositeTransfer` | `input`, `output`                                             |
| `PassBridgeConfig<T>`                 | `PassBridge`                 | `source`, `target`, `activated`                               |
| `TransformBridgeConfig<TIn, TOut>`    | `TransformBridge`            | `source`, `target`, `operator`, `activated`                   |
| `TransferBridgeConfig<TIn, TOut>`     | `TransferBridge`             | `source`, `target`, `middle`, `middleOwned`, `activated`      |
| `BridgeAggregatorConfig`              | `BridgeAggregator`           | `bridges`, `activated`, `owned`                               |
| `BridgeSelectorConfig<TMap>`          | `BridgeSelector`             | `bridges`, `initialKey`, `activated`, `owned`                 |
| `BridgeMultiSelectorConfig<TMap>`     | `BridgeMultiSelector`        | `bridges`, `initialKeys`, `activated`, `owned`                |

**Async configs:**

| Config                                  | For                                | Required fields                               |
|-----------------------------------------|------------------------------------|-----------------------------------------------|
| `AsyncPollingProxyTransferConfig<T>`    | Async polling transfers            | `interval`, `activated`                       |
| `AsyncPollingSourceTransferConfig<T>`   | `AsyncPollingSourceTransfer`       | `fetcher`, `interval`, `activated`            |
| `AsyncPollingFlowTransferConfig<T>`     | `AsyncPollingFlowTransfer`         | `flow`, `interval`, `activated`               |
| `AsyncIdlePollingTransferConfig<T>`     | `AsyncIdlePollingTransfer`         | `fetcher`, `timeout`, `interval`, `activated` |
| `AsyncSinkTransferConfig<T>`            | `AsyncSinkTransfer`                | `callback`, `onError?`                        |
| `AsyncWriteTransferConfig<T>`           | `AsyncWriteTransfer`               | `flow`                                        |
| `AsyncReadTransferConfig<T>`            | `AsyncReadTransfer`                | `flow`                                        |
| `AsyncConvertTransferConfig<TIn, TOut>` | `AsyncConvertTransfer`             | `operator` (AsyncOperatorInterface)           |
| `AsyncConditionTransferConfig<T>`       | `AsyncConditionTransfer`           | — (predicates are optional, sync or async), `onAcceptError?`, `onEmitError?` |
| `AsyncStoredChannelTransferConfig<T>`   | `AsyncStoredChannelTransfer`       | `setup`, `destroy`, `onError?`, `onDestroyError?`           |
| `AsyncTransformBridgeConfig<TIn, TOut>` | `AsyncTransformBridge`             | `source`, `target`, `operator`, `activated`   |
| `LinkConfig<TTargetTransfer>`           | `linkTransfers` (async strategies) | `onError?`                                    |

All polling transfers support an optional `tickerFactory?: TickerFactory` to replace the default ticker (`RAFTicker.factory`).

| Config         | For                           | Required fields         |
|----------------|-------------------------------|-------------------------|
| `TickerConfig` | `RAFTicker`, `IntervalTicker` | `callback`, `interval?` |

Many configs include optional error handlers (`onError`, `onAcceptError`, `onEmitError`, `onDestroyError`). Each handler receives `(error: Error, source: TSource)` where `source` is the transfer instance that triggered the error.

---

## Running Tests

```bash
npm i
npm run test
```

## License

Transferum is licensed under the MIT License.
