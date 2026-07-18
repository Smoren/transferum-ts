import type {
  BridgeInterface,
  BridgeMultiSelectorInterface,
  BridgeSelectorInterface,
  GateInterface,
  GateTransferInterface,
  SubscriberInterface,
} from "./interfaces";
import type {
  BaseSelectorKey,
  DataHandler,
  SelectorKey,
  InputTransfer,
  OutputTransfer,
  DuplexTransfer,
} from "./types";
import type {
  BridgeAggregatorConfig,
  BridgeMultiSelectorConfig,
  BridgeSelectorConfig,
  PassBridgeConfig,
  TransformBridgeConfig,
  TransferBridgeConfig,
  AsyncTransformBridgeConfig,
} from "./configs";
import { ConvertTransfer, GateTransfer, AsyncConvertTransfer } from "./transfers";
import { linkTransfers } from "./utils";
import { StateSubscriptionManager } from "./helpers";

/** Simple gated bridge — passes data from source to target through an internal GateTransfer. */
export class PassBridge<T> implements BridgeInterface {
  protected readonly _source: OutputTransfer<T>;
  protected readonly _target: InputTransfer<T>;
  protected readonly _gate: GateTransferInterface<T>;
  protected readonly _gateState: StateSubscriptionManager<GateInterface>;
  protected _subscribers: SubscriberInterface[];

  constructor(config: PassBridgeConfig<T>) {
    this._source = config.source;
    this._target = config.target;
    this._gate = new GateTransfer<T>(config);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);

    this._subscribers = [
      linkTransfers(this._source, this._gate),
      linkTransfers(this._gate, this._target),
    ];
  }

  public get active(): boolean {
    return this._gate.active;
  }

  public activate(): void {
    this._gate.activate();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._gate.deactivate();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._gate.toggle();
    this._gateState.notify();
    return result;
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public destroy(): void {
    this._subscribers.forEach((subscriber) => subscriber.unsubscribe());
    this._subscribers = [];
    this._gateState.destroy();
    this._gate.destroy();
  }
}

/** Gated bridge with synchronous data transformation — source → gate → converter → target. */
export class TransformBridge<TInput, TOutput> implements BridgeInterface {
  protected readonly _source: OutputTransfer<TInput>;
  protected readonly _target: InputTransfer<TOutput>;
  protected readonly _converter: ConvertTransfer<TInput, TOutput>;
  protected readonly _gate: GateTransferInterface<TInput>;
  protected readonly _gateState: StateSubscriptionManager<GateInterface>;
  protected _subscribers: SubscriberInterface[];

  constructor(config: TransformBridgeConfig<TInput, TOutput>) {
    this._source = config.source;
    this._target = config.target;
    this._converter = new ConvertTransfer<TInput, TOutput>(config);
    this._gate = new GateTransfer<TInput>(config);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);

    this._subscribers = [
      linkTransfers(this._source, this._gate),
      linkTransfers(this._gate, this._converter),
      linkTransfers(this._converter, this._target),
    ];
  }

  public get active(): boolean {
    return this._gate.active;
  }

  public activate(): void {
    this._gate.activate();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._gate.deactivate();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._gate.toggle();
    this._gateState.notify();
    return result;
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public destroy(): void {
    this._subscribers.forEach((subscriber) => subscriber.unsubscribe());
    this._subscribers = [];
    this._converter.destroy();
    this._gateState.destroy();
    this._gate.destroy();
  }
}

/** Gated bridge with an intermediate duplex transfer — source → gate → middle → target. */
export class TransferBridge<TInput, TOutput> implements BridgeInterface {
  protected readonly _source: OutputTransfer<TInput>;
  protected readonly _target: InputTransfer<TOutput>;
  protected readonly _middle: DuplexTransfer<TInput, TOutput>;
  protected readonly _gate: GateTransferInterface<TInput>;
  protected readonly _gateState: StateSubscriptionManager<GateInterface>;
  protected readonly _middleOwned: boolean;
  protected _subscribers: SubscriberInterface[];

  constructor(config: TransferBridgeConfig<TInput, TOutput>) {
    this._source = config.source;
    this._target = config.target;
    this._middle = config.middle;
    this._middleOwned = config.middleOwned;
    this._gate = new GateTransfer(config);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);

    this._subscribers = [
      linkTransfers(this._source, this._gate),
      linkTransfers(this._gate, this._middle),
      linkTransfers(this._middle, this._target),
    ];
  }

  public get active(): boolean {
    return this._gate.active;
  }

  public activate(): void {
    this._gate.activate();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._gate.deactivate();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._gate.toggle();
    this._gateState.notify();
    return result;
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public destroy(): void {
    this._subscribers.forEach((subscriber) => subscriber.unsubscribe());
    this._subscribers = [];

    if (this._middleOwned) {
      this._middle.destroy();
    }
    this._gateState.destroy();
    this._gate.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncTransformBridge
// ═══════════════════════════════════════════════════════════════
/**
 * Bridge with asynchronous data type transformation via AsyncOperator.
 *
 * Flow structure: source → gate → asyncConverter → target
 *
 * Gate and subscription remain synchronous. AsyncConvertTransfer receives
 * data via asyncPush (the gate→converter link uses the async strategy of
 * linkTransfers), transforms via await operator.apply() and notifies
 * subscribers synchronously.
 *
 * Configuration (AsyncTransformBridgeConfig):
 * - source: OutputTransfer<TInput>
 * - target: InputTransfer<TOutput>
 * - operator: AsyncOperatorInterface<TInput, TOutput | undefined>
 * - activated: boolean
 * - onError?: ErrorHandler — operator error handler
 */
export class AsyncTransformBridge<TInput, TOutput> implements BridgeInterface {
  protected readonly _source: OutputTransfer<TInput>;
  protected readonly _target: InputTransfer<TOutput>;
  protected readonly _converter: AsyncConvertTransfer<TInput, TOutput>;
  protected readonly _gate: GateTransferInterface<TInput>;
  protected readonly _gateState: StateSubscriptionManager<GateInterface>;
  protected _subscribers: SubscriberInterface[];

  constructor(config: AsyncTransformBridgeConfig<TInput, TOutput>) {
    this._source = config.source;
    this._target = config.target;
    this._converter = new AsyncConvertTransfer<TInput, TOutput>(config);
    this._gate = new GateTransfer<TInput>(config);
    this._gateState = new StateSubscriptionManager<GateInterface>(this);

    this._subscribers = [
      linkTransfers(this._source, this._gate),
      linkTransfers(this._gate, this._converter),
      linkTransfers(this._converter, this._target),
    ];
  }

  public get active(): boolean {
    return this._gate.active;
  }

  public activate(): void {
    this._gate.activate();
    this._gateState.notify();
  }

  public deactivate(): void {
    this._gate.deactivate();
    this._gateState.notify();
  }

  public toggle(): boolean {
    const result = this._gate.toggle();
    this._gateState.notify();
    return result;
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public destroy(): void {
    this._subscribers.forEach((subscriber) => subscriber.unsubscribe());
    this._subscribers = [];
    this._converter.destroy();
    this._gateState.destroy();
    this._gate.destroy();
  }
}

/** Aggregator bridge — controls multiple bridges as a group. Active only when ALL nested bridges are active. */
export class BridgeAggregator implements BridgeInterface {
  protected _bridges: BridgeInterface[];
  protected readonly _owned: boolean;
  protected readonly _gateState: StateSubscriptionManager<GateInterface>;

  constructor(config: BridgeAggregatorConfig) {
    this._bridges = config.bridges;
    this._owned = config.owned;
    this._gateState = new StateSubscriptionManager<GateInterface>(this);

    // Full synchronization from the start:
    // force all bridges into the state specified by config.activated
    if (config.activated) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  // The aggregator is active only if ALL nested bridges are active
  public get active(): boolean {
    if (this._bridges.length === 0) {
      return false;
    }
    return this._bridges.every(b => b.active);
  }

  // Force-activate absolutely all bridges
  public activate(): void {
    this._bridges.forEach(b => b.activate());
    this._gateState.notify();
  }

  // Force-deactivate absolutely all bridges
  public deactivate(): void {
    this._bridges.forEach(b => b.deactivate());
    this._gateState.notify();
  }

  public toggle(): boolean {
    // Base the decision on the current actual state of most/all bridges
    if (this.active) {
      this.deactivate();
      return false;
    }

    this.activate();
    return true;
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public destroy(): void {
    if (!this._owned) {
      this._bridges = [];
      return;
    }
    this._bridges.forEach(b => b.destroy());
    this._gateState.destroy();
    this._bridges = [];
  }
}

/** Single-choice selector bridge — activates exactly one bridge from a map at a time. */
export class BridgeSelector<TMap extends Record<BaseSelectorKey, BridgeInterface>> implements BridgeSelectorInterface<TMap> {
  protected _bridges: TMap;
  protected _selectedKey: SelectorKey<TMap>;
  protected _active: boolean;
  protected readonly _owned: boolean;
  protected readonly _gateState: StateSubscriptionManager<GateInterface>;
  protected _subscribers: SubscriberInterface[] = [];
  protected _syncing = false;

  constructor(config: BridgeSelectorConfig<TMap>) {
    if (config.bridges[config.initialKey] === undefined) {
      throw new Error('Initial bridge key is invalid');
    }

    this._active = config.activated;
    this._owned = config.owned ?? false;
    this._bridges = config.bridges;
    this._selectedKey = config.initialKey;
    this._gateState = new StateSubscriptionManager<GateInterface>(this);

    if (config.syncWithChildren) {
      for (const key of Object.keys(this._bridges)) {
        this._subscribers.push(this._bridges[key].onStateChange((b) => {
          if (this._syncing) {
            return;
          }
          if (b.active && this.selectedKey !== key) {
            this.select(key);
            return;
          }
          if (!b.active && this.selectedKey === key) {
            this.deactivate();
            return;
          }
        }));
      }
    }

    if (this._active) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  public get active(): boolean {
    return this._active;
  }

  public activate(): void {
    this._syncing = true;
    try {
      this._active = true;
      this._deactivateBridges();
      this._tryActivateBridge(this._selectedKey);
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  public deactivate(): void {
    this._syncing = true;
    try {
      this._active = false;
      this._deactivateBridges();
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  public toggle(): boolean {
    if (this._active) {
      this.deactivate();
      return false;
    }
    this.activate();
    return true;
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public destroy(): void {
    this._subscribers.forEach((s) => s.unsubscribe());
    this._subscribers = [];
    if (this._owned) {
      Object.values(this._bridges).forEach(b => b.destroy());
    }
    this._gateState.destroy();
    this._bridges = {} as TMap;
  }

  public select(key: SelectorKey<TMap>): void {
    if (this._selectedKey === key) {
      return;
    }

    this._syncing = true;
    try {
      this._selectedKey = key;
      this._deactivateBridges();
      this._tryActivateBridge(key);
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  public get selectedKey(): SelectorKey<TMap> {
    return this._selectedKey;
  }

  public get selectedBridge(): BridgeInterface {
    return this._bridges[this._selectedKey];
  }

  protected _tryActivateBridge(key: SelectorKey<TMap>): void {
    if (!this._active) {
      return;
    }
    const toActivate = this._bridges[key];
    if (!toActivate.active) {
      toActivate.activate();
    }
  }

  protected _deactivateBridges(): void {
    Object.values<BridgeInterface>(this._bridges)
      .filter(b => b.active)
      .forEach(b => b.deactivate());
  }
}

/** Multi-choice selector bridge — activates any subset of bridges from a map simultaneously. */
export class BridgeMultiSelector<TMap extends Record<BaseSelectorKey, BridgeInterface>> implements BridgeMultiSelectorInterface<TMap> {
  protected _bridges: TMap;
  protected _selectedKeys: Set<SelectorKey<TMap>>;
  protected _active: boolean;
  protected readonly _owned: boolean;
  protected readonly _gateState: StateSubscriptionManager<GateInterface>;
  protected _subscribers: SubscriberInterface[] = [];
  protected _syncing = false;

  constructor(config: BridgeMultiSelectorConfig<TMap>) {
    this._active = config.activated;
    this._owned = config.owned ?? false;

    this._bridges = config.bridges;
    this._selectedKeys = new Set();
    this._gateState = new StateSubscriptionManager<GateInterface>(this);
    this._selectKeys(config.initialKeys);

    if (config.syncWithChildren) {
      for (const key of Object.keys(this._bridges)) {
        this._subscribers.push(this._bridges[key].onStateChange((b) => {
          if (this._syncing) {
            return;
          }
          if (b.active && !this._selectedKeys.has(key as SelectorKey<TMap>)) {
            this.check(key as SelectorKey<TMap>);
            return;
          }
          if (!b.active && this._selectedKeys.has(key as SelectorKey<TMap>)) {
            this.uncheck(key as SelectorKey<TMap>);
            return;
          }
        }));
      }
    }

    if (this._active) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  public get active(): boolean {
    return this._active;
  }

  public activate(): void {
    this._syncing = true;
    try {
      this._active = true;
      this._deactivateBridges();
      this._tryActivateBridges(this._selectedKeys);
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  public deactivate(): void {
    this._syncing = true;
    try {
      this._active = false;
      this._deactivateBridges();
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  public toggle(): boolean {
    if (this._active) {
      this.deactivate();
      return false;
    }
    this.activate();
    return true;
  }

  public onStateChange(handler: DataHandler<GateInterface>): SubscriberInterface {
    return this._gateState.subscribe(handler);
  }

  public destroy(): void {
    this._subscribers.forEach((s) => s.unsubscribe());
    this._subscribers = [];
    if (this._owned) {
      Object.values(this._bridges).forEach(b => b.destroy());
    }
    this._gateState.destroy();
    this._bridges = {} as TMap;
    this._selectedKeys.clear();
  }

  public select(keys: SelectorKey<TMap>[]): void {
    this._syncing = true;
    try {
      this._selectKeys(keys);
      this._deactivateBridges();
      this._tryActivateBridges(this._selectedKeys);
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  public get selectedKeys(): SelectorKey<TMap>[] {
    return Array.from(this._selectedKeys);
  }

  public get selectedBridges(): BridgeInterface[] {
    return Array.from(this._selectedKeys).map(key => this._bridges[key]);
  }

  public check(key: SelectorKey<TMap>): void {
    this._syncing = true;
    try {
      this._selectKey(key);
      this._tryActivateBridge(key);
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  public uncheck(key: SelectorKey<TMap>): void {
    this._syncing = true;
    try {
      this._unselectKey(key)
      this._deactivateBridge(key);
      this._gateState.notify();
    } finally {
      this._syncing = false;
    }
  }

  protected _tryActivateBridges(keys: SelectorKey<TMap>[] | Set<SelectorKey<TMap>>): void {
    if (!this._active) {
      return;
    }
    for (const key of keys) {
      this._tryActivateBridge(key);
    }
  }

  protected _tryActivateBridge(key: SelectorKey<TMap>): void {
    if (!this._active) {
      return;
    }
    const toActivate = this._bridges[key];
    if (!toActivate.active) {
      toActivate.activate();
    }
  }

  protected _deactivateBridges(): void {
    Object.values<BridgeInterface>(this._bridges)
      .filter(b => b.active)
      .forEach(b => b.deactivate());
  }

  protected _deactivateBridge(key: SelectorKey<TMap>): void {
    const bridge = this._bridges[key];
    if (bridge.active) {
      bridge.deactivate();
    }
  }

  protected _selectKeys(keys: SelectorKey<TMap>[]): void {
    keys.forEach(key => {
      if (this._bridges[key] === undefined) {
        throw new Error(`Bridge key "${String(key)}" is invalid`);
      }
    });
    this._selectedKeys = new Set(keys);
  }

  protected _selectKey(key: SelectorKey<TMap>): void {
    if (this._bridges[key] === undefined) {
      throw new Error(`Bridge key "${String(key)}" is invalid`);
    }
    this._selectedKeys.add(key);
  }

  protected _unselectKey(key: SelectorKey<TMap>): void {
    if (this._bridges[key] === undefined) {
      throw new Error(`Bridge key "${String(key)}" is invalid`);
    }
    this._selectedKeys.delete(key);
  }
}
