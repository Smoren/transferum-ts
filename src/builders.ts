import type {
  DisposableInterface,
  DuplexPipelineBuilderInterface,
  GateInterface,
  InputPipelineBuilderInterface,
  OutputPipelineBuilderInterface,
  OperatorInterface,
  OperatorPipelineBuilderInterface,
  TriggerableInterface,
  AsyncInputPipelineBuilderInterface,
  AsyncOutputPipelineBuilderInterface,
  AsyncDuplexPipelineBuilderInterface,
  AsyncOperatorPipelineBuilderInterface,
  AsyncTriggerableInterface,
  AsyncOperatorInterface,
} from "./interfaces";
import type {
  First,
  Last,
  CompositeDuplexTransfer,
  DuplexTransfer,
  CompositeInputTransfer,
  InputTransfer,
  InputTransferDataType,
  CompositeOutputTransfer,
  OutputTransfer,
  OutputTransferDataType,
} from "./types";
import type { ErrorHandler } from "./types";
import type { LinkConfig } from "./configs";
import { PipelineOperator, AsyncPipelineOperator } from "./operators";
import { DisposableSubscriberAdapter } from "./helpers";
import { UniversalCompositeTransfer } from "./transfers";
import { linkTransfers } from "./utils";

// ═══════════════════════════════════════════════════════════════
// InputPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing input pipelines (InputPipeline).
 *
 * Purpose:
 * Creates a composite transfer with an input interface (InputCompositeTransfer),
 * which accepts data from outside and passes it through a chain of intermediate
 * duplex transfers to the final input transfer.
 *
 * Pipeline structure:
 *   TStartTransfer [-> DuplexTransfer -> ... ->] -> InputTransfer
 *   │              │                                │
 *   └─ start()     └─ to()                          └─ finish()
 *
 * Where:
 * - TStartTransfer — initial duplex transfer (must be DuplexTransfer)
 * - DuplexTransfer — intermediate chain links (optional, via to())
 * - InputTransfer — final transfer (PushableTransferInterface | InputPollingTransferInterface)
 *
 * Mechanics:
 * 1. start(startTransfer) — creates a builder with the initial transfer
 * 2. to(nextTransfer, owned?) — adds an intermediate duplex transfer to the chain,
 *    linking it to the previous one via linkTransfers()
 * 3. finish(lastTransfer, options?) — completes the pipeline, creating a UniversalCompositeTransfer
 *
 * finish() options:
 * - triggerable?: TriggerableInterface — explicit trigger for the composite
 * - gate?: GateInterface — explicit gate for flow control
 * - owned?: boolean — whether to destroy lastTransfer on composite destroy()
 *
 * The owned parameter in to():
 * - owned = true — the intermediate transfer is added to the owned resources array
 *   and will be destroyed on composite destroy()
 * - owned = false (default) — the transfer is not destroyed automatically
 *
 * Data types:
 * - TStart — data type of the initial transfer (inferred automatically)
 * - TCurrent — data type of the current chain link (changes after each to())
 * - Composite input type = InputTransferDataType<TStartTransfer>
 *
 * Use cases:
 * - Building a reactive data processing pipeline
 * - Chain of transformations with automatic subscription management
 * - Creating input nodes for pipeline architecture
 *
 * @example
 * ```typescript
 * const pipeline = InputPipelineBuilder
 *   .start(new PushStoredChannelTransfer<number>())
 *   .to(new ConditionTransfer<number>(x => x > 0))
 *   .to(new BufferTransfer<number>())
 *   .finish(new GateTransfer<number>({ activated: true, initialValue: 0 }), {
 *     owned: true
 *   });
 *
 * pipeline.push(42);
 * pipeline.destroy();
 * ```
 *
 * @typeParam TCurrent — data type of the current chain link
 * @typeParam TStartTransfer — type of the initial transfer (must be InputTransfer)
 */
export class InputPipelineBuilder<
  TCurrent,
  TStartTransfer extends InputTransfer<any>
> implements InputPipelineBuilderInterface<TCurrent, TStartTransfer> {
  private readonly _startTransfer: TStartTransfer;
  private readonly _currentTransfer: DuplexTransfer<any, TCurrent>;
  private readonly _ownedResources: DisposableInterface[];

  private constructor(
    startTransfer: TStartTransfer,
    currentTransfer: DuplexTransfer<any, TCurrent>,
    ownedResources: DisposableInterface[] = [],
  ) {
    this._startTransfer = startTransfer;
    this._currentTransfer = currentTransfer;
    this._ownedResources = ownedResources;
  }

  /**
   * Static method to create a builder with an initial duplex transfer.
   *
   * @typeParam TCurrent — data type of the initial transfer
   * @typeParam TStartTransfer — type of the initial transfer (must be DuplexTransfer)
   * @param startTransfer — initial duplex transfer
   * @returns A new InputPipelineBuilder instance
   */
  public static start<TCurrent, TStartTransfer extends DuplexTransfer<any, TCurrent>>(
    startTransfer: TStartTransfer,
  ): InputPipelineBuilderInterface<TCurrent, TStartTransfer> {
    return new InputPipelineBuilder<TCurrent, TStartTransfer>(startTransfer, startTransfer, []);
  }

  /**
   * Adds an intermediate duplex transfer to the pipeline chain.
   *
   * Mechanics:
   * 1. Links the current transfer to nextTransfer via linkTransfers()
   * 2. Creates a DisposableSubscriberAdapter to manage the subscription
   * 3. Adds the adapter (and optionally nextTransfer) to the owned resources array
   * 4. Returns a new builder with the updated chain
   *
   * @typeParam TNext — data type of the next transfer
   * @param nextTransfer — duplex transfer to add to the chain
   * @param owned — if true, nextTransfer will be destroyed on composite destroy()
   * @returns A new builder with the updated TNext type
   */
  public to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): InputPipelineBuilderInterface<TNext, TStartTransfer> {
    const subscriber = linkTransfers(this._currentTransfer, nextTransfer);
    const nextOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (owned) {
      nextOwnedResources.push(nextTransfer);
    }

    return new InputPipelineBuilder<TNext, TStartTransfer>(
      this._startTransfer,
      nextTransfer,
      nextOwnedResources
    );
  }

  /**
   * Completes the pipeline construction and creates a composite transfer.
   *
   * Mechanics:
   * 1. Links the last transfer in the chain to lastTransfer via linkTransfers()
   * 2. Creates a UniversalCompositeTransfer with input = startTransfer, output = lastTransfer
   * 3. Adds all owned resources (intermediate transfers + adapters + optionally lastTransfer)
   * 4. Applies triggerable and gate options to the composite
   *
   * Options:
   * - triggerable — explicit trigger for the composite (overrides extraction from input/output)
   * - gate — explicit gate for flow control (overrides extraction from input/output)
   * - owned — if true, lastTransfer is added to owned resources
   *
   * @typeParam TTriggerable — trigger type (TriggerableInterface | undefined)
   * @typeParam TGate — gate type (GateInterface | undefined)
   * @param lastTransfer — final input transfer
   * @param options — completion options (triggerable, gate, owned)
   * @returns InputCompositeTransfer with computed types
   */
  public finish<
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: InputTransfer<TCurrent>,
    options?: {
      triggerable?: TTriggerable;
      gate?: TGate;
      owned?: boolean,
    },
  ): CompositeInputTransfer<InputTransferDataType<TStartTransfer>, TStartTransfer, TTriggerable, undefined, TGate> {
    const subscriber = linkTransfers(this._currentTransfer, lastTransfer);
    const finalOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (options?.owned) {
      finalOwnedResources.push(lastTransfer);
    }

    // Create the composite instance, passing explicitly provided configurations
    const composite = new UniversalCompositeTransfer<InputTransferDataType<TStartTransfer>, never>({
      input: this._startTransfer,
      output: lastTransfer as any,
      owned: finalOwnedResources,
      triggerable: options?.triggerable,
      gate: options?.gate,
    });

    // Return the computed type, fully satisfying the client's IDE
    return composite as InputTransfer<InputTransferDataType<TStartTransfer>> as CompositeInputTransfer<InputTransferDataType<TStartTransfer>, TStartTransfer, TTriggerable, undefined, TGate>;
  }
}

// ═══════════════════════════════════════════════════════════════
// OutputPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing output pipelines (OutputPipeline).
 *
 * Purpose:
 * Creates a composite transfer with an output interface (OutputCompositeTransfer),
 * which extracts data from the initial output transfer and passes it through
 * a chain of intermediate duplex transfers to the final transfer.
 *
 * Pipeline structure:
 *   OutputTransfer [-> DuplexTransfer -> ... ->] -> TFinishTransfer
 *   │              │                                │
 *   └─ start()     └─ to()                          └─ finish()
 *
 * Where:
 * - OutputTransfer — initial output transfer (PullableTransferInterface | SubscribableTransferInterface | GateTransferInterface)
 * - DuplexTransfer — intermediate chain links (optional, via to())
 * - TFinishTransfer — final duplex transfer
 *
 * Mechanics:
 * 1. start(startTransfer) — creates a builder with the initial output transfer
 * 2. to(nextTransfer, owned?) — adds an intermediate duplex transfer to the chain,
 *    linking it to the previous one via linkTransfers()
 * 3. finish(lastTransfer, options?) — completes the pipeline, creating a UniversalCompositeTransfer
 *
 * finish() options:
 * - triggerable?: TriggerableInterface — explicit trigger for the composite
 * - gate?: GateInterface — explicit gate for flow control
 * - owned?: boolean — whether to destroy lastTransfer on composite destroy()
 *
 * The owned parameter in to():
 * - owned = true — the intermediate transfer is added to the owned resources array
 *   and will be destroyed on composite destroy()
 * - owned = false (default) — the transfer is not destroyed automatically
 *
 * Data types:
 * - Composite output type = OutputTransferDataType<TFinishTransfer>
 *
 * Use cases:
 * - Building a pipeline for extracting data from an external source
 * - Chain of transformations with polling or subscribable source
 * - Creating output nodes for pipeline architecture
 *
 * @example
 * ```typescript
 * const pipeline = OutputPipelineBuilder
 *   .start(new GateTransfer<number>({ activated: true, initialValue: 0 }))
 *   .to(new PushStoredChannelTransfer<number>())
 *   .finish(new PushStoredChannelTransfer<number>(), {
 *     owned: true
 *   });
 *
 * pipeline.subscribe(data => console.log(data));
 * pipeline.destroy();
 * ```
 */
export class OutputPipelineBuilder implements OutputPipelineBuilderInterface {
  private readonly _startTransfer: OutputTransfer<any>;
  private readonly _currentTransfer: DuplexTransfer<any, any>;
  private readonly _ownedResources: DisposableInterface[];

  private constructor(
    startTransfer: OutputTransfer<any>,
    currentTransfer: DuplexTransfer<unknown, unknown>,
    ownedResources: DisposableInterface[] = [],
  ) {
    this._startTransfer = startTransfer;
    this._currentTransfer = currentTransfer;
    this._ownedResources = ownedResources;
  }

  /**
   * Static method to create a builder with an initial output transfer.
   *
   * @param startTransfer — initial output transfer (OutputTransfer)
   * @returns A new OutputPipelineBuilder instance
   */
  public static start(startTransfer: OutputTransfer<unknown>): OutputPipelineBuilderInterface {
    return new OutputPipelineBuilder(
      startTransfer,
      startTransfer as DuplexTransfer<unknown, unknown>,
      [],
    ) as OutputPipelineBuilderInterface;
  }

  /**
   * Adds an intermediate duplex transfer to the pipeline chain.
   *
   * Mechanics:
   * 1. Links the current transfer to nextTransfer via linkTransfers()
   * 2. Creates a DisposableSubscriberAdapter to manage the subscription
   * 3. Adds the adapter (and optionally nextTransfer) to the owned resources array
   * 4. Returns a new builder with the updated chain
   *
   * @param nextTransfer — duplex transfer to add to the chain
   * @param owned — if true, nextTransfer will be destroyed on composite destroy()
   * @returns A new builder to continue the chain
   */
  public to(nextTransfer: DuplexTransfer<unknown, unknown>, owned?: boolean): OutputPipelineBuilderInterface {
    const subscriber = linkTransfers(this._currentTransfer, nextTransfer);
    const nextOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (owned) {
      nextOwnedResources.push(nextTransfer);
    }

    return new OutputPipelineBuilder(
      this._startTransfer,
      nextTransfer,
      nextOwnedResources
    );
  }

  /**
   * Completes the pipeline construction and creates a composite transfer.
   *
   * Mechanics:
   * 1. Links the last transfer in the chain to lastTransfer via linkTransfers()
   * 2. Creates a UniversalCompositeTransfer with input = startTransfer (muted to never), output = lastTransfer
   * 3. Adds all owned resources (intermediate transfers + adapters + optionally lastTransfer)
   * 4. Applies triggerable and gate options to the composite
   *
   * Options:
   * - triggerable — explicit trigger for the composite
   * - gate — explicit gate for flow control
   * - owned — if true, lastTransfer is added to owned resources
   *
   * @typeParam TFinishTransfer — final transfer type (must be DuplexTransfer)
   * @typeParam TTriggerable — trigger type (TriggerableInterface | undefined)
   * @typeParam TGate — gate type (GateInterface | undefined)
   * @param lastTransfer — final duplex transfer
   * @param options — completion options (triggerable, gate, owned)
   * @returns OutputCompositeTransfer with computed types
   */
  public finish<
    TFinishTransfer extends DuplexTransfer<any, any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      gate?: TGate;
      owned?: boolean;
    },
  ): CompositeOutputTransfer<OutputTransferDataType<TFinishTransfer>, TFinishTransfer, TTriggerable, undefined, TGate> {
    const subscriber = linkTransfers(this._currentTransfer as any, lastTransfer);
    const finalOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (options?.owned) {
      finalOwnedResources.push(lastTransfer);
    }

    const composite = new UniversalCompositeTransfer({
      input: this._startTransfer as any, // Mute the input side to never
      output: lastTransfer,
      owned: finalOwnedResources,
      triggerable: options?.triggerable,
      gate: options?.gate,
    });

    return composite as OutputTransfer<OutputTransferDataType<TFinishTransfer>> as CompositeOutputTransfer<OutputTransferDataType<TFinishTransfer>, TFinishTransfer, TTriggerable, undefined, TGate>;
  }
}

// ═══════════════════════════════════════════════════════════════
// DuplexPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing full-duplex pipelines (DuplexPipeline).
 *
 * Purpose:
 * Creates a composite transfer with a duplex interface (DuplexCompositeTransfer),
 * which supports both input (push) and output (pull/subscribe) operations.
 *
 * Pipeline structure:
 *   TStartTransfer [-> DuplexTransfer -> ... ->] -> TFinishTransfer
 *   │              │                                │
 *   └─ start()     └─ to()                          └─ finish()
 *
 * Where:
 * - TStartTransfer — initial duplex transfer (must be InputTransfer)
 * - DuplexTransfer — intermediate chain links (optional, via to())
 * - TFinishTransfer — final output transfer (OutputTransfer)
 *
 * Mechanics:
 * 1. start(startTransfer) — creates a builder with the initial duplex transfer
 * 2. to(nextTransfer, owned?) — adds an intermediate duplex transfer to the chain,
 *    linking it to the previous one via linkTransfers()
 * 3. finish(lastTransfer, options?) — completes the pipeline, creating a UniversalCompositeTransfer
 *
 * finish() options:
 * - triggerable?: TriggerableInterface — explicit trigger for the composite
 * - gate?: GateInterface — explicit gate for flow control
 * - owned?: boolean — whether to destroy lastTransfer on composite destroy()
 *
 * The owned parameter in to():
 * - owned = true — the intermediate transfer is added to the owned resources array
 *   and will be destroyed on composite destroy()
 * - owned = false (default) — the transfer is not destroyed automatically
 *
 * Data types:
 * - Composite input type = InputTransferDataType<TStartTransfer>
 * - Composite output type = OutputTransferDataType<TFinishTransfer>
 *
 * Use cases:
 * - Building a bidirectional data processing pipeline
 * - Data transformation with both push and pull operations
 * - Creating intermediate nodes for complex pipeline architectures
 *
 * @example
 * ```typescript
 * const pipeline = DuplexPipelineBuilder
 *   .start(new PushStoredChannelTransfer<number>())
 *   .to(new ConditionTransfer<number>(x => x > 0))
 *   .to(new PushStoredChannelTransfer<number>())
 *   .finish(new PushStoredChannelTransfer<number>(), {
 *     owned: true
 *   });
 *
 * // Push data
 * pipeline.push(42);
 *
 * // Subscribe to output data
 * pipeline.subscribe(data => console.log(data));
 *
 * // Pull data
 * const value = pipeline.pull();
 *
 * pipeline.destroy();
 * ```
 *
 * @typeParam TCurrent — data type of the current chain link
 * @typeParam TStartTransfer — type of the initial transfer (must be InputTransfer)
 */
export class DuplexPipelineBuilder<
  TCurrent,
  TStartTransfer extends InputTransfer<any>
> implements DuplexPipelineBuilderInterface<TCurrent, TStartTransfer> {
  private readonly _startTransfer: TStartTransfer;
  private readonly _currentTransfer: DuplexTransfer<any, TCurrent>;
  private readonly _ownedResources: DisposableInterface[];

  private constructor(
    startTransfer: TStartTransfer,
    currentTransfer: DuplexTransfer<any, TCurrent>,
    ownedResources: DisposableInterface[] = [],
  ) {
    this._startTransfer = startTransfer;
    this._currentTransfer = currentTransfer;
    this._ownedResources = ownedResources;
  }

  /**
   * Static method to create a builder with an initial duplex transfer.
   *
   * @typeParam TCurrent — data type of the initial transfer
   * @typeParam TStartTransfer — type of the initial transfer (must be DuplexTransfer)
   * @param startTransfer — initial duplex transfer
   * @returns A new DuplexPipelineBuilder instance
   */
  public static start<TCurrent, TStartTransfer extends DuplexTransfer<any, TCurrent>>(
    startTransfer: TStartTransfer,
  ): DuplexPipelineBuilderInterface<TCurrent, TStartTransfer> {
    return new DuplexPipelineBuilder<TCurrent, TStartTransfer>(startTransfer, startTransfer, []);
  }

  /**
   * Adds an intermediate duplex transfer to the pipeline chain.
   *
   * Mechanics:
   * 1. Links the current transfer to nextTransfer via linkTransfers()
   * 2. Creates a DisposableSubscriberAdapter to manage the subscription
   * 3. Adds the adapter (and optionally nextTransfer) to the owned resources array
   * 4. Returns a new builder with the updated chain
   *
   * @typeParam TNext — data type of the next transfer
   * @param nextTransfer — duplex transfer to add to the chain
   * @param owned — if true, nextTransfer will be destroyed on composite destroy()
   * @returns A new builder with the updated TNext type
   */
  public to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): DuplexPipelineBuilderInterface<TNext, TStartTransfer> {
    const subscriber = linkTransfers(this._currentTransfer, nextTransfer);
    const nextOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (owned) {
      nextOwnedResources.push(nextTransfer);
    }

    return new DuplexPipelineBuilder<TNext, TStartTransfer>(
      this._startTransfer,
      nextTransfer,
      nextOwnedResources
    );
  }

  /**
   * Completes the pipeline construction and creates a full-duplex composite transfer.
   *
   * Mechanics:
   * 1. Links the last transfer in the chain to lastTransfer via linkTransfers()
   * 2. Creates a UniversalCompositeTransfer with input = startTransfer, output = lastTransfer
   * 3. Adds all owned resources (intermediate transfers + adapters + optionally lastTransfer)
   * 4. Applies triggerable and gate options to the composite
   *
   * Options:
   * - triggerable — explicit trigger for the composite (overrides extraction from input/output)
   * - gate — explicit gate for flow control (overrides extraction from input/output)
   * - owned — if true, lastTransfer is added to owned resources
   *
   * @typeParam TFinishTransfer — final transfer type (must be OutputTransfer)
   * @typeParam TTriggerable — trigger type (TriggerableInterface | undefined)
   * @typeParam TGate — gate type (GateInterface | undefined)
   * @param lastTransfer — final output transfer
   * @param options — completion options (triggerable, gate, owned)
   * @returns DuplexCompositeTransfer with computed input and output types
   */
  public finish<
    TFinishTransfer extends DuplexTransfer<any, any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      gate?: TGate;
      owned?: boolean;
    },
  ): CompositeDuplexTransfer<
    InputTransferDataType<TStartTransfer>,
    OutputTransferDataType<TFinishTransfer>,
    TStartTransfer,
    TFinishTransfer,
    TTriggerable,
    undefined,
    TGate
  > {
    const subscriber = linkTransfers(this._currentTransfer, lastTransfer as any);
    const finalOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (options?.owned) {
      finalOwnedResources.push(lastTransfer);
    }

    // Extract data types for input and output via utility types
    type TStartData = InputTransferDataType<TStartTransfer>;
    type TFinishData = OutputTransferDataType<TFinishTransfer>;

    // Create the full-duplex composite instance
    const composite = new UniversalCompositeTransfer<TStartData, TFinishData>({
      input: this._startTransfer,
      output: lastTransfer,
      owned: finalOwnedResources,
      triggerable: options?.triggerable,
      gate: options?.gate,
    });

    // Signature double cast to pass compiler checks and keep the client IDE clean
    return composite as DuplexTransfer<TStartData, TFinishData> as CompositeDuplexTransfer<
      TStartData,
      TFinishData,
      TStartTransfer,
      TFinishTransfer,
      TTriggerable,
      undefined,
      TGate
    >;
  }
}

// ═══════════════════════════════════════════════════════════════
// OperatorPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing operator pipelines (OperatorPipeline).
 *
 * Purpose:
 * Creates a PipelineOperator — a sequential chain of operators,
 * where the output of each previous operator becomes the input of the next.
 *
 * Pipeline structure:
 *   Operator<T0, T1> -> Operator<T1, T2> -> ... -> Operator<Tn-1, Tn>
 *
 * Where:
 * - Operator<TInput, TOutput> — operator with strict input/output types
 * - TFlow — tuple of types [T0, T1, T2, ..., Tn] representing the entire pipeline
 *
 * Mechanics:
 * 1. create() — creates an empty builder
 * 2. add(operator) — adds an operator to the chain with type checking:
 *    - For an empty builder: accepts any Operator<TInput, TOutput>
 *    - For a filled builder: requires Operator<Last<TFlow>, TNext>
 * 3. build() — creates a PipelineOperator from the accumulated operators
 *
 * Data types:
 * - TFlow — tuple of data flow types through the pipeline
 * - First<TFlow> — input type of the first operator
 * - Last<TFlow> — output type of the last operator
 *
 * Difference from Input/Output/DuplexPipelineBuilder:
 * - Works with OperatorInterface, not TransferInterface
 * - Does not use linkTransfers() — operators execute sequentially
 * - Does not create a composite transfer — returns PipelineOperator
 * - No owned resource management — operators are not destroyed automatically
 *
 * Use cases:
 * - Sequential data transformation through a chain of functions
 * - Building ETL pipelines (Extract-Transform-Load)
 * - Composition of pure functions with typing
 *
 * @example
 * ```typescript
 * const operator = OperatorPipelineBuilder
 *   .create()
 *   .add(new MapOperator<number, string>(x => x.toString()))
 *   .add(new FilterOperator<string>(s => s.length > 0))
 *   .add(new ParseOperator<string, number>(s => parseInt(s, 10)))
 *   .build();
 *
 * const result = operator.apply(42);
 * ```
 *
 * @typeParam TFlow — tuple of types [TInput0, TOutput1, TOutput2, ..., TOutputN]
 */
export class OperatorPipelineBuilder<TFlow extends readonly unknown[]> implements OperatorPipelineBuilderInterface<TFlow> {
  private readonly _operators: OperatorInterface<unknown, unknown>[] = []

  constructor(operators: OperatorInterface<unknown, unknown>[]) {
    this._operators = operators;
  }

  /**
   * Static method to create an empty builder.
   *
   * @returns A new OperatorPipelineBuilder instance with an empty tuple []
   */
  public static create(): OperatorPipelineBuilder<[]> {
    return new OperatorPipelineBuilder<[]>([]);
  }

  /**
   * Adds an operation to the pipeline. Supports two modes:
   * 1. If the pipeline is empty, accepts any operator and sets the initial/final type.
   * 2. If the pipeline already has steps, strictly requires that the input of the new operator matches Last<TFlow>.
   *
   * @typeParam TInput — operator input type
   * @typeParam TOutput — operator output type
   * @param operator — operator to add to the chain
   * @returns A new builder with the updated type tuple
   */
  public add<TInput, TOutput>(
    this: OperatorPipelineBuilder<[]>,
    operator: OperatorInterface<TInput, TOutput>
  ): OperatorPipelineBuilder<[TInput, TOutput]>;

  /**
   * Adds an operator whose input matches the output of the previous one.
   *
   * @typeParam TNext — output type of the new operator
   * @param operator — operator to add to the chain
   * @returns A new builder with the extended type tuple
   */
  public add<TNext>(
    this: OperatorPipelineBuilder<TFlow>,
    operator: OperatorInterface<Last<TFlow>, TNext>
  ): OperatorPipelineBuilder<[...TFlow, TNext]>;

  add(operator: OperatorInterface<unknown, unknown>): OperatorPipelineBuilder<readonly unknown[]> {
    return new OperatorPipelineBuilder<readonly unknown[]>([
      ...this._operators,
      operator
    ]);
  }

  /**
   * Builds the final standalone PipelineOperator.
   * This method is only available if at least one operator has been added to the builder.
   *
   * @returns PipelineOperator with types [First<TFlow>, Last<TFlow>]
   */
  build(this: OperatorPipelineBuilder<readonly [unknown, ...unknown[]]>): PipelineOperator<First<TFlow>, Last<TFlow>> {
    return new PipelineOperator<First<TFlow>, Last<TFlow>>(this._operators);
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncInputPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing input pipelines with async transfer support.
 *
 * Differences from InputPipelineBuilder:
 * - linkTransfers is called with LinkConfig (onError for async-push rejection)
 * - finish() accepts asyncTriggerable in addition to triggerable
 * - asyncTriggerable is passed to UniversalCompositeTransfer
 *
 * @typeParam TCurrent — data type of the current chain link
 * @typeParam TStartTransfer — type of the initial transfer (must be InputTransfer)
 */
export class AsyncInputPipelineBuilder<
  TCurrent,
  TStartTransfer extends InputTransfer<any>
> implements AsyncInputPipelineBuilderInterface<TCurrent, TStartTransfer> {
  private readonly _startTransfer: TStartTransfer;
  private readonly _currentTransfer: DuplexTransfer<any, TCurrent>;
  private readonly _ownedResources: DisposableInterface[];

  private constructor(
    startTransfer: TStartTransfer,
    currentTransfer: DuplexTransfer<any, TCurrent>,
    ownedResources: DisposableInterface[] = [],
  ) {
    this._startTransfer = startTransfer;
    this._currentTransfer = currentTransfer;
    this._ownedResources = ownedResources;
  }

  public static start<TCurrent, TStartTransfer extends DuplexTransfer<any, TCurrent>>(
    startTransfer: TStartTransfer,
  ): AsyncInputPipelineBuilderInterface<TCurrent, TStartTransfer> {
    return new AsyncInputPipelineBuilder<TCurrent, TStartTransfer>(startTransfer, startTransfer, []);
  }

  public to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): AsyncInputPipelineBuilderInterface<TNext, TStartTransfer> {
    const subscriber = linkTransfers(this._currentTransfer, nextTransfer);
    const nextOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (owned) {
      nextOwnedResources.push(nextTransfer);
    }

    return new AsyncInputPipelineBuilder<TNext, TStartTransfer>(
      this._startTransfer,
      nextTransfer,
      nextOwnedResources
    );
  }

  public finish<
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TAsyncTriggerable extends AsyncTriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: InputTransfer<TCurrent>,
    options?: {
      triggerable?: TTriggerable;
      asyncTriggerable?: TAsyncTriggerable;
      gate?: TGate;
      owned?: boolean;
      linkOnError?: ErrorHandler;
    },
  ): CompositeInputTransfer<InputTransferDataType<TStartTransfer>, TStartTransfer, TTriggerable, TAsyncTriggerable, TGate> {
    const linkConfig: LinkConfig | undefined = options?.linkOnError !== undefined
      ? { onError: options.linkOnError }
      : undefined;

    const subscriber = linkTransfers(this._currentTransfer, lastTransfer, linkConfig);
    const finalOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (options?.owned) {
      finalOwnedResources.push(lastTransfer);
    }

    const composite = new UniversalCompositeTransfer<InputTransferDataType<TStartTransfer>, never>({
      input: this._startTransfer,
      output: lastTransfer as any,
      owned: finalOwnedResources,
      triggerable: options?.triggerable,
      asyncTriggerable: options?.asyncTriggerable,
      gate: options?.gate,
    });

    return composite as InputTransfer<InputTransferDataType<TStartTransfer>> as CompositeInputTransfer<InputTransferDataType<TStartTransfer>, TStartTransfer, TTriggerable, TAsyncTriggerable, TGate>;
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncOutputPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing output pipelines with async transfer support.
 *
 * Differences from OutputPipelineBuilder:
 * - linkTransfers is called with LinkConfig (onError for async-push rejection)
 * - finish() accepts asyncTriggerable in addition to triggerable
 */
export class AsyncOutputPipelineBuilder implements AsyncOutputPipelineBuilderInterface {
  private readonly _startTransfer: OutputTransfer<any>;
  private readonly _currentTransfer: DuplexTransfer<any, any>;
  private readonly _ownedResources: DisposableInterface[];

  private constructor(
    startTransfer: OutputTransfer<any>,
    currentTransfer: DuplexTransfer<unknown, unknown>,
    ownedResources: DisposableInterface[] = [],
  ) {
    this._startTransfer = startTransfer;
    this._currentTransfer = currentTransfer;
    this._ownedResources = ownedResources;
  }

  public static start(startTransfer: OutputTransfer<unknown>): AsyncOutputPipelineBuilderInterface {
    return new AsyncOutputPipelineBuilder(
      startTransfer,
      startTransfer as DuplexTransfer<unknown, unknown>,
      [],
    ) as AsyncOutputPipelineBuilderInterface;
  }

  public to(
    nextTransfer: DuplexTransfer<unknown, unknown>,
    owned?: boolean,
  ): AsyncOutputPipelineBuilderInterface {
    const subscriber = linkTransfers(this._currentTransfer, nextTransfer);
    const nextOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (owned) {
      nextOwnedResources.push(nextTransfer);
    }

    return new AsyncOutputPipelineBuilder(
      this._startTransfer,
      nextTransfer,
      nextOwnedResources
    ) as AsyncOutputPipelineBuilderInterface;
  }

  public finish<
    TFinishTransfer extends DuplexTransfer<any, any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TAsyncTriggerable extends AsyncTriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      asyncTriggerable?: TAsyncTriggerable;
      gate?: TGate;
      owned?: boolean;
      linkOnError?: ErrorHandler;
    },
  ): CompositeOutputTransfer<OutputTransferDataType<TFinishTransfer>, TFinishTransfer, TTriggerable, TAsyncTriggerable, TGate> {
    const linkConfig: LinkConfig | undefined = options?.linkOnError !== undefined
      ? { onError: options.linkOnError }
      : undefined;

    const subscriber = linkTransfers(this._currentTransfer as any, lastTransfer, linkConfig);
    const finalOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (options?.owned) {
      finalOwnedResources.push(lastTransfer);
    }

    const composite = new UniversalCompositeTransfer({
      input: this._startTransfer as any,
      output: lastTransfer,
      owned: finalOwnedResources,
      triggerable: options?.triggerable,
      asyncTriggerable: options?.asyncTriggerable,
      gate: options?.gate,
    });

    return composite as OutputTransfer<OutputTransferDataType<TFinishTransfer>> as CompositeOutputTransfer<OutputTransferDataType<TFinishTransfer>, TFinishTransfer, TTriggerable, TAsyncTriggerable, TGate>;
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncDuplexPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing full-duplex pipelines with async transfer support.
 *
 * Differences from DuplexPipelineBuilder:
 * - linkTransfers is called with LinkConfig (onError for async-push rejection)
 * - finish() accepts asyncTriggerable in addition to triggerable
 *
 * @typeParam TCurrent — data type of the current chain link
 * @typeParam TStartTransfer — type of the initial transfer (must be InputTransfer)
 */
export class AsyncDuplexPipelineBuilder<
  TCurrent,
  TStartTransfer extends InputTransfer<any>
> implements AsyncDuplexPipelineBuilderInterface<TCurrent, TStartTransfer> {
  private readonly _startTransfer: TStartTransfer;
  private readonly _currentTransfer: DuplexTransfer<any, TCurrent>;
  private readonly _ownedResources: DisposableInterface[];

  private constructor(
    startTransfer: TStartTransfer,
    currentTransfer: DuplexTransfer<any, TCurrent>,
    ownedResources: DisposableInterface[] = [],
  ) {
    this._startTransfer = startTransfer;
    this._currentTransfer = currentTransfer;
    this._ownedResources = ownedResources;
  }

  public static start<TStart extends InputTransfer<any>>(
    startTransfer: TStart,
  ): AsyncDuplexPipelineBuilderInterface<InputTransferDataType<TStart>, TStart> {
    return new AsyncDuplexPipelineBuilder<InputTransferDataType<TStart>, TStart>(
      startTransfer,
      startTransfer as any, // Приведение к any безопасно, так как на старте это дуплекс-точка
      []
    );
  }

  public to<TNext>(
    nextTransfer: DuplexTransfer<TCurrent, TNext>,
    owned?: boolean,
  ): AsyncDuplexPipelineBuilderInterface<TNext, TStartTransfer> {
    const subscriber = linkTransfers(this._currentTransfer, nextTransfer);
    const nextOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (owned) {
      nextOwnedResources.push(nextTransfer);
    }

    return new AsyncDuplexPipelineBuilder<TNext, TStartTransfer>(
      this._startTransfer,
      nextTransfer,
      nextOwnedResources
    );
  }

  public finish<
    TFinishTransfer extends DuplexTransfer<any, any>,
    TTriggerable extends TriggerableInterface | undefined = undefined,
    TAsyncTriggerable extends AsyncTriggerableInterface | undefined = undefined,
    TGate extends GateInterface | undefined = undefined,
  >(
    lastTransfer: TFinishTransfer,
    options?: {
      triggerable?: TTriggerable;
      asyncTriggerable?: TAsyncTriggerable;
      gate?: TGate;
      owned?: boolean;
      linkOnError?: ErrorHandler;
    },
  ): CompositeDuplexTransfer<
    InputTransferDataType<TStartTransfer>,
    OutputTransferDataType<TFinishTransfer>,
    TStartTransfer,
    TFinishTransfer,
    TTriggerable,
    TAsyncTriggerable,
    TGate
  > {
    const linkConfig: LinkConfig | undefined = options?.linkOnError !== undefined
      ? { onError: options.linkOnError }
      : undefined;

    const subscriber = linkTransfers(this._currentTransfer, lastTransfer as any, linkConfig);
    const finalOwnedResources = [new DisposableSubscriberAdapter(subscriber), ...this._ownedResources];

    if (options?.owned) {
      finalOwnedResources.push(lastTransfer);
    }

    type TStartData = InputTransferDataType<TStartTransfer>;
    type TFinishData = OutputTransferDataType<TFinishTransfer>;

    const composite = new UniversalCompositeTransfer<TStartData, TFinishData>({
      input: this._startTransfer,
      output: lastTransfer,
      owned: finalOwnedResources,
      triggerable: options?.triggerable,
      asyncTriggerable: options?.asyncTriggerable,
      gate: options?.gate,
    });

    return composite as DuplexTransfer<TStartData, TFinishData> as CompositeDuplexTransfer<
      TStartData,
      TFinishData,
      TStartTransfer,
      TFinishTransfer,
      TTriggerable,
      TAsyncTriggerable,
      TGate
    >;
  }
}

// ═══════════════════════════════════════════════════════════════
// AsyncOperatorPipelineBuilder
// ═══════════════════════════════════════════════════════════════
/**
 * Builder for constructing operator pipelines with async operator support.
 *
 * Differences from OperatorPipelineBuilder:
 * - add() accepts OperatorInterface | AsyncOperatorInterface
 * - build() returns AsyncPipelineOperator
 *
 * @typeParam TFlow — tuple of types [TInput0, TOutput1, TOutput2, ..., TOutputN]
 */
export class AsyncOperatorPipelineBuilder<TFlow extends readonly unknown[]> implements AsyncOperatorPipelineBuilderInterface<TFlow> {
  private readonly _operators: (OperatorInterface<unknown, unknown> | AsyncOperatorInterface<unknown, unknown>)[] = [];

  constructor(operators: (OperatorInterface<unknown, unknown> | AsyncOperatorInterface<unknown, unknown>)[]) {
    this._operators = operators;
  }

  public static create(): AsyncOperatorPipelineBuilder<[]> {
    return new AsyncOperatorPipelineBuilder<[]>([]);
  }

  public add<TInput, TOutput>(
    this: AsyncOperatorPipelineBuilder<[]>,
    operator: AsyncOperatorInterface<TInput, TOutput>
  ): AsyncOperatorPipelineBuilder<[TInput, TOutput]>;

  public add<TInput, TOutput>(
    this: AsyncOperatorPipelineBuilder<[]>,
    operator: OperatorInterface<TInput, TOutput>
  ): AsyncOperatorPipelineBuilder<[TInput, TOutput]>;

  public add<TNext>(
    this: AsyncOperatorPipelineBuilder<TFlow>,
    operator: AsyncOperatorInterface<Last<TFlow>, TNext>
  ): AsyncOperatorPipelineBuilder<[...TFlow, TNext]>;

  public add<TNext>(
    this: AsyncOperatorPipelineBuilder<TFlow>,
    operator: OperatorInterface<Last<TFlow>, TNext>
  ): AsyncOperatorPipelineBuilder<[...TFlow, TNext]>;

  add(operator: OperatorInterface<unknown, unknown> | AsyncOperatorInterface<unknown, unknown>): AsyncOperatorPipelineBuilder<readonly unknown[]> {
    return new AsyncOperatorPipelineBuilder<readonly unknown[]>([
      ...this._operators,
      operator
    ]);
  }

  build(this: AsyncOperatorPipelineBuilder<readonly [unknown, ...unknown[]]>): AsyncPipelineOperator<First<TFlow>, Last<TFlow>> {
    return new AsyncPipelineOperator<First<TFlow>, Last<TFlow>>(this._operators as AsyncOperatorInterface<unknown, unknown>[]);
  }
}
