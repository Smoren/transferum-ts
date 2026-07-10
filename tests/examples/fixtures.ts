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
