import type { CommunicationContractInterface } from "./interfaces";
import type {
  Pushable,
  Pullable,
  Subscribable,
  PollingProxy,
  Triggerable,
  Gate,
  AsyncPushable,
  AsyncPullable,
  AsyncPollingProxy,
  AsyncTriggerable,
} from "./types";

/**
 * Type guard: narrows a transfer to `Pushable<T>` when `isPushable` is true.
 *
 * @category Guards
 */
export function isPushable<T>(contract: CommunicationContractInterface): contract is CommunicationContractInterface & Pushable<T> {
  return contract.isPushable;
}

/**
 * Type guard: narrows a transfer to `Pullable<T>` when `isPullable` is true.
 *
 * @category Guards
 */
export function isPullable<T>(contract: CommunicationContractInterface): contract is CommunicationContractInterface & Pullable<T> {
  return contract.isPullable;
}

/**
 * Type guard: narrows a transfer to `Subscribable<T>` when `isSubscribable` is true.
 *
 * @category Guards
 */
export function isSubscribable<T>(contract: CommunicationContractInterface): contract is CommunicationContractInterface & Subscribable<T> {
  return contract.isSubscribable;
}

/**
 * Type guard: narrows a transfer to `PollingProxy<T>` when `isPollingProxy` is true.
 *
 * @category Guards
 */
export function isPollingProxy<T>(contract: CommunicationContractInterface): contract is CommunicationContractInterface & PollingProxy<T> {
  return contract.isPollingProxy;
}

/**
 * Type guard: narrows a transfer to `Triggerable` when `isTriggerable` is true.
 *
 * @category Guards
 */
export function isTriggerable(contract: CommunicationContractInterface): contract is CommunicationContractInterface & Triggerable {
  return contract.isTriggerable;
}

/**
 * Type guard: narrows a transfer to `Gate` when `isGate` is true.
 *
 * @category Guards
 */
export function isGate(contract: CommunicationContractInterface): contract is CommunicationContractInterface & Gate {
  return contract.isGate;
}

/**
 * Type guard: narrows a transfer to `AsyncPushable<T>` when `isAsyncPushable` is true.
 *
 * @category Guards
 */
export function isAsyncPushable<T>(contract: CommunicationContractInterface): contract is CommunicationContractInterface & AsyncPushable<T> {
  return contract.isAsyncPushable;
}

/**
 * Type guard: narrows a transfer to `AsyncPullable<T>` when `isAsyncPullable` is true.
 *
 * @category Guards
 */
export function isAsyncPullable<T>(contract: CommunicationContractInterface): contract is CommunicationContractInterface & AsyncPullable<T> {
  return contract.isAsyncPullable;
}

/**
 * Type guard: narrows a transfer to `AsyncPollingProxy<T>` when `isAsyncPollingProxy` is true.
 *
 * @category Guards
 */
export function isAsyncPollingProxy<T>(contract: CommunicationContractInterface): contract is CommunicationContractInterface & AsyncPollingProxy<T> {
  return contract.isAsyncPollingProxy;
}

/**
 * Type guard: narrows a transfer to `AsyncTriggerable` when `isAsyncTriggerable` is true.
 *
 * @category Guards
 */
export function isAsyncTriggerable(contract: CommunicationContractInterface): contract is CommunicationContractInterface & AsyncTriggerable {
  return contract.isAsyncTriggerable;
}
