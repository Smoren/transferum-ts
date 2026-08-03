import {
  PushChannelTransfer,
  PushStoredChannelTransfer,
  BufferTransfer,
  GateTransfer,
  MergeTransfer,
  PollingProxyTransfer,
  AsyncSinkTransfer,
  AsyncReadTransfer,
  AsyncPollingProxyTransfer,
  AsyncStoredChannelTransfer,
  isPushable,
  isPullable,
  isSubscribable,
  isPollingProxy,
  isTriggerable,
  isGate,
  isAsyncPushable,
  isAsyncPullable,
  isAsyncPollingProxy,
  isAsyncTriggerable,
} from '../../src';
import { describe, expect, it, jest } from '@jest/globals';

// ═══════════════════════════════════════════════════════════════
// Type guards
// ═══════════════════════════════════════════════════════════════
// Each type guard checks a capability flag on a transfer and narrows
// the TypeScript type accordingly.

// ═══════════════════════════════════════════════════════════════
// isPushable
// ═══════════════════════════════════════════════════════════════

describe('isPushable returns true for pushable transfers test', () => {
  it('PushChannelTransfer has isPushable=true', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isPushable(transfer)).toBe(true);
    transfer.destroy();
  });

  it('BufferTransfer has isPushable=true', () => {
    const transfer = new BufferTransfer<number>();
    expect(isPushable(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isPushable returns false for non-pushable transfers test', () => {
  it('MergeTransfer has isPushable=false', () => {
    const transfer = new MergeTransfer<number>({ sources: [] });
    expect(isPushable(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isPullable
// ═══════════════════════════════════════════════════════════════

describe('isPullable returns true for pullable transfers test', () => {
  it('BufferTransfer has isPullable=true', () => {
    const transfer = new BufferTransfer<number>();
    expect(isPullable(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isPullable returns false for non-pullable transfers test', () => {
  it('PushChannelTransfer has isPullable=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isPullable(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isSubscribable
// ═══════════════════════════════════════════════════════════════

describe('isSubscribable returns true for subscribable transfers test', () => {
  it('PushChannelTransfer has isSubscribable=true', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isSubscribable(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isSubscribable returns false for non-subscribable transfers test', () => {
  it('BufferTransfer has isSubscribable=false', () => {
    const transfer = new BufferTransfer<number>();
    expect(isSubscribable(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isPollingProxy
// ═══════════════════════════════════════════════════════════════

describe('isPollingProxy returns true for polling proxy transfers test', () => {
  it('PollingProxyTransfer has isPollingProxy=true', () => {
    const transfer = new PollingProxyTransfer<number>({ interval: 1000, activated: false });
    expect(isPollingProxy(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isPollingProxy returns false for non-polling-proxy transfers test', () => {
  it('PushChannelTransfer has isPollingProxy=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isPollingProxy(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isTriggerable
// ═══════════════════════════════════════════════════════════════

describe('isTriggerable returns true for triggerable transfers test', () => {
  it('PushStoredChannelTransfer has isTriggerable=true', () => {
    const transfer = new PushStoredChannelTransfer<number>();
    expect(isTriggerable(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isTriggerable returns false for non-triggerable transfers test', () => {
  it('PushChannelTransfer has isTriggerable=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isTriggerable(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isGate
// ═══════════════════════════════════════════════════════════════

describe('isGate returns true for gate transfers test', () => {
  it('GateTransfer has isGate=true', () => {
    const transfer = new GateTransfer<number>({ activated: true });
    expect(isGate(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isGate returns false for non-gate transfers test', () => {
  it('PushChannelTransfer has isGate=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isGate(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isAsyncPushable
// ═══════════════════════════════════════════════════════════════

describe('isAsyncPushable returns true for async pushable transfers test', () => {
  it('AsyncSinkTransfer has isAsyncPushable=true', () => {
    const transfer = new AsyncSinkTransfer<number>({ callback: jest.fn() });
    expect(isAsyncPushable(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isAsyncPushable returns false for non-async-pushable transfers test', () => {
  it('PushChannelTransfer has isAsyncPushable=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isAsyncPushable(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isAsyncPullable
// ═══════════════════════════════════════════════════════════════

describe('isAsyncPullable returns true for async pullable transfers test', () => {
  it('AsyncReadTransfer has isAsyncPullable=true', () => {
    const transfer = new AsyncReadTransfer<number>({ flow: { read: () => undefined } });
    expect(isAsyncPullable(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isAsyncPullable returns false for non-async-pullable transfers test', () => {
  it('PushChannelTransfer has isAsyncPullable=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isAsyncPullable(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isAsyncPollingProxy
// ═══════════════════════════════════════════════════════════════

describe('isAsyncPollingProxy returns true for async polling proxy transfers test', () => {
  it('AsyncPollingProxyTransfer has isAsyncPollingProxy=true', () => {
    const transfer = new AsyncPollingProxyTransfer<number>({ interval: 1000, activated: false });
    expect(isAsyncPollingProxy(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isAsyncPollingProxy returns false for non-async-polling-proxy transfers test', () => {
  it('PushChannelTransfer has isAsyncPollingProxy=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isAsyncPollingProxy(transfer)).toBe(false);
    transfer.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════
// isAsyncTriggerable
// ═══════════════════════════════════════════════════════════════

describe('isAsyncTriggerable returns true for async triggerable transfers test', () => {
  it('AsyncStoredChannelTransfer has isAsyncTriggerable=true', () => {
    const transfer = new AsyncStoredChannelTransfer<number>({
      setup: () => {},
      destroy: () => {},
    });
    expect(isAsyncTriggerable(transfer)).toBe(true);
    transfer.destroy();
  });
});

describe('isAsyncTriggerable returns false for non-async-triggerable transfers test', () => {
  it('PushChannelTransfer has isAsyncTriggerable=false', () => {
    const transfer = new PushChannelTransfer<number>();
    expect(isAsyncTriggerable(transfer)).toBe(false);
    transfer.destroy();
  });
});
