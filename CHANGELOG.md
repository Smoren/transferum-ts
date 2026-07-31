# Transferum Change Log

## v1.6.0 - 2026-07-31

### Pluggable Link Strategies — new public API for custom linking

* **`LinkStrategyInterface`** (`src/interfaces.ts`) — new public interface for custom linking strategies. Implement `link(lhs, rhs, options?)` to override how transfers are wired together.
* **`DefaultLinkStrategy`** (`src/linking.ts`) — default implementation that inspects capability flags on both transfers and dispatches to the matching sync or async strategy (Subscribable → Pushable, Pullable → PollingProxy, Subscribable → PollingProxy, Subscribable → AsyncPushable, AsyncPullable → AsyncPollingProxy, Pullable → AsyncPollingProxy, Subscribable → AsyncPollingProxy). Sync strategies have priority over async.
* **`BaseLinkingStrategy`** (`src/linking.ts`) — abstract base class with protected helper methods for each of the 7 linking strategies and error pattern. Custom strategies can extend this class and override only the strategies they need to customize.
* **`createDefaultLinkStrategy()`** (`src/factories.ts`) — factory function that returns a new `DefaultLinkStrategy` instance.

### Pluggable linking in CompositeTransferBuilder

* `CompositeTransferBuilder.start(transfer, options?)` now accepts an optional config object `{ linkStrategy?: LinkStrategyInterface }`. When provided, all subsequent `to()` and `finish()` calls use the injected strategy's `link()` method instead of `linkTransfers()`.
* Example:
  ```typescript
  const linkStrategy = new DefaultLinkStrategy();
  const composite = CompositeTransferBuilder
    .start(new PushStoredChannelTransfer<number>(), { linkStrategy })
    .to(new ConditionTransfer<number>({ shouldAccept: x => x > 0 }))
    .finish(new SinkTransfer<number>({ callback: console.log }));
  ```

### Pluggable linking in Bridges

* `PassBridge`, `TransformBridge`, `TransferBridge`, and `AsyncTransformBridge` now accept an optional `linkStrategy?: LinkStrategyInterface` in their config.
* When provided, all internal links (source → gate → converter → target) are created via `linkStrategy.link()` instead of `linkTransfers()`.
* Default: `new DefaultLinkStrategy()` (zero-config, backward-compatible).

### Code organization

* **New module `src/linking.ts`** — contains `BaseLinkingStrategy`, `DefaultLinkStrategy`, and `linkTransfers()` function. The `linkTransfers()` function now delegates to `DefaultLinkStrategy.link()`.
* **`src/utils.ts` simplified** — `linkTransfers()` has been moved to `linking.ts`. `utils.ts` now only contains `handleError()`.
* **`src/interfaces.ts`** — `CommunicationContractInterface` is now `export` (was package-private), enabling typed access to capability flags for custom strategies and bridges.
* **`src/index.ts`** — exports `./linking` module.

### Backward compatibility

* `linkTransfers()` is still exported from `'transferum'` (now from `linking.ts` instead of `utils.ts`). All existing imports from `'transferum'` work unchanged.
* All bridge constructors continue to work without a `linkStrategy` config — defaults to `DefaultLinkStrategy`.
* `CompositeTransferBuilder.start()` continues to work without `options` — defaults to `DefaultLinkStrategy`.
* No breaking API changes. All deprecated builders from v1.5.0 remain deprecated.

### Tests

* **New test suite `tests/linkers/default-linker.test.ts`** (549 lines) — covers all 7 linking strategies (Subscribable → Pushable, Pullable → PollingProxy, Subscribable → PollingProxy, Subscribable → AsyncPushable, AsyncPullable → AsyncPollingProxy, Pullable → AsyncPollingProxy, Subscribable → AsyncPollingProxy), error cases (AsyncPullable → sync PollingProxy, Pullable → Pushable, unsupported combinations), lifecycle (active/inactive, unsubscribe stops data flow), and multiple independent links.
* **New test suite `tests/bridges/bridge-linker.test.ts`** (190 lines) — covers custom link strategy injection in all 4 bridge types: `PassBridge`, `TransformBridge`, `TransferBridge`, `AsyncTransformBridge`. Each test verifies that the bridge delegates internal wiring to the injected strategy via call tracking, and that backward compatibility (no `linkStrategy` config) works correctly.
* **New test suite `tests/factories/linker-factories.test.ts`** (89 lines) — covers `createDefaultLinkStrategy()`: returns `DefaultLinkStrategy` instance, provides `link()` method, returns new instance each call, connects Subscribable → Pushable, and supports unsubscribe.
* **Coverage:** Maintained **100% test coverage** (statements, branches, functions, lines) across all 12 source files. Total tests: **2,176**.

## v1.5.1 - 2026-07-26

### Documentation

* **JSDoc `@category` tags** added to ~300 exported entities across all 12 source files. TypeDoc now groups API reference into 15 categories: Transfers, Async Transfers, Operators, Async Operators, Bridges, Async Bridges, Storages, Tickers, Builders, Factories (with domain sub-categories), Helpers, Utilities, Interfaces, Types, Configs.
* **README:** Added API Docs badge linking to [https://smoren.github.io/transferum-ts](https://smoren.github.io/transferum-ts). All entity section headings (`### PushChannelTransfer`, `### linkTransfers`, etc.) are now clickable links to their TypeDoc API reference pages.

## v1.5.0 - 2026-07-26

### CompositeTransferBuilder — unified pipeline builder

* **New builder:** `CompositeTransferBuilder` — a single, type-safe builder that replaces `InputPipelineBuilder`, `OutputPipelineBuilder`, `DuplexPipelineBuilder`, `AsyncInputPipelineBuilder`, `AsyncOutputPipelineBuilder`, and `AsyncDuplexPipelineBuilder`.
* **Pipeline structure:** `OutputTransfer [→ DuplexTransfer → …] → InputTransfer`. The `start()` method accepts an `OutputTransfer`, `to()` accepts a `DuplexTransfer`, and `finish()` accepts an `InputTransfer`.
* **Auto-capability inference:** Input flags (`Pushable`, `PollingProxy`, `AsyncPushable`, `AsyncPollingProxy`) are extracted from the start transfer; output flags (`Pullable`, `Subscribable`, `AsyncPullable`) are extracted from the finish transfer. Triggerable, AsyncTriggerable, and Gate are inferred from explicit options or auto-extracted from the chain.
* **`to(transfer, options)`:** accepts an options object `{ owned?: boolean, onLinkError?: ErrorHandler }` instead of the previous `(transfer, owned?)` signature. `onLinkError` enables async linking error handling at any intermediate step.
* **`finish(lastTransfer, options)`:** accepts `{ triggerable?, asyncTriggerable?, gate?, owned?, onLinkError? }`. Returns a `CompositeTransfer<TInput, TOutput, TStartTransfer, TFinishTransfer, TTriggerable, TAsyncTriggerable, TGate>` — a computed type with capability flags derived from start and finish transfers.
* **Unified sync + async:** `onLinkError` in `to()` and `finish()` enables async error handling across the entire chain, eliminating the need for separate async builder variants.
* **Examples:**
  ```typescript
  // Input pipeline (replaces InputPipelineBuilder)
  const input = CompositeTransferBuilder
    .start(createPushStoredChannelTransfer<number>())
    .to(createConditionTransfer<number>({ shouldAccept: x => x > 0 }))
    .finish(createSinkTransfer<number>({ callback: console.log }), { owned: true });
  input.push(42);

  // Output pipeline (replaces OutputPipelineBuilder)
  const output = CompositeTransferBuilder
    .start(createPollingSourceTransfer<number>({ fetcher: () => 42, interval: 1000, activated: true }))
    .to(createConvertTransfer<number, string>({ operator: createMapOperator(n => n.toString()) }))
    .finish(createPushStoredChannelTransfer<string>());
  output.subscribe(data => console.log(data));

  // Full-duplex pipeline (replaces DuplexPipelineBuilder)
  const duplex = CompositeTransferBuilder
    .start(createPushStoredChannelTransfer<number>())
    .to(createConditionTransfer<number>({ shouldAccept: x => x > 0 }))
    .finish(createPushStoredChannelTransfer<number>(), { owned: true });
  duplex.push(42);
  duplex.subscribe(data => console.log(data));
  ```

### Deprecated builders

* `InputPipelineBuilder`, `OutputPipelineBuilder`, `DuplexPipelineBuilder` — marked `@deprecated`. Use `CompositeTransferBuilder` instead. Will be removed in the next major release.
* `AsyncInputPipelineBuilder`, `AsyncOutputPipelineBuilder`, `AsyncDuplexPipelineBuilder` — marked `@deprecated`. Use `CompositeTransferBuilder` with `onLinkError` for async error handling. Will be removed in the next major release.
* `AsyncOperatorPipelineBuilder` — remains non-deprecated as it works with `OperatorInterface` / `AsyncOperatorInterface`, not `TransferInterface`.

### Type safety improvements

* **`CompositeTransfer` type:** New computed type in `types.ts` that derives capability flags from start and finish transfers via `FilterNever<[...]>`. Replaces `CompositeInputTransfer`, `CompositeOutputTransfer`, and `CompositeDuplexTransfer` (which remain for backward compatibility).

### Infrastructure

* **Code reorganization:** Deprecated builders, interfaces, and types moved to the bottom sections of their respective files for better readability.
* **`CompositeTransferBuilderInterface`:** Interface updated with `to(transfer, options?)` and `finish(lastTransfer, options?)` method signatures.

### Tests

* **CompositeTransferBuilder test suite:** 1319 tests covering input, output, and duplex pipeline construction, capability flag inference, `owned` resource management, `onLinkError` error handling, `triggerable`/`gate`/`asyncTriggerable` options, type-safe chaining, and `destroy()` lifecycle.
* **Coverage:** Maintained **100% test coverage** (statements, branches, functions, lines) across all 11 source files. Total tests: **3,454**.

## v1.4.0 - 2026-07-25

### Sequence Guard for AsyncConvertTransfer and AsyncConditionTransfer
* **Bug fix (issue #7):** Race condition on `_state.value` when `maxConcurrency > 1`. Parallel async operations shared a single `ProxyReference<T>`, so a faster operation could overwrite or clear `_state.value` before a slower one emitted — subscribers received stale or `undefined` values, and emissions arrived out of order.
* **Sequence Guard:** When `maxConcurrency > 1`, each operation receives a monotonic sequence number. Results are placed into an internal `PendingResultQueue` and emitted to subscribers strictly in data-arrival order. A faster result waits in the queue until all preceding operations have emitted. When `maxConcurrency <= 1`, the guard is inactive (zero overhead, backward-compatible).
* **`AsyncConditionTransfer.shouldEmit`** now receives the operation's local `data: T` instead of the shared `_state.value`, eliminating cross-operation data leakage. The `_state` is written only at emission time inside the guarded `_drain()`.
* **`AsyncConditionTransfer.shouldEmit`** signature narrowed from `(currentState: T | undefined) => Promise<boolean> | boolean` to `(data: T) => Promise<boolean> | boolean` — `undefined` is no longer possible at runtime. Backward-compatible via contravariance (a function accepting `T | undefined` is assignable to a parameter expecting `T`).
* **`AsyncConvertTransfer`** and **`AsyncConditionTransfer`** `destroy()` now clears the pending result queue.
* **New helper classes** (`src/helpers.ts`): `PendingResultQueue<T>` (ordered result queue with `nextSeq()`/`submit()`/`drain()`/`clear()`) and `OrderedExecutor` (sequential async task executor with `submit()`/`reset()`).

### Ordered execution for AsyncSinkTransfer and AsyncWriteTransfer
* **New config option `ordered?: boolean`** added to `AsyncSinkTransferConfig` and `AsyncWriteTransferConfig` (default: `false`, backward-compatible). When enabled, `callback` / `flow.write()` invocations are executed sequentially in data-arrival order via an internal `OrderedExecutor` (promise chain). The chain catches errors per-task so a throwing task does not block subsequent tasks; the error is still propagated to the `asyncPush` caller.
* `destroy()` on both transfers now resets the executor.

### ConditionTransfer cleanup
* **`trigger()` method removed** from `ConditionTransfer`. It was not part of any implemented interface (`isTriggerable` was never set to `true`), and its existence created a race condition: `shouldEmit` could receive `undefined` from `_state.value` after `_state.clear()` in a prior `push()`. The `push()` method now inlines the `shouldEmit` check directly with the incoming `data: T`, making `undefined` impossible.
* **`ConditionTransferConfig.shouldEmit`** signature narrowed from `(currentState: T | undefined) => boolean` to `(data: T) => boolean` — `undefined` is no longer possible at runtime. Backward-compatible via contravariance.
* **README:** Removed `!== undefined` guards from `shouldEmit` examples for both `ConditionTransfer` and `AsyncConditionTransfer`.

### Infrastructure
* **API docs generator:** `typedoc` added as devDependency; `npm run docs` script generates API reference to `docs/api`.
* **GitHub Actions:** `deploy-docs.yml` workflow added — generates and deploys API docs to GitHub Pages on push to `master`.
* **`.gitignore`:** `docs` directory added.
* **`interfaces.ts`:** Unused `OutputTransfer` import removed.

### Tests
* **Sequence Guard tests:** Added race-condition regression tests for `AsyncConvertTransfer` (287 tests) and `AsyncConditionTransfer` (459 tests) — covering parallel ordered emission, stale-result prevention, failed-operation queue advancement, and `destroy()` queue cleanup.
* **Ordered execution tests:** Added tests for `AsyncSinkTransfer` (264 tests) and `AsyncWriteTransfer` (284 tests) covering ordered callback/write execution, error isolation, and `destroy()` reset.
* **Helper tests:** Added `PendingResultQueue` (237 tests) and `OrderedExecutor` (355 tests) test suites.
* **ConditionTransfer tests:** Removed 3 tests that used `trigger()` manually; renamed 2 tests from "trigger" to "shouldEmit" naming; removed `!== undefined` guards from `shouldEmit` predicates.
* **Coverage:** Maintained **100% test coverage** (statements, branches, functions, lines) across all 11 source files. Total tests: **2,086**.

## v1.3.0 - 2026-07-19

### DisplaceTransfer — switch-map transfer with onDisplace callback
* **New transfer:** `DisplaceTransfer<TInput, TOutput, TInner>` — for each input value, creates a new inner async-pushable + subscribable transfer via a factory function, pushes the value into it via `asyncPush()`, and forwards the inner's emissions to outer subscribers. On each new `push()`, the previous inner is unsubscribed and destroyed — only the latest inner's emissions pass through. **RxJS equivalent:** `switchMap`.
* **New factory:** `createDisplaceTransfer<TInput, TOutput, TInner>()`.

### Documentation
* **README — DisplaceTransfer section:** New subsection with capabilities, configuration (including `onDisplace`), RxJS equivalent, code example, and `onDisplace` usage example with a custom `FetchTransfer` (abort pattern).
* **README — Comparison tables:** `DisplaceTransfer` added to Transfer Comparison Table, Transformation category, operator-equivalent coverage (`switchMap`→`DisplaceTransfer`), and Gate/Flow control row.
* **README — Debounced search example:** Updated to use `DisplaceTransfer` instead of `AsyncConvertTransfer` directly, demonstrating switch-map semantics.
* **JSDoc:** `DisplaceTransfer` class and `createDisplaceTransfer` factory fully documented with mechanics, error handling, configuration, and use cases.

### Tests
* **DisplaceTransfer test suite:** 37 tests covering capability flags, basic push & subscribe, displace behavior (cancel previous inner), destroy (dispose inner, clean up subscriptions, idempotent), error handling (factory error with/without `onError`, previous inner kept active on factory error), real-world scenarios (fetch, WebSocket, readFile, search-as-you-type), async inner transfers (`AsyncConvertTransfer`, `AsyncConditionTransfer`), and `onDisplace` (called with previous inner, not called on first push/destroy, called before destroy, rapid push, custom cleanup, backward-compatible without callback, exception rethrown but inner still destroyed).
* **Factory tests:** 8 tests for `createDisplaceTransfer` (type, push, displace, destroy, error handling, async inner).
* **Use-case tests:** Updated debounced search test to use `DisplaceTransfer`; added displacement scenario test (slow query cancelled by fast query).
* **Coverage:** Maintained **100% test coverage** (statements, branches, functions, lines) across all 11 source files. Total tests: **2,029**.

## v1.2.0 - 2026-07-18

### syncWithChildren for BridgeSelector and BridgeMultiSelector
* **New optional config field:** `syncWithChildren?: boolean` added to `BridgeSelectorConfig` and `BridgeMultiSelectorConfig` (default `false`).
* **`BridgeSelector`:** when enabled, the selector subscribes to `onStateChange()` of all child bridges. External activation of a child bridge switches selection to it (`select()`). External deactivation of the selected bridge deactivates the selector (`deactivate()`).
* **`BridgeMultiSelector`:** when enabled, the selector subscribes to `onStateChange()` of all child bridges. External activation of a child bridge adds it to the selection (`check()`). External deactivation of a selected child bridge removes it from the selection (`uncheck()`).
* **Feedback loop prevention:** an internal `_syncing` guard suppresses child state-change notifications while the selector is performing its own `activate()` / `deactivate()` / `select()` / `check()` / `uncheck()`, preventing recursive re-entry.
* **Cleanup:** `destroy()` unsubscribes from all child state-change subscriptions before destroying owned bridges.
* **Backward-compatible:** `syncWithChildren` defaults to `false` — existing code behaves exactly as before.

### Tests
* Added 11 tests for `BridgeSelector` `syncWithChildren` (external activation/deactivation, feedback loop prevention on activate/deactivate/select, disabled mode, no-op cases, inactive selector, destroy unsubscribe, onStateChange notification).
* Added 14 tests for `BridgeMultiSelector` `syncWithChildren` (external activation/deactivation, feedback loop prevention on activate/deactivate/select/check/uncheck, disabled mode, no-op cases, inactive selector, destroy unsubscribe, onStateChange notification, multiple external activations accumulation).
* **Coverage:** Maintained **100% test coverage** (statements, branches, functions, lines) across all 11 source files. Total tests: **1,982**.

## v1.1.2 - 2026-07-16

### Documentation
* **README — Comparison section:** Removed "Transferum vs Callbag" and "Transferum vs AsyncIterator" subsections, their table of contents entries, their columns from the Quick Comparison Table, and their entries from "When to Consider Alternatives." Neither Callbag (a spec, not a library) nor AsyncIterator (a built-in pull-only protocol) represents a realistic alternative for library selection.

### Tests
* No test changes. **100% coverage** maintained. Total tests: **1,957**.

## v1.1.1 - 2026-07-16

### Documentation
* **README — Tagline:** Replaced "A reactive data processing pipeline system for TypeScript" with "A language for describing interactions between components" — describes the essence, not an application.
* **README — Graph diagram:** Added ASCII graph diagram illustrating transfers as nodes and bridges as edges, with the caption "This is a graph."
* **README — Architectural Invariants:** Integrated the central philosophical formulation: "Behavior can be described as a composition of independent capabilities that simultaneously determine the type, the implementation, and the rules of interaction."
* **README — Audit corrections, verbosity reduction**.
* **package.json:** Description aligned with the new tagline.

### Code style
* **`src/transfers.ts`:** Transfer class definitions reordered for logical grouping — `ChannelTransfer`, `StoredChannelTransfer`, `PushStoredChannelTransfer` moved adjacent to `PushChannelTransfer`. No functional changes.
* **`src/factories.ts`:** `createPushStoredChannelTransfer` factory moved adjacent to `createPushChannelTransfer`. Multi-line function signatures collapsed to single lines, trailing commas added for consistency. No functional changes.

### Tests
* No test changes. **100% coverage** maintained. Total tests: **1,957**.

## v1.1.0 - 2026-07-15

### Backpressure for async transfers
* **New shared config:** `BackpressureConfig<T>` (`maxConcurrency?`, `bufferSize?`, `onBufferOverflow?`) added to `configs.ts`.
* **Four async transfers gained backpressure support:** `AsyncSinkTransfer`, `AsyncWriteTransfer`, `AsyncConvertTransfer`, `AsyncConditionTransfer`. Their `asyncPush()` methods now route data through `_process()` / `_dequeue()` — limiting concurrent async operations, queuing excess data in an internal buffer, and invoking `onBufferOverflow` (or silently dropping) when both concurrency and buffer are full.
* **Backward-compatible:** All backpressure options default to `Infinity` — existing code behaves exactly as before (unlimited parallel processing, no buffering).
* **`destroy()`** on all four transfers now clears the internal buffer, discarding queued items.

### Documentation
* **README — Backpressure section:** New subsection under Async Transfers documenting `BackpressureConfig<T>` options, mechanics, and a usage example.
* **README — Key Benefits:** Added "Built-in backpressure" row.
* **README — Async Transfer Comparison Table:** Added "BP" (Backpressure) column.
* **README — Transfer descriptions:** Added backpressure notes to `AsyncSinkTransfer`, `AsyncWriteTransfer`, `AsyncConvertTransfer`, `AsyncConditionTransfer`.
* **README — Configurations:** Updated async configs table with `maxConcurrency?`, `bufferSize?`, `onBufferOverflow?` fields and `BackpressureConfig<T>` reference.

### Tests
* **Backpressure tests:** Added 8 backpressure test scenarios for each of the 4 async transfers (32 tests total): `maxConcurrency` sequential/parallel/default, `bufferSize` with/without `onBufferOverflow`, error-frees-slot, `destroy()` clears buffer.
* **Coverage:** Maintained **100% test coverage** (statements, branches, functions, lines) across all 11 source files. Total tests: **1,957**.

## v1.0.2 - 2026-07-12

### Documentation
* **README:** Added project logo.
* **README — Monitoring & Alerts:** Rewritten example to use `OutputPipelineBuilder` with `ConditionTransfer` → `ThrottleTransfer` → `ConvertTransfer` (instead of manual `PushChannelTransfer` + `subscribe`). Updated imports and accompanying text.

### Example tests
* **Domain-specific tests:** Synced "Monitoring & Alerts" test with the updated README example — pipeline-based with concrete throttle assertion (1 alert out of ~5 polls).

## v1.0.1 - 2026-07-12

### Documentation
* **README:** Examples fixed and improved.

### Example tests
* **Use-cases tests:** synced with README.
* **Domain-specific tests:** synced with README.
* **Coverage:** Maintained **100% test coverage**. Total tests: **1,925**.

## v1.0.0 - 2026-07-11

### Stable release
First stable release. The public API is now frozen — no breaking changes are planned within the v1.x line.

* **Codebase Stability:** `v1.0.0` (as well as `v0.3.1`) contains absolutely no changes to the `src/` directory. The API surface is officially confirmed as stable.
* **API Stability Marker:** `v0.3.0` finalized the error handling model (`ErrorHandler<TSource>`, `handleError()`, per-stage handlers, fail-safe polling).

### Documentation
* **Comparison Tables:** Clarified operator counts by distinguishing pure operators (~10, stateless transforms) from flow-control transfers with explicit lifecycle.
* **API Mapping:** Added an "Operator-equivalent coverage" row mapping RxJS operators to Transferum transfers (`debounceTime` → `DebounceTransfer`, `filter` → `ConditionTransfer`, `merge` → `MergeTransfer`, `share` → `SplitTransfer`, `takeUntil` → `GateTransfer`, `delay` → `DelayedPushChannelTransfer`).
* **Architecture Highlights:** Updated the "Quick Comparison Table" with a "Flow-control as nodes" row, highlighting Transferum's transfer-based architecture versus operator-only alternatives.
* **Alternative Recommendations:** The "When to Consider Alternatives" section for RxJS now lists specific uncovered operators (`combineLatest`, `zip`, `withLatestFrom`, `bufferCount`, `windowTime`, `retryWhen`) instead of using a generic operator-count argument.
* **Code Examples:**
  * Expanded the "Debounced search" code comparison to include realistic error handling (`catchError` / `onError`) and empty-result suppression (second `ConditionTransfer` / `filter`).
  * Added a new code comparison: "Conditional routing with runtime switching" showcasing `BridgeMultiSelector` versus manual RxJS subscription management.

### Tests
* **Test Suite Alignment:** Replaced the "Debounced user input with async validation" test with "Debounced search with error handling and empty-result suppression" to perfectly match the updated README examples, covering API failure recovery and empty-result filtering.
* **Fixtures:** Added the `SearchResult` type to test fixtures.
* **Coverage:** Maintained **100% test coverage** (statements, branches, functions, lines) across all 11 source files with a total of **1,927 tests**.

## v0.3.1 - 2026-07-11

### Documentation
* README and keywords updated.

## v0.3.0 - 2026-07-11

### Type-safe error handling
* `ErrorHandler<TSource>` now accepts `(error, source)` instead of `(error)` — the handler receives the transfer instance where the error occurred.
* `handleError()` updated to `handleError<TSource>(error, source, onError?)` — single entry point for all transfers.
* `LinkConfig<TTargetTransfer>` typed with a generic instead of `any`.
* `any` → `unknown` in builders and interfaces for `strict` mode compatibility.

### Consistent error model in polling transfers
* Sync polling (`PollingSourceTransfer`, `PollingProxyTransfer`, `PollingFlowTransfer`, `IdlePollingTransfer`): on error without `onError` — exception rethrown, **ticker stops** (fail-safe). With `onError` — suppressed, polling continues.
* Async polling (`AsyncPollingSourceTransfer`, `AsyncPollingProxyTransfer`, `AsyncPollingFlowTransfer`, `AsyncIdlePollingTransfer`): same, but without `onError` — **unhandled promise rejection** + ticker stops. Removed `_safeTrigger()` / `_safePoll()` — no more silent error swallowing.
* `pull()` / `asyncPull()` — error always propagates to caller, ticker unaffected.

### Per-stage handlers for Condition and Channel
* `ConditionTransfer` / `AsyncConditionTransfer`: single `onError` → separate `onAcceptError` and `onEmitError`.
* `ChannelTransfer` / `StoredChannelTransfer` / `AsyncStoredChannelTransfer`: `onSetupError` removed — `setup()` errors always rethrown (zombie object impossible). `onEmitError` → `onError`.
* `SinkTransfer` / `AsyncSinkTransfer`: `onError` added (previously callback errors were unhandled).

### linkTransfers — TODO resolved
* Case 4 (`subscribable → asyncPushable`): inline handling replaced with `handleError(e, rhs, onError)`. Without `onError` — rethrow → unhandled rejection (visible, not silent). Source subscription remains active.

### Configs renamed
* `PollingProxyConfig` → `PollingProxyTransferConfig<T>`, `PollingSourceConfig` → `PollingSourceTransferConfig<T>`, `AsyncPollingProxyConfig` → `AsyncPollingProxyTransferConfig<T>`, `AsyncPollingSourceConfig` → `AsyncPollingSourceTransferConfig<T>`.
* All polling configs now explicitly include `interval` and `tickerFactory` instead of inheriting from a base polling config.

### Tests and coverage
* 100% coverage (statements, branches, functions, lines) across all files.
* 1926 tests (was ~1921).
* Added tests for: error rethrow + ticker stop, `onError` suppression, non-Error wrapping, `?.` branch, link rejection behavior.

### Documentation
* New "Error Handling" section with sync/async polling behavior tables.
* Error handling blocks in descriptions of all 13 polling/channel transfers.
* Updated comparison tables (RxJS, Most.js, Bacon.js, Quick Comparison) — error handling as a competitive advantage.
* Added "Resilient error handling" to Key Benefits and "When to Choose Transferum".
* Note on sync builders + async targets in Pipeline Builders section.

## v0.2.0 - 2026-07-10

### Transfers
* `IdlePollingTransfer` capabilities changed (made _pullable_).
* `AsyncIdlePollingTransfer` capabilities changed (made _asyncTriggerable_, _asyncPullable_ and **not** _triggerable_).
