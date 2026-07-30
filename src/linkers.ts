import type {
  CompositeTransferBuilderInterface,
  LinkerInterface,
  SubscriberInterface,
} from "./interfaces";
import type { InputTransfer, OutputTransfer, OutputTransferDataType } from "./types";
import type { LinkConfig } from "./configs";
import { linkTransfers } from "./utils";
import { CompositeTransferBuilder } from "./builders";

export class DefaultLinker implements LinkerInterface {
  public link<T, RTransfer extends InputTransfer<T>>(
    lhs: OutputTransfer<T>,
    rhs: RTransfer,
    options?: LinkConfig<RTransfer>,
  ): SubscriberInterface {
    return linkTransfers(lhs, rhs, options);
  }

  public start<TStartTransfer extends OutputTransfer<unknown>>(startTransfer: TStartTransfer): CompositeTransferBuilderInterface<OutputTransferDataType<TStartTransfer>, TStartTransfer> {
    return CompositeTransferBuilder.start(startTransfer, this);
  }
}
