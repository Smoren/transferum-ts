/**
 * Fixtures and helpers for README examples tests.
 * Provides common mocks, test utilities, and type helpers.
 */

import { jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// Common Mock Functions
// ═══════════════════════════════════════════════════════════════

/** Creates a mock callback that records all calls. */
export function createMockCallback<T = unknown>() {
  const mock = jest.fn<(data: T) => void>();
  return {
    mock,
    calls: () => mock.mock.calls as [T][],
    lastCall: () => mock.mock.calls[mock.mock.calls.length - 1]?.[0],
    callCount: () => mock.mock.calls.length,
    wasCalled: () => mock.mock.calls.length > 0,
    wasCalledWith: (expected: T) => {
      return mock.mock.calls.some(([arg]) => arg === expected || JSON.stringify(arg) === JSON.stringify(expected));
    },
  };
}

/** Creates a mock fetcher that returns predefined values. */
export function createMockFetcher<T>(values: T[], callCount = 0) {
  let index = 0;
  const mock = jest.fn<() => T | undefined>(() => {
    if (index < values.length) {
      return values[index++];
    }
    return undefined;
  });
  return { mock, values, index: () => index };
}

/** Creates a mock async fetcher that returns predefined values. */
export function createMockAsyncFetcher<T>(values: T[]) {
  let index = 0;
  const mock = jest.fn<() => Promise<T | undefined>>(async () => {
    if (index < values.length) {
      return values[index++];
    }
    return undefined;
  });
  return { mock, values, index: () => index };
}

// ═══════════════════════════════════════════════════════════════
// Test Data Generators
// ═══════════════════════════════════════════════════════════════

export const testNumbers = [1, 2, 3, 42, 100];
export const testStrings = ['hello', 'world', 'test', 'answer'];
export const testObjects = [
  { id: 1, name: 'first' },
  { id: 2, name: 'second' },
  { id: 3, name: 'third' },
];

// ═══════════════════════════════════════════════════════════════
// Async Test Helpers
// ═══════════════════════════════════════════════════════════════

/** Waits for a condition to be true with timeout. */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 10,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}

/** Waits for a specific duration. */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// Type Helpers for Tests
// ═══════════════════════════════════════════════════════════════

export type ServerState = { id: number; status: string };
export type ViewModel = { id: number; displayStatus: string };
export type SensorData = { temperature: number; humidity: number };
export type UserAction = { type: string; payload?: unknown };
export type CachedState = { data: string; timestamp: number };
export type UnifiedState = SensorData & { userAction?: UserAction; cached?: CachedState };
export type FeedItem = { id: number; content: string };
export type GameState = { score: number; level: number };
export type InputEvent = { type: string; key?: string; x?: number; y?: number };
export type GameCommand = { action: string; params?: Record<string, unknown> };
export type PhysicsEvent = { type: string; force: number };
export type Alert = { type: string; value: number };
export type ComponentState = { loading: boolean; data: unknown | null };
export type UIEvent = { type: string; target: string };
export type Metric = { name: string; value: number };
export type LogEntry = { level: 'INFO' | 'WARN' | 'ERROR'; message: string; timestamp: number };
export type Quote = { symbol: string; price: number; timestamp: number };
export type TechnicalIndicator = { value: number; threshold: number };
export type TradingSignal = { action: 'BUY' | 'SELL'; symbol: string; price: number };
export type ValidationResult = { valid: boolean; message?: string };
export type RawData = { raw: string };
export type ProcessedData = { processed: string };
export type Telemetry = { name: string; value: number };

// ═══════════════════════════════════════════════════════════════
// Helper Functions for Examples
// ═══════════════════════════════════════════════════════════════

export function toViewModel(state: ServerState): ViewModel {
  return {
    id: state.id,
    displayStatus: state.status.toUpperCase(),
  };
}

export function eventToCommand(event: InputEvent): GameCommand {
  return {
    action: event.type,
    params: event.key ? { key: event.key } : event.x !== undefined ? { x: event.x, y: event.y } : undefined,
  };
}

export function detectAnomaly(log: LogEntry): boolean {
  return log.level === 'ERROR' || log.message.includes('anomaly');
}

export async function validate(s: string): Promise<{ valid: boolean; message?: string }> {
  if (s.length === 0) {
    return { valid: false, message: 'Empty string' };
  }
  return { valid: true };
}

export async function searchAPI(query: string): Promise<{ id: number; title: string }[]> {
  return [
    { id: 1, title: `Result for: ${query}` },
    { id: 2, title: `Another result: ${query}` },
  ];
}

export async function check(n: number): Promise<{ valid: boolean }> {
  return { valid: n > 0 };
}
