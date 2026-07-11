# Transferum Change Log

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
