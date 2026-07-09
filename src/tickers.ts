import type { TickerInterface } from "./interfaces";
import type { TickerCallback, TickerFactory } from "./types";
import type { TickerConfig } from "./configs";

/**
 * Ticker based on requestAnimationFrame with a configurable interval.
 * Optimized for browser environments. Falls back to setTimeout when RAF is unavailable.
 *
 * Key features:
 * - Leading edge: the first callback is invoked in the first frame (via _startTime offset)
 * - Safe stop() inside callback: _startTime is recalculated BEFORE calling callback
 * - If callback calls stop() synchronously, the frame is not rescheduled
 */
export class RAFTicker implements TickerInterface {
  private readonly _callback: TickerCallback;
  private _interval: number;
  private _rafId: number | null = null;
  private _startTime: number | null = null;

  public static get factory(): TickerFactory {
    return (config: TickerConfig) => new RAFTicker(config);
  }

  constructor(config: TickerConfig) {
    this._callback = config.callback;
    this._interval = config.interval ?? 0;
  }

  public start(): void {
    // Add a strict active guard, as in IntervalTicker
    if (this.active) {
      return;
    }

    const loopZeroDelay = (): void => {
      this._callback();
      this._rafId = RAFTicker._raf(loopZeroDelay);
    };

    const loopWithDelay = (timestamp: number): void => {
      if (this._startTime === null) {
        // Artificially shift the start backward for the leading-edge call
        this._startTime = timestamp - this._interval;
      }

      const elapsed = timestamp - this._startTime;

      if (elapsed >= this._interval) {
        // Compute the next checkpoint BEFORE calling callback for the same reason:
        // so that callback can safely call stop() inside itself
        this._startTime = timestamp - (elapsed % this._interval);
        this._callback();
      }

      // Reschedule the frame only if callback did not call stop() synchronously
      if (this.active) {
        this._rafId = RAFTicker._raf(loopWithDelay);
      }
    };

    this._rafId = this._interval === 0
      ? RAFTicker._raf(loopZeroDelay)
      : RAFTicker._raf(loopWithDelay);
  }

  public stop(): void {
    if (this._rafId !== null) {
      RAFTicker._caf(this._rafId);
      this._rafId = null;
      this._startTime = null;
    }
  }

  public restart(): void {
    this.stop();
    this.start();
  }

  public toggle(): boolean {
    if (this.active) {
      this.stop();
      return false;
    }
    this.start();
    return true;
  }

  public get active(): boolean {
    return this._rafId !== null;
  }

  public get interval(): number {
    return this._interval;
  }

  public updateInterval(delay: number): void {
    this._interval = delay;
    if (this.active) {
      this.restart();
    }
  }

  private static _getRAF(): (callback: FrameRequestCallback) => number {
    if (typeof globalThis !== 'undefined' && globalThis.requestAnimationFrame) {
      return globalThis.requestAnimationFrame.bind(globalThis);
    }
    return (callback: FrameRequestCallback): number => {
      return setTimeout(() => {
        callback(typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
      }, 0) as unknown as number;
    };
  }

  private static _getCAF(): (handle: number) => void {
    if (typeof globalThis !== 'undefined' && globalThis.cancelAnimationFrame) {
      return globalThis.cancelAnimationFrame.bind(globalThis);
    }
    return (handle: number): void => {
      clearTimeout(handle);
    };
  }

  private static readonly _raf = RAFTicker._getRAF();
  private static readonly _caf = RAFTicker._getCAF();
}

/**
 * Ticker based on setInterval with a configurable interval.
 * Optimized for Node.js and tests with fake timers.
 *
 * Key features:
 * - Leading edge: callback is invoked via setTimeout(fn, 0) when interval > 0
 * - When interval === 0: setInterval(fn, 0) starts immediately (built-in leading-edge for 0)
 * - _timeoutId stores the setTimeout ID for leading-edge and is cleared in stop()
 * - active checks both timers: _timerId || _timeoutId
 */
export class IntervalTicker implements TickerInterface {
  private readonly _callback: TickerCallback;
  private _interval: number;
  private _timerId: ReturnType<typeof setInterval> | null = null;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;

  public static get factory(): TickerFactory {
    return (config: TickerConfig) => new IntervalTicker(config);
  }

  constructor(config: TickerConfig) {
    this._callback = config.callback;
    this._interval = config.interval ?? 0;
  }

  public start(): void {
    // Check active state across both timers to avoid double start()
    if (this.active) {
      return;
    }

    if (this._interval > 0) {
      // 1. Schedule an asynchronous leading-edge call
      this._timeoutId = setTimeout(() => {
        this._timeoutId = null;
        this._timerId = setInterval(() => this._callback(), this._interval);
        this._callback();
      }, 0);
    } else {
      // If interval is 0, start setInterval immediately (it has a built-in leading-edge for 0)
      this._timerId = setInterval(() => this._callback(), this._interval);
    }
  }

  public stop(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    if (this._timerId !== null) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  public restart(): void {
    this.stop();
    this.start();
  }

  public toggle(): boolean {
    if (this.active) {
      this.stop();
      return false;
    }
    this.start();
    return true;
  }

  public get active(): boolean {
    // The ticker is considered active if the leading timeout is pending OR the interval is already running
    return this._timerId !== null || this._timeoutId !== null;
  }

  public get interval(): number {
    return this._interval;
  }

  public updateInterval(delay: number): void {
    this._interval = delay;
    if (this.active) {
      this.restart();
    }
  }
}
