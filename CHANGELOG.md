# Transferum Change Log

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
