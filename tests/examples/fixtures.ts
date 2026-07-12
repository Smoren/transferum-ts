/**
 * Fixtures and helpers for README examples tests.
 * Provides common mocks, test utilities, and type helpers.
 */

// ═══════════════════════════════════════════════════════════════
// Async Test Helpers
// ═══════════════════════════════════════════════════════════════

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
export type SensorReading = { sensor: string; value: number };
export type SensorState = { temperature: number };
export type KeyInput = { code: string };
export type Alert = { type: string; value: number };
export type Metric = { name: string; value: number };
export type LogEntry = { level: 'INFO' | 'WARN' | 'ERROR'; message: string; timestamp: number };
export type Quote = { symbol: string; price: number; timestamp: number };
export type TechnicalIndicator = { value: number; symbols: string[]; threshold: number };
export type TradingSignal = { action: string; symbols: string[]; targetPrice: number };
export type ValidationResult = { valid: boolean; message?: string };
export type RawData = { raw: string };
export type ProcessedData = { processed: string };
export type Telemetry = { name: string; value: number };
export type SearchResult = { id: number; title: string };

// ═══════════════════════════════════════════════════════════════
// Helper Functions for Examples
// ═══════════════════════════════════════════════════════════════

export function toViewModel(state: ServerState): ViewModel {
  return {
    id: state.id,
    displayStatus: state.status.toUpperCase(),
  };
}

export async function validate(s: string): Promise<{ valid: boolean; message?: string }> {
  if (s.length === 0) {
    return { valid: false, message: 'Empty string' };
  }
  return { valid: true };
}
