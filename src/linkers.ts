import type {
  CompositeTransferBuilderInterface,
  LinkerInterface,
  SubscriberInterface,
} from "./interfaces";
import type { InputTransfer, OutputTransfer, OutputTransferDataType } from "./types";
import type { LinkConfig } from "./configs";
import { linkTransfers } from "./utils";
import { CompositeTransferBuilder } from "./builders";

/**
 * Default implementation of {@link LinkerInterface}.
 *
 * Provides the standard linking behavior:
 * - `link()` delegates to {@link linkTransfers} from `utils.ts`
 * - `start()` creates a {@link CompositeTransferBuilder} with `this` injected as the linker
 *
 * @example
 * ```typescript
 * const linker = new DefaultLinker();
 *
 * // Direct linking
 * const subscriber = linker.link(source, target);
 *
 * // Builder-based linking
 * const pipeline = linker
 *   .start(source)
 *   .to(intermediate)
 *   .finish(sink);
 * ```
 *
 * @category Linkers
 */
export class DefaultLinker implements LinkerInterface {
  /**
   * Links an output transfer to an input transfer via {@link linkTransfers}.
   *
   * @typeParam T — data type flowing through the link
   * @typeParam RTransfer — type of the input transfer (RHS)
   * @param lhs — output transfer (source)
   * @param rhs — input transfer (sink)
   * @param options — optional link config (onError for async-push rejection)
   * @returns SubscriberInterface for breaking the link
   */
  public link<T, RTransfer extends InputTransfer<T>>(
    lhs: OutputTransfer<T>,
    rhs: RTransfer,
    options?: LinkConfig<RTransfer>,
  ): SubscriberInterface {
    return linkTransfers(lhs, rhs, options);
  }

  /**
   * Creates a {@link CompositeTransferBuilder} with this linker injected,
   * so that every `to()` and `finish()` call uses this linker's `link()` method.
   *
   * @typeParam TStartTransfer — type of the initial transfer (must be OutputTransfer)
   * @param startTransfer — initial output transfer
   * @returns A new CompositeTransferBuilder instance with this linker injected
   */
  public start<TStartTransfer extends OutputTransfer<unknown>>(startTransfer: TStartTransfer): CompositeTransferBuilderInterface<OutputTransferDataType<TStartTransfer>, TStartTransfer> {
    return CompositeTransferBuilder.start(startTransfer, this);
  }
}
